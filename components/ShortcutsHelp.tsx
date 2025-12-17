import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsHelpProps {
  onClose: () => void;
}

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ onClose }) => {
  const shortcuts = [
    { key: "Global", items: [
      { keys: ["Ctrl", "\\"], desc: "Toggle Dock Visibility" },
      { keys: ["Ctrl", "Space"], desc: "Pin / Unpin Window (Always on Top)" },
      { keys: ["Esc"], desc: "Close Note / Dashboard / Modal" },
    ]},
    { key: "Editor Formatting", items: [
      { keys: ["Ctrl", "B"], desc: "Bold" },
      { keys: ["Ctrl", "I"], desc: "Italic" },
      { keys: ["-", "Space"], desc: "Bullet List" },
      { keys: ["1.", "Space"], desc: "Ordered List (Numbers)" },
      { keys: ["[]", "Space"], desc: "Insert Checkbox" },
      { keys: ["---", "Space"], desc: "Insert Horizontal Line" },
      { keys: ["Tab"], desc: "Insert Tab Space" },
    ]},
    { key: "Headings", items: [
      { keys: ["#", "Space"], desc: "Large Heading (H1)" },
      { keys: ["##", "Space"], desc: "Medium Heading (H2)" },
      { keys: ["###", "Space"], desc: "Normal Text" },
      { keys: ["Ctrl", "Alt", "1"], desc: "Large Heading (H1)" },
      { keys: ["Ctrl", "Alt", "2"], desc: "Medium Heading (H2)" },
      { keys: ["Ctrl", "Alt", "0"], desc: "Normal Text" },
    ]}
  ];

  return (
    <div className="modal-overlay fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-200" data-interactive>
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col" data-interactive>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2 text-white">
            <Keyboard size={20} className="text-blue-400" />
            <span className="font-semibold">Keyboard Shortcuts</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {shortcuts.map((section) => (
            <div key={section.key}>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{section.key}</h3>
              <div className="space-y-3">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.desc}</span>
                    <div className="flex gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd key={kIdx} className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono text-slate-300 min-w-[20px] text-center border border-white/5">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 text-center">
            <p className="text-xs text-slate-500">Press <kbd className="font-mono text-slate-400">Esc</kbd> to close</p>
        </div>
      </div>
    </div>
  );
};