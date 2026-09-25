require('events').EventEmitter.defaultMaxListeners = 50;
const { app, BrowserWindow, Menu, Tray, dialog, ipcMain, shell, session, screen, webContents, Notification, nativeImage, desktopCapturer } = require('electron');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { pathToFileURL } = require('url');
const { Client } = require('discord-rpc');
const { loadEnv } = require('./env');
const { checkForAppUpdate, downloadAndInstallUpdate, runUpdateInstaller, savePendingInstaller, peekPendingInstaller, consumePendingInstaller, isNewerVersion } = require('./updater');
const { isBlockedUrl, isPopupUrl, COSMETIC_AD_BLOCK_CSS } = require('./adblocker');

const devRoot = path.join(__dirname, '..');
const earlyEnvPaths = [
  path.join(devRoot, '.env'),
  path.join(__dirname, '.env')
];
if (app.isPackaged) {
  earlyEnvPaths.unshift(path.join(path.dirname(process.execPath), '.env'));
}
loadEnv(earlyEnvPaths);

const browserWindows = new Set();
const incognitoWindows = new Set(); // tracked separately for cleanup
let incognitoPermissions = []; // in-memory only for private session duration — never written to disk!

function isIncognitoWindow(win) {
  return Boolean(win && incognitoWindows.has(win));
}
const pendingPermissions = new Map();
const pendingScreenShares = new Map();
let screenShareRequestCounter = 0;
app.setAppUserModelId('com.faibilo.browser');
let tray = null;
let splashWindow = null;
let splashUpdateResolve = null;
let splashMandatoryUpdateActive = false;
let isQuitting = false;
let pendingOpenUrl = '';
let permissionRequestCounter = 0;

let cachedCleanUa = '';
const profilePath = app.isPackaged
  ? path.join(app.getPath('appData'), 'Faibilo')
  : path.join(__dirname, '..', '.faibilo-profile');
const cachePath = path.join(profilePath, 'FastCache');
const settingsPath = path.join(profilePath, 'settings.json');
const permissionsPath = path.join(profilePath, 'permissions.json');

let discordRpcClient = null;
let discordRpcReady = false;
let discordRpcStartTimestamp = null;
let aboutToQuitDiscord = false;

function getUpdateEnvPaths() {
  const paths = [
    path.join(devRoot, '.env'),
    path.join(__dirname, '.env'),
    path.join(profilePath, '.env')
  ];
  if (app.isPackaged) {
    paths.unshift(path.join(path.dirname(process.execPath), '.env'));
  }
  return paths;
}

function reloadUpdateEnv() {
  loadEnv(getUpdateEnvPaths(), { overwrite: true });
}

let appSettings = {
  downloadPath: '',
  askDownloadLocation: false,
  blockAds: true,
  blockPopups: true,
  blockTrackers: true,
  autoSkipVideoAds: true,
  cosmeticFiltering: true,
  whitelistedDomains: [],
  customBlockRules: [],
  blockedCount: 0,
  fastMode: true,
  launchAtStartup: false,
  desktopMediaDisk: true,
  themePreset: 'forest',
  accentColor: '#8be2bf',
  componentBgColor: '#151d19',
  borderColor: '#2f4039'
};

let sitePermissions = [];
const pendingPermissionPrompts = new Map();
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.exit(0);
}

function registerProtocolHandlers() {
  if (process.platform !== 'win32' && process.platform !== 'darwin') return;
  ['faibilo'].forEach((scheme) => {
    try {
      if (process.defaultApp && process.argv[1]) {
        app.setAsDefaultProtocolClient(scheme, process.execPath, [path.resolve(process.argv[1])]);
      } else {
        app.setAsDefaultProtocolClient(scheme);
      }
    } catch {
      // Ignore duplicate registration in development.
    }
  });
}

registerProtocolHandlers();

app.on('open-url', (event, url) => {
  event.preventDefault();
  pendingOpenUrl = url;
  if (app.isReady()) {
    openUrlInBrowser(url);
  }
});

function getLaunchArgs(argv = process.argv) {
  return argv.slice(process.defaultApp ? 2 : 1);
}

function resolveFileOpenTarget(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.url') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/^URL=(.+)$/im);
      return match?.[1]?.trim() || null;
    } catch {
      return null;
    }
  }
  if (ext === '.webloc') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/<string>(https?:\/\/[^<]+)<\/string>/i);
      return match?.[1]?.trim() || null;
    } catch {
      return null;
    }
  }
  const supportedWebExtensions = [
    '.html', '.htm', '.xhtml', '.mhtml',
    '.svg', '.pdf',
    '.txt', '.xml', '.json',
    '.webp', '.png', '.jpg', '.jpeg', '.gif', '.avif',
    '.mp4', '.webm', '.mp3', '.wav', '.ogg'
  ];
  if (supportedWebExtensions.includes(ext) || fs.existsSync(filePath)) {
    try {
      return pathToFileURL(filePath).href;
    } catch {
      return `file:///${filePath.replace(/\\/g, '/')}`;
    }
  }
  return null;
}

function normalizeLaunchTarget(rawTarget = '') {
  let target = String(rawTarget || '').trim();
  if (!target) return '';
  if ((target.startsWith('"') && target.endsWith('"')) || (target.startsWith("'") && target.endsWith("'"))) {
    target = target.slice(1, -1).trim();
  }
  if (!target) return '';
  if (/^https?:\/\//i.test(target) || /^faibilo:\/\//i.test(target) || /^file:\/\//i.test(target)) return target;
  try {
    const resolved = path.resolve(target);
    if (!fs.existsSync(resolved)) return '';
    return resolveFileOpenTarget(resolved) || '';
  } catch {
    return '';
  }
}

function getLaunchTarget(argv = process.argv) {
  for (const arg of getLaunchArgs(argv)) {
    if (!arg || arg.startsWith('-')) continue;
    const normalized = normalizeLaunchTarget(arg);
    if (normalized) return normalized;
  }
  return '';
}

function isDefaultBrowser() {
  if (process.platform === 'win32') {
    try {
      const stdout = execSync(
        'reg query "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId',
        { encoding: 'utf8', timeout: 2500, windowsHide: true }
      );
      const match = stdout.match(/ProgId\s+REG_SZ\s+(\S+)/i);
      const progId = match ? match[1].trim() : '';
      if (!progId) return false;
      if (progId.toLowerCase().includes('faibilo')) return true;

      try {
        const cmdStdout = execSync(
          `reg query "HKCR\\${progId}\\shell\\open\\command" /ve`,
          { encoding: 'utf8', timeout: 2500, windowsHide: true }
        );
        const lower = cmdStdout.toLowerCase();
        if (lower.includes('faibilo.exe')) return true;
        if (process.defaultApp && lower.includes('programing\\browser')) return true;
      } catch {}

      return false;
    } catch {
      // Fallback
      return false;
    }
  }

  if (process.platform === 'darwin') {
    try {
      return app.isDefaultProtocolClient('http') && app.isDefaultProtocolClient('https');
    } catch {
      return false;
    }
  }

  return false;
}

function setAsDefaultBrowser() {
  let success = false;
  try {
    if (process.defaultApp && process.argv[1]) {
      const args = [path.resolve(process.argv[1])];
      app.setAsDefaultProtocolClient('http', process.execPath, args);
      app.setAsDefaultProtocolClient('https', process.execPath, args);
      app.setAsDefaultProtocolClient('faibilo', process.execPath, args);
    } else {
      app.setAsDefaultProtocolClient('http');
      app.setAsDefaultProtocolClient('https');
      app.setAsDefaultProtocolClient('faibilo');
    }
    success = true;
  } catch {
    success = false;
  }

  // On Windows 10/11, opening Windows Default Apps settings allows the user to confirm default browser
  if (process.platform === 'win32') {
    try {
      shell.openExternal('ms-settings:defaultapps');
    } catch {}
  }

  return { success, isDefault: isDefaultBrowser() };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initializeDiscordRichPresence() {
  if (discordRpcClient || aboutToQuitDiscord) return;

  try {
    discordRpcClient = new Client({ transport: 'ipc' });
    discordRpcStartTimestamp = Date.now();

    discordRpcClient.on('ready', () => {
      discordRpcReady = true;
      updateDiscordPresence();
    });

    discordRpcClient.on('disconnected', () => {
      discordRpcReady = false;
      discordRpcClient = null;
    });

    await discordRpcClient.login({ clientId: '1528322456144711821' });
  } catch (error) {
    console.warn('Discord Rich Presence unavailable:', error.message);
    discordRpcClient = null;
    discordRpcReady = false;
  }
}

function getDiscordActivityForWindow(browserWindow) {
  const webContentsInstance = browserWindow?.webContents;
  if (!browserWindow || browserWindow.isDestroyed() || !webContentsInstance || webContentsInstance.isDestroyed()) {
    return null;
  }

  const pageTitle = webContentsInstance.getTitle?.() || 'Faibilo Browser';
  const currentUrl = webContentsInstance.getURL?.() || '';
  let state = 'Browsing the web';

  try {
    if (currentUrl.startsWith('faibilo://')) {
      state = 'Using Faibilo';
    } else {
      const parsedUrl = new URL(currentUrl);
      state = parsedUrl.hostname || 'Browsing the web';
    }
  } catch {
    // Keep the default state for local or unknown URLs.
  }

  return {
    details: pageTitle || 'Faibilo Browser',
    state,
    startTimestamp: discordRpcStartTimestamp || Date.now(),
    largeImageText: 'Faibilo Browser'
  };
}

async function updateDiscordPresence(browserWindow = null) {
  if (!discordRpcClient || !discordRpcReady || aboutToQuitDiscord) return;

  const activity = getDiscordActivityForWindow(browserWindow || findReusableBrowserWindow());
  if (!activity) {
    try {
      await discordRpcClient.clearActivity();
    } catch {
      // Ignore clear failures.
    }
    return;
  }

  try {
    await discordRpcClient.setActivity(activity);
  } catch {
    // Ignore RPC activity failures so the browser still works.
  }
}

async function clearDiscordPresence() {
  if (!discordRpcClient || !discordRpcReady || aboutToQuitDiscord) return;
  try {
    await discordRpcClient.clearActivity();
  } catch {
    // Ignore clear failures.
  }
}

function waitForSplashWindow(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (!splashWindow || splashWindow.isDestroyed()) {
      resolve();
      return;
    }
    if (!splashWindow.webContents.isLoading()) {
      resolve();
      return;
    }
    splashWindow.webContents.once('did-finish-load', resolve);
    setTimeout(resolve, timeoutMs);
  });
}

