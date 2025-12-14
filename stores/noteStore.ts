import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, AppSettings, NotePosition } from '../types';

interface NoteState {
  notes: Note[];
  settings: AppSettings;
  searchQuery: string;
  
  // Actions
  addNote: (initialPosition?: Partial<NotePosition>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void; // Moves to trash
  restoreNote: (id: string) => void; // Recovers from trash
  permanentlyDeleteNote: (id: string) => void; // Removes from DB
  cleanupTrash: () => void; // Removes old trash
  
  toggleNoteWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  setSearchQuery: (query: string) => void;
  toggleDashboard: () => void;
}

const DEFAULT_NOTE_WIDTH = 320;
const DEFAULT_NOTE_HEIGHT = 300;

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      settings: {
        theme: 'glass',
        showDashboard: true,
      },
      searchQuery: '',

      addNote: (initialPosition) => {
        const id = crypto.randomUUID();
        const maxZ = Math.max(0, ...get().notes.map(n => n.position.zIndex));
        
        const newNote: Note = {
          id,
          title: '',
          content: '',
          color: 'slate',
          tags: [],
          isPinned: false,
          isLocked: false,
          opacity: 1,
          showToolbar: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isOpen: true,
          position: {
            x: initialPosition?.x ?? 100 + (Math.random() * 50),
            y: initialPosition?.y ?? 100 + (Math.random() * 50),
            width: DEFAULT_NOTE_WIDTH,
            height: DEFAULT_NOTE_HEIGHT,
            zIndex: maxZ + 1,
          },
        };

        set((state) => ({
          notes: [...state.notes, newNote],
          settings: { ...state.settings, showDashboard: false } // Auto hide dashboard on creation for focus
        }));
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
          ),
        }));
      },

      deleteNote: (id) => {
        // Soft delete: set deletedAt timestamp and close the window
        set((state) => ({
          notes: state.notes.map((n) => 
            n.id === id ? { ...n, deletedAt: Date.now(), isOpen: false, isPinned: false } : n
          ),
        }));
      },

      restoreNote: (id) => {
        set((state) => ({
          notes: state.notes.map((n) => 
            n.id === id ? { ...n, deletedAt: undefined } : n
          ),
        }));
      },

      permanentlyDeleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));
      },

      cleanupTrash: () => {
        // Remove notes deleted more than 7 days ago
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        set((state) => ({
          notes: state.notes.filter((n) => {
            if (!n.deletedAt) return true; // Keep active notes
            return (now - n.deletedAt) < SEVEN_DAYS_MS; // Keep recent trash
          })
        }));
      },

      toggleNoteWindow: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isOpen: !note.isOpen } : note
          ),
        }));
      },

      bringToFront: (id) => {
        const notes = get().notes;
        const note = notes.find((n) => n.id === id);
        if (!note) return;

        const maxZ = Math.max(0, ...notes.map((n) => n.position.zIndex));
        if (note.position.zIndex === maxZ) return;

        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, position: { ...n.position, zIndex: maxZ + 1 } } : n
          ),
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      
      toggleDashboard: () => set((state) => ({ 
        settings: { ...state.settings, showDashboard: !state.settings.showDashboard } 
      })),
    }),
    {
      name: 'memora-storage',
    }
  )
);