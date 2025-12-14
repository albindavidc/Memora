import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('updaterAPI', {
  // Actions
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  skipVersion: (version: string) => ipcRenderer.invoke('updater:skipVersion', version),
  
  // State getters
  getState: () => ipcRenderer.invoke('updater:getState'),
  getSettings: () => ipcRenderer.invoke('updater:getSettings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('updater:updateSettings', settings),
  
  // Events
  onStateChanged: (callback: (state: any) => void) => {
    const handler = (_: any, state: any) => callback(state);
    ipcRenderer.on('updater:state-changed', handler);
    return () => ipcRenderer.removeListener('updater:state-changed', handler);
  }
});