function splashProgress(percent, status) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('splash:progress', { percent, status });
  }
}

function waitForRendererReady(browserWindow, timeoutMs = 20000) {
  return new Promise((resolve) => {
    if (!browserWindow || browserWindow.isDestroyed()) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);

    const handler = (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win || win.id !== browserWindow.id) return;
      cleanup();
      resolve();
    };

    function cleanup() {
      clearTimeout(timer);
      ipcMain.removeListener('app:renderer-ready', handler);
    }

    ipcMain.on('app:renderer-ready', handler);
  });
}

function createSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) return splashWindow;

  splashWindow = new BrowserWindow({
    width: 500,
    height: 390,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    icon: path.join(__dirname, 'assets', 'Faibilo-logo.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'splash-preload.js')
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => {
    splashWindow?.show();
  });
  splashWindow.on('close', (event) => {
    if (splashMandatoryUpdateActive && !isQuitting) {
      event.preventDefault();
      app.quit();
    }
  });
  splashWindow.on('closed', () => {
    splashWindow = null;
    splashMandatoryUpdateActive = false;
  });

  return splashWindow;
}

function closeSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
  splashWindow = null;
}

function waitForWindowContent(browserWindow, timeoutMs = 9000) {
  return new Promise((resolve) => {
    if (!browserWindow || browserWindow.isDestroyed()) {
      resolve();
      return;
    }
    if (browserWindow.webContents.isLoading()) {
      browserWindow.webContents.once('did-finish-load', resolve);
      setTimeout(resolve, timeoutMs);
      return;
    }
    resolve();
  });
}

function splashDownloadProgress(payload) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('splash:download-progress', payload);
  }
}

function splashUpdateAvailable(payload) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    const hasFeatures = (Array.isArray(payload?.features) && payload.features.length > 0) || Boolean(payload?.notes);
    const targetHeight = hasFeatures ? 590 : 510;
    if (payload?.necessary) {
      splashMandatoryUpdateActive = true;
    }
    splashWindow.setSize(550, targetHeight);
    splashWindow.center();
    splashWindow.webContents.send('splash:update', payload);
  }
}

function waitForSplashUpdateDecision(timeoutMs = 120000) {
  return new Promise((resolve) => {
    splashUpdateResolve = resolve;
    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
      setTimeout(() => {
        if (splashUpdateResolve === resolve) {
          splashUpdateResolve = null;
          resolve('continue');
        }
      }, timeoutMs);
    }
  });
}

function resolveSplashUpdateDecision(action) {
  if (!splashUpdateResolve) return;
  const resolve = splashUpdateResolve;
  splashUpdateResolve = null;
  resolve(action);
}

async function resetSplashBootView() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    try {
      await splashWindow.webContents.executeJavaScript(`
        document.getElementById('bootView')?.classList.remove('hidden');
        document.getElementById('updateView')?.classList.add('hidden');
        document.getElementById('splash')?.classList.remove('update-mode');
      `);
    } catch {
      // Ignore splash reset errors.
    }
  }
}

async function performUpdateInstall(updateInfo) {
  splashDownloadProgress({ percent: 0, status: 'Starting download...' });
  const { installerPath, version } = await downloadAndInstallUpdate(updateInfo, app.getPath('temp'), (progress) => {
    splashDownloadProgress({
      percent: progress.percent ?? 0,
      status: progress.status || 'Downloading update...'
    });
  });

  // Save installer path + version so we can skip re-downloading on next launch.
  savePendingInstaller(installerPath, profilePath, version, updateInfo?.features, updateInfo?.notes);

  // Tell the splash screen the download finished — show a "Run Installer" button.
  splashDownloadProgress({ percent: 100, status: 'Download complete!', ready: true, installerPath });
}

async function launchWithSplash(initialUrl = '') {
  const launchTarget = normalizeLaunchTarget(initialUrl) || getLaunchTarget();
  const browserWindow = createWindow(launchTarget, { show: true });

  if (appSettings.desktopMediaDisk) {
    try { showMediaWidget(); } catch {}
  }

  // Non-blocking background update check & silent background download on app launch
  setTimeout(async () => {
    try {
      const currentVersion = app.getVersion();
      reloadUpdateEnv();

      // Check if there is already a downloaded update waiting to be installed
      const pending = peekPendingInstaller(profilePath);
      if (pending && fs.existsSync(pending.installerPath) && isNewerVersion(pending.version, currentVersion)) {
        if (browserWindow && !browserWindow.isDestroyed()) {
          browserWindow.webContents.send('app:update-downloaded', {
            version: pending.version,
            features: pending.features || [],
            notes: pending.notes || '',
            installerPath: pending.installerPath
          });
        }
      }

      const updateResult = await checkForAppUpdate(currentVersion);
      if (updateResult?.available && updateResult.downloadUrl) {
        if (updateResult.necessary) {
          createSplashWindow();
          splashUpdateAvailable(updateResult);
        } else {
          // If already downloaded this version, ensure renderer is notified
          if (pending && pending.version === updateResult.version && fs.existsSync(pending.installerPath)) {
            browserWindows.forEach((win) => {
              if (win && !win.isDestroyed()) {
                win.webContents.send('app:update-downloaded', {
                  version: updateResult.version,
                  features: updateResult.features || [],
                  notes: updateResult.notes || '',
                  installerPath: pending.installerPath
                });
              }
            });
            return;
          }

          // Silently download update in background
          try {
            const { installerPath, version } = await downloadAndInstallUpdate(
              updateResult,
              app.getPath('temp'),
              (progress) => {
                browserWindows.forEach((win) => {
                  if (win && !win.isDestroyed()) {
                    win.webContents.send('app:update-download-progress', {
                      version: updateResult.version,
                      percent: progress.percent
                    });
                  }
                });
              }
            );
            savePendingInstaller(installerPath, profilePath, version, updateResult.features, updateResult.notes);

            // Broadcast to all browser windows that update is downloaded and ready to install
            browserWindows.forEach((win) => {
              if (win && !win.isDestroyed()) {
                win.webContents.send('app:update-downloaded', {
                  version: updateResult.version,
                  features: updateResult.features || [],
                  notes: updateResult.notes || '',
                  installerPath
                });
              }
            });
          } catch (dlErr) {
            console.warn('[AutoUpdater] Silent background download failed:', dlErr.message);
          }
        }
      }
    } catch (err) {
      console.warn('[AutoUpdater] Background update check error:', err.message);
    }
  }, 2000);

  return browserWindow;
}

fs.mkdirSync(cachePath, { recursive: true });
app.setPath('userData', profilePath);
app.setPath('cache', cachePath);
// Disable automation blink flags so standard bot/verification checks (like Cloudflare Turnstile) don't detect automation
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
// Enable Chromium GPU rasterization, zero-copy compositing, and accelerated video decoding
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-highres-timer');
app.commandLine.appendSwitch('enable-quic');
app.commandLine.appendSwitch('enable-tcp-fast-open');
app.commandLine.appendSwitch('v8-cache-options', 'code');
app.commandLine.appendSwitch('enable-features', 'NetworkService,NetworkServiceInProcess,ParallelDownloading,CanvasOopRasterization,VaapiVideoDecoder,BackForwardCache,SurfaceSync');
app.commandLine.appendSwitch('user-data-dir', profilePath);
app.commandLine.appendSwitch('disk-cache-dir', cachePath);
app.commandLine.appendSwitch('disk-cache-size', String(1024 * 1024 * 1024));
app.commandLine.appendSwitch('media-cache-size', String(512 * 1024 * 1024));

