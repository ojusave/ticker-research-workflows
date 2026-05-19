import { randomUUID } from 'crypto'
import { research } from '../../tasks/src/research.js'
import type { ResearchEvent } from '../../shared/types.js'

type LiveRun = {
  events: ResearchEvent[]
  listeners: Set<(e: ResearchEvent) => void>
  done: boolean
}

const liveRuns = new Map<string, LiveRun>()

export function startResearch(query: string): string {
  const runId = randomUUID()
  const live: LiveRun = { events: [], listeners: new Set(), done: false }
  liveRuns.set(runId, live)

  const onEvent = (e: ResearchEvent) => {
    live.events.push(e)
    live.listeners.forEach((fn) => fn(e))
    if (e.type === 'done' || e.type === 'failed') live.done = true
  }

  research(query, onEvent).catch((err) => {
    onEvent({ type: 'failed', error: String(err) })
  })

  return runId
}

export function subscribeToRun(
  runId: string,
  fn: (e: ResearchEvent) => void
): { whenDone: Promise<void> } | null {
  const live = liveRuns.get(runId)
  if (!live) return null

  live.events.forEach(fn)

  const whenDone = new Promise<void>((resolve) => {
    if (live.done) {
      resolve()
      return
    }
    const wrapped = (e: ResearchEvent) => {
      fn(e)
      if (e.type === 'done' || e.type === 'failed') resolve()
    }
    live.listeners.add(wrapped)
  })

  return { whenDone }
}
