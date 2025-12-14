"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_updater_1 = require("electron-updater");
const electron_log_1 = __importDefault(require("electron-log"));
// --- Update Manager State ---
let updateState = {
    status: 'idle',
    currentVersion: electron_1.app.getVersion(),
    availableVersion: null,
    releaseNotes: null,
    releaseDate: null,
    downloadProgress: 0,
    bytesPerSecond: 0,
    totalBytes: 0,
    downloadedBytes: 0,
    error: null
};
let updateSettings = {
    autoCheck: true,
    autoDownload: false,
    autoInstall: false,
    checkInterval: 60,
    allowPrerelease: false,
    allowDowngrade: false
};
// --- Configuration ---
electron_updater_1.autoUpdater.logger = electron_log_1.default;
electron_updater_1.autoUpdater.logger.transports.file.level = 'info';
electron_updater_1.autoUpdater.autoDownload = false; // We handle this manually via UI
electron_updater_1.autoUpdater.autoInstallOnAppQuit = false;
// --- Window Management ---
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        frame: false, // Frameless for custom UI
        transparent: true, // Glass effect support
        backgroundColor: '#00000000', // Transparent bg
        hasShadow: true,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // Load app
    if (process.env.NODE_ENV === 'development' || process.env.BROWSER === 'none') {
        mainWindow.loadURL('http://localhost:5173');
    }
    else {
        // In production, we load the bundled index.html
        // Since main.js is in dist-electron/ and index.html is in dist/, we go up one level
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
}
// --- App Lifecycle ---
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
    // Initial update check if enabled
    if (updateSettings.autoCheck) {
        setTimeout(() => {
            electron_updater_1.autoUpdater.checkForUpdatesAndNotify().catch(() => { });
        }, 3000);
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// --- Updater Logic Helper ---
function broadcastState() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('updater:state-changed', updateState);
    }
}
function updateStatus(partial) {
    updateState = { ...updateState, ...partial };
    broadcastState();
}
// --- Updater Events ---
electron_updater_1.autoUpdater.on('checking-for-update', () => {
    updateStatus({ status: 'checking', error: null });
});
electron_updater_1.autoUpdater.on('update-available', (info) => {
    updateStatus({
        status: 'available',
        availableVersion: info.version,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : 'No release notes',
        releaseDate: info.releaseDate
    });
});
electron_updater_1.autoUpdater.on('update-not-available', () => {
    updateStatus({ status: 'not-available' });
});
electron_updater_1.autoUpdater.on('error', (err) => {
    updateStatus({ status: 'error', error: err.message });
});
electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
    updateStatus({
        status: 'downloading',
        downloadProgress: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
        totalBytes: progressObj.total,
        downloadedBytes: progressObj.transferred
    });
});
electron_updater_1.autoUpdater.on('update-downloaded', () => {
    updateStatus({ status: 'downloaded', downloadProgress: 100 });
});
// --- IPC Handlers (API) ---
electron_1.ipcMain.handle('updater:check', async () => {
    try {
        await electron_updater_1.autoUpdater.checkForUpdates();
        return updateState;
    }
    catch (e) {
        updateStatus({ status: 'error', error: e.message });
        return updateState;
    }
});
electron_1.ipcMain.handle('updater:download', async () => {
    await electron_updater_1.autoUpdater.downloadUpdate();
    return updateState;
});
electron_1.ipcMain.handle('updater:install', () => {
    electron_updater_1.autoUpdater.quitAndInstall();
});
electron_1.ipcMain.handle('updater:getState', () => updateState);
electron_1.ipcMain.handle('updater:getSettings', () => updateSettings);
electron_1.ipcMain.handle('updater:updateSettings', (_, newSettings) => {
    updateSettings = { ...updateSettings, ...newSettings };
    // Apply logic
    updateSettings.autoDownload ? electron_updater_1.autoUpdater.autoDownload = true : electron_updater_1.autoUpdater.autoDownload = false;
    return updateSettings;
});
electron_1.ipcMain.handle('updater:skipVersion', () => {
    // Logic to save skipped version to store would go here
});
