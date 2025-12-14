import React, { useEffect, useState, useMemo } from 'react';
import { useNoteStore } from './stores/noteStore';
import { NoteWindow } from './components/NoteWindow';
import { Dashboard } from './components/Dashboard';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { UpdateModal } from './components/Updater/UpdateModal';
import { Plus, LayoutGrid, Keyboard } from 'lucide-react';
import { NOTE_COLORS } from './types';

const App: React.FC = () => {
  const { notes, settings, addNote, toggleDashboard, cleanupTrash } = useNoteStore();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showDock, setShowDock] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Timer for dock clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Run cleanup for old trash on mount
  useEffect(() => {
    cleanupTrash();
  }, [cleanupTrash]);

  // Format Date: Fri - 24/02/2024
  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/,/g, ' -').replace(/\//g, '/'); 
  // Custom replace to match exact requested format "Fri - dd/mm/yyyy" if localestring differs slightly
  // Actually simpler manual construction ensures strict format:
  const dayName = currentTime.toLocaleDateString('en-US', { weekday: 'short' });
  const day = String(currentTime.getDate()).padStart(2, '0');
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const year = currentTime.getFullYear();
  const displayDate = `${dayName} - ${day}/${month}/${year}`;


  // Create an initial note if none exist
  useEffect(() => {
    // Only add if store is completely empty (fresh load)
    const state = useNoteStore.getState();
    if (state.notes.length === 0) {
      addNote({ x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 150 });
    }
  }, [addNote]);

  // Global Shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
        // Toggle Dock: Ctrl + \
        if (e.ctrlKey && e.key === '\\') {
            setShowDock(prev => !prev);
        }
        
        // Close Shortcuts: Esc
        if (e.key === 'Escape' && showShortcuts) {
            setShowShortcuts(false);
        }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [showShortcuts]);

  // Enable click-through for transparent areas (Electron only)
  useEffect(() => {
    if (!window.windowAPI?.setIgnoreMouseEvents) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if mouse is over an interactive element (note, dock, modal)
      const isOverInteractive = target.closest('.note-container, .dock-container, .modal-overlay, [data-interactive]');
      
      if (isOverInteractive) {
        // Enable mouse events when over a note or interactive element
        window.windowAPI.setIgnoreMouseEvents(false);
      } else {
        // Ignore mouse events when over transparent background (click passes through)
        window.windowAPI.setIgnoreMouseEvents(true, { forward: true });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const openNotes = notes.filter(n => n.isOpen && !n.deletedAt);

  // Get the top-most note's color and opacity for dock theming
  const dockTheme = useMemo(() => {
    // Default to blue color when no notes are open
    const defaultBlue = NOTE_COLORS.find(c => c.id === 'blue') || NOTE_COLORS[0];
    if (openNotes.length === 0) {
      return { bg: defaultBlue.bg, isLight: defaultBlue.isLight, opacity: 0.9 };
    }
    // Find note with highest z-index
    const topNote = openNotes.reduce((top, note) => 
      (note.position.zIndex || 0) > (top.position.zIndex || 0) ? note : top
    );
    const color = NOTE_COLORS.find(c => c.id === topNote.color) || NOTE_COLORS[0];
    return {
      bg: color.bg,
      isLight: color.isLight,
      opacity: topNote.opacity ?? 0.9,
    };
  }, [openNotes]);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-transparent">
      
      {/* Floating Notes Layer */}
      <div className="relative z-10 w-full h-full">
        {openNotes.map((note) => (
          <NoteWindow 
            key={note.id} 
            note={note} 
            onOpenShortcuts={() => setShowShortcuts(true)}
          />
        ))}
      </div>

      {/* Simulated Dock / System Tray (Bottom Center) */}
      <div 
        className={`dock-container absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center transition-all duration-300 ${showDock ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}
        style={{ opacity: showDock ? dockTheme.opacity : 0 }}
      >
        {/* Date Display floating slightly above dock items */}
        <div 
          className={`mb-2 px-3 py-1 backdrop-blur-md rounded-full border text-xs font-mono shadow-lg ${dockTheme.isLight ? 'border-black/10 text-slate-700' : 'border-white/5 text-white/80'}`}
          style={{ backgroundColor: dockTheme.bg }}
        >
            {displayDate}
        </div>

        <div 
          className={`flex items-center gap-4 px-4 py-3 backdrop-blur-xl border rounded-2xl shadow-2xl ${dockTheme.isLight ? 'border-black/10' : 'border-white/10'}`}
          style={{ backgroundColor: dockTheme.bg }}
        >
            <button 
                onClick={() => addNote()}
                className={`group relative p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${dockTheme.isLight ? 'bg-black/5 hover:bg-black/10 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                title="New Note"
            >
                <Plus size={24} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">New Note</span>
            </button>

            <div className={`w-[1px] h-8 mx-1 ${dockTheme.isLight ? 'bg-black/10' : 'bg-white/10'}`} />

            <button 
                onClick={toggleDashboard}
                className={`group relative p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                  settings.showDashboard 
                    ? (dockTheme.isLight ? 'bg-black/20 text-slate-900' : 'bg-white/20 text-white')
                    : (dockTheme.isLight ? 'bg-transparent text-slate-600 hover:bg-black/10' : 'bg-transparent text-white/70 hover:bg-white/10')
                }`}
                title="Dashboard"
            >
                <LayoutGrid size={24} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Dashboard</span>
            </button>
            
            <button 
                onClick={() => setShowShortcuts(true)}
                className={`group relative p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                  showShortcuts 
                    ? (dockTheme.isLight ? 'bg-black/20 text-slate-900' : 'bg-white/20 text-white')
                    : (dockTheme.isLight ? 'bg-transparent text-slate-600 hover:bg-black/10' : 'bg-transparent text-white/70 hover:bg-white/10')
                }`}
                title="Shortcuts"
            >
                <Keyboard size={24} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Shortcuts</span>
            </button>

            <div className="flex flex-col ml-2">
                <span className={`text-xs font-bold ${dockTheme.isLight ? 'text-slate-800' : 'text-white/90'}`}>Memora</span>
                <span className={`text-[10px] ${dockTheme.isLight ? 'text-slate-500' : 'text-white/50'}`}>{openNotes.length} Active Notes</span>
            </div>
        </div>
      </div>

      {/* Dashboard Overlay */}
      {settings.showDashboard && <Dashboard />}

      {/* Shortcuts Modal */}
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
      
      {/* Auto Updater Modal */}
      <UpdateModal />

      {/* Dock Hint (When hidden) */}
      {!showDock && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors" onClick={() => setShowDock(true)} title="Show Dock (Ctrl + \)" />
      )}

      {/* Intro Hint (Only shows if dashboard is hidden and few notes) */}
      {!settings.showDashboard && openNotes.length < 2 && showDock && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/30 text-sm animate-pulse pointer-events-none">
          Click + to create notes, Drag header to move
        </div>
      )}

    </div>
  );
};

export default App;