app.on('web-contents-created', (_event, contents) => {
  contents.setMaxListeners(50);

  contents.on('will-navigate', (event, url) => {
    if (isExternalAppUrl(url)) {
      event.preventDefault();
      handleExternalAppRedirection(contents, url);
    }
  });

  contents.on('will-frame-navigate', (event) => {
    if (isExternalAppUrl(event.url)) {
      event.preventDefault();
      handleExternalAppRedirection(contents, event.url);
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    if (isExternalAppUrl(url)) {
      handleExternalAppRedirection(contents, url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
});

function sendBrowserCommand(command) {
  const target = BrowserWindow.getFocusedWindow() || [...browserWindows].at(-1);
  target?.webContents.send('browser-command', command);
}

function toggleFocusedDevTools() {
  const target = BrowserWindow.getFocusedWindow() || [...browserWindows].at(-1);
  if (!target || target.isDestroyed()) return;
  target.webContents.toggleDevTools();
}

function installKeyboardShortcuts(browserWindow) {
  browserWindow.webContents.on('before-input-event', (event, input) => {
    if (input?.type !== 'keyDown') return;
    if (input?.key === 'F12') {
      event.preventDefault();
      browserWindow.webContents.toggleDevTools();
    } else if (input?.key === 'F11') {
      event.preventDefault();
      browserWindow.setFullScreen(!browserWindow.isFullScreen());
    } else if (input?.key === 'Escape' && browserWindow.isFullScreen()) {
      event.preventDefault();
      browserWindow.setFullScreen(false);
    }
  });
}

function findReusableBrowserWindow() {
  const windows = [...browserWindows].filter((window) => !window.isDestroyed());
  return windows.find((window) => window.isVisible() && window.isFocused())
    || windows.find((window) => window.isVisible())
    || windows[0]
    || null;
}

function setWindowBackgroundMode(browserWindow, inBackground) {
  if (!browserWindow || browserWindow.isDestroyed()) return;
  browserWindow.webContents.setBackgroundThrottling(Boolean(inBackground));
  browserWindow.webContents.send('app:background-mode', Boolean(inBackground));
}

function hideBrowserWindow(browserWindow) {
  if (!browserWindow || browserWindow.isDestroyed()) return;
  setWindowBackgroundMode(browserWindow, true);
  browserWindow.hide();
}

function showBrowserWindow(browserWindow) {
  if (!browserWindow || browserWindow.isDestroyed()) return;
  if (!browserWindow.isVisible()) browserWindow.show();
  if (browserWindow.isMinimized()) browserWindow.restore();
  setWindowBackgroundMode(browserWindow, false);
  browserWindow.focus();
}

function openUrlInBrowser(url = '') {
  const targetUrl = normalizeLaunchTarget(url) || String(url || '').trim();
  const browserWindow = findReusableBrowserWindow();
  if (!browserWindow) {
    createWindow(targetUrl, { show: true });
    return;
  }
  showBrowserWindow(browserWindow);
  if (targetUrl) browserWindow.webContents.send('open-url-in-tab', targetUrl);
}

function loadSettings() {
  try {
    appSettings = { ...appSettings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
  } catch {
    appSettings.downloadPath = app.getPath('downloads');
    saveSettings();
  }
  applyStartupSetting();
}

function saveSettings() {
  fs.writeFileSync(settingsPath, JSON.stringify(appSettings, null, 2));
}

function applyStartupSetting() {
  if (process.platform !== 'win32') return;
  const args = app.isPackaged ? [] : [app.getAppPath()];
  app.setLoginItemSettings({
    openAtLogin: Boolean(appSettings.launchAtStartup),
    path: process.execPath,
    args
  });
}

function createTray() {
  if (tray || process.platform !== 'win32') return;
  tray = new Tray(path.join(__dirname, 'assets', 'Faibilo-logo.png'));
  tray.setToolTip('Faibilo');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Faibilo', click: () => {
        const browserWindow = findReusableBrowserWindow();
        if (browserWindow) showBrowserWindow(browserWindow);
        else createWindow();
      }},
      {
        label: 'Quit Faibilo',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on('click', () => {
    const browserWindow = findReusableBrowserWindow();
    if (browserWindow) {
      showBrowserWindow(browserWindow);
      return;
    }
    createWindow();
  });
}

function loadPermissions() {
  try {
    sitePermissions = JSON.parse(fs.readFileSync(permissionsPath, 'utf8'));
  } catch {
    sitePermissions = [];
  }
}

function savePermissions() {
  fs.writeFileSync(permissionsPath, JSON.stringify(sitePermissions, null, 2));
}

function permissionKey(origin, permission) {
  return `${origin}|${permission}`;
}

function permissionLabel(permission) {
  return (
    {
      media: 'camera and microphone',
      microphone: 'microphone',
      camera: 'camera',
      geolocation: 'location',
      notifications: 'notifications and push messages',
      midiSysex: 'MIDI devices',
      pointerLock: 'mouse pointer lock',
      fullscreen: 'fullscreen',
      'display-capture': 'screen sharing'
    }[permission] || permission
  );
}

function permissionIcon(permission, label = '') {
  return (
    {
      media: label === 'camera' ? 'camera' : 'mic',
      microphone: 'mic',
      camera: 'camera',
      geolocation: 'map-pin',
      notifications: 'bell',
      'display-capture': 'screen'
    }[permission] || 'shield-alert'
  );
}

function permissionOriginFromDetails(details, webContents) {
  try {
    if (details?.requestingUrl) return new URL(details.requestingUrl).origin;
    if (webContents && !webContents.isDestroyed()) return new URL(webContents.getURL()).origin;
  } catch {
    // fall through
  }
  return details?.requestingUrl || 'This site';
}

function normalizeOrigin(origin) {
  if (!origin) return 'This site';
  try {
    return new URL(origin).origin;
  } catch {
    return String(origin);
  }
}

const DANGEROUS_SCHEMES = new Set(['file:', 'javascript:', 'data:', 'vbscript:', 'shell:', 'disk:']);
const WEB_SCHEMES = new Set(['http:', 'https:', 'about:', 'data:', 'blob:', 'faibilo:', 'file:', 'chrome:', 'javascript:', 'ws:', 'wss:']);

const KNOWN_PROTOCOL_APPS = {
  discord: 'Discord',
  spotify: 'Spotify',
  tg: 'Telegram',
  telegram: 'Telegram',
  zoommtg: 'Zoom',
  zoomus: 'Zoom',
  slack: 'Slack',
  msteams: 'Microsoft Teams',
  teams: 'Microsoft Teams',
  steam: 'Steam',
  mailto: 'Email Client',
  magnet: 'Torrent Client',
  vscode: 'Visual Studio Code',
  'vscode-insiders': 'VS Code Insiders',
  whatsapp: 'WhatsApp',
  'roblox-player': 'Roblox',
  epicgames: 'Epic Games Launcher',
  battlenet: 'Battle.net',
  skype: 'Skype',
  facetime: 'FaceTime',
  itms: 'Apple Music / iTunes',
  'itms-apps': 'App Store'
};

function isExternalAppUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const match = rawUrl.match(/^([a-z0-9+.-]+):/i);
  if (!match) return false;
  const protocol = match[1].toLowerCase() + ':';
  if (DANGEROUS_SCHEMES.has(protocol)) return false;
  return !WEB_SCHEMES.has(protocol);
}

function getAppNameForScheme(scheme) {
  const clean = String(scheme || '').toLowerCase().replace(/:$/, '');
  if (KNOWN_PROTOCOL_APPS[clean]) return KNOWN_PROTOCOL_APPS[clean];
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

const pendingAppRedirects = new Map();
let appRedirectCounter = 0;

function handleExternalAppRedirection(senderContents, targetUrl, preferredOrigin) {
  if (!isExternalAppUrl(targetUrl)) return false;

  const match = targetUrl.match(/^([a-z0-9+.-]+):/i);
  if (!match) return false;
  const scheme = match[1].toLowerCase();
  const appName = getAppNameForScheme(scheme);

  let origin = preferredOrigin || 'This site';
  if (!preferredOrigin) {
    try {
      if (senderContents && !senderContents.isDestroyed()) {
        const url = senderContents.getURL();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          origin = new URL(url).origin;
        }
      }
    } catch {}
  }

  const permKey = `open-app:${scheme}`;
  const saved = findPermission(origin, permKey);
  if (saved) {
    if (saved.allowed) {
      shell.openExternal(targetUrl);
      return true;
    }
    return false;
  }

  const hostContents = senderContents && typeof senderContents.getHostWebContents === 'function'
    ? senderContents.getHostWebContents()
    : senderContents;
  const parent = BrowserWindow.fromWebContents(hostContents)
    || BrowserWindow.getFocusedWindow()
    || [...browserWindows].find((w) => !w.isDestroyed());

  if (!parent || parent.isDestroyed()) {
    return false;
  }

  const requestId = `app-redirect-${++appRedirectCounter}`;

  const timeoutId = setTimeout(() => {
    if (pendingAppRedirects.has(requestId)) {
      pendingAppRedirects.delete(requestId);
      if (!parent.isDestroyed()) {
        parent.webContents.send('app-redirect:cancelled', requestId);
      }
    }
  }, 60000);

  pendingAppRedirects.set(requestId, {
    url: targetUrl,
    origin,
    scheme,
    appName,
    windowId: parent.id,
    timeoutId,
    callback: (allowed, remember) => {
      clearTimeout(timeoutId);
      if (remember) {
        const isIncognito = isIncognitoWindow(parent);
        rememberPermission(origin, permKey, Boolean(allowed), `Open ${appName}`, isIncognito);
      }
      if (allowed) {
        shell.openExternal(targetUrl);
      }
    }
  });

  parent.webContents.send('app-redirect:request', {
    requestId,
    origin,
    appName,
    scheme,
    url: targetUrl
  });

  return true;
}

function notifyGuestNotificationPermission(origin, status, isIncognito = false) {
  const norm = normalizeOrigin(origin);
  webContents.getAllWebContents().forEach((guest) => {
    if (guest.isDestroyed() || guest.getType() !== 'webview') return;
    try {
      const guestIncognito = guest.session === session.fromPartition('incognito');
      if (guestIncognito !== isIncognito) return;
      if (normalizeOrigin(guest.getURL()) !== norm) return;
      guest.send('webview:notification-permission-response', status);
    } catch {
      // Ignore invalid guest URLs while loading.
    }
  });
}

function promptSitePermissionOnce({ parent, origin, permission, label, icon }) {
  const isIncognito = isIncognitoWindow(parent);
  const key = `${isIncognito ? 'incog|' : ''}${permissionKey(origin, permission)}`;
  if (pendingPermissionPrompts.has(key)) {
    return pendingPermissionPrompts.get(key);
  }

  const promptPromise = new Promise((resolve) => {
    queueSitePermissionRequest({
      parent,
      origin,
      permission,
      label,
      icon,
      onResult: resolve
    });
  }).finally(() => {
    pendingPermissionPrompts.delete(key);
  });

  pendingPermissionPrompts.set(key, promptPromise);
  return promptPromise;
}

function queueSitePermissionRequest({ parent, origin, permission, label, icon, onResult }) {
  const isIncognito = isIncognitoWindow(parent);
  const savedPermission = findPermission(origin, permission, isIncognito);
  if (savedPermission) {
    if (permission === 'notifications') {
      notifyGuestNotificationPermission(origin, savedPermission.allowed ? 'granted' : 'denied', isIncognito);
    }
    onResult(savedPermission.allowed);
    return null;
  }

  if (!parent || parent.isDestroyed()) {
    onResult(false);
    return null;
  }

  const finishRequest = (allowed) => {
    rememberPermission(origin, permission, allowed, label, isIncognito);
    if (permission === 'notifications') {
      notifyGuestNotificationPermission(origin, allowed ? 'granted' : 'denied', isIncognito);
    }
    onResult(allowed);
  };

  const requestId = `permission-${++permissionRequestCounter}`;
  const timeout = setTimeout(() => {
    const request = pendingPermissions.get(requestId);
    if (!request) return;
    pendingPermissions.delete(requestId);
    request.callback(false);
    if (!parent.isDestroyed()) parent.webContents.send('permission-cancelled', requestId);
  }, 30000);

  pendingPermissions.set(requestId, { callback: finishRequest, timeout, windowId: parent.id, origin, permission });
  parent.webContents.send('permission-requested', { requestId, origin, permission, label, icon });
  return requestId;
}

function findPermission(origin, permission, isIncognito = false) {
  const norm = normalizeOrigin(origin);
  if (isIncognito) {
    return incognitoPermissions.find((item) => normalizeOrigin(item.origin) === norm && item.permission === permission) || null;
  }
  return sitePermissions.find((item) => normalizeOrigin(item.origin) === norm && item.permission === permission);
}

function rememberPermission(origin, permission, allowed, label, isIncognito = false) {
  const norm = normalizeOrigin(origin);
  const now = Date.now();
  const next = {
    key: permissionKey(norm, permission),
    origin: norm,
    permission,
    label: label || permissionLabel(permission),
    allowed: Boolean(allowed),
    updatedAt: now
  };
  if (isIncognito) {
    // In-memory ONLY for private session duration — never write to permissions.json!
    incognitoPermissions = [next, ...incognitoPermissions.filter((item) => item.key !== next.key)];
    return;
  }
  sitePermissions = [next, ...sitePermissions.filter((item) => item.key !== next.key)];
  savePermissions();
}

function installMenuShortcuts() {
  const template = [
    {
      label: 'Faibilo',
      submenu: [
        { label: 'New Tab', accelerator: 'CommandOrControl+T', click: () => sendBrowserCommand('new-tab') },
        { label: 'Close Tab', accelerator: 'CommandOrControl+W', click: () => sendBrowserCommand('close-tab') },
        { label: 'New Window', accelerator: 'CommandOrControl+N', click: () => createWindow() },
        { label: 'New Private Window', accelerator: 'CommandOrControl+Shift+N', click: () => createWindow('', { isIncognito: true }) },
        { type: 'separator' },
        { label: 'Back', accelerator: 'Alt+Left', click: () => sendBrowserCommand('go-back') },
        { label: 'Forward', accelerator: 'Alt+Right', click: () => sendBrowserCommand('go-forward') },
        { label: 'Reload', accelerator: 'CommandOrControl+R', click: () => sendBrowserCommand('reload') },
        { label: 'Reload', accelerator: 'F5', click: () => sendBrowserCommand('reload') },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CommandOrControl+F', click: () => sendBrowserCommand('find') },
        { label: 'Print Page', accelerator: 'CommandOrControl+P', click: () => sendBrowserCommand('print') },
        { label: 'Save Page', accelerator: 'CommandOrControl+S', click: () => sendBrowserCommand('save-page') },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CommandOrControl+Plus', click: () => sendBrowserCommand('zoom-in') },
        { label: 'Zoom In', accelerator: 'CommandOrControl+=', click: () => sendBrowserCommand('zoom-in') },
        { label: 'Zoom Out', accelerator: 'CommandOrControl+-', click: () => sendBrowserCommand('zoom-out') },
        { label: 'Reset Zoom', accelerator: 'CommandOrControl+0', click: () => sendBrowserCommand('zoom-reset') },
        { type: 'separator' },
        { label: 'Developer Tools', accelerator: 'F12', click: toggleFocusedDevTools },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/**
 * Clear ALL data from the incognito session partition.
 * Called whenever the last incognito window is closed.
 */
async function clearIncognitoSession() {
  incognitoPermissions = []; // Wipe all in-memory private permissions!
  try {
    const incognitoSession = session.fromPartition('incognito');
    await incognitoSession.clearStorageData({
      storages: [
        'cookies',
        'filesystem',
        'indexdb',
        'localstorage',
        'shadercache',
        'websql',
        'serviceworkers',
        'cachestorage'
      ]
    });
    await incognitoSession.clearCache();
    await incognitoSession.clearHostResolverCache();
    await incognitoSession.clearAuthCache();
  } catch {
    // Session may already be gone — ignore.
  }
}

function createWindow(initialUrl = '', options = {}) {
  const titleBarColor = options.isIncognito ? '#130f1a' : '#111815';
  const titleBarSymbolColor = options.isIncognito ? '#f5f3ff' : '#f4f7f1';

  const browserWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 920,
    minHeight: 620,
    title: options.isIncognito ? 'Faibilo (Private)' : 'Faibilo',
    icon: path.join(__dirname, 'assets', 'Faibilo-logo.png'),
    backgroundColor: options.isIncognito ? '#09060c' : '#0f1412',
    show: options.show ?? true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: titleBarColor,
      symbolColor: titleBarSymbolColor,
      height: 42
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      webviewTag: true
    }
  });

  browserWindows.add(browserWindow);
  if (options.isIncognito) incognitoWindows.add(browserWindow);
  browserWindow.webContents.setMaxListeners(30);
  installKeyboardShortcuts(browserWindow);

  const updatePresenceFromWindow = () => {
    updateDiscordPresence(browserWindow);
  };

  browserWindow.webContents.on('did-navigate', updatePresenceFromWindow);
  browserWindow.webContents.on('did-navigate-in-page', updatePresenceFromWindow);
  browserWindow.webContents.on('did-stop-loading', updatePresenceFromWindow);
  browserWindow.webContents.on('page-title-updated', updatePresenceFromWindow);
  browserWindow.on('focus', updatePresenceFromWindow);
  browserWindow.on('blur', () => {
    if (BrowserWindow.getFocusedWindow()?.id === browserWindow.id) return;
    updateDiscordPresence();
  });

  browserWindow.on('close', (event) => {
    if (isQuitting) return;
    if (options.isIncognito) {
      // Incognito windows truly close — don't hide to tray
      return; // let the close proceed → 'closed' fires below
    }
    event.preventDefault();
    hideBrowserWindow(browserWindow);
  });

  browserWindow.on('show', () => {
    if (!isQuitting) setWindowBackgroundMode(browserWindow, false);
  });

  browserWindow.on('focus', () => {
    if (!isQuitting) setWindowBackgroundMode(browserWindow, false);
  });

  browserWindow.on('closed', () => {
    browserWindows.delete(browserWindow);
    incognitoWindows.delete(browserWindow);

    // If this was the last incognito window, wipe all session data
    if (options.isIncognito && incognitoWindows.size === 0) {
      clearIncognitoSession();
    }

    for (const [requestId, request] of pendingPermissions) {
      if (request.windowId !== browserWindow.id) continue;
      clearTimeout(request.timeout);
      request.callback(false);
      pendingPermissions.delete(requestId);
    }

    for (const [requestId, request] of pendingScreenShares) {
      if (request.windowId !== browserWindow.id) continue;
      clearTimeout(request.timeout);
      try { request.callback({}); } catch {}
      pendingScreenShares.delete(requestId);
    }

    for (const [requestId, request] of pendingAppRedirects) {
      if (request.windowId !== browserWindow.id) continue;
      clearTimeout(request.timeoutId);
      pendingAppRedirects.delete(requestId);
    }
  });

  // Handle Fullscreen events to notify renderer
  browserWindow.on('enter-full-screen', () => {
    browserWindow.webContents.send('window:fullscreen', true);
  });
  browserWindow.on('leave-full-screen', () => {
    browserWindow.webContents.send('window:fullscreen', false);
  });

  const query = initialUrl ? { url: initialUrl } : {};
  if (options.isIncognito) {
    query.incognito = 'true';
  }

  browserWindow.loadFile(path.join(__dirname, 'index.html'), { query });

  browserWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalAppUrl(url)) {
      handleExternalAppRedirection(browserWindow.webContents, url);
      return { action: 'deny' };
    }

    const isAdBlockingActive = appSettings.blockAds !== false || appSettings.blockTrackers !== false;
    const isPopupBlockingActive = appSettings.blockPopups !== false;
    const blockOptions = {
      whitelistedDomains: appSettings.whitelistedDomains || [],
      customBlockRules: appSettings.customBlockRules || []
    };

    if ((isAdBlockingActive && isBlockedUrl(url, blockOptions)) || (isPopupBlockingActive && isPopupUrl(url, blockOptions))) {
      appSettings.blockedCount = (appSettings.blockedCount || 0) + 1;
      browserWindow.webContents.send('adblock:blocked', { url, type: 'popup' });
      return { action: 'deny' };
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      openUrlInBrowser(url);
    } else {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  return browserWindow;
}

function windowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

function resolvePermissionRequest(requestId, allowed, sender) {
  const request = pendingPermissions.get(requestId);
  const senderWindow = BrowserWindow.fromWebContents(sender);
  if (!request || senderWindow?.id !== request.windowId) return false;
  clearTimeout(request.timeout);
  pendingPermissions.delete(requestId);
  request.callback(Boolean(allowed));
  return true;
}

let pendingBlockedNetworkCount = 0;
let blockedBatchNotifyTimer = null;

function flushBlockedNetworkBatch() {
  if (pendingBlockedNetworkCount <= 0) return;
  const count = pendingBlockedNetworkCount;
  pendingBlockedNetworkCount = 0;
  blockedBatchNotifyTimer = null;

  for (const win of browserWindows) {
    if (!win.isDestroyed()) {
      win.webContents.send('adblock:blocked', { count, type: 'network' });
    }
  }
}

function configureFastSession(browserSession) {
  browserSession.setPreloads([]);

  // Clean User-Agent so all websites detect standard Chrome (enabling screen share on Discord, Meet, Teams, etc.)
  try {
    const defaultUa = browserSession.getUserAgent();
    const cleanUa = defaultUa.replace(/Electron\/[0-9\.]+\s*/gi, '').replace(/Faibilo\/[0-9\.]+\s*/gi, '').trim();
    if (cleanUa) {
      cachedCleanUa = cleanUa;
      browserSession.setUserAgent(cleanUa);
    }
  } catch {}

  browserSession.webRequest.onBeforeRequest((details, callback) => {
    if (!details.url || !details.url.startsWith('http')) {
      callback({});
      return;
    }

    const isAdBlockingActive = appSettings.blockAds !== false || appSettings.blockTrackers !== false;
    const blockOptions = {
      whitelistedDomains: appSettings.whitelistedDomains || [],
      customBlockRules: appSettings.customBlockRules || [],
      initiator: details.initiator
    };

    if (isAdBlockingActive && isBlockedUrl(details.url, blockOptions)) {
      appSettings.blockedCount = (appSettings.blockedCount || 0) + 1;
      pendingBlockedNetworkCount++;
      if (!blockedBatchNotifyTimer) {
        blockedBatchNotifyTimer = setTimeout(flushBlockedNetworkBatch, 150);
      }
      callback({ cancel: true });
      return;
    }

    callback({});
  });

  browserSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = details.requestHeaders || {};
    for (const key of Object.keys(headers)) {
      const lower = key.toLowerCase();
      if (lower === 'user-agent') {
        headers[key] = headers[key]
          .replace(/Electron\/[0-9\.]+\s*/gi, '')
          .replace(/Faibilo\/[0-9\.]+\s*/gi, '')
          .trim();
      } else if (lower === 'sec-ch-ua' || lower === 'sec-ch-ua-full-version-list') {
        headers[key] = headers[key]
          .replace(/"Electron";v="[^"]*"\s*,?\s*/gi, '')
          .replace(/"Faibilo";v="[^"]*"\s*,?\s*/gi, '')
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*/, '')
          .replace(/,\s*$/, '')
          .trim();
      }
    }
    callback({ requestHeaders: headers });
  });

  browserSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders || {};
    for (const key of Object.keys(responseHeaders)) {
      const lower = key.toLowerCase();
      if (lower === 'permissions-policy' || lower === 'feature-policy') {
        responseHeaders[key] = responseHeaders[key].map((val) =>
          val.replace(/display-capture=\(\s*\)/gi, 'display-capture=*')
        );
      }
    }
    callback({ responseHeaders });
  });

  browserSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (permission === 'display-capture') return true;
    let parent = null;
    try {
      const host = typeof webContents?.getHostWebContents === 'function' ? webContents.getHostWebContents() : webContents;
      parent = BrowserWindow.fromWebContents(host);
    } catch {}
    const isIncognito = isIncognitoWindow(parent) || (webContents?.session === session.fromPartition('incognito'));
    const saved = findPermission(requestingOrigin, permission, isIncognito);
    if (!saved) return false;
    return saved.allowed;
  });

  browserSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (permission === 'display-capture' || (permission === 'media' && Array.isArray(details.mediaTypes) && details.mediaTypes.length === 0)) {
      callback(true);
      return;
    }

    const origin = permissionOriginFromDetails(details, webContents);
    const hostContents = typeof webContents.getHostWebContents === 'function' ? webContents.getHostWebContents() : webContents;
    const parent = BrowserWindow.fromWebContents(hostContents) || BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    let label = permissionLabel(permission);

    if (permission === 'media' && details.mediaTypes?.length === 1) {
      label = details.mediaTypes[0] === 'audio' ? 'microphone' : 'camera';
    }

    const icon = permissionIcon(permission, label);

    if (!parent || parent.isDestroyed()) {
      callback(false);
      return;
    }

    promptSitePermissionOnce({ parent, origin, permission, label, icon })
      .then((allowed) => callback(allowed))
      .catch(() => callback(false));
  });

  browserSession.setDisplayMediaRequestHandler(async (request, callback) => {
    let parent = null;
    try {
      const frameContents = request.frame ? webContents.fromFrame(request.frame) : null;
      const hostContents = frameContents && typeof frameContents.getHostWebContents === 'function'
        ? frameContents.getHostWebContents()
        : frameContents;
      parent = hostContents ? BrowserWindow.fromWebContents(hostContents) : null;
    } catch {
      parent = null;
    }

    if (!parent || parent.isDestroyed()) {
      parent = BrowserWindow.getFocusedWindow() || [...browserWindows].find((w) => !w.isDestroyed()) || null;
    }

    if (!parent || parent.isDestroyed()) {
      callback({});
      return;
    }

    let origin = 'This site';
    try {
      if (request.securityOrigin) {
        origin = new URL(request.securityOrigin).origin;
      } else if (request.frame?.url) {
        origin = new URL(request.frame.url).origin;
      }
    } catch {
      origin = request.securityOrigin || 'This site';
    }

    let rawSources = [];
    try {
      rawSources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 480, height: 270 },
        fetchWindowIcons: true
      });
    } catch (err) {
      console.warn('Failed to retrieve desktop sources for screen share:', err);
      callback({});
      return;
    }

    const sources = rawSources.map((s) => ({
      id: s.id,
      name: s.name,
      isScreen: s.id.startsWith('screen:'),
      display_id: s.display_id || '',
      thumbnail: s.thumbnail ? s.thumbnail.toDataURL() : '',
      appIcon: s.appIcon ? s.appIcon.toDataURL() : ''
    }));

    const requestId = `screenshare-${++screenShareRequestCounter}`;
    let completed = false;

    const finishRequest = (result) => {
      if (completed) return;
      completed = true;
      const req = pendingScreenShares.get(requestId);
      if (req) {
        clearTimeout(req.timeout);
        pendingScreenShares.delete(requestId);
      }
      try {
        if (result?.allowed && result?.sourceId) {
          const matchedSource = rawSources.find((s) => s.id === result.sourceId);
          if (matchedSource) {
            const streamOptions = {
              video: matchedSource
            };
            if (result.audio) {
              streamOptions.audio = 'loopback';
            }
            try {
              callback(streamOptions);
              return;
            } catch (cbErr) {
              if (streamOptions.audio) {
                // If audio loopback is unsupported on this source/platform, fall back to video only
                delete streamOptions.audio;
                callback(streamOptions);
                return;
              }
              throw cbErr;
            }
          }
        }
      } catch (e) {
        console.warn('Error during screen share callback response:', e);
      }
      try { callback({}); } catch {}
    };

    const timeout = setTimeout(() => {
      finishRequest({ allowed: false });
      if (!parent.isDestroyed()) {
        parent.webContents.send('screenshare:cancelled', requestId);
      }
    }, 60000);

    pendingScreenShares.set(requestId, {
      callback: finishRequest,
      timeout,
      windowId: parent.id,
      origin
    });

    parent.webContents.send('screenshare:request', {
      requestId,
      origin,
      sources
    });
  });
}

