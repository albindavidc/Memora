import { useEffect, useState, useCallback } from "react";
import { UpdateState, UpdateSettings } from "../types";

export function useUpdater() {
  const [state, setState] = useState<UpdateState>({
    status: "idle",
    currentVersion: "1.0.0",
    availableVersion: null,
    releaseNotes: null,
    releaseDate: null,
    downloadProgress: 0,
    bytesPerSecond: 0,
    totalBytes: 0,
    downloadedBytes: 0,
    error: null,
  });

  const [settings, setSettings] = useState<UpdateSettings>({
    autoCheck: true,
    autoDownload: false,
    autoInstall: false,
    checkInterval: 60,
    allowPrerelease: false,
    allowDowngrade: false,
  });

  useEffect(() => {
    // Check if we are running in Electron
    if (window.updaterAPI) {
      window.updaterAPI.getState().then(setState);
      window.updaterAPI.getSettings().then(setSettings);

      const unsubscribe = window.updaterAPI.onStateChanged((newState) => {
        setState(newState);
      });

      return () => unsubscribe();
    } else {
      // WEB/BROWSER MODE: Do NOT auto-trigger update popup
      // Updates are only shown when manually triggered from Dashboard
      console.log("Running in Web Mode: Update checks are manual only");
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (window.updaterAPI) {
      return window.updaterAPI.checkForUpdates();
    } else {
      // Mock check
      setState((prev) => ({ ...prev, status: "checking" }));
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          status: "available",
          availableVersion: "1.1.0",
          releaseNotes: "Manual check found this update.",
        }));
      }, 1500);
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (window.updaterAPI) {
      return window.updaterAPI.downloadUpdate();
    } else {
      // Mock download
      setState((prev) => ({
        ...prev,
        status: "downloading",
        downloadProgress: 0,
      }));
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setState((prev) => ({
          ...prev,
          downloadProgress: progress,
          bytesPerSecond: 1024 * 1024, // 1MB/s
          totalBytes: 100 * 1024 * 1024, // 100MB
          downloadedBytes: (progress / 100) * 100 * 1024 * 1024,
        }));

        if (progress >= 100) {
          clearInterval(interval);
          setState((prev) => ({ ...prev, status: "downloaded" }));
        }
      }, 200);
    }
  }, []);

  const installUpdate = useCallback(() => {
    if (window.updaterAPI) {
      window.updaterAPI.installUpdate();
    } else {
      alert("In a real app, this would restart FloatNotes!");
      // Reset to idle for demo
      setState((prev) => ({ ...prev, status: "idle" }));
    }
  }, []);

  const skipVersion = useCallback((version: string) => {
    if (window.updaterAPI) {
      window.updaterAPI.skipVersion(version);
    }
    // Dismiss mock
    setState((prev) => ({ ...prev, status: "idle" }));
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<UpdateSettings>) => {
      if (window.updaterAPI) {
        const updated = await window.updaterAPI.updateSettings(newSettings);
        setSettings(updated);
      } else {
        setSettings((prev) => ({ ...prev, ...newSettings }));
      }
    },
    []
  );

  return {
    state,
    settings,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    skipVersion,
    updateSettings,
  };
}
