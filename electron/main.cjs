const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let mainWindow;
let backendProcess;
let logFile;

function log(message) {
  try {
    if (!logFile) return;
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
  } catch {
    // Logging must never prevent the app from starting.
  }
}

async function startBackend() {
  log('Starting backend');
  process.env.BACKEND_PORT = process.env.BACKEND_PORT || '3333';
  process.env.ELECTRON_USER_DATA = app.getPath('userData');
  process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:3333';

  const serverEntry = app.isPackaged
    ? path.join(process.resourcesPath, 'server', 'index.js')
    : path.join(__dirname, '..', 'server', 'index.ts');

  if (app.isPackaged) {
    const electronExe = process.execPath;
    log(`Spawning backend with ${electronExe} ${serverEntry}`);
    backendProcess = spawn(electronExe, [serverEntry], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    backendProcess.stdout.on('data', (data) => log(`backend stdout: ${data.toString().trim()}`));
    backendProcess.stderr.on('data', (data) => log(`backend stderr: ${data.toString().trim()}`));
    backendProcess.on('exit', (code, signal) => log(`backend exited code=${code} signal=${signal}`));
    await waitForBackend();
    return;
  }

  if (!app.isPackaged) {
    const tsx = await import('tsx/esm/api');
    tsx.register();
  }

  log(`Importing backend from ${serverEntry}`);
  await import(pathToFileURL(serverEntry).href);
  log('Backend imported');
}

async function waitForBackend() {
  const url = `http://localhost:${process.env.BACKEND_PORT || 3333}/api/health`;
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        log('Backend healthcheck ok');
        return;
      }
    } catch {
      // Try again until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error('Backend nao iniciou dentro do tempo esperado.');
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
  logFile = path.join(app.getPath('userData'), 'startup.log');
  log(`App ready packaged=${app.isPackaged} resources=${process.resourcesPath}`);
  try {
    await startBackend();
    await createWindow();
  } catch (error) {
    log(error?.stack || error?.message || String(error));
    dialog.showErrorBox('Erro ao iniciar Bicho de Pelo', error?.stack || error?.message || String(error));
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});