function trackDownloads(browserSession) {
  browserSession.on('will-download', (event, item) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const startedAt = Date.now();

    if (!appSettings.askDownloadLocation && appSettings.downloadPath) {
      item.setSavePath(path.join(appSettings.downloadPath, item.getFilename()));
    }

    const payload = () => ({
      id,
      filename: item.getFilename(),
      url: item.getURL(),
      savePath: item.getSavePath(),
      receivedBytes: item.getReceivedBytes(),
      totalBytes: item.getTotalBytes(),
      state: item.getState(),
      startedAt
    });

    // Notify only visible browser windows (not media/splash windows)
    const notifyWindows = (channel, data) => {
      BrowserWindow.getAllWindows().forEach((win) => {
        if (win.isDestroyed()) return;
        // Skip non-browser windows (small widget windows have no download panel)
        if (win.getSize()[0] < 400) return;
        win.webContents.send(channel, data);
      });
    };

    notifyWindows('download-started', payload());

    // Throttle progress updates — max one IPC message per 250ms per download
    // so the main process isn't flooded while the download thread runs at full speed
    let lastUpdate = 0;
    item.on('updated', () => {
      const now = Date.now();
      if (now - lastUpdate < 250) return;
      lastUpdate = now;
      notifyWindows('download-updated', payload());
    });

    item.once('done', (_event, state) => {
      // Always send the final done event with the real save path
      notifyWindows('download-done', { ...payload(), state });
    });
  });
}



