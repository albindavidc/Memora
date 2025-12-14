"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('updaterAPI', {
    // Actions
    checkForUpdates: () => electron_1.ipcRenderer.invoke('updater:check'),
    downloadUpdate: () => electron_1.ipcRenderer.invoke('updater:download'),
    installUpdate: () => electron_1.ipcRenderer.invoke('updater:install'),
    skipVersion: (version) => electron_1.ipcRenderer.invoke('updater:skipVersion', version),
    // State getters
    getState: () => electron_1.ipcRenderer.invoke('updater:getState'),
    getSettings: () => electron_1.ipcRenderer.invoke('updater:getSettings'),
    updateSettings: (settings) => electron_1.ipcRenderer.invoke('updater:updateSettings', settings),
    // Events
    onStateChanged: (callback) => {
        const handler = (_, state) => callback(state);
        electron_1.ipcRenderer.on('updater:state-changed', handler);
        return () => electron_1.ipcRenderer.removeListener('updater:state-changed', handler);
    }
});
