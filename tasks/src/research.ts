import { Render } from '@renderinc/sdk'
import { buildQueries } from './queries.js'
import { buildIndexedArticles, toSourceRefs } from './sources.js'
import { synthesize } from './synthesize.js'
import type { ResearchEvent, SearchResult } from '../../shared/types.js'

const workflowSlug = process.env.WORKFLOW_SERVICE_SLUG ?? 'ticker-research-workflows'
const render = new Render()

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
        const finished = await render.workflows
        .startTask(`${workflowSlug}/searchOne`, [query, spec, index])
        .then((started) => started.get())
      const result = finished.results?.[0] as SearchResult
      if (!result) throw new Error('searchOne failed')
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
