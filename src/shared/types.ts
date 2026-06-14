import type { CategoryId } from './categories'

/** A drive as reported by the OS, shown on the start screen. */
export interface DriveInfo {
  letter: string
  label: string
  totalBytes: number
  freeBytes: number
}

/** One node of the aggregated directory tree returned after a scan. */
export interface ScanNode {
  name: string
  path: string
  type: 'dir' | 'file'
  /** Recursively aggregated size for directories. */
  sizeBytes: number
  /** Recursively aggregated file count for directories. */
  fileCount: number
  /** Set on files only. */
  category?: CategoryId
  mtimeMs?: number
  /** Present for directories; pruned to the largest entries before transport. */
  children?: ScanNode[]
  /** True when the directory could not be read (permissions, locks). */
  accessError?: boolean
}

export interface CategorySummary {
  id: CategoryId
  sizeBytes: number
  fileCount: number
}

export interface ScanResult {
  root: string
  startedAt: number
  finishedAt: number
  totalSizeBytes: number
  totalFiles: number
  totalDirs: number
  categories: CategorySummary[]
  tree: ScanNode
  /** Paths skipped because they were not accessible. */
  skipped: string[]
}

/** Throttled progress emitted while a scan is running. */
export interface ScanProgress {
  filesScanned: number
  dirsScanned: number
  bytesScanned: number
  currentPath: string
}

/** Messages sent from the main process to the scan worker. */
export type WorkerRequest = { type: 'start'; root: string } | { type: 'cancel' }

/** Messages sent from the scan worker back to the main process. */
export type WorkerResponse =
  | { type: 'progress'; progress: ScanProgress }
  | { type: 'done'; result: ScanResult }
  | { type: 'error'; message: string }
