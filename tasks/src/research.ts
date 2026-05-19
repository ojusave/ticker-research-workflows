import { Render } from '@renderinc/sdk'
import { buildQueries } from './queries.js'
import { buildIndexedArticles, toSourceRefs } from './sources.js'
import { synthesize } from './synthesize.js'
import type { ResearchEvent, SearchResult } from '../../shared/types.js'

const workflowSlug = process.env.WORKFLOW_SERVICE_SLUG ?? 'ticker-research-workflows'
const pollMs = parseInt(process.env.WORKFLOW_POLL_MS ?? '1500', 10)
const render = new Render()

/** Poll task status instead of SSE `.get()` — parallel runs can hang on EventSource. */
async function waitForSearchTask(taskRunId: string): Promise<SearchResult> {
  while (true) {
    const details = await render.workflows.getTaskRun(taskRunId)
    if (details.status === 'completed') {
      const result = details.results?.[0] as SearchResult | undefined
      if (!result) throw new Error('searchOne returned no result')
      return result
    }
    if (details.status === 'failed' || details.status === 'canceled') {
      throw new Error(details.error ?? `searchOne ${details.status}`)
    }
    await new Promise((r) => setTimeout(r, pollMs))
  }
}

export async function research(
  query: string,
  onEvent: (e: ResearchEvent) => void
): Promise<string> {
  const searches = buildQueries(query)
  onEvent({
    type: 'started',
    query,
    queries: searches.map((s) => s.query),
  })

  const results = await Promise.all(
    searches.map(async (spec, index) => {
      onEvent({ type: 'search:running', index })
      try {
        const started = await render.workflows.startTask(
          `${workflowSlug}/searchOne`,
          [query, spec, index]
        )
        const result = await waitForSearchTask(started.taskRunId)
        onEvent({ type: 'search:done', index, articleCount: result.articles.length })
        return result
      } catch (err) {
        onEvent({ type: 'search:failed', index, error: String(err) })
        throw err
      }
    })
  )

  onEvent({ type: 'sources', sources: toSourceRefs(buildIndexedArticles(results)) })
  onEvent({ type: 'synthesizing', message: 'All searches complete. Starting synthesis…' })
  const memo = await synthesize(query, results, (update) => {
    if (update.message) onEvent({ type: 'synthesizing', message: update.message })
    if (update.delta) onEvent({ type: 'synthesis:chunk', delta: update.delta })
  })
  onEvent({ type: 'done', memo })
  return memo
}
