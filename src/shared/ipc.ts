import type { DriveInfo, ScanProgress, ScanResult } from './types'

/** Channel names for renderer -> main calls (invoke/handle) and events (send). */
export const IpcChannel = {
  ListDrives: 'drives:list',
  SelectFolder: 'dialog:select-folder',
  StartScan: 'scan:start',
  CancelScan: 'scan:cancel',
  OpenPath: 'shell:open-path',
  // main -> renderer events
  ScanProgress: 'scan:progress',
  ScanDone: 'scan:done',
  ScanError: 'scan:error'
} as const

/**
 * The surface exposed on `window.api` by the preload script. Keeping it in the
 * shared layer lets preload and renderer agree on a single typed contract.
 */
export interface DriveCleanerApi {
  listDrives(): Promise<DriveInfo[]>
  selectFolder(): Promise<string | null>
  startScan(root: string): Promise<void>
  cancelScan(): Promise<void>
  openPath(target: string): Promise<void>
  /** Subscribe to scan events; each returns an unsubscribe function. */
  onScanProgress(handler: (progress: ScanProgress) => void): () => void
  onScanDone(handler: (result: ScanResult) => void): () => void
  onScanError(handler: (message: string) => void): () => void
}
