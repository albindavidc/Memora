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
    status: "idle",
    currentVersion: electron_1.app.getVersion(),
    availableVersion: null,
    releaseNotes: null,
    releaseDate: null,
    downloadProgress: 0,
    bytesPerSecond: 0,
    totalBytes: 0,
    downloadedBytes: 0,
    error: null,
};
let updateSettings = {
    autoCheck: false, // Manual updates only - check from Dashboard
    autoDownload: false,
    autoInstall: false,
    checkInterval: 60,
    allowPrerelease: false,
    allowDowngrade: false,
};
// --- Configuration ---
electron_updater_1.autoUpdater.logger = electron_log_1.default;
electron_updater_1.autoUpdater.logger.transports.file.level = "info";
electron_updater_1.autoUpdater.autoDownload = false; // We handle this manually via UI
electron_updater_1.autoUpdater.autoInstallOnAppQuit = false;
// --- Native Context Menu Setup ---
function setupContextMenu(window) {
    window.webContents.on("context-menu", (event, params) => {
        const menuTemplate = [];
        // Text editing options
        if (params.isEditable) {
            if (params.misspelledWord) {
                // Add spelling suggestions
                for (const suggestion of params.dictionarySuggestions.slice(0, 5)) {
                    menuTemplate.push({
                        label: suggestion,
                        click: () => window.webContents.replaceMisspelling(suggestion),
                    });
                }
                if (params.dictionarySuggestions.length > 0) {
                    menuTemplate.push({ type: "separator" });
                }
            }
            menuTemplate.push({ label: "Undo", role: "undo", enabled: params.editFlags.canUndo }, { label: "Redo", role: "redo", enabled: params.editFlags.canRedo }, { type: "separator" }, { label: "Cut", role: "cut", enabled: params.editFlags.canCut }, { label: "Copy", role: "copy", enabled: params.editFlags.canCopy }, { label: "Paste", role: "paste", enabled: params.editFlags.canPaste }, {
                label: "Select All",
                role: "selectAll",
                enabled: params.editFlags.canSelectAll,
            });
        }
        else if (params.selectionText) {
            // Text selection (non-editable)
            menuTemplate.push({ label: "Copy", role: "copy" });
        }
        // Link options
        if (params.linkURL) {
            if (menuTemplate.length > 0) {
                menuTemplate.push({ type: "separator" });
            }
            menuTemplate.push({
                label: "Open Link in Browser",
                click: () => electron_1.shell.openExternal(params.linkURL),
            }, {
                label: "Copy Link Address",
                click: () => electron_1.clipboard.writeText(params.linkURL),
            });
        }
        // Image options
        if (params.hasImageContents && params.srcURL) {
            if (menuTemplate.length > 0) {
                menuTemplate.push({ type: "separator" });
            }
            menuTemplate.push({
                label: "Copy Image",
                click: () => window.webContents.copyImageAt(params.x, params.y),
            });
        }
        // Show menu only if there are items
        if (menuTemplate.length > 0) {
            const menu = electron_1.Menu.buildFromTemplate(menuTemplate);
            menu.popup({ window });
        }
    });
}
// --- Window Management ---
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        frame: false, // Frameless for custom UI
        transparent: true, // Glass effect support
        backgroundColor: "#00000000", // Transparent bg
        hasShadow: false, // Disable shadow to reduce compositor conflicts
        alwaysOnTop: false, // Default to not floating above other windows
        skipTaskbar: false, // Keep in taskbar
        icon: path_1.default.join(__dirname, "../assets/icon.png"), // App icon
        // Improve performance with hardware-accelerated content in other apps
        paintWhenInitiallyHidden: true,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            // These can help with compositor issues
            backgroundThrottling: false,
        },
    });
    // Maximize window on startup
    mainWindow.maximize();
    // Load app
    if (process.env.NODE_ENV === "development" ||
        process.env.BROWSER === "none") {
        mainWindow.loadURL("http://localhost:5173");
    }
    else {
        // In production, we load the bundled index.html
        // Since main.js is in dist-electron/ and index.html is in dist/, we go up one level
        mainWindow.loadFile(path_1.default.join(__dirname, "../dist/index.html"));
    }
    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: "deny" };
    });
    // Setup native context menu
    setupContextMenu(mainWindow);
}
// --- Window IPC Handlers ---
electron_1.ipcMain.handle("window:setAlwaysOnTop", (_, value) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        // Use "screen-saver" level. For true always on top of everything
        mainWindow.setAlwaysOnTop(value, value ? "screen-saver" : "normal");
        return mainWindow.isAlwaysOnTop();
    }
    return false;
});
electron_1.ipcMain.handle("window:getAlwaysOnTop", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        return mainWindow.isAlwaysOnTop();
    }
    return false;
});
// Enable click-through for transparent areas
electron_1.ipcMain.on("window:setIgnoreMouseEvents", (_, ignore, options) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setIgnoreMouseEvents(ignore, options);
    }
});
// --- App Lifecycle ---
electron_1.app.whenReady().then(() => {
    createWindow();
    // Configure auto-start on Windows login (only in production)
    if (process.env.NODE_ENV !== "development" && electron_1.app.isPackaged) {
        electron_1.app.setLoginItemSettings({
            openAtLogin: true,
            path: electron_1.app.getPath("exe"),
        });
    }
    // Ensure app quits when window is closed
    if (mainWindow) {
        mainWindow.on("closed", () => {
            mainWindow = null;
            electron_1.app.quit();
        });
    }
    electron_1.app.on("activate", () => {
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
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
// --- Updater Logic Helper ---
function broadcastState() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("updater:state-changed", updateState);
    }
}
function updateStatus(partial) {
    updateState = { ...updateState, ...partial };
    broadcastState();
}
// --- Updater Events ---
electron_updater_1.autoUpdater.on("checking-for-update", () => {
    updateStatus({ status: "checking", error: null });
});
electron_updater_1.autoUpdater.on("update-available", (info) => {
    updateStatus({
        status: "available",
        availableVersion: info.version,
        releaseNotes: typeof info.releaseNotes === "string"
            ? info.releaseNotes
            : "No release notes",
        releaseDate: info.releaseDate,
    });
});
electron_updater_1.autoUpdater.on("update-not-available", () => {
    updateStatus({ status: "not-available" });
});
electron_updater_1.autoUpdater.on("error", (err) => {
    updateStatus({ status: "error", error: err.message });
});
electron_updater_1.autoUpdater.on("download-progress", (progressObj) => {
    updateStatus({
        status: "downloading",
        downloadProgress: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
        totalBytes: progressObj.total,
        downloadedBytes: progressObj.transferred,
    });
});
electron_updater_1.autoUpdater.on("update-downloaded", () => {
    updateStatus({ status: "downloaded", downloadProgress: 100 });
});
// --- IPC Handlers (API) ---
electron_1.ipcMain.handle("updater:check", async () => {
    try {
        await electron_updater_1.autoUpdater.checkForUpdates();
        return updateState;
    }
    catch (e) {
        updateStatus({ status: "error", error: e.message });
        return updateState;
    }
});
electron_1.ipcMain.handle("updater:download", async () => {
    await electron_updater_1.autoUpdater.downloadUpdate();
    return updateState;
});
electron_1.ipcMain.handle("updater:install", () => {
    electron_updater_1.autoUpdater.quitAndInstall();
});
electron_1.ipcMain.handle("updater:getState", () => updateState);
electron_1.ipcMain.handle("updater:getSettings", () => updateSettings);
electron_1.ipcMain.handle("updater:updateSettings", (_, newSettings) => {
    updateSettings = { ...updateSettings, ...newSettings };
    // Apply logic
    updateSettings.autoDownload
        ? (electron_updater_1.autoUpdater.autoDownload = true)
        : (electron_updater_1.autoUpdater.autoDownload = false);
    return updateSettings;
});
electron_1.ipcMain.handle("updater:skipVersion", () => {
    // Logic to save skipped version to store would go here
});
