import { Scanner } from './walk'
import { pruneTree, toCategorySummaries } from './aggregate'
import type { ScanResult, WorkerRequest, WorkerResponse } from '@shared/types'

/**
 * Utility-process entry point. Receives `start`/`cancel` requests from the main
 * process and streams progress plus a final aggregated result back.
 */

let cancelled = false

function post(message: WorkerResponse): void {
  process.parentPort.postMessage(message)
}

async function runScan(root: string): Promise<void> {
  const startedAt = Date.now()
  const scanner = new Scanner({
    emitProgress: (progress) => post({ type: 'progress', progress }),
    isCancelled: () => cancelled
  })

  const { tree, stats, installations } = await scanner.scan(root)

  const result: ScanResult = {
    root,
    startedAt,
    finishedAt: Date.now(),
    totalSizeBytes: stats.bytes,
    totalFiles: stats.files,
    totalDirs: stats.dirs,
    categories: toCategorySummaries(stats.categories),
    installations,
    tree: pruneTree(tree),
    skipped: stats.skipped
  }

  post({ type: 'done', result })
}

process.parentPort.on('message', (event) => {
  const request = event.data as WorkerRequest

  if (request.type === 'cancel') {
    cancelled = true
    return
  }

  if (request.type === 'start') {
    cancelled = false
    runScan(request.root).catch((error) => {
      post({ type: 'error', message: error instanceof Error ? error.message : String(error) })
    })
  }
})
