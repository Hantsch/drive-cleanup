import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'

/** Creates the single application window and loads the renderer. */
export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#0b0e17',
    title: 'Drive Cleaner',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  window.once('ready-to-show', () => window.show())

  // Open external links in the OS browser, never inside the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    window.loadURL(devServerUrl)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
