const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('faibilo', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  newBrowserWindow: (url, options) => ipcRenderer.invoke('window:newBrowserWindow', url, options),
  respondToPermission: (requestId, allowed) => ipcRenderer.invoke('permission:respond', requestId, allowed),
  requestWebviewPermission: (payload) => ipcRenderer.invoke('webview-permission:request', payload),
  listPermissions: () => ipcRenderer.invoke('permissions:list'),
  forgetPermission: (key) => ipcRenderer.invoke('permissions:forget', key),
  clearPermissions: () => ipcRenderer.invoke('permissions:clear'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  chooseDownloadPath: () => ipcRenderer.invoke('settings:chooseDownloadPath'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  showItemInFolder: (filePath) => ipcRenderer.invoke('app:showItemInFolder', filePath),
  toggleDevTools: () => ipcRenderer.invoke('app:toggleDevTools'),
  savePage: (webContentsId) => ipcRenderer.invoke('window:save-page', webContentsId),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  setFullscreen: (state) => ipcRenderer.invoke('window:set-fullscreen', state),
  webviewPreloadPath: ipcRenderer.sendSync('get-webview-preload-path'),

  // Ad & Popup Blocker APIs (safe synchronous IPC, no relative require in sandbox)
  isBlockedUrl: (url, options) => {
    try {
      return ipcRenderer.sendSync('adblock:check-url', { url, options });
    } catch {
      return false;
    }
  },
  isPopupUrl: (url, options) => {
    try {
      return ipcRenderer.sendSync('adblock:check-popup', { url, options });
    } catch {
      return false;
    }
  },
  onAdBlocked: (callback) => ipcRenderer.on('adblock:blocked', (_event, data) => callback(data)),

  onBrowserCommand: (callback) => ipcRenderer.on('browser-command', (_event, command) => callback(command)),
  onPermissionRequested: (callback) => ipcRenderer.on('permission-requested', (_event, request) => callback(request)),
  onPermissionCancelled: (callback) => ipcRenderer.on('permission-cancelled', (_event, requestId) => callback(requestId)),
  onScreenShareRequested: (callback) => ipcRenderer.on('screenshare:request', (_event, data) => callback(data)),
  onScreenShareCancelled: (callback) => ipcRenderer.on('screenshare:cancelled', (_event, requestId) => callback(requestId)),
  respondToScreenShare: (payload) => ipcRenderer.invoke('screenshare:respond', payload),
  onAppRedirectRequested: (callback) => ipcRenderer.on('app-redirect:request', (_event, data) => callback(data)),
  onAppRedirectCancelled: (callback) => ipcRenderer.on('app-redirect:cancelled', (_event, reqId) => callback(reqId)),
  respondToAppRedirect: (payload) => ipcRenderer.invoke('app-redirect:respond', payload),
  requestAppRedirect: (url, origin) => ipcRenderer.invoke('app-redirect:request-from-client', url, origin),
  onNotificationClicked: (callback) => ipcRenderer.on('webview:notification-clicked', (_event, data) => callback(data)),
  onOpenUrlInTab: (callback) => ipcRenderer.on('open-url-in-tab', (_event, url) => callback(url)),
  onDownloadStarted: (callback) => ipcRenderer.on('download-started', (_event, item) => callback(item)),
  onDownloadUpdated: (callback) => ipcRenderer.on('download-updated', (_event, item) => callback(item)),
  onDownloadDone: (callback) => ipcRenderer.on('download-done', (_event, item) => callback(item)),
  onFullscreen: (callback) => ipcRenderer.on('window:fullscreen', (_event, isFullscreen) => callback(isFullscreen)),
  onBackgroundMode: (callback) => ipcRenderer.on('app:background-mode', (_event, inBackground) => callback(inBackground)),

  // Widget Search integration
  searchFromWidget: (query, options = {}) => ipcRenderer.send('widget:search', { query, options }),

  // Media Widget APIs
  sendMediaState: (state) => ipcRenderer.send('media:update-state', state),
  onMediaState: (callback) => ipcRenderer.on('media:state', (_event, state) => callback(state)),
  sendMediaControl: (action) => ipcRenderer.send('media:control-action', action),
  onMediaControl: (callback) => ipcRenderer.on('media:control', (_event, action) => callback(action)),
  setMediaMenuOpen: (open) => ipcRenderer.send('media:set-menu-open', open),
  sendMediaSettings: (enabled) => ipcRenderer.send('media:settings-update', enabled),
  onMediaSettingsChange: (callback) => ipcRenderer.on('media:settings-change', (_event, enabled) => callback(enabled)),
  onWindowAppear: (callback) => ipcRenderer.on('window:appear', () => callback()),
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('media:set-ignore-mouse-events', ignore, options),
  startMediaWidgetDrag: () => ipcRenderer.send('media:drag-start'),
  dragMediaWidget: (dx, dy) => ipcRenderer.send('media:drag', { dx, dy }),
  onMediaAppearance: (callback) => ipcRenderer.on('media:appearance', (_event, appearance) => callback(appearance)),
  sendMediaAppearance: (appearance) => ipcRenderer.send('media:appearance-update', appearance),
  getMediaAppearance: () => ipcRenderer.invoke('media:get-appearance'),

  notifyAppReady: () => ipcRenderer.send('app:renderer-ready'),

  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),
  getPendingUpdate: () => ipcRenderer.invoke('app:get-pending-update'),
  installUpdate: (updateInfo) => ipcRenderer.invoke('app:install-update', updateInfo),
  installReadyUpdate: () => ipcRenderer.invoke('app:install-ready-update'),
  onUpdateAvailable: (callback) => ipcRenderer.on('app:update-available', (_event, data) => callback(data)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('app:update-downloaded', (_event, data) => callback(data)),
  onUpdateDownloadProgress: (callback) => ipcRenderer.on('app:update-download-progress', (_event, data) => callback(data)),
  isDefaultBrowser: () => ipcRenderer.invoke('app:is-default-browser'),
  setDefaultBrowser: () => ipcRenderer.invoke('app:set-default-browser'),
  cleanUserAgent: ipcRenderer.sendSync('get-clean-user-agent'),
  trimMemory: () => ipcRenderer.invoke('app:trim-memory')
});