app.whenReady().then(async () => {
  reloadUpdateEnv();
  loadSettings();
  loadPermissions();
  createTray();
  initializeDiscordRichPresence().catch(() => {});

  if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
      applicationName: 'Faibilo',
      applicationVersion: '1.0.0',
      copyright: 'Copyright © 2026 VenoxBhs. Developer: GRSNSSS (Saaketh).',
      credits: 'Developer: GRSNSSS (Saaketh)\nPublisher: VenoxBhs'
    });
  }

  const faibiloSession = session.fromPartition('persist:faibilo');
  configureFastSession(faibiloSession);
  configureFastSession(session.defaultSession);
  trackDownloads(faibiloSession);
  trackDownloads(session.defaultSession);

  // Configure in-memory Private/Incognito Session
  const incognitoSession = session.fromPartition('incognito');
  configureFastSession(incognitoSession);
  trackDownloads(incognitoSession);

  // Create and show the main window with splash on first launch
  const launchTarget = normalizeLaunchTarget(pendingOpenUrl) || getLaunchTarget();
  pendingOpenUrl = '';
  await launchWithSplash(launchTarget);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow('', { show: true });
    } else {
      const browserWindow = findReusableBrowserWindow();
      if (browserWindow) showBrowserWindow(browserWindow);
    }
  });

  app.on('second-instance', (_event, commandLine) => {
    const target = getLaunchTarget(commandLine);
    openUrlInBrowser(target || '');
  });
});

