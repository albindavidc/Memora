import React, { useState, useMemo } from 'react';
import { X, GripVertical, Maximize2, Palette, Star, Lock, Unlock, Keyboard, Ghost, Type, Settings, Trash2, LayoutGrid, Pin } from 'lucide-react';
import { Note, NOTE_COLORS } from '../types';
import { useDraggable } from '../hooks/useDraggable';
import { Editor } from './Editor';
import { useNoteStore } from '../stores/noteStore';

interface NoteWindowProps {
  note: Note;
  onOpenShortcuts: () => void;
}

export const NoteWindow: React.FC<NoteWindowProps> = ({ note, onOpenShortcuts }) => {
  const { updateNote, deleteNote, bringToFront } = useNoteStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showOpacityControl, setShowOpacityControl] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPinnedOnTop, setIsPinnedOnTop] = useState(true); // Default to true since window starts alwaysOnTop

  // Use new optimized hook
  // We only update the store (DB) when dragging ends
  const { ref, isDragging, handleMouseDown, handleResizeStart } = useDraggable({
    initialPosition: note.position,
    onDragEnd: (pos) => !note.isLocked && updateNote(note.id, { position: pos }),
    onDragStart: () => bringToFront(note.id),
  });

  const activeColor = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
  
  // Dynamic Text Color Class based on background brightness
  const textColorClass = activeColor.isLight ? 'text-slate-900' : 'text-white';
  const iconColorClass = activeColor.isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/40 hover:text-white';
  const activeIconColorClass = activeColor.isLight ? 'text-slate-900' : 'text-white';
  const borderColorClass = activeColor.isLight ? 'border-slate-300' : 'border-white/5';
  const placeholderClass = activeColor.isLight ? 'placeholder-slate-500' : 'placeholder-white/30';

  // Accurate Character Count (Strip HTML and Whitespace)
  const charCount = useMemo(() => {
    if (!note.content) return 0;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    // Remove all whitespace characters (spaces, tabs, newlines)
    return text.replace(/\s/g, '').length;
  }, [note.content]);

  // Footer Data
  const { timeStr, dateStr } = useMemo(() => {
    const d = new Date(note.updatedAt);
    
    // Time: 10:30 AM
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Date: Fri - 24/02/2024
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const dateStr = `${dayName} - ${day}/${month}/${year}`;
    
    return { timeStr, dateStr };
  }, [note.updatedAt]);

  return (
    <div
      ref={ref}
      onMouseDown={() => bringToFront(note.id)}
      style={{
        transform: `translate(${note.position.x}px, ${note.position.y}px)`,
        width: note.position.width,
        height: note.position.height,
        zIndex: note.position.zIndex,
        backgroundColor: activeColor.bg,
        borderColor: activeColor.border,
        opacity: note.opacity ?? 1,
      }}
      className={`
        note-container absolute flex flex-col rounded-2xl border overflow-hidden
        shadow-2xl 
        ${isDragging ? 'shadow-black/50 cursor-grabbing will-change-transform' : 'cursor-default transition-all duration-200 ease-out'}
        group
      `}
    >
      {/* Header / Drag Handle */}
      <div
        onMouseDown={note.isLocked ? undefined : handleMouseDown}
        className={`
            h-9 shrink-0 flex items-center justify-between px-2 border-b ${borderColorClass} transition-colors
            ${note.isLocked ? 'cursor-default opacity-80' : 'cursor-grab active:cursor-grabbing'}
        `}
      >
        <div className="flex items-center gap-2">
            {note.isLocked ? (
                <Lock size={12} className={`${activeColor.isLight ? 'text-slate-400' : 'text-white/30'} ml-1`} />
            ) : (
                <GripVertical size={14} className={activeColor.isLight ? 'text-slate-400' : 'text-white/40'} />
            )}
            <input 
                type="text" 
                value={note.title} 
                onChange={(e) => updateNote(note.id, { title: e.target.value })}
                disabled={note.isLocked}
                className={`bg-transparent border-none outline-none ${textColorClass} text-sm font-medium w-20 min-w-0 ${placeholderClass} no-drag ${note.isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
            />
        </div>
        
        {/* Always visible: Settings and Close only */}
        <div className="flex items-center gap-0.5 no-drag">
          {/* Settings Panel */}
          <div className="relative">
            <button
                onClick={() => {
                    setShowSettings(!showSettings);
                    setShowColorPicker(false);
                    setShowOpacityControl(false);
                }}
                className={`p-1 rounded hover:bg-black/5 transition-colors ${showSettings ? activeIconColorClass : iconColorClass}`}
                title="Settings"
            >
                <Settings size={12} />
            </button>
            {showSettings && (
                <div 
                    className={`absolute top-full right-0 mt-2 p-3 rounded-lg border shadow-xl z-50 w-48 flex flex-col gap-3 ${activeColor.isLight ? 'border-black/10' : 'border-white/10'}`}
                    style={{ backgroundColor: activeColor.bg }}
                >
                    <h4 className={`text-xs font-semibold uppercase tracking-wide ${activeColor.isLight ? 'text-slate-600' : 'text-white/70'}`}>Note Settings</h4>
                    
                    {/* Pin to Favorites Toggle */}
                    <button 
                        onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                        className={`flex items-center gap-2 text-xs transition-colors ${activeColor.isLight ? 'text-slate-700 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
                    >
                        <Star size={14} fill={note.isPinned ? "currentColor" : "none"} className={note.isPinned ? 'text-yellow-500' : ''} />
                        {note.isPinned ? 'Unpin from Favorites' : 'Pin to Favorites'}
                    </button>
                    
                    {/* Pin on Top Toggle */}
                    <button 
                        onClick={async () => {
                            if (window.windowAPI) {
                                const newState = await window.windowAPI.setAlwaysOnTop(!isPinnedOnTop);
                                setIsPinnedOnTop(newState);
                            }
                        }}
                        className={`flex items-center gap-2 text-xs transition-colors ${activeColor.isLight ? 'text-slate-700 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
                    >
                        <Pin size={14} fill={isPinnedOnTop ? "currentColor" : "none"} className={isPinnedOnTop ? 'text-blue-500' : ''} />
                        {isPinnedOnTop ? 'Unpin from Top' : 'Pin on Top'}
                    </button>
                    
                    {/* Lock Toggle */}
                    <button 
                        onClick={() => updateNote(note.id, { isLocked: !note.isLocked })}
                        className={`flex items-center gap-2 text-xs transition-colors ${activeColor.isLight ? 'text-slate-700 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
                    >
                        {note.isLocked ? <Lock size={14} className="text-red-400" /> : <Unlock size={14} />}
                        {note.isLocked ? 'Unlock Position' : 'Lock Position'}
                    </button>
                    
                    {/* Toolbar Toggle */}
                    <button 
                        onClick={() => updateNote(note.id, { showToolbar: !note.showToolbar })}
                        className={`flex items-center gap-2 text-xs transition-colors ${activeColor.isLight ? 'text-slate-700 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
                    >
                        <Type size={14} className={note.showToolbar ? 'text-blue-400' : ''} />
                        {note.showToolbar ? 'Hide Toolbar' : 'Show Toolbar'}
                    </button>
                    
                    {/* Dashboard Toggle */}
                    <button 
                        onClick={() => {
                            const { toggleDashboard } = useNoteStore.getState();
                            toggleDashboard();
                            setShowSettings(false);
                        }}
                        className={`flex items-center gap-2 text-xs transition-colors ${activeColor.isLight ? 'text-slate-700 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
                    >
                        <LayoutGrid size={14} />
                        Open Dashboard
                    </button>
                    
                    <div className={`w-full h-[1px] ${activeColor.isLight ? 'bg-black/10' : 'bg-white/10'}`} />
                    
                    {/* Opacity */}
                    <div className="flex flex-col gap-1">
                        <span className={`text-[10px] ${activeColor.isLight ? 'text-slate-500' : 'text-white/50'}`}>Opacity: {Math.round((note.opacity ?? 1) * 100)}%</span>
                        <input 
                            type="range" 
                            min="0.2" 
                            max="1" 
                            step="0.05"
                            value={note.opacity ?? 1}
                            onChange={(e) => updateNote(note.id, { opacity: parseFloat(e.target.value) })}
                            className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-blue-500 ${activeColor.isLight ? 'bg-black/20' : 'bg-white/20'}`}
                        />
                    </div>
                    
                    {/* Colors */}
                    <div className="flex flex-col gap-1">
                        <span className={`text-[10px] ${activeColor.isLight ? 'text-slate-500' : 'text-white/50'}`}>Color</span>
                        <div className="flex gap-1 flex-wrap">
                            {NOTE_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => updateNote(note.id, { color: c.id })}
                                    className={`w-5 h-5 rounded-full border hover:scale-110 transition-transform ${note.color === c.id ? 'border-white ring-1 ring-white/50' : 'border-white/20'}`}
                                    style={{ background: c.bg }}
                                    title={c.id}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className={`w-full h-[1px] ${activeColor.isLight ? 'bg-black/10' : 'bg-white/10'}`} />
                    
                    {/* Delete */}
                    <button 
                        onClick={() => {
                            deleteNote(note.id);
                            setShowSettings(false);
                        }}
                        className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        <Trash2 size={14} />
                        Delete Note
                    </button>
                </div>
            )}
          </div>
          
          <div className={`w-[1px] h-3 mx-1 ${activeColor.isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          <button 
            onClick={() => updateNote(note.id, { isOpen: false })}
            className={`p-1 rounded hover:bg-black/5 transition-colors ${iconColorClass}`}
            title="Close window"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className={`flex-1 overflow-hidden relative flex flex-col [&_.editor-content]:${textColorClass}`}>
            <Editor 
                content={note.content} 
                onChange={(content) => updateNote(note.id, { content })} 
                showToolbar={note.showToolbar}
                isLight={activeColor.isLight}
            />
        </div>
        
        {/* Status Bar: Time, Date, Char Count - Single line */}
        <div className={`h-5 shrink-0 ${activeColor.isLight ? 'bg-black/5 text-slate-500' : 'bg-black/10 text-white/30'} flex items-center justify-between px-2 text-[9px] select-none border-t ${borderColorClass}`}>
            <span className="flex items-center gap-1">
                {timeStr} · {dateStr}
            </span>
            <span className="flex items-center gap-1">
                {note.isLocked && <Lock size={8} />}
                {charCount}
            </span>
        </div>
      </div>

      {/* Resize Handle */}
      {!note.isLocked && (
        <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-drag z-10"
        >
            <Maximize2 size={8} className={`${activeColor.isLight ? 'text-slate-400' : 'text-white/30'} rotate-90`} />
        </div>
      )}
    </div>
  );
};