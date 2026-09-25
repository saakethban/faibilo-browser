const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('splash', {
  onProgress: (callback) => {
    ipcRenderer.on('splash:progress', (_event, payload) => callback(payload));
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('splash:update', (_event, payload) => callback(payload));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('splash:download-progress', (_event, payload) => callback(payload));
  },
  requestInstall: () => ipcRenderer.invoke('splash:request-install'),
  continueLaunch: () => ipcRenderer.invoke('splash:continue'),
  runInstaller: () => ipcRenderer.invoke('splash:run-installer'),
  getPendingInstaller: () => ipcRenderer.invoke('splash:get-pending-installer')
});