app.on('window-all-closed', () => {
  if (isQuitting) {
    if (process.platform !== 'darwin') app.quit();
    return;
  }
  // Keep running in the tray with tabs alive when the window is hidden.
});

app.on('before-quit', async () => {
  aboutToQuitDiscord = true;
  isQuitting = true;
  await clearDiscordPresence();
  // Wipe incognito data on every app exit regardless of open windows
  if (incognitoWindows.size > 0) {
    clearIncognitoSession();
  }
});

ipcMain.handle('splash:request-install', () => {
  resolveSplashUpdateDecision('install');
  return true;
});

ipcMain.handle('splash:continue', () => {
  resolveSplashUpdateDecision('continue');
  return true;
});

ipcMain.handle('splash:run-installer', async () => {
  const pending = consumePendingInstaller(profilePath);
  if (!pending) return { ok: false, error: 'No installer found' };
  try {
    await runUpdateInstaller(pending.installerPath);
    // Quit Faibilo so the installer can replace the running exe.
    isQuitting = true;
    splashMandatoryUpdateActive = false;
    app.quit();
    return { ok: true };
  } catch (error) {
    // Re-save the path so the user can try again next launch.
    savePendingInstaller(pending.installerPath, profilePath);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('splash:get-pending-installer', () => {
  const stateFile = path.join(profilePath, 'pending-update.json');
  try {
    const data = JSON.parse(require('fs').readFileSync(stateFile, 'utf8'));
    if (data?.installerPath && require('fs').existsSync(data.installerPath)) {
      return data;
    }
  } catch { /* none */ }
  return null;
});

ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:is-default-browser', () => isDefaultBrowser());
ipcMain.handle('app:set-default-browser', () => setAsDefaultBrowser());
ipcMain.handle('app:trim-memory', async () => {
  try {
    const defaultSes = session.defaultSession;
    if (defaultSes) {
      await defaultSes.clearCache();
    }
    const mem = process.memoryUsage();
    return {
      ok: true,
      rssMb: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024))
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('app:check-for-updates', async () => {
  reloadUpdateEnv();
  const currentVersion = app.getVersion();
  const result = await checkForAppUpdate(currentVersion);
  const pending = peekPendingInstaller(profilePath);
  if (pending && pending.version === result?.version && fs.existsSync(pending.installerPath)) {
    return { ...result, downloaded: true, installerPath: pending.installerPath };
  }
  return result;
});

ipcMain.handle('app:get-pending-update', () => {
  const currentVersion = app.getVersion();
  const pending = peekPendingInstaller(profilePath);
  if (pending && fs.existsSync(pending.installerPath) && isNewerVersion(pending.version, currentVersion)) {
    return pending;
  }
  return null;
});

ipcMain.handle('app:install-ready-update', async () => {
  try {
    const pending = peekPendingInstaller(profilePath);
    if (pending?.installerPath && fs.existsSync(pending.installerPath)) {
      await runUpdateInstaller(pending.installerPath);
      setTimeout(() => {
        app.quit();
      }, 800);
      return { ok: true, installerPath: pending.installerPath };
    }
    return { ok: false, error: 'No ready installer found' };
  } catch (err) {
    return { ok: false, error: err?.message || 'Failed to start installer' };
  }
});

ipcMain.handle('app:install-update', async (_event, updateInfo) => {
  reloadUpdateEnv();
  try {
    const pending = peekPendingInstaller(profilePath);
    let installer = pending?.installerPath;
    if (!installer || !fs.existsSync(installer) || (updateInfo?.version && pending?.version !== updateInfo.version)) {
      const res = await downloadAndInstallUpdate(updateInfo, app.getPath('temp'));
      installer = res.installerPath;
      savePendingInstaller(installer, profilePath, res.version, updateInfo?.features, updateInfo?.notes);
    }
    if (installer && fs.existsSync(installer)) {
      await runUpdateInstaller(installer);
      setTimeout(() => {
        app.quit();
      }, 800);
      return { ok: true, installerPath: installer };
    }
    return { ok: false, error: 'Installer file not found.' };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('window:minimize', (event) => windowFromEvent(event)?.minimize());
ipcMain.handle('window:maximize', (event) => {
  const browserWindow = windowFromEvent(event);
  if (!browserWindow) return false;
  if (browserWindow.isMaximized()) browserWindow.unmaximize();
  else browserWindow.maximize();
  return browserWindow.isMaximized();
});
ipcMain.handle('window:close', (event) => {
  const browserWindow = windowFromEvent(event);
  if (!browserWindow || isQuitting) return;
  hideBrowserWindow(browserWindow);
});
ipcMain.handle('window:toggle-fullscreen', (event) => {
  const win = windowFromEvent(event);
  if (win) win.setFullScreen(!win.isFullScreen());
});
ipcMain.handle('window:set-fullscreen', (event, state) => {
  const win = windowFromEvent(event);
  if (win) win.setFullScreen(Boolean(state));
});
ipcMain.handle('window:newBrowserWindow', (_event, url, options) => {
  if (typeof url === 'string') {
    createWindow(url, options);
  }
});

ipcMain.handle('window:save-page', async (event, wcId) => {
  const wc = webContents.fromId(wcId);
  if (!wc) return;
  
  let title = wc.getTitle() || 'page';
  title = title.replace(/[\\/:*?"<>|]/g, '_');
  const defaultPath = path.join(appSettings.downloadPath || app.getPath('downloads'), `${title}.html`);
  
  const { canceled, filePath } = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), {
    title: 'Save Page As',
    defaultPath,
    filters: [
      { name: 'Webpage, Complete', extensions: ['html'] },
      { name: 'Webpage, HTML Only', extensions: ['html', 'htm'] }
    ]
  });
  
  if (!canceled && filePath) {
    wc.savePage(filePath, 'HTMLComplete')
      .then(() => console.log('Page saved successfully:', filePath))
      .catch((err) => console.error('Failed to save page:', err));
  }
});

ipcMain.handle('permission:respond', (event, requestId, allowed) => {
  return resolvePermissionRequest(requestId, allowed, event.sender);
});

ipcMain.handle('permissions:list', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return isIncognitoWindow(win) ? incognitoPermissions : sitePermissions;
});

ipcMain.handle('permissions:forget', (event, key) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (isIncognitoWindow(win)) {
    incognitoPermissions = incognitoPermissions.filter((item) => item.key !== key);
    return incognitoPermissions;
  }
  sitePermissions = sitePermissions.filter((item) => item.key !== key);
  savePermissions();
  return sitePermissions;
});

ipcMain.handle('permissions:clear', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (isIncognitoWindow(win)) {
    incognitoPermissions = [];
    return incognitoPermissions;
  }
  sitePermissions = [];
  savePermissions();
  return sitePermissions;
});

ipcMain.handle('settings:get', () => appSettings);
ipcMain.handle('settings:update', (_event, nextSettings) => {
  appSettings = { ...appSettings, ...nextSettings };
  saveSettings();
  applyStartupSetting();

  if ('desktopMediaDisk' in nextSettings) {
    if (!appSettings.desktopMediaDisk) {
      hideMediaWidget();
    } else {
      showMediaWidget();
    }
    if (mediaWindow && !mediaWindow.isDestroyed()) {
      mediaWindow.webContents.send('media:state', mediaState);
    }
  }

  if (mediaWindow && !mediaWindow.isDestroyed()) {
    mediaWindow.webContents.send('media:appearance', {
      themePreset: appSettings.themePreset || 'forest',
      accentColor: appSettings.accentColor || '#8be2bf',
      componentBgColor: appSettings.componentBgColor || '#151d19',
      borderColor: appSettings.borderColor || '#2f4039'
    });
  }

  return appSettings;
});

ipcMain.handle('settings:chooseDownloadPath', async () => {
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Choose download folder',
    defaultPath: appSettings.downloadPath || app.getPath('downloads'),
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || !result.filePaths[0]) return appSettings;
  appSettings.downloadPath = result.filePaths[0];
  saveSettings();
  return appSettings;
});

ipcMain.handle('app:openExternal', (event, url) => {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    shell.openExternal(url);
    return;
  }
  if (isExternalAppUrl(url)) {
    handleExternalAppRedirection(event.sender, url);
  }
});

ipcMain.handle('app:showItemInFolder', (_event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
  }
});

ipcMain.on('webview:popup-blocked', (event, data) => {
  appSettings.blockedCount = (appSettings.blockedCount || 0) + 1;
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send('adblock:blocked', { url: data?.url, type: 'popup' });
  }
});

// Synchronous ad and popup checks for sandboxed preloads
ipcMain.on('adblock:check-url', (event, { url, options }) => {
  event.returnValue = isBlockedUrl(url, options);
});

ipcMain.on('adblock:check-popup', (event, { url, options }) => {
  event.returnValue = isPopupUrl(url, options);
});

ipcMain.on('adblock:get-cosmetic-css', (event) => {
  event.returnValue = COSMETIC_AD_BLOCK_CSS;
});

ipcMain.on('adblock:get-site-config', (event, url) => {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {}

  const isWhitelisted = (appSettings.whitelistedDomains || []).some((domain) => {
    const d = String(domain || '').toLowerCase().trim();
    return d && (host === d || host.endsWith('.' + d));
  });

  const blockAds = appSettings.blockAds !== false;
  const cosmeticFiltering = appSettings.cosmeticFiltering !== false;
  const autoSkipVideoAds = appSettings.autoSkipVideoAds !== false;

  event.returnValue = {
    whitelisted: isWhitelisted,
    blockAds: isWhitelisted ? false : blockAds,
    cosmeticFiltering: isWhitelisted ? false : cosmeticFiltering,
    autoSkipVideoAds: isWhitelisted ? false : autoSkipVideoAds,
    cosmeticCss: (!isWhitelisted && blockAds && cosmeticFiltering) ? COSMETIC_AD_BLOCK_CSS : ''
  };
});

ipcMain.handle('app:toggleDevTools', (event) => {
  const browserWindow = windowFromEvent(event);
  browserWindow?.webContents.toggleDevTools();
  return true;
});

// --- Widget Search Integration ---
ipcMain.on('widget:search', (_event, { query }) => {
  const q = String(query ?? '').trim();
  if (!q) return;

  const browserWindow = findReusableBrowserWindow();
  if (browserWindow) {
    showBrowserWindow(browserWindow);
    browserWindow.webContents.send('browser-command', { type: 'widget-search', query: q });
    browserWindow.webContents.send('widget-search-query', q);
  } else {
    let targetUrl = q;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(q)) {
      if (/^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/i.test(q)) {
        targetUrl = `http://${q}`;
      } else if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/i.test(q)) {
        targetUrl = `https://${q}`;
      } else {
        const engine = appSettings.searchEngine || 'google';
        let searchBase = 'https://www.google.com/search?q=';
        if (engine === 'duckduckgo') searchBase = 'https://duckduckgo.com/?q=';
        if (engine === 'bing') searchBase = 'https://www.bing.com/search?q=';
        targetUrl = `${searchBase}${encodeURIComponent(q)}`;
      }
    }
    createWindow(targetUrl);
  }
});

