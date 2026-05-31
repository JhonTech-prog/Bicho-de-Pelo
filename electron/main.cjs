const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let mainWindow;

async function startBackend() {
  process.env.BACKEND_PORT = process.env.BACKEND_PORT || '3333';
  process.env.ELECTRON_USER_DATA = app.getPath('userData');
  process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:3333';

  const serverEntry = app.isPackaged
    ? path.join(process.resourcesPath, 'server', 'index.ts')
    : path.join(__dirname, '..', 'server', 'index.ts');

  const tsx = await import('tsx/esm/api');
  const unregister = tsx.register();
  await import(pathToFileURL(serverEntry).href);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 720,
    title: 'Bicho de Pelo',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await mainWindow.loadURL(`http://localhost:${process.env.BACKEND_PORT || 3333}`);
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    await createWindow();
  } catch (error) {
    dialog.showErrorBox('Erro ao iniciar Bicho de Pelo', error?.stack || error?.message || String(error));
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});
