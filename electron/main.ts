/**
 * Offsidestore Studio – desktopová aplikace (Electron).
 * Uvnitř běží malý server jen pro tento počítač (127.0.0.1): servíruje aplikaci
 * a lokální API (trendy, Shopify, Gemini). Klíče se ukládají šifrovaně do profilu uživatele.
 */
import { app, BrowserWindow, dialog, Menu, safeStorage, shell } from 'electron';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createHandler, KEY_NAMES, type KeyName } from '../server/plugin';

const PORT = 43117; // pevný port = stabilní úložiště dat (localStorage) mezi spuštěními
const ORIGIN = `http://127.0.0.1:${PORT}`;
const DIST = path.join(app.getAppPath(), 'dist');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

// ───────── Klíče (šifrovaně v profilu uživatele) ─────────

const keysFile = () => path.join(app.getPath('userData'), 'klice.dat');

function loadKeys(): Partial<Record<KeyName, string>> {
  try {
    const raw = fs.readFileSync(keysFile());
    const json = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(raw) : raw.toString('utf8');
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function persistKeys(keys: Partial<Record<KeyName, string>>) {
  const json = JSON.stringify(keys);
  const data = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(json) : Buffer.from(json, 'utf8');
  fs.mkdirSync(path.dirname(keysFile()), { recursive: true });
  fs.writeFileSync(keysFile(), data, { mode: 0o600 });
}

// ───────── Server ─────────

function startServer(env: Record<string, string | undefined>): Promise<http.Server> {
  const api = createHandler(env, {
    saveKeys: (values) => {
      for (const k of KEY_NAMES) {
        if (values[k] === undefined) continue;
        if (values[k]) env[k] = values[k];
        else delete env[k];
      }
      persistKeys(Object.fromEntries(KEY_NAMES.filter((k) => env[k]).map((k) => [k, env[k]!])));
    },
  });

  const server = http.createServer((req, res) => {
    api(req, res, () => {
      // statické soubory aplikace
      const url = new URL(req.url ?? '/', ORIGIN);
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/' || !path.extname(rel)) rel = '/index.html';
      const file = path.normalize(path.join(DIST, rel));
      if (!file.startsWith(DIST + path.sep)) {
        res.statusCode = 403;
        return res.end();
      }
      fs.readFile(file, (err, data) => {
        if (err) {
          res.statusCode = 404;
          return res.end('Nenalezeno');
        }
        res.setHeader('Content-Type', MIME[path.extname(file)] ?? 'application/octet-stream');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.end(data);
      });
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

// ───────── Okno ─────────

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#050505',
    title: 'Offsidestore Studio',
    icon: path.join(DIST, 'brand', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.once('ready-to-show', () => win?.show());
  win.loadURL(ORIGIN + '/');

  // Odkazy ven (Instagram, zdroje trendů…) otevírat v prohlížeči, ne v aplikaci.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(ORIGIN)) {
      e.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });
  win.on('closed', () => (win = null));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    if (process.platform === 'win32') app.setAppUserModelId('cz.offsidestore.studio');
    if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
    const env: Record<string, string | undefined> = { ...loadKeys() };
    try {
      await startServer(env);
    } catch (e) {
      dialog.showErrorBox(
        'Offsidestore Studio nejde spustit',
        `Port ${PORT} je obsazený jiným programem (${(e as Error).message}). Zavři ho nebo restartuj počítač a zkus to znovu.`,
      );
      app.quit();
      return;
    }
    createWindow();
    app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