// --- Desktop Media Disk Widget ---
let mediaWindow = null;
let mediaState = {
  playing: false,
  title: '',
  thumbnail: '',
  url: '',
  menuOpen: false,
  exists: false
};

function createMediaWindow() {
  if (mediaWindow && !mediaWindow.isDestroyed()) return mediaWindow;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const xCoord = 12;
  const yCoord = screenHeight - 142;

  let initialWidth = mediaState.menuOpen ? 340 : 100;
  let initialHeight = 130;

  mediaWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    x: xCoord,
    y: yCoord,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    focusable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  mediaWindow.setIgnoreMouseEvents(false);
  mediaWindow.setAlwaysOnTop(true, 'screen-saver');

  mediaWindow.loadFile(path.join(__dirname, 'media.html'));
  mediaWindow.on('closed', () => {
    mediaWindow = null;
  });

  mediaWindow.webContents.on('did-finish-load', () => {
    mediaWindow?.webContents.send('media:state', mediaState);
    mediaWindow?.webContents.send('media:appearance', {
      themePreset: appSettings.themePreset || 'forest',
      accentColor: appSettings.accentColor || '#8be2bf',
      componentBgColor: appSettings.componentBgColor || '#151d19',
      borderColor: appSettings.borderColor || '#2f4039'
    });
  });

  return mediaWindow;
}

function updateMediaWindowBounds() {
  if (!mediaWindow || mediaWindow.isDestroyed()) return;
  const targetWidth = mediaState.menuOpen ? 340 : 100;
  mediaWindow.setSize(targetWidth, 130);
}

function showMediaWidget() {
  if (!appSettings.desktopMediaDisk) return;
  const win = createMediaWindow();
  if (win.isDestroyed()) return;
  if (!win.isVisible()) {
    win.show();
    win.webContents.send('window:appear');
  }
  win.webContents.send('media:state', mediaState);
}

function hideMediaWidget() {
  if (mediaWindow && !mediaWindow.isDestroyed()) {
    mediaWindow.hide();
  }
}

ipcMain.on('media:update-state', (_event, state) => {
  const exists = Boolean(state.exists);
  mediaState.exists = exists;
  mediaState.playing = Boolean(state.playing);

  if (exists) {
    mediaState.title = state.title || '';
    mediaState.thumbnail = state.thumbnail || '';
    mediaState.url = state.url || '';
  } else {
    mediaState.title = '';
    mediaState.thumbnail = '';
    mediaState.url = '';
    updateMediaWindowBounds();
  }

  if (appSettings.desktopMediaDisk) {
    showMediaWidget();
    mediaWindow?.webContents.send('media:state', mediaState);
  }
});

ipcMain.on('media:control-action', (_event, action) => {
  const browserWindow = findReusableBrowserWindow();
  if (!browserWindow) return;

  if (action === 'go-to-tab') {
    showBrowserWindow(browserWindow);
  }

  browserWindow.webContents.send('media:control', action);
});

