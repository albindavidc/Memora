import React, { useEffect, useState } from 'react';
import { useNoteStore } from './stores/noteStore';
import { NoteWindow } from './components/NoteWindow';
import { Dashboard } from './components/Dashboard';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { UpdateModal } from './components/Updater/UpdateModal';
import { Plus, LayoutGrid, Keyboard } from 'lucide-react';

const App: React.FC = () => {
  const { notes, settings, addNote, toggleDashboard, cleanupTrash } = useNoteStore();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showDock, setShowDock] = useState(true);
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

  const openNotes = notes.filter(n => n.isOpen && !n.deletedAt);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      
      {/* Background / Wallpaper - Simulating Desktop Environment */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{
            backgroundImage: `url('background.jpg')`,
            opacity: 0.4
        }}
      />
      <div className="absolute inset-0 bg-slate-900/60 z-0 pointer-events-none" />

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
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center transition-all duration-300 ${showDock ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}
      >
        {/* Date Display floating slightly above dock items */}
        <div className="mb-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/5 text-xs text-white/80 font-mono shadow-lg">
            {displayDate}
        </div>

        <div className="flex items-center gap-4 px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <button 
                onClick={() => addNote()}
                className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-105 active:scale-95"
                title="New Note"
            >
                <Plus size={24} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">New Note</span>
            </button>

            <div className="w-[1px] h-8 bg-white/10 mx-1" />

            <button 
                onClick={toggleDashboard}
                className={`group relative p-3 rounded-xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95 ${settings.showDashboard ? 'bg-white/20 text-white' : 'bg-transparent text-white/70'}`}
                title="Dashboard"
            >
                <LayoutGrid size={24} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Dashboard</span>
            </button>
            
            <button 
                onClick={() => setShowShortcuts(true)}
                className={`group relative p-3 rounded-xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95 ${showShortcuts ? 'bg-white/20 text-white' : 'bg-transparent text-white/70'}`}
                title="Shortcuts"
            >
                <Keyboard size={24} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Shortcuts</span>
            </button>

            <div className="flex flex-col ml-2">
                <span className="text-xs font-bold text-white/90">Memora</span>
                <span className="text-[10px] text-white/50">{openNotes.length} Active Notes</span>
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