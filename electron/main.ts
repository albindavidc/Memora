import { app, BrowserWindow, ipcMain, shell } from "electron";
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
  autoCheck: true,
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

// --- Window Management ---
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false, // Frameless for custom UI
    transparent: true, // Glass effect support
    backgroundColor: "#00000000", // Transparent bg
    hasShadow: true,
    alwaysOnTop: true, // Float above all windows
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
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
}

// --- Window IPC Handlers ---
ipcMain.handle("window:setAlwaysOnTop", (_, value: boolean) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(value);
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
