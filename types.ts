export interface NotePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML string
  color: string;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  opacity: number; // Opacity value 0.1 to 1.0
  showToolbar: boolean; // Toggle formatting toolbar
  deletedAt?: number; // Timestamp when moved to trash
  createdAt: number;
  updatedAt: number;
  position: NotePosition;
  isOpen: boolean; // Is the floating window visible?
}

export type ThemeMode = "light" | "dark" | "glass";

export interface AppSettings {
  theme: ThemeMode;
  showDashboard: boolean;
}

export const NOTE_COLORS = [
  {
    id: "slate",
    bg: "#1e293b",
    border: "rgba(255,255,255,0.1)",
    isLight: false,
  },
  {
    id: "red",
    bg: "#450a0a",
    border: "rgba(248, 113, 113, 0.2)",
    isLight: false,
  },
  {
    id: "amber",
    bg: "#451a03",
    border: "rgba(251, 191, 36, 0.2)",
    isLight: false,
  },
  {
    id: "emerald",
    bg: "#022c22",
    border: "rgba(52, 211, 153, 0.2)",
    isLight: false,
  },
  {
    id: "blue",
    bg: "#172554",
    border: "rgba(96, 165, 250, 0.2)",
    isLight: false,
  },
  {
    id: "violet",
    bg: "#2e1065",
    border: "rgba(167, 139, 250, 0.2)",
    isLight: false,
  },
  {
    id: "pink",
    bg: "#500724",
    border: "rgba(244, 114, 182, 0.2)",
    isLight: false,
  },
  {
    id: "orange",
    bg: "#431407",
    border: "rgba(251, 146, 60, 0.2)",
    isLight: false,
  },
  {
    id: "teal",
    bg: "#134e4a",
    border: "rgba(45, 212, 191, 0.2)",
    isLight: false,
  },
  {
    id: "indigo",
    bg: "#312e81",
    border: "rgba(129, 140, 248, 0.2)",
    isLight: false,
  },
  // Light colors for visibility, marked as isLight=true for dark text
  {
    id: "cool-gray",
    bg: "#bdbdbd",
    border: "rgba(0, 0, 0, 0.1)",
    isLight: true,
  },
  {
    id: "off-white",
    bg: "#efefef",
    border: "rgba(0, 0, 0, 0.1)",
    isLight: true,
  },
];

// Updater Types
export interface UpdateState {
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

export interface UpdateSettings {
  autoCheck: boolean;
  autoDownload: boolean;
  autoInstall: boolean;
  checkInterval: number;
  allowPrerelease: boolean;
  allowDowngrade: boolean;
}

export interface UpdaterAPI {
  checkForUpdates: () => Promise<any>;
  downloadUpdate: () => Promise<any>;
  installUpdate: () => void;
  skipVersion: (version: string) => Promise<void>;
  getState: () => Promise<UpdateState>;
  getSettings: () => Promise<UpdateSettings>;
  updateSettings: (
    settings: Partial<UpdateSettings>
  ) => Promise<UpdateSettings>;
  onStateChanged: (callback: (state: UpdateState) => void) => () => void;
}

export interface WindowAPI {
  setAlwaysOnTop: (value: boolean) => Promise<boolean>;
  getAlwaysOnTop: () => Promise<boolean>;
  setIgnoreMouseEvents: (
    ignore: boolean,
    options?: { forward: boolean }
  ) => void;
}

declare global {
  interface Window {
    updaterAPI: UpdaterAPI;
    windowAPI: WindowAPI;
  }
}
