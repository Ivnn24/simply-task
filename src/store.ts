import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Todo' | 'Done';

export interface Task {
  id: string;
  title: string;
  subject: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string; // ISO String
  estimatedTime: number; // in minutes
  createdAt: string;
  completedAt?: string;
  notes?: string;
  files?: TaskFile[];
  summary?: string;
  startedAt?: string; // When task timer was started
}

export interface TaskFile {
  id: string;
  name: string;
  type: string; // 'pdf', 'docx', 'pptx', etc.
  size: number;
  uploadedAt: string;
  content?: string; // Extracted text content
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  isRead: boolean;
  timestamp: string;
}

interface AppState {
  tasks: Task[];
  notifications: Notification[];
  userScore: number;
  streak: number;
  lastActiveDate: string | null;
  isFocusMode: boolean;
  isDarkMode: boolean;

  // Actions
  addTask: (task: Omit<Task, 'id' | 'status' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void; // ADDED THIS
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void; // NEW
  
  // Notification Actions
  addNotification: (message: string, type: 'info' | 'warning' | 'alert') => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;

  toggleFocusMode: () => void;
  toggleTheme: () => void;
  updateScore: () => void;
  checkStreak: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      notifications: [],
      userScore: 50,
      streak: 0,
      lastActiveDate: null,
      isFocusMode: false,
      isDarkMode: false,

      addTask: (taskData) => {
        const newTask: Task = {
          id: nanoid(),
          status: 'Todo',
          createdAt: new Date().toISOString(),
          ...taskData,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        get().updateScore();
        // Add notification for creation
        get().addNotification(`New task created: ${newTask.title}`, 'info');
      },

      // NEW: Update Task
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              const updated: any = { ...t, ...updates };
              if (updates.status) {
                updated.status = updates.status as TaskStatus;
              }
              return updated;
            }
            return t;
          }),
        }));
      },

      toggleTaskStatus: (id) => {
        set((state) => {
          const tasks = state.tasks.map((t) => {
            if (t.id === id) {
              const isCompleting = t.status === 'Todo';
              return {
                ...t,
                status: (isCompleting ? 'Done' : 'Todo') as TaskStatus,
                completedAt: isCompleting ? new Date().toISOString() : undefined,
              };
            }
            return t;
          });
          return { tasks };
        });
        get().updateScore();
        get().checkStreak();
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
        get().updateScore();
      },

      duplicateTask: (id) => {
        const taskToDuplicate = get().tasks.find((t) => t.id === id);
        if (!taskToDuplicate) return;
        
        const newTask: Task = {
          ...taskToDuplicate,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          status: 'Todo',
          completedAt: undefined,
          startedAt: undefined,
          title: `${taskToDuplicate.title} (Copy)`,
        };
        
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        get().addNotification(`Task duplicated: ${newTask.title}`, 'info');
      },

      // NEW: Notification Logic
      addNotification: (message, type) => {
        const newNotif: Notification = {
          id: nanoid(),
          message,
          type,
          isRead: false,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ notifications: [newNotif, ...state.notifications] }));
      },

      markRead: (id) => {
        console.log('markRead called with ID:', id);
        set((state) => {
          const updated = state.notifications.map(n => {
            if (n.id === id) {
              console.log(`Marking notification ${n.id} as read`);
              return { ...n, isRead: true };
            }
            return n;
          });
          const unreadAfter = updated.filter(n => !n.isRead).length;
          console.log(`After marking read - unread count: ${unreadAfter}`);
          return { notifications: updated };
        });
      },

      clearNotifications: () => set({ notifications: [] }),

      toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      updateScore: () => {
        const { tasks } = get();
        if (tasks.length === 0) {
           set({ userScore: 50 });
           return;
        }
        const completed = tasks.filter((t) => t.status === 'Done').length;
        const total = tasks.length;
        let score = Math.round((completed / total) * 100);
        set({ userScore: Math.max(0, Math.min(100, score)) });
      },

      checkStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastActiveDate, streak } = get();
        if (lastActiveDate === today) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (lastActiveDate === yesterdayStr) {
           set({ streak: streak + 1, lastActiveDate: today });
        } else {
           set({ streak: 1, lastActiveDate: today });
        }
      }
    }),
    { name: 'task-master-storage' }
  )
);