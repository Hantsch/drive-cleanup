import { ipcMain, dialog, shell, type BrowserWindow } from 'electron'
import { IpcChannel } from '@shared/ipc'
import { listDrives } from './system/drives'
import { ScanController } from './scan/scan-controller'

/**
 * Registers every renderer-facing handler and returns the scan controller so
 * the app can dispose its worker on quit.
 */
export function registerIpc(getWindow: () => BrowserWindow | null): ScanController {
  const scan = new ScanController(getWindow)

  ipcMain.handle(IpcChannel.ListDrives, () => listDrives())

  ipcMain.handle(IpcChannel.SelectFolder, async () => {
    const window = getWindow()
    const result = window
      ? await dialog.showOpenDialog(window, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  ipcMain.handle(IpcChannel.StartScan, (_event, root: string) => scan.start(root))
  ipcMain.handle(IpcChannel.CancelScan, () => scan.cancel())
  ipcMain.handle(IpcChannel.OpenPath, (_event, target: string) => shell.openPath(target))

  return scan
}
