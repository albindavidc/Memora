import React, { useRef, useEffect } from 'react';
import { 
  Bold, Italic, List, 
  Heading1, Heading2, Pilcrow, // Icons for headings/normal text
  Image as ImageIcon, CheckSquare 
} from 'lucide-react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  showToolbar?: boolean;
  isLight?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ content, onChange, showToolbar = true, isLight = false }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content on mount
  useEffect(() => {
    if (editorRef.current) {
        if (editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync content only if it's drastically different or we are not focused
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
        if(document.activeElement !== editorRef.current) {
             editorRef.current.innerHTML = content;
        }
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if(editorRef.current) {
        editorRef.current.focus();
        handleInput();
    }
  };

  const insertImage = () => {
      const url = prompt('Enter image URL:');
      if (url) {
          execCommand('insertImage', url);
      }
  };

  const insertCheckbox = () => {
      // We wrap it in a div to ensure it sits on its own line/block context
      const checkboxHtml = '<div><input type="checkbox" style="margin-right: 8px; vertical-align: middle;">&nbsp;</div>';
      execCommand('insertHTML', checkboxHtml);
  };

  // Handle click on checkboxes to toggle them
  const handleEditorClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'checkbox') {
        const checkbox = e.target as HTMLInputElement;
        if (checkbox.checked) {
            checkbox.setAttribute('checked', 'checked');
        } else {
            checkbox.removeAttribute('checked');
        }
        handleInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // 1. Handle Headings & Formatting Shortcuts
      if (e.ctrlKey && e.altKey) {
          if (e.key === '1') { e.preventDefault(); execCommand('formatBlock', 'H1'); return; }
          if (e.key === '2') { e.preventDefault(); execCommand('formatBlock', 'H2'); return; }
          if (e.key === '0') { e.preventDefault(); execCommand('formatBlock', 'P'); return; }
      }
      
      // Bullet List (Ctrl + Shift + 8)
      if (e.ctrlKey && e.shiftKey && e.key === '*') {
          e.preventDefault();
          execCommand('insertUnorderedList');
          return;
      }

      // 2. Handle Tab
      if (e.key === 'Tab') {
          e.preventDefault();
          execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
          return;
      }

      // 3. Handle Text Shortcuts (Hash for headings, [] for checkbox)
      if (e.key === ' ') {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const node = range.startContainer;
              
              // Ensure we are looking at text
              // If node is the div itself (empty line), we might need to check textContent directly
              const text = node.textContent || "";
              const offset = range.startOffset;

              // We only care if we are at the "end" of the shortcut trigger
              // i.e., user typed "#" then pressed Space.
              
              // Get the text specifically before the caret
              const textBeforeCaret = text.substring(0, offset);

              // Helper to clear the trigger characters and apply format
              const applyFormat = (triggerLen: number, format: string) => {
                  e.preventDefault(); // Stop the space
                  
                  // Delete the trigger characters (e.g., "#")
                  // If we are in a text node
                  if (node.nodeType === Node.TEXT_NODE) {
                      range.setStart(node, offset - triggerLen);
                      range.setEnd(node, offset);
                      range.deleteContents();
                  } else {
                      // Fallback for edge cases (rare in contentEditable)
                      editorRef.current!.innerHTML = "";
                  }

                  // Apply the block format
                  if (format === 'CHECKBOX') {
                      insertCheckbox();
                  } else {
                      execCommand('formatBlock', format);
                  }
                  
                  handleInput();
              };

              // H3/Normal Text: ### + Space
              if (textBeforeCaret.endsWith('###')) {
                  // If line is just "###", apply. If "foo ###", maybe not? 
                  // Usually markdown shortcuts work at start of line.
                  // We check if the trimmed line is exactly the trigger
                  if (textBeforeCaret.trim() === '###') {
                      applyFormat(3, 'P'); // Using P for 3 hashes based on request for "normal text"
                      return;
                  }
              }

              // H2: ## + Space
              if (textBeforeCaret.endsWith('##')) {
                  if (textBeforeCaret.trim() === '##') {
                      applyFormat(2, 'H2');
                      return;
                  }
              }

              // H1: # + Space
              if (textBeforeCaret.endsWith('#')) {
                  if (textBeforeCaret.trim() === '#') {
                      applyFormat(1, 'H1');
                      return;
                  }
              }
              
              // Checkbox: [] + Space
              if (textBeforeCaret.endsWith('[]')) {
                  applyFormat(2, 'CHECKBOX');
                  return;
              }
          }
      }

      // 4. Handle Enter Key for Checkboxes
      if (e.key === 'Enter') {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;

          const range = selection.getRangeAt(0);
          
          let currentBlock = range.commonAncestorContainer as HTMLElement;
          if (currentBlock.nodeType === Node.TEXT_NODE) {
              currentBlock = currentBlock.parentElement as HTMLElement;
          }

          while (currentBlock && currentBlock.parentElement !== editorRef.current && currentBlock.parentElement) {
              currentBlock = currentBlock.parentElement;
          }

          const checkbox = currentBlock.querySelector('input[type="checkbox"]');

          if (checkbox) {
              e.preventDefault();
              
              const textContent = currentBlock.textContent || "";
              
              if (textContent.trim() === '') {
                  checkbox.remove();
                  handleInput();
                  return;
              }

              const newDiv = document.createElement('div');
              newDiv.innerHTML = '<input type="checkbox" style="margin-right: 8px; vertical-align: middle;">&nbsp;';
              
              if (currentBlock.nextSibling) {
                  editorRef.current?.insertBefore(newDiv, currentBlock.nextSibling);
              } else {
                  editorRef.current?.appendChild(newDiv);
              }

              const newRange = document.createRange();
              const lastChild = newDiv.lastChild;
              if (lastChild) {
                  newRange.setStart(lastChild, lastChild.textContent?.length || 0);
                  newRange.collapse(true);
              } else {
                   newRange.setStart(newDiv, 0);
                   newRange.collapse(true);
              }
              
              selection.removeAllRanges();
              selection.addRange(newRange);
              
              handleInput();
          }
      }
  };

  const ToolbarBtn = ({ onClick, icon: Icon, title }: { onClick: () => void, icon: any, title: string }) => (
    <button 
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick} 
        className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-600 hover:bg-black/5 hover:text-slate-900' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        title={title}
    >
        <Icon size={14} />
    </button>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden no-drag cursor-text text-left">
      {/* Minimal Toolbar */}
      {showToolbar && (
        <div className={`flex items-center gap-0.5 px-3 py-2 border-b flex-wrap transition-colors duration-200 ${isLight ? 'bg-black/5 border-slate-300' : 'bg-black/10 border-white/10'}`}>
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'H1')} icon={Heading1} title="Large Heading (# + Space)" />
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'H2')} icon={Heading2} title="Medium Heading (## + Space)" />
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'P')} icon={Pilcrow} title="Normal Text (### + Space)" />
            
            <div className={`w-[1px] h-4 mx-1 ${isLight ? 'bg-slate-300' : 'bg-white/10'}`} />
            
            <ToolbarBtn onClick={() => execCommand('bold')} icon={Bold} title="Bold (Ctrl+B)" />
            <ToolbarBtn onClick={() => execCommand('italic')} icon={Italic} title="Italic (Ctrl+I)" />
            
            <div className={`w-[1px] h-4 mx-1 ${isLight ? 'bg-slate-300' : 'bg-white/10'}`} />
            
            <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List (Ctrl+Shift+8)" />
            <ToolbarBtn onClick={insertCheckbox} icon={CheckSquare} title="Checkbox ([] + Space)" />
        </div>
      )}

      {/* Content Area */}
      <div
        ref={editorRef}
        className={`editor-content flex-1 p-4 overflow-y-auto leading-relaxed outline-none ${isLight ? 'text-slate-900' : 'text-white'}`}
        contentEditable
        suppressContentEditableWarning={true}
        dir="ltr"
        onClick={handleEditorClick}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        style={{ minHeight: '100px', textAlign: 'left' }}
      />
    </div>
  );
};