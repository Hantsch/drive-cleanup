import { utilityProcess, type UtilityProcess, type BrowserWindow } from 'electron'
import { join } from 'node:path'
import { IpcChannel } from '@shared/ipc'
import type { WorkerRequest, WorkerResponse } from '@shared/types'

/**
 * Owns the scan worker (a utility process) and forwards its messages to the
 * renderer. Keeping the filesystem walk off the main process keeps the UI and
 * IPC responsive even on large drives.
 */
export class ScanController {
  private worker: UtilityProcess | null = null

  constructor(private readonly getWindow: () => BrowserWindow | null) {}

  start(root: string): void {
    this.send({ type: 'start', root })
  }

  cancel(): void {
    this.worker?.postMessage({ type: 'cancel' } satisfies WorkerRequest)
  }

  dispose(): void {
    this.worker?.kill()
    this.worker = null
  }

  private send(request: WorkerRequest): void {
    this.ensureWorker().postMessage(request)
  }

  private ensureWorker(): UtilityProcess {
    if (this.worker) return this.worker

    const workerPath = join(__dirname, 'scan.worker.js')
    const worker = utilityProcess.fork(workerPath, [], { serviceName: 'drive-cleaner-scan' })
    worker.on('message', (message: WorkerResponse) => this.forward(message))
    worker.on('exit', () => {
      this.worker = null
    })

    this.worker = worker
    return worker
  }

  private forward(message: WorkerResponse): void {
    const contents = this.getWindow()?.webContents
    if (!contents) return

    switch (message.type) {
      case 'progress':
        contents.send(IpcChannel.ScanProgress, message.progress)
        break
      case 'done':
        contents.send(IpcChannel.ScanDone, message.result)
        break
      case 'error':
        contents.send(IpcChannel.ScanError, message.message)
        break
    }
  }
}
