import { useState, useEffect } from 'react';
import type { Task } from './store';
import { useStore } from './store';
import { 
  TaskForm, TaskCard, ScoreCard, StreakCard, FocusModeButton, 
  AnalyticsDashboard, SubjectView, WeeklyReport 
} from './components';
import { motion, AnimatePresence } from 'framer-motion';
import RichTextEditor, { parseRichText } from './RichTextEditor';
import { 
  requestNotificationPermission, 
  checkAndNotifyUpcomingTasks
} from './notifications';
import { 
  Sun, Moon, List, Grid3x3, BookOpen, Sparkles, 
  CheckCircle2, Circle, Layout, Plus, Clock, Bell, X, Save, AlertTriangle, Calendar,
  FileText, File, Presentation, BarChart3, Paperclip, Trash2, HelpCircle, Copy
} from 'lucide-react';

// ============ UTILITY FUNCTIONS FOR PH TIME ============
function formatDatePH(date: Date | string) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', { 
    timeZone: 'Asia/Manila',
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }).format(d);
}

function formatTimePH(date: Date | string) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(d);
}

// ============ SUB-COMPONENT: EDIT/VIEW MODAL (FIXED) ============
const TaskDetailModal = ({ task, onClose, isDarkMode, onDeleteClick }: { task: Task, onClose: () => void, isDarkMode: boolean, onDeleteClick: (taskId: string) => void }) => {
  const { updateTask } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for editing
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedNotes, setEditedNotes] = useState(task.notes || '');
  const [editedSubject, setEditedSubject] = useState(task.subject);
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate);
  const [isSaving, setIsSaving] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    updateTask(task.id, {
      title: editedTitle,
      notes: editedNotes,
      subject: editedSubject,
      dueDate: editedDueDate
    });
    setIsEditing(false);
    setIsSaving(false);
  };

  const removeFile = (fileId: string) => {
    const task_files = task.files || [];
    const updated = task_files.filter((f: any) => f.id !== fileId);
    updateTask(task.id, { files: updated.length > 0 ? updated : undefined });
  };

  const getFileIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'pdf':
      case 'txt': return <FileText className="w-4 h-4" />;
      case 'docx':
      case 'doc': return <File className="w-4 h-4" />;
      case 'pptx':
      case 'ppt': return <Presentation className="w-4 h-4" />;
      case 'xlsx':
      case 'xls': return <BarChart3 className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] ${isDarkMode ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white border border-indigo-800/30' : 'bg-white text-slate-900'}`}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Modal Header (Fixed) */}
        <div className={`flex-shrink-0 px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-indigo-700/30 bg-indigo-900/20' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${task.priority === 'Urgent' ? 'bg-red-500' : task.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`} />
            <span className="text-sm font-bold uppercase tracking-wider opacity-70">{task.priority} Priority</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-500/20 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Modal Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          
          {/* Title Section */}
          <div>
            <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Task Title</label>
            {isEditing ? (
              <input 
                value={editedTitle} 
                onChange={(e) => setEditedTitle(e.target.value)}
                className={`w-full p-2 rounded-lg font-bold text-lg outline-none border-2 focus:border-blue-500 bg-transparent ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`}
              />
            ) : (
              <h2 className="text-2xl font-bold leading-tight">{task.title}</h2>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Subject */}
             <div>
                <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Subject</label>
                {isEditing ? (
                   <input 
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className={`w-full p-2 rounded-lg text-sm bg-transparent border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`}
                   />
                ) : (
                   <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{task.subject}</span>
                   </div>
                )}
             </div>

             {/* Due Date */}
             <div>
                <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Due Date</label>
                {isEditing ? (
                   <input 
                      type="datetime-local"
                      value={editedDueDate.substring(0, 16)}
                      onChange={(e) => setEditedDueDate(new Date(e.target.value).toISOString())}
                      className={`w-full p-2 rounded-lg text-sm bg-transparent border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`}
                   />
                ) : (
                   <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-500" />
                      <span className="font-medium">{formatDatePH(task.dueDate)}</span>
                   </div>
                )}
             </div>
          </div>

          {/* Notes Section - Fixed Scrolling Issue here */}
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-indigo-900/20 border border-indigo-700/30' : 'bg-slate-50'}`}>
            <label className="text-xs font-bold uppercase opacity-50 mb-2 block flex items-center gap-2">
               Notes / Description (with Rich Text Support)
            </label>
            {isEditing ? (
              <RichTextEditor
                value={editedNotes}
                onChange={setEditedNotes}
                isDarkMode={isDarkMode}
                placeholder="Add your notes here... (Use **text** for bold, *text* for italic)"
                rows={8}
              />
            ) : (
              <div className={`whitespace-pre-wrap leading-relaxed text-sm overflow-hidden ${isDarkMode ? 'text-indigo-100' : 'text-slate-600'}`}>
                {task.notes ? parseRichText(task.notes) : <span className="italic opacity-50">No notes added.</span>}
              </div>
            )}
          </div>

          {/* Attachments Section - Read Only */}
          {task.files && task.files.length > 0 && (
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-indigo-900/20 border border-indigo-700/30' : 'bg-slate-50'}`}>
              <label className="text-xs font-bold uppercase opacity-50 mb-3 block flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Attachments
              </label>
              
              <div className="space-y-2">
                {task.files.map(file => (
                  <div key={file.id} className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'bg-indigo-800/30 border-indigo-700/50' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-slate-500 flex-shrink-0">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs opacity-50">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    {isEditing && (
                      <button 
                        onClick={() => removeFile(file.id)}
                        className={`p-1 rounded hover:bg-red-500/20 text-red-500 flex-shrink-0`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Section - Read Only */}
          {task.summary && (
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-indigo-900/30 border border-indigo-700/50' : 'bg-blue-50 border border-blue-200'}`}>
              <label className="text-xs font-bold uppercase opacity-50 mb-2 block flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Summary
              </label>
              <div className={`text-sm leading-relaxed ${isDarkMode ? 'text-indigo-100' : 'text-blue-900'}`}>
                {task.summary}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions (Fixed) */}
        <div className={`flex-shrink-0 px-6 py-4 border-t flex justify-end gap-3 ${isDarkMode ? 'border-indigo-700/30 bg-indigo-900/15' : 'border-slate-100 bg-slate-50'}`}>
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button 
                 onClick={() => onDeleteClick(task.id)}
                 className="mr-auto px-4 py-2 rounded-xl text-red-500 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                 Delete
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-900'}`}
              >
                Edit Details
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};


// ============ MAIN APP COMPONENT ============
export default function App() {
  const { tasks, notifications, addNotification, markRead, clearNotifications, isDarkMode, toggleTheme, deleteTask, initializeDevice } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'subject'>('list');
  const [showForm, setShowForm] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [, setIsMobileMenuOpen] = useState(false); // For mobile hamburger menu
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  // State for Features
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; taskId: string | null }>({ show: false, taskId: null });

  // Initialize device on mount
  useEffect(() => {
    initializeDevice();
  }, [initializeDevice]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard Shortcuts (Ctrl+K for quick task creation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for quick add
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowForm(!showForm);
      }
      // Ctrl+Shift+F or Cmd+Shift+F for search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setShowSearchBar(!showSearchBar);
      }
      // Ctrl+/ or Cmd+/ for help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowHelpModal(!showHelpModal);
      }
      // Escape to close search and modals
      if (e.key === 'Escape') {
        setSearchQuery('');
        setShowForm(false);
        setShowSearchBar(false);
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm, showSearchBar, showHelpModal]);

  // Initialize push notifications on app mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Timer: Clock + Notification Checker + Push Notifications
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (now.getSeconds() === 0) {
         tasks.forEach(task => {
            if (task.status === 'Done') return;
            const due = new Date(task.dueDate).getTime();
            const current = now.getTime();
            const diffHours = (due - current) / (1000 * 60 * 60);

            if (diffHours > 0.9 && diffHours < 1.1) {
               addNotification(`Deadline approaching: "${task.title}" is due in 1 hour!`, 'alert');
            }
            if (diffHours < 0 && diffHours > -0.02) {
               addNotification(`Task Overdue: "${task.title}" is past due!`, 'warning');
            }
         });
      }

      // Check for push notifications every 5 minutes
      if (now.getMinutes() % 5 === 0 && now.getSeconds() === 0) {
        checkAndNotifyUpcomingTasks(tasks);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [tasks, addNotification]);

  // Filter tasks by search query
  const filteredTasks = tasks.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      (t.notes && t.notes.toLowerCase().includes(query))
    );
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'Todo');
  const doneTasks = filteredTasks.filter((t) => t.status === 'Done');
  const totalScore = Math.round((doneTasks.length / (filteredTasks.length || 1)) * 100);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notificationId: string) => {
    console.log('handleNotificationClick called with ID:', notificationId);
    markRead(notificationId);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const ViewToggle = ({ mode, icon: Icon, label }: { mode: typeof viewMode, icon: any, label: string }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 z-10 flex items-center gap-2 ${
        viewMode === mode 
          ? (isDarkMode ? 'text-white' : 'text-blue-600') 
          : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
      }`}
    >
      {viewMode === mode && (
        <motion.div
          layoutId="view-tab"
          className={`absolute inset-0 rounded-lg shadow-sm ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </span>
    </button>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen overflow-x-hidden transition-colors duration-500`}>
      {/* Global Background Gradient */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-500 ${
        isDarkMode 
          ? 'bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black' 
          : 'bg-slate-50 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white'
      }`} />

      {/* ============ HEADER ============ */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? (isDarkMode ? 'bg-slate-900/80 border-b border-slate-800 backdrop-blur-xl' : 'bg-white/80 border-b border-slate-200/60 backdrop-blur-xl') 
          : 'bg-transparent border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Time Area */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative hidden xs:block">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 rounded-full" />
                <div className={`relative p-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600 shadow-sm border border-slate-100'}`}>
                   <Sparkles className="w-6 h-6" fill="currentColor" fillOpacity={0.2} />
                </div>
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-tight leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  SimplyTask
                </h1>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Clock className="w-3 h-3" />
                  <span>{formatDatePH(currentTime)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-blue-600'}`}>
                    PH
                  </span>
                  <span className="tabular-nums font-mono">
                    {formatTimePH(currentTime)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search tasks... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-2 rounded-xl text-sm transition-all ${
                  isDarkMode
                    ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 shadow-sm'
                } focus:outline-none`}
              />
            </div>
            
            {/* Desktop Stats & Actions */}
            <div className="flex items-center gap-3">
               {/* NOTIFICATION BELL */}
               <div className="relative">
                  <button 
                     onClick={() => setShowNotifications(!showNotifications)}
                     className={`p-2.5 rounded-xl transition-all relative z-50 ${
                        isDarkMode 
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm border border-slate-200'
                     }`}
                  >
                     <Bell className="w-5 h-5" />
                     {unreadCount > 0 && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
                     )}
                  </button>

                  {/* NOTIFICATION DROPDOWN */}
                  <AnimatePresence>
                     {showNotifications && (
                        <>
                           {/* Mobile Backdrop */}
                           <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setShowNotifications(false)}
                              className="fixed inset-0 md:hidden z-[99] bg-black/30"
                           />
                           
                           {/* Notification Modal */}
                           <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className={`fixed md:absolute left-1/2 md:left-auto md:right-0 top-1/2 md:top-full -translate-x-1/2 md:translate-x-0 -translate-y-1/2 md:translate-y-0 md:mt-2 w-[95vw] md:w-96 rounded-3xl shadow-2xl border overflow-hidden z-[101] max-h-[70vh] md:max-h-80 ${
                                 isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                              }`}
                           >
                           <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-opacity-100">
                              <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>🔔 Notifications</h3>
                              {notifications.length > 0 && (
                                 <button onClick={clearNotifications} className="text-xs text-blue-500 hover:underline">Clear all</button>
                              )}
                           </div>
                           <div className="overflow-y-auto max-h-[calc(65vh-60px)] md:max-h-[calc(80vh-70px)]">
                              {notifications.length === 0 ? (
                                 <div className="p-8 text-center text-gray-500 text-sm">✨ No new notifications</div>
                              ) : (
                                 notifications.map(notif => (
                                    <div 
                                       key={notif.id} 
                                       onClick={() => handleNotificationClick(notif.id)}
                                       className={`p-4 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer flex gap-3 ${
                                          !notif.isRead ? (isDarkMode ? 'bg-slate-700/30' : 'bg-blue-50/50') : ''
                                       } ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}
                                    >
                                       <div className={`mt-1 flex-shrink-0 ${
                                          notif.type === 'alert' ? 'text-red-500' : notif.type === 'warning' ? 'text-orange-500' : 'text-blue-500'
                                       }`}>
                                          {notif.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                       </div>
                                       <div>
                                          <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} ${!notif.isRead ? 'font-semibold' : ''}`}>
                                             {notif.message}
                                          </p>
                                          <p className="text-xs text-gray-400 mt-1">{formatTimePH(notif.timestamp)}</p>
                                       </div>
                                       {!notif.isRead && (
                                          <div className="ml-auto mt-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                       )}
                                    </div>
                                 ))
                              )}
                           </div>
                           </motion.div>
                        </>
                     )}
                  </AnimatePresence>
               </div>

              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition-all border ${
                  isDarkMode 
                    ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'
                }`}
                title="Toggle dark/light mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                className={`p-2.5 rounded-xl transition-all border ${
                  isDarkMode 
                    ? 'bg-slate-800 text-blue-400 border-slate-700 hover:bg-slate-700' 
                    : 'bg-white text-blue-600 border-slate-200 hover:bg-slate-50 shadow-sm'
                }`}
                title="View help and guides"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============ MAIN CONTENT ============ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE: Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6">
             <div className="sticky top-28 space-y-6">
                <ScoreCard />
                <div className="grid grid-cols-2 gap-4">
                  <StreakCard />
                  <FocusModeButton />
                </div>
                <WeeklyReport />
                <AnalyticsDashboard />
             </div>
          </aside>

          {/* RIGHT SIDE: Tasks Area */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* Controls Bar */}
            <div className={`sticky top-20 z-30 lg:static p-2 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between backdrop-blur-md transition-all ${
               scrolled ? 'lg:backdrop-blur-none' : ''
            } ${
               isDarkMode ? 'bg-slate-900/50 sm:bg-transparent' : 'bg-white/50 sm:bg-transparent'
            }`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(!showForm)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" strokeWidth={3} />
                {showForm ? 'Close Form' : 'New Task'}
              </motion.button>

              <div className={`flex p-1.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/80 border-slate-200'}`}>
                <ViewToggle mode="list" icon={List} label="List" />
                <ViewToggle mode="grid" icon={Layout} label="Grid" />
                <ViewToggle mode="subject" icon={BookOpen} label="Subject" />
              </div>
            </div>

            {/* Form */}
            <AnimatePresence>
              {showForm && <div className="mb-8"><TaskForm onClose={() => setShowForm(false)} /></div>}
            </AnimatePresence>

            {/* Task Lists */}
            <AnimatePresence mode="wait">
              {tasks.length === 0 && !showForm ? (
                <div className={`text-center py-20 rounded-3xl border-2 border-dashed ${isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-white/50'}`}>
                  <Sparkles className="w-10 h-10 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-500">No tasks yet.</p>
                </div>
              ) : (
                <motion.div className="space-y-8 pb-24 lg:pb-0">
                  {/* Todo Tasks */}
                  {todoTasks.length > 0 && (
                    <div className="space-y-4">
                       <h2 className={`font-bold text-xl flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          <Circle className="w-5 h-5 text-yellow-500" /> In Progress
                       </h2>
                       {viewMode === 'grid' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {todoTasks.map(task => (
                                <motion.div key={task.id} layout onClick={() => handleTaskClick(task)} className="cursor-pointer hover:scale-[1.02] transition-transform">
                                   <TaskCard task={task} />
                                </motion.div>
                             ))}
                          </div>
                       ) : viewMode === 'subject' ? (
                          <SubjectView tasks={todoTasks} viewMode="grid" onTaskClick={handleTaskClick} /> 
                       ) : (
                          <div className="space-y-3">
                             {todoTasks.map(task => (
                                <motion.div key={task.id} layout onClick={() => handleTaskClick(task)} className="cursor-pointer hover:translate-x-1 transition-transform">
                                   <TaskCard task={task} />
                                </motion.div>
                             ))}
                          </div>
                       )}
                    </div>
                  )}

                  {/* Done Tasks */}
                  {doneTasks.length > 0 && (
                    <div className="space-y-4 opacity-75">
                       <h2 className={`font-bold text-xl flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          <CheckCircle2 className="w-5 h-5 text-green-500" /> Completed
                       </h2>
                       <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
                          {doneTasks.map(task => (
                             <motion.div key={task.id} layout onClick={() => handleTaskClick(task)} className="cursor-pointer">
                                <TaskCard task={task} />
                             </motion.div>
                          ))}
                       </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* ============ TASK DETAIL MODAL ============ */}
        <AnimatePresence>
           {selectedTask && (
              <TaskDetailModal 
                 task={selectedTask} 
                 onClose={() => setSelectedTask(null)} 
                 isDarkMode={isDarkMode}
                 onDeleteClick={(taskId) => setDeleteConfirm({ show: true, taskId })}
              />
           )}
        </AnimatePresence>

        {/* Mobile Nav */}
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-6 left-4 right-4 lg:hidden z-50">
          <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center justify-between ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'}`}>
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pending</span>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{todoTasks.length}</span>
             </div>
             <div className={`h-8 w-px ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Score</span>
                <span className="text-lg font-bold text-blue-500">{totalScore}</span>
             </div>
             <div className={`h-8 w-px ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
             <button onClick={() => document.getElementById('mobile-stats')?.scrollIntoView({ behavior: 'smooth' })} className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <Grid3x3 className="w-5 h-5" />
             </button>
          </div>
        </motion.div>

        <div id="mobile-stats" className="lg:hidden mt-12 space-y-6 pb-24">
          <ScoreCard /><StreakCard /><FocusModeButton /><WeeklyReport /><AnalyticsDashboard />
        </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
            onClick={() => setDeleteConfirm({ show: false, taskId: null })}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
              className={`rounded-2xl shadow-2xl max-w-sm w-full ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-red-900/30' 
                  : 'bg-white border border-red-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Icon */}
              <div className={`p-6 border-b ${
                isDarkMode ? 'border-red-900/30 bg-red-900/20' : 'border-red-100 bg-red-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-red-500/20">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Delete Task?
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className={`p-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <p className="mb-2">Are you absolutely sure you want to delete this task?</p>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {selectedTask?.title && (
                    <>
                      <strong>Task:</strong> "{selectedTask.title}"
                    </>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className={`p-6 border-t flex gap-3 ${
                isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
              }`}>
                <button
                  onClick={() => setDeleteConfirm({ show: false, taskId: null })}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    isDarkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.taskId) {
                      deleteTask(deleteConfirm.taskId);
                      setSelectedTask(null);
                      setDeleteConfirm({ show: false, taskId: null });
                      addNotification('Task deleted successfully', 'info');
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-colors bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
              className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700' 
                  : 'bg-white border border-slate-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`sticky top-0 p-6 border-b flex justify-between items-center ${
                isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-blue-500/20">
                    <HelpCircle className="w-6 h-6 text-blue-500" />
                  </div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    How to Use SimplyTask
                  </h2>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className={`p-6 space-y-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                
                {/* AI Summarization */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                      🤖 AI Summarization
                    </h3>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-800/30' : 'bg-purple-50 border border-purple-200'}`}>
                    <ol className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <span className={`font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>1.</span>
                        <span>Click "Attach Files" in the task form</span>
                      </li>
                      <li className="flex gap-2">
                        <span className={`font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>2.</span>
                        <span>Upload PDF, TXT, DOCX, PPTX, or XLSX files</span>
                      </li>
                      <li className="flex gap-2">
                        <span className={`font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>3.</span>
                        <span>AI automatically extracts and summarizes content</span>
                      </li>
                      <li className="flex gap-2">
                        <span className={`font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>4.</span>
                        <span>Summary appears below and auto-fills Notes</span>
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      ⌨️ Keyboard Shortcuts
                    </h3>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Quick add task</span>
                        <kbd className={`px-2 py-1 rounded font-mono text-xs ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>Ctrl+K</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Close modals & clear search</span>
                        <kbd className={`px-2 py-1 rounded font-mono text-xs ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>Esc</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                      🔍 Search & Filter
                    </h3>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-800/30' : 'bg-green-50 border border-green-200'}`}>
                    <p className="text-sm">Type in the search bar at the top to filter tasks by:</p>
                    <ul className="text-sm mt-2 space-y-1 ml-4">
                      <li>• Task title</li>
                      <li>• Subject/category</li>
                      <li>• Notes content</li>
                    </ul>
                  </div>
                </div>

                {/* Task Actions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                      ✨ Task Actions
                    </h3>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-orange-900/20 border border-orange-800/30' : 'bg-orange-50 border border-orange-200'}`}>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2"><Copy className="w-4 h-4" /> <strong>Duplicate:</strong> Click copy icon to duplicate task</p>
                      <p className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-500" /> <strong>Delete:</strong> Click trash icon to delete task</p>
                      <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> <strong>Complete:</strong> Click checkbox to mark as done</p>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className={`p-4 rounded-lg border-l-4 ${isDarkMode ? 'border-l-yellow-500 bg-yellow-900/20' : 'border-l-yellow-400 bg-yellow-50'}`}>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    💡 Pro Tips:
                  </p>
                  <ul className="text-sm mt-2 space-y-1 ml-4">
                    <li>• Hover over tasks to see quick actions</li>
                    <li>• AI summarizes multiple files together</li>
                    <li>• Edit AI-generated summaries anytime</li>
                    <li>• Use search to organize your workflow</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </main>
    </div>
  );
}