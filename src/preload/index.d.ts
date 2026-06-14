import type { DriveCleanerApi } from '@shared/ipc'

declare global {
  interface Window {
    api: DriveCleanerApi
  }
}

export {}
