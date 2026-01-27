import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, Archive, Settings, HelpCircle } from 'lucide-react';

interface MobileMenuProps {
  isDarkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onNewTask: () => void;
  onSearch: () => void;
  onArchive: () => void;
  onSettings: () => void;
  onHelp: () => void;
}

export const MobileHamburgerMenu: React.FC<MobileMenuProps> = ({
  isDarkMode,
  isOpen,
  onClose,
  onNewTask,
  onSearch,
  onArchive,
  onSettings,
  onHelp,
}) => {
  const menuItems = [
    { icon: Plus, label: 'New Task', action: onNewTask },
    { icon: Search, label: 'Search', action: onSearch },
    { icon: Archive, label: 'Archive', action: onArchive },
    { icon: Settings, label: 'Settings', action: onSettings },
    { icon: HelpCircle, label: 'Help', action: onHelp },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />

          {/* Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className={`fixed left-0 top-0 h-full w-64 z-50 ${
              isDarkMode ? 'bg-slate-800' : 'bg-white'
            } shadow-xl`}
          >
            <div className="p-4 border-b border-slate-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Menu</h2>
                <button onClick={onClose} className="hover:opacity-70">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                      isDarkMode
                        ? 'hover:bg-slate-700 text-slate-200'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Keyboard Shortcuts Info */}
            <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <p className="text-xs font-bold mb-2 opacity-70">KEYBOARD SHORTCUTS</p>
              <div className="space-y-1 text-xs opacity-70">
                <p>Ctrl+K: New Task</p>
                <p>Ctrl+Shift+F: Search</p>
                <p>Ctrl+?: Help</p>
                <p>Esc: Close</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileHamburgerMenu;
