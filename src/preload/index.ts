import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IpcChannel, type DriveCleanerApi } from '@shared/ipc'
import type { ScanProgress, ScanResult } from '@shared/types'

/** Subscribes to a main-process event and returns an unsubscribe function. */
function subscribe<T>(channel: string, handler: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T) => handler(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: DriveCleanerApi = {
  listDrives: () => ipcRenderer.invoke(IpcChannel.ListDrives),
  selectFolder: () => ipcRenderer.invoke(IpcChannel.SelectFolder),
  startScan: (root) => ipcRenderer.invoke(IpcChannel.StartScan, root),
  cancelScan: () => ipcRenderer.invoke(IpcChannel.CancelScan),
  openPath: (target) => ipcRenderer.invoke(IpcChannel.OpenPath, target),
  onScanProgress: (handler) => subscribe<ScanProgress>(IpcChannel.ScanProgress, handler),
  onScanDone: (handler) => subscribe<ScanResult>(IpcChannel.ScanDone, handler),
  onScanError: (handler) => subscribe<string>(IpcChannel.ScanError, handler)
}

contextBridge.exposeInMainWorld('api', api)
