import React, { useState, useMemo } from 'react';
import { X, GripVertical, Maximize2, Palette, Star, Lock, Unlock, Keyboard, Ghost, Type } from 'lucide-react';
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
        absolute flex flex-col rounded-2xl border
        backdrop-blur-xl shadow-2xl 
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
                placeholder="Untitled"
                disabled={note.isLocked}
                className={`bg-transparent border-none outline-none ${textColorClass} text-sm font-medium w-32 ${placeholderClass} no-drag ${note.isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
            />
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 no-drag">
           <button 
            onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
            className={`p-1 rounded hover:bg-black/5 transition-colors ${note.isPinned ? 'text-yellow-500' : iconColorClass}`}
            title="Favorite"
          >
            <Star size={12} fill={note.isPinned ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={() => updateNote(note.id, { isLocked: !note.isLocked })}
            className={`p-1 rounded hover:bg-black/5 transition-colors ${note.isLocked ? 'text-red-500' : iconColorClass}`}
            title={note.isLocked ? "Unlock position" : "Lock position"}
          >
            {note.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          
          <button
            onClick={() => updateNote(note.id, { showToolbar: !note.showToolbar })}
            className={`p-1 rounded hover:bg-black/5 transition-colors ${note.showToolbar ? activeIconColorClass : iconColorClass}`}
            title="Toggle Formatting Toolbar"
          >
            <Type size={12} />
          </button>

          <button
            onClick={onOpenShortcuts}
            className={`p-1 rounded hover:bg-black/5 transition-colors ${iconColorClass}`}
            title="Keyboard Shortcuts"
          >
            <Keyboard size={12} />
          </button>

          {/* Opacity Control */}
          <div className="relative">
            <button
                onClick={() => {
                    setShowOpacityControl(!showOpacityControl);
                    setShowColorPicker(false);
                }}
                className={`p-1 rounded hover:bg-black/5 transition-colors ${iconColorClass}`}
                title="Opacity"
            >
                <Ghost size={12} />
            </button>
            {showOpacityControl && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-slate-900/95 rounded-lg border border-white/10 shadow-xl z-50 w-40 flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] text-white/50">
                        <span>Transparent</span>
                        <span>Opaque</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.2" 
                        max="1" 
                        step="0.05"
                        value={note.opacity ?? 1}
                        onChange={(e) => updateNote(note.id, { opacity: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                     <div className="text-center text-xs text-white font-mono">
                        {Math.round((note.opacity ?? 1) * 100)}%
                    </div>
                </div>
            )}
          </div>

          {/* Color Picker */}
          <div className="relative">
            <button 
                onClick={() => {
                    setShowColorPicker(!showColorPicker);
                    setShowOpacityControl(false);
                }}
                className={`p-1 rounded hover:bg-black/5 transition-colors ${iconColorClass}`}
                disabled={note.isLocked}
            >
                <Palette size={12} />
            </button>
            {showColorPicker && (
                <div className="absolute top-full right-0 mt-2 p-2 bg-slate-900/90 rounded-lg border border-white/10 flex gap-1 shadow-xl z-50 w-32 flex-wrap">
                    {NOTE_COLORS.map(c => (
                        <button
                            key={c.id}
                            onClick={() => {
                                updateNote(note.id, { color: c.id });
                                setShowColorPicker(false);
                            }}
                            className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform m-0.5"
                            style={{ background: c.bg }}
                            title={c.id}
                        />
                    ))}
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
        
        {/* Status Bar: Time (Left), Date (Center), Char Count (Right) */}
        <div className={`h-6 shrink-0 ${activeColor.isLight ? 'bg-black/5 text-slate-500' : 'bg-black/10 text-white/30'} grid grid-cols-3 items-center px-3 text-[10px] select-none border-t ${borderColorClass}`}>
            <span className="text-left">{timeStr}</span>
            <span className="text-center">{dateStr}</span>
            <span className="text-right flex items-center justify-end gap-1">
                {note.isLocked && <Lock size={8} />}
                {charCount} chars
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