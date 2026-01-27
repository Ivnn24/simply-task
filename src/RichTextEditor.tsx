import { useState, useRef } from 'react';
import { Bold, Italic, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (text: string) => void;
  isDarkMode: boolean;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

// Simple rich text format to store: use **text** for bold and *text* for italic
export interface RichText {
  raw: string; // Original markdown format
}

// Parse markdown-like format for display
export const parseRichText = (text: string): React.JSX.Element => {
  if (!text) return <></>;

  const parts: React.JSX.Element[] = [];
  let lastIndex = 0;
  let key = 0;

  // Regex to find both **bold** and *italic* patterns
  const regex = /\*\*([^\*]+)\*\*|\*([^\*]+)\*/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.substring(lastIndex, match.index)}</span>);
    }

    // Add formatted text
    if (match[1]) {
      // Bold: **text**
      parts.push(
        <strong key={key++} className="font-bold">
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      // Italic: *text*
      parts.push(
        <em key={key++} className="italic">
          {match[2]}
        </em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.substring(lastIndex)}</span>);
  }

  return <>{parts}</>;
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  isDarkMode,
  placeholder = 'Add your notes here...',
  rows = 8,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formatMode, setFormatMode] = useState<'bold' | 'italic' | null>(null);

  // Handle text selection for formatting
  const handleTextSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = value.substring(start, end);
      setSelectedText(selected);
    }
  };

  // Apply bold formatting
  const applyBold = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    // If no text selected, enable toggle mode for mobile
    if (start === end && !selectedText) {
      if (formatMode === 'bold') {
        setFormatMode(null);
      } else {
        setFormatMode('bold');
      }
      return;
    }

    const selected = selectedText || value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newText = `${before}**${selected}**${after}`;

    onChange(newText);
    setSelectedText('');
    setFormatMode(null);

    // Restore selection
    setTimeout(() => {
      if (textareaRef.current) {
        const newStart = start + 2;
        const newEnd = end + 2;
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    }, 0);
  };

  // Apply italic formatting
  const applyItalic = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    // If no text selected, enable toggle mode for mobile
    if (start === end && !selectedText) {
      if (formatMode === 'italic') {
        setFormatMode(null);
      } else {
        setFormatMode('italic');
      }
      return;
    }

    const selected = selectedText || value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newText = `${before}*${selected}*${after}`;

    onChange(newText);
    setSelectedText('');
    setFormatMode(null);

    // Restore selection
    setTimeout(() => {
      if (textareaRef.current) {
        const newStart = start + 1;
        const newEnd = end + 1;
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    }, 0);
  };

  // Copy formatted text
  const copyFormatted = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={applyBold}
            disabled={disabled}
            title="Make selected text bold (or toggle for mobile)"
            className={`p-2 rounded-lg transition-all ${
              formatMode === 'bold' || selectedText
                ? isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                : isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Bold className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={applyItalic}
            disabled={disabled}
            title="Make selected text italic (or toggle for mobile)"
            className={`p-2 rounded-lg transition-all ${
              formatMode === 'italic' || selectedText
                ? isDarkMode
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
                : isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Italic className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showPreview
                ? isDarkMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-500 text-white'
                : isDarkMode
                  ? 'bg-slate-700 text-slate-200'
                  : 'bg-slate-200 text-slate-700'
            }`}
          >
            {showPreview ? 'Editing' : 'Preview'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyFormatted}
            className={`p-2 rounded-lg transition-all ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600'
                : 'bg-slate-200 hover:bg-slate-300'
            }`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>

      <div className="text-xs opacity-60 italic">
        💡 Tip: Select text and click Bold/Italic, or click to toggle mode for mobile. Use **text** for bold, *text* for italic.
      </div>

      {showPreview ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-3 rounded-lg border-2 min-h-[200px] overflow-auto custom-scrollbar whitespace-pre-wrap leading-relaxed text-sm ${
            isDarkMode
              ? 'border-indigo-600 bg-indigo-900/20 text-indigo-100'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          {parseRichText(value || placeholder)}
        </motion.div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
            
            // Auto-format when in format mode - wrap new typed text with markers
            if (formatMode && newValue.length > value.length) {
              // Text was added
              const diff = newValue.length - value.length;
              const cursorPos = e.currentTarget.selectionStart;
              
              // Apply formatting around the newly typed text
              const before = newValue.substring(0, cursorPos - diff);
              const typed = newValue.substring(cursorPos - diff, cursorPos);
              const after = newValue.substring(cursorPos);
              
              const marker = formatMode === 'bold' ? '**' : '*';
              const formatted = `${before}${marker}${typed}${marker}${after}`;
              
              onChange(formatted);
              // Disable format mode after applying
              setFormatMode(null);
              
              // Reset cursor position
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.setSelectionRange(cursorPos + marker.length, cursorPos + marker.length);
                }
              }, 0);
            }
          }}
          onSelect={handleTextSelect}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-transparent p-3 rounded-lg border-2 focus:ring-2 ring-blue-500 outline-none font-mono text-sm resize-none transition-all ${
            isDarkMode
              ? 'border-indigo-600 text-indigo-100 placeholder-indigo-400'
              : 'border-slate-200 text-slate-700 placeholder-slate-400'
          }`}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
