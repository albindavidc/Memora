import { app, BrowserWindow, ipcMain, shell, Menu, clipboard } from "electron";
import path from "path";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

// --- Types (Mirrored from renderer) ---
interface UpdateState {
  status:
    | "idle"
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error";
  currentVersion: string;
  availableVersion: string | null;
  releaseNotes: string | null;
  releaseDate: string | null;
  downloadProgress: number;
  bytesPerSecond: number;
  totalBytes: number;
  downloadedBytes: number;
  error: string | null;
}

// --- Update Manager State ---
let updateState: UpdateState = {
  status: "idle",
  currentVersion: app.getVersion(),
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
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = "info";
autoUpdater.autoDownload = false; // We handle this manually via UI
autoUpdater.autoInstallOnAppQuit = false;

// --- Native Context Menu Setup ---
function setupContextMenu(window: BrowserWindow) {
  window.webContents.on("context-menu", (event, params) => {
    const menuTemplate: Electron.MenuItemConstructorOptions[] = [];

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

      menuTemplate.push(
        { label: "Undo", role: "undo", enabled: params.editFlags.canUndo },
        { label: "Redo", role: "redo", enabled: params.editFlags.canRedo },
        { type: "separator" },
        { label: "Cut", role: "cut", enabled: params.editFlags.canCut },
        { label: "Copy", role: "copy", enabled: params.editFlags.canCopy },
        { label: "Paste", role: "paste", enabled: params.editFlags.canPaste },
        {
          label: "Select All",
          role: "selectAll",
          enabled: params.editFlags.canSelectAll,
        }
      );
    } else if (params.selectionText) {
      // Text selection (non-editable)
      menuTemplate.push({ label: "Copy", role: "copy" });
    }

    // Link options
    if (params.linkURL) {
      if (menuTemplate.length > 0) {
        menuTemplate.push({ type: "separator" });
      }
      menuTemplate.push(
        {
          label: "Open Link in Browser",
          click: () => shell.openExternal(params.linkURL),
        },
        {
          label: "Copy Link Address",
          click: () => clipboard.writeText(params.linkURL),
        }
      );
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
      const menu = Menu.buildFromTemplate(menuTemplate);
      menu.popup({ window });
    }
  });
}

// --- Window Management ---
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false, // Frameless for custom UI
    transparent: true, // Glass effect support
    backgroundColor: "#00000000", // Transparent bg
    hasShadow: false, // Disable shadow to reduce compositor conflicts
    alwaysOnTop: false, // Default to not floating above other windows
    skipTaskbar: false, // Keep in taskbar
    icon: path.join(__dirname, "../assets/icon.png"), // App icon
    // Improve performance with hardware-accelerated content in other apps
    paintWhenInitiallyHidden: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      // These can help with compositor issues
      backgroundThrottling: false,
    },
  });

  // Maximize window on startup
  mainWindow.maximize();

  // Load app
  if (
    process.env.NODE_ENV === "development" ||
    process.env.BROWSER === "none"
  ) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    // In production, we load the bundled index.html
    // Since main.js is in dist-electron/ and index.html is in dist/, we go up one level
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Setup native context menu
  setupContextMenu(mainWindow);
}

// --- Window IPC Handlers ---
ipcMain.handle("window:setAlwaysOnTop", (_, value: boolean) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Use "screen-saver" level. For true always on top of everything
    mainWindow.setAlwaysOnTop(value, value ? "screen-saver" : "normal");
    return mainWindow.isAlwaysOnTop();
  }
  return false;
});

ipcMain.handle("window:getAlwaysOnTop", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow.isAlwaysOnTop();
  }
  return false;
});

// Enable click-through for transparent areas
ipcMain.on(
  "window:setIgnoreMouseEvents",
  (_, ignore: boolean, options?: { forward: boolean }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(ignore, options);
    }
  }
);

// --- App Lifecycle ---
app.whenReady().then(() => {
  createWindow();

  // Configure auto-start on Windows login (only in production)
  if (process.env.NODE_ENV !== "development" && app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath("exe"),
    });
  }

  // Ensure app quits when window is closed
  if (mainWindow) {
    mainWindow.on("closed", () => {
      mainWindow = null;
      app.quit();
    });
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Initial update check if enabled
  if (updateSettings.autoCheck) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    }, 3000);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- Updater Logic Helper ---
function broadcastState() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("updater:state-changed", updateState);
  }
}

function updateStatus(partial: Partial<UpdateState>) {
  updateState = { ...updateState, ...partial };
  broadcastState();
}

// --- Updater Events ---
autoUpdater.on("checking-for-update", () => {
  updateStatus({ status: "checking", error: null });
});

autoUpdater.on("update-available", (info) => {
  updateStatus({
    status: "available",
    availableVersion: info.version,
    releaseNotes:
      typeof info.releaseNotes === "string"
        ? info.releaseNotes
        : "No release notes",
    releaseDate: info.releaseDate,
  });
});

autoUpdater.on("update-not-available", () => {
  updateStatus({ status: "not-available" });
});

autoUpdater.on("error", (err) => {
  updateStatus({ status: "error", error: err.message });
});

autoUpdater.on("download-progress", (progressObj) => {
  updateStatus({
    status: "downloading",
    downloadProgress: Math.round(progressObj.percent),
    bytesPerSecond: progressObj.bytesPerSecond,
    totalBytes: progressObj.total,
    downloadedBytes: progressObj.transferred,
  });
});

autoUpdater.on("update-downloaded", () => {
  updateStatus({ status: "downloaded", downloadProgress: 100 });
});

// --- IPC Handlers (API) ---
ipcMain.handle("updater:check", async () => {
  try {
    await autoUpdater.checkForUpdates();
    return updateState;
  } catch (e: any) {
    updateStatus({ status: "error", error: e.message });
    return updateState;
  }
});

ipcMain.handle("updater:download", async () => {
  await autoUpdater.downloadUpdate();
  return updateState;
});

ipcMain.handle("updater:install", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("updater:getState", () => updateState);
ipcMain.handle("updater:getSettings", () => updateSettings);
ipcMain.handle("updater:updateSettings", (_, newSettings) => {
  updateSettings = { ...updateSettings, ...newSettings };
  // Apply logic
  updateSettings.autoDownload
    ? (autoUpdater.autoDownload = true)
    : (autoUpdater.autoDownload = false);
  return updateSettings;
});
ipcMain.handle("updater:skipVersion", () => {
  // Logic to save skipped version to store would go here
});
