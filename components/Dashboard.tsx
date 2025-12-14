import React, { useState, useMemo } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { NOTE_COLORS } from '../types';
import { 
  Plus, Search, X, LayoutGrid, Clock, Star, 
  Calendar, Palette, Inbox, Trash2, RotateCcw
} from 'lucide-react';

type FilterType = 'all' | 'pinned' | 'recent' | 'trash';

export const Dashboard: React.FC = () => {
  const { 
    notes, searchQuery, setSearchQuery, addNote, 
    toggleNoteWindow, toggleDashboard, deleteNote, 
    restoreNote, permanentlyDeleteNote 
  } = useNoteStore();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      // 1. Text Search
      const searchContent = (n.title + n.content).toLowerCase();
      if (searchQuery && !searchContent.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 2. Color Filter
      if (selectedColor && n.color !== selectedColor) {
        return false;
      }

      // 3. Trash Logic
      // If we are in trash view, ONLY show deleted notes
      if (activeFilter === 'trash') {
        return !!n.deletedAt;
      }
      
      // If we are NOT in trash view, hide deleted notes
      if (n.deletedAt) {
        return false;
      }

      // 4. Smart Filters
      switch (activeFilter) {
        case 'pinned':
          return n.isPinned;
        case 'recent':
          // Modified in last 24 hours
          return Date.now() - n.updatedAt < 86400000;
        case 'all':
        default:
          return true;
      }
    });
  }, [notes, searchQuery, activeFilter, selectedColor]);

  // Sidebar Item Component
  const SidebarItem = ({ 
    icon: Icon, 
    label, 
    id, 
    isActive, 
    onClick,
    count
  }: { 
    icon: any, 
    label: string, 
    id: FilterType, 
    isActive: boolean, 
    onClick: () => void,
    count?: number
  }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-blue-600/20 text-blue-200' 
          : 'hover:bg-white/5 text-slate-400 hover:text-white'
      }`}
    >
      <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'} />
      <span className="font-medium text-sm">{label}</span>
      {count !== undefined && <span className="ml-auto text-xs opacity-40">{count}</span>}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-full max-h-[85vh] glass-panel rounded-3xl flex shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-slate-900/50 border-r border-white/5 p-6 flex flex-col hidden md:flex">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/50">
              M
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Memora</span>
          </div>

          <div className="space-y-1">
            <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Workspace
            </div>
            <SidebarItem 
              icon={Inbox} 
              label="All Notes" 
              id="all" 
              isActive={activeFilter === 'all'} 
              onClick={() => { setActiveFilter('all'); setSelectedColor(null); }} 
              count={notes.filter(n => !n.deletedAt).length}
            />
            <SidebarItem 
              icon={Star} 
              label="Favorites" 
              id="pinned" 
              isActive={activeFilter === 'pinned'} 
              onClick={() => { setActiveFilter('pinned'); setSelectedColor(null); }} 
            />
            <SidebarItem 
              icon={Clock} 
              label="Recent" 
              id="recent" 
              isActive={activeFilter === 'recent'} 
              onClick={() => { setActiveFilter('recent'); setSelectedColor(null); }} 
            />
            
            <div className="my-2 h-[1px] bg-white/5 mx-4" />
            
            <SidebarItem 
              icon={Trash2} 
              label="Trash" 
              id="trash" 
              isActive={activeFilter === 'trash'} 
              onClick={() => { setActiveFilter('trash'); setSelectedColor(null); }} 
              count={notes.filter(n => !!n.deletedAt).length}
            />
          </div>

          <div className="mt-8 space-y-1">
            <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tags & Colors
            </div>
            <div className="grid grid-cols-6 px-4 gap-2">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(selectedColor === c.id ? null : c.id)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedColor === c.id ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{ background: c.bg }}
                  title={c.id}
                />
              ))}
            </div>
          </div>

          <div className="mt-auto">
             <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/5">
                <p className="text-xs text-blue-200/80 mb-2">Pro Tip</p>
                <p className="text-xs text-slate-400">Trash items are automatically deleted after 7 days.</p>
             </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-slate-950/20">
          {/* Header */}
          <div className="h-20 border-b border-white/5 flex items-center justify-between px-8">
            <div className="flex items-center gap-3 bg-slate-800/50 border border-white/5 rounded-xl px-4 py-2.5 w-96 focus-within:bg-slate-800 focus-within:border-white/20 transition-all">
              <Search className="text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search your notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => addNote()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
              >
                <Plus size={18} /> <span>Create Note</span>
              </button>
              <button 
                onClick={toggleDashboard}
                className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-8">
            {filteredNotes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                  {activeFilter === 'trash' ? <Trash2 size={32} className="opacity-20" /> : <LayoutGrid size={32} className="opacity-20" />}
                </div>
                <p className="text-lg font-medium text-slate-300">
                    {activeFilter === 'trash' ? 'Trash is empty' : 'No notes found'}
                </p>
                <p className="text-sm opacity-50 mt-1">
                    {activeFilter === 'trash' ? 'Items in trash are removed after 7 days' : 'Try adjusting your filters or create a new one'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNotes.map(note => {
                  const colorStyle = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
                  // Determine text color based on note brightness
                  const textColor = colorStyle.isLight ? 'text-slate-800' : 'text-slate-200';
                  const titleColor = colorStyle.isLight ? 'text-black' : 'text-white';
                  const metaColor = colorStyle.isLight ? 'text-slate-500' : 'text-slate-400';

                  return (
                    <div 
                      key={note.id}
                      onClick={() => {
                        // Only open if not in trash
                        if(!note.deletedAt) {
                            if(!note.isOpen) toggleNoteWindow(note.id);
                            toggleDashboard();
                        }
                      }}
                      className="group relative aspect-square rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border border-white/5 overflow-hidden flex flex-col"
                      style={{ background: colorStyle.bg }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className={`font-semibold truncate pr-2 text-lg ${titleColor}`}>{note.title || 'Untitled'}</h3>
                        <div className="flex gap-2">
                           {note.isPinned && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                           {note.isOpen && !note.deletedAt && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] mt-1"></div>}
                        </div>
                      </div>
                      
                      <div className={`flex-1 text-sm overflow-hidden leading-relaxed font-light mask-linear-fade ${textColor}`}>
                        <div dangerouslySetInnerHTML={{__html: note.content || `<span class="italic opacity-50">No content</span>`}} />
                      </div>

                      <div className={`mt-4 pt-4 border-t ${colorStyle.isLight ? 'border-black/5' : 'border-white/10'} flex items-center justify-between text-xs ${metaColor}`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Actions based on context */}
                            {note.deletedAt ? (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            restoreNote(note.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-green-500/20 hover:bg-green-500 text-green-200 hover:text-white rounded transition-all"
                                        title="Restore"
                                    >
                                        <RotateCcw size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(confirm('Permanently delete this note?')) {
                                                permanentlyDeleteNote(note.id);
                                            }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded transition-all"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 px-2 py-1 rounded text-[10px] text-white">
                                        Open
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNote(note.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded transition-all"
                                        title="Move to Trash"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};