ipcMain.on('media:set-menu-open', (_event, open) => {
  mediaState.menuOpen = Boolean(open);
  updateMediaWindowBounds();
});

ipcMain.on('media:settings-update', (_event, enabled) => {
  appSettings.desktopMediaDisk = Boolean(enabled);
  saveSettings();
  if (!appSettings.desktopMediaDisk) {
    hideMediaWidget();
  } else {
    showMediaWidget();
  }
  BrowserWindow.getAllWindows().forEach((window) => {
    if (window !== mediaWindow) {
      window.webContents.send('media:settings-change', appSettings.desktopMediaDisk);
    }
  });
});

ipcMain.on('media:set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.setIgnoreMouseEvents(ignore, options);
  }
});

let mediaDragStartPos = null;

ipcMain.on('media:drag-start', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    const [x, y] = win.getPosition();
    mediaDragStartPos = { x, y };
  }
});

ipcMain.on('media:drag', (event, { dx, dy }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed() && mediaDragStartPos) {
    const newX = Math.round(mediaDragStartPos.x + dx);
    const newY = Math.round(mediaDragStartPos.y + dy);
    win.setPosition(newX, newY);
  }
});

ipcMain.handle('media:get-appearance', () => ({
  themePreset: appSettings.themePreset || 'forest',
  accentColor: appSettings.accentColor || '#8be2bf',
  componentBgColor: appSettings.componentBgColor || '#151d19',
  borderColor: appSettings.borderColor || '#2f4039'
}));

ipcMain.on('media:appearance-update', (_event, appearance) => {
  if (!appearance || typeof appearance !== 'object') return;
  if (appearance.themePreset) appSettings.themePreset = appearance.themePreset;
  if (appearance.accentColor) appSettings.accentColor = appearance.accentColor;
  if (appearance.componentBgColor) appSettings.componentBgColor = appearance.componentBgColor;
  if (appearance.borderColor) appSettings.borderColor = appearance.borderColor;
  saveSettings();
  if (mediaWindow && !mediaWindow.isDestroyed()) {
    mediaWindow.webContents.send('media:appearance', {
      themePreset: appSettings.themePreset || 'forest',
      accentColor: appSettings.accentColor || '#8be2bf',
      componentBgColor: appSettings.componentBgColor || '#151d19',
      borderColor: appSettings.borderColor || '#2f4039'
    });
  }
});

// --- Webview Preload Path & Notifications ---

ipcMain.on('get-webview-preload-path', (event) => {
  const url = require('url');
  event.returnValue = url.pathToFileURL(path.join(__dirname, 'preload-webview.js')).href;
});

ipcMain.on('get-clean-user-agent', (event) => {
  if (cachedCleanUa) {
    event.returnValue = cachedCleanUa;
    return;
  }
  try {
    const ua = session.defaultSession.getUserAgent();
    cachedCleanUa = ua.replace(/Electron\/[0-9\.]+\s*/gi, '').replace(/Faibilo\/[0-9\.]+\s*/gi, '').trim();
    event.returnValue = cachedCleanUa;
  } catch {
    event.returnValue = '';
  }
});

ipcMain.handle('webview-permission:request', async (event, { permission, url }) => {
  const parent = BrowserWindow.fromWebContents(event.sender);
  if (!parent || parent.isDestroyed()) return false;

  const origin = permissionOriginFromDetails({ requestingUrl: url });
  let label = permissionLabel(permission);
  const icon = permissionIcon(permission, label);

  try {
    return await promptSitePermissionOnce({ parent, origin, permission, label, icon });
  } catch {
    return false;
  }
});

ipcMain.handle('screenshare:respond', (event, payload) => {
  const { requestId, allowed, sourceId, audio } = payload || {};
  const request = pendingScreenShares.get(requestId);
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (!request || senderWindow?.id !== request.windowId) return false;
  request.callback({ allowed: Boolean(allowed), sourceId, audio: Boolean(audio) });
  return true;
});

ipcMain.handle('app-redirect:respond', (event, payload) => {
  const { requestId, allowed, remember } = payload || {};
  const request = pendingAppRedirects.get(requestId);
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (!request || senderWindow?.id !== request.windowId) return false;
  clearTimeout(request.timeoutId);
  pendingAppRedirects.delete(requestId);
  request.callback(Boolean(allowed), Boolean(remember));
  return true;
});

ipcMain.handle('app-redirect:request-from-client', (event, url, clientOrigin) => {
  if (isExternalAppUrl(url)) {
    return handleExternalAppRedirection(event.sender, url, clientOrigin);
  }
  return false;
});


ipcMain.on('webview:check-notification-permission', (event, origin) => {
  const normOrigin = normalizeOrigin(origin);
  const isIncognito = event.sender.session === session.fromPartition('incognito');
  const savedPermission = findPermission(normOrigin, 'notifications', isIncognito);
  if (savedPermission) {
    event.returnValue = savedPermission.allowed ? 'granted' : 'denied';
  } else {
    event.returnValue = 'default';
  }
});

ipcMain.on('webview:request-notification-permission', (event, payload) => {
  const webContents = event.sender;
  const origin = typeof payload === 'object' && payload ? payload.origin : payload;
  const reqId = typeof payload === 'object' && payload ? payload.reqId : undefined;

  const hostContents = typeof webContents.getHostWebContents === 'function'
    ? webContents.getHostWebContents()
    : webContents;
  const parent = BrowserWindow.fromWebContents(hostContents)
    || BrowserWindow.getFocusedWindow()
    || BrowserWindow.getAllWindows()[0];

  if (!parent || parent.isDestroyed()) {
    if (!webContents.isDestroyed()) {
      webContents.send('webview:notification-permission-response', { status: 'denied', reqId });
    }
    return;
  }

  const normOrigin = normalizeOrigin(origin);
  promptSitePermissionOnce({
    parent,
    origin: normOrigin,
    permission: 'notifications',
    label: permissionLabel('notifications'),
    icon: 'bell'
  }).then((allowed) => {
    if (!webContents.isDestroyed()) {
      webContents.send('webview:notification-permission-response', { status: allowed ? 'granted' : 'denied', reqId });
    }
  }).catch(() => {
    if (!webContents.isDestroyed()) {
      webContents.send('webview:notification-permission-response', { status: 'denied', reqId });
    }
  });
});

const activeSystemNotifications = new Map();

ipcMain.on('webview:show-notification', (event, { id, title, options }) => {
  const payload = options || {};
  let iconPath = path.join(__dirname, 'assets', 'Faibilo-logo.png');

  if (payload.icon) {
    try {
      if (typeof payload.icon === 'string' && payload.icon.startsWith('data:image/')) {
        iconPath = nativeImage.createFromDataURL(payload.icon);
      } else if (typeof payload.icon === 'string' && fs.existsSync(payload.icon)) {
        iconPath = payload.icon;
      }
    } catch {
      // Keep default icon.
    }
  }

  const notifId = id || ('notif_' + Date.now() + '_' + Math.random().toString(36).slice(2));

  // If there's an existing notification with the same tag, close it
  if (payload.tag) {
    for (const [existingId, item] of activeSystemNotifications.entries()) {
      if (item.tag === payload.tag) {
        try { item.notification.close(); } catch {}
        activeSystemNotifications.delete(existingId);
      }
    }
  }

  const notification = new Notification({
    title: title || 'Faibilo',
    body: payload.body || '',
    icon: iconPath,
    silent: Boolean(payload.silent)
  });

  activeSystemNotifications.set(notifId, { notification, tag: payload.tag, sender: event.sender });

  notification.on('click', () => {
    const sender = event.sender;
    const hostContents = typeof sender.getHostWebContents === 'function'
      ? sender.getHostWebContents()
      : sender;
    const win = BrowserWindow.fromWebContents(hostContents)
      || BrowserWindow.getFocusedWindow()
      || BrowserWindow.getAllWindows()[0];

    if (win && !win.isDestroyed()) {
      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
      win.webContents.send('webview:notification-clicked', {
        guestId: sender.id,
        id: notifId,
        tag: payload.tag
      });
    }

    if (!sender.isDestroyed()) {
      sender.send('webview:notification-clicked', {
        id: notifId,
        tag: payload.tag
      });
    }
  });

  notification.on('close', () => {
    activeSystemNotifications.delete(notifId);
    if (!event.sender.isDestroyed()) {
      event.sender.send('webview:notification-closed', {
        id: notifId,
        tag: payload.tag
      });
    }
  });

  notification.show();
});

ipcMain.on('webview:close-notification', (_event, { id, tag }) => {
  if (id && activeSystemNotifications.has(id)) {
    try { activeSystemNotifications.get(id).notification.close(); } catch {}
    activeSystemNotifications.delete(id);
    return;
  }
  if (tag) {
    for (const [existingId, item] of activeSystemNotifications.entries()) {
      if (item.tag === tag) {
        try { item.notification.close(); } catch {}
        activeSystemNotifications.delete(existingId);
      }
    }
  }
});



