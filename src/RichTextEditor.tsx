/**
 * Rich Text Editor Component for Task Notes
 * Supports bold, italic, underline, and code formatting
 */

import { useRef } from 'react';
import { Bold, Italic, Underline, Code } from 'lucide-react';
import { motion } from 'framer-motion';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDarkMode: boolean;
  rows?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Add your notes here...',
  isDarkMode,
  rows = 6,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // Apply formatting
  const applyFormat = (before: string, after: string = before) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    // If no text selected, insert formatting with placeholder
    if (start === end) {
      const placeholder = before === after ? 'text' : 'text';
      const newValue = `${beforeText}${before}${placeholder}${after}${afterText}`;
      onChange(newValue);

      // Set cursor in the middle
      setTimeout(() => {
        const newCursorPos = start + before.length + placeholder.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    } else {
      // Apply formatting to selected text
      const newValue = `${beforeText}${before}${selectedText}${after}${afterText}`;
      onChange(newValue);

      // Restore selection
      setTimeout(() => {
        const newStart = start + before.length;
        const newEnd = newStart + selectedText.length;
        textarea.setSelectionRange(newStart, newEnd);
      });
    }
  };

  const actions = [
    {
      icon: Bold,
      label: 'Bold',
      shortcut: 'Ctrl+B',
      onClick: () => applyFormat('**', '**'),
    },
    {
      icon: Italic,
      label: 'Italic',
      shortcut: 'Ctrl+I',
      onClick: () => applyFormat('*', '*'),
    },
    {
      icon: Underline,
      label: 'Underline',
      shortcut: 'Ctrl+U',
      onClick: () => applyFormat('<u>', '</u>'),
    },
    {
      icon: Code,
      label: 'Code',
      shortcut: 'Ctrl+`',
      onClick: () => applyFormat('`', '`'),
    },
  ];

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormat('**', '**');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('*', '*');
          break;
        case 'u':
          e.preventDefault();
          applyFormat('<u>', '</u>');
          break;
        case '`':
          e.preventDefault();
          applyFormat('`', '`');
          break;
      }
    }
  };

  return (
    <div className={`rounded-xl overflow-hidden border ${isDarkMode ? 'bg-indigo-900/20 border-indigo-700/30' : 'bg-white border-slate-200'}`}>
      {/* Toolbar */}
      <div className={`flex flex-wrap gap-1 p-3 border-b ${isDarkMode ? 'border-indigo-700/30 bg-indigo-900/10' : 'border-slate-200 bg-slate-50'}`}>
        {actions.map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            title={`${action.label} (${action.shortcut})`}
            className={`p-2 rounded-lg transition-all flex items-center justify-center ${
              isDarkMode
                ? 'hover:bg-indigo-700/30 text-indigo-300 hover:text-indigo-200'
                : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <action.icon className="w-4 h-4" />
          </motion.button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`w-full p-4 bg-transparent resize-none outline-none font-mono text-sm ${
          isDarkMode ? 'text-indigo-100 placeholder-indigo-400/50' : 'text-slate-700 placeholder-slate-400'
        }`}
      />

      {/* Preview of formatting */}
      {value && (
        <div className={`border-t p-3 text-xs ${isDarkMode ? 'border-indigo-700/30 bg-indigo-900/5 text-indigo-200/70' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
          <div className="space-y-1">
            <p>
              <strong>Preview:</strong>
            </p>
            <div className="line-clamp-2 whitespace-pre-wrap">
              {value.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').replace(/<u>/g, '').replace(/<\/u>/g, '')}
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className={`px-4 py-2 text-xs ${isDarkMode ? 'bg-indigo-900/5 text-indigo-200/60' : 'bg-slate-50 text-slate-500'}`}>
        <div className="flex flex-wrap gap-3 text-xs">
          <span>**bold**</span>
          <span>*italic*</span>
          <span>`code`</span>
          <span>&lt;u&gt;underline&lt;/u&gt;</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Render formatted text with proper styling
 */
export function RenderFormattedText({ text, isDarkMode }: { text: string; isDarkMode: boolean }) {
  // Split text and apply formatting
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Pattern for **bold**, *italic*, `code`, <u>underline</u>
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|<u>(.+?)<\/u>/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add formatted text
    if (match[1]) {
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold">
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      parts.push(
        <em key={`italic-${match.index}`} className="italic">
          {match[2]}
        </em>
      );
    } else if (match[3]) {
      parts.push(
        <code key={`code-${match.index}`} className={`px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'} font-mono text-xs`}>
          {match[3]}
        </code>
      );
    } else if (match[4]) {
      parts.push(
        <u key={`underline-${match.index}`} className="underline decoration-blue-500">
          {match[4]}
        </u>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <div className="whitespace-pre-wrap leading-relaxed">{parts.length > 0 ? parts : text}</div>;
}
