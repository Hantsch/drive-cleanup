import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './window'
import { registerIpc } from './ipc'

let mainWindow: BrowserWindow | null = null

app.whenReady().then(() => {
  const scan = registerIpc(() => mainWindow)
  mainWindow = createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow()
  })

  app.on('before-quit', () => scan.dispose())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
