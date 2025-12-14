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

export type ThemeMode = 'light' | 'dark' | 'glass';

export interface AppSettings {
  theme: ThemeMode;
  showDashboard: boolean;
}

export const NOTE_COLORS = [
  { id: 'slate', bg: 'rgba(30, 41, 59, 0.7)', border: 'rgba(255,255,255,0.1)', isLight: false },
  { id: 'red', bg: 'rgba(69, 10, 10, 0.7)', border: 'rgba(248, 113, 113, 0.2)', isLight: false },
  { id: 'amber', bg: 'rgba(69, 26, 3, 0.7)', border: 'rgba(251, 191, 36, 0.2)', isLight: false },
  { id: 'emerald', bg: 'rgba(2, 44, 34, 0.7)', border: 'rgba(52, 211, 153, 0.2)', isLight: false },
  { id: 'blue', bg: 'rgba(23, 37, 84, 0.7)', border: 'rgba(96, 165, 250, 0.2)', isLight: false },
  { id: 'violet', bg: 'rgba(46, 16, 101, 0.7)', border: 'rgba(167, 139, 250, 0.2)', isLight: false },
  { id: 'pink', bg: 'rgba(80, 7, 36, 0.7)', border: 'rgba(244, 114, 182, 0.2)', isLight: false },
  { id: 'orange', bg: 'rgba(67, 20, 7, 0.7)', border: 'rgba(251, 146, 60, 0.2)', isLight: false },
  { id: 'teal', bg: 'rgba(19, 78, 74, 0.7)', border: 'rgba(45, 212, 191, 0.2)', isLight: false },
  { id: 'indigo', bg: 'rgba(49, 46, 129, 0.7)', border: 'rgba(129, 140, 248, 0.2)', isLight: false },
  // Light colors with high opacity for visibility, marked as isLight=true for dark text
  { id: 'cool-gray', bg: '#bdbdbd', border: 'rgba(0, 0, 0, 0.1)', isLight: true },
  { id: 'off-white', bg: 'rgba(239, 239, 239, 0.9)', border: 'rgba(0, 0, 0, 0.1)', isLight: true },
];

// Updater Types
export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
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
  updateSettings: (settings: Partial<UpdateSettings>) => Promise<UpdateSettings>;
  onStateChanged: (callback: (state: UpdateState) => void) => () => void;
}

declare global {
  interface Window {
    updaterAPI: UpdaterAPI;
  }
}