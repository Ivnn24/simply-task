import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Todo' | 'Done' | 'Archived';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'none';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface TaskTag {
  id: string;
  name: string;
  color: string;
}

export interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  estimatedTime: number; // in minutes
  createdAt: string;
  completedAt?: string;
  notes?: string;
  files?: TaskFile[];
  summary?: string;
  startedAt?: string;
  
  // New features
  tags?: string[]; // Tag IDs
  subtasks?: Subtask[];
  recurrence?: RecurrenceType;
  recurrenceEnd?: string;
  lastRecurrenceDate?: string;
  timeEntries?: TimeEntry[];
  totalTimeSpent?: number; // in minutes
  isTemplate?: boolean;
  deviceId?: string; // Device where task was created
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
  tags: TaskTag[];
  archivedTasks: Task[];
  userScore: number;
  streak: number;
  lastActiveDate: string | null;
  isFocusMode: boolean;
  isDarkMode: boolean;
  deviceId: string; // Unique device identifier
  selectedTags: string[]; // For filtering
  searchQuery: string;

  // Actions
  addTask: (task: Omit<Task, 'id' | 'status' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  archiveTask: (id: string) => void;
  restoreTask: (id: string) => void;
  
  // Tag Actions
  addTag: (name: string, color: string) => string;
  removeTag: (tagId: string) => void;
  addTagToTask: (taskId: string, tagId: string) => void;
  removeTagFromTask: (taskId: string, tagId: string) => void;
  setSelectedTags: (tagIds: string[]) => void;
  
  // Subtask Actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  
  // Time Tracking
  startTimer: (taskId: string) => void;
  stopTimer: (taskId: string) => void;
  addTimeEntry: (taskId: string, duration: number) => void;
  
  // Recurrence
  createRecurringTask: (taskId: string, recurrenceType: RecurrenceType, endDate?: string) => void;
  
  // Search & Filter
  setSearchQuery: (query: string) => void;
  
  // Notification Actions
  addNotification: (message: string, type: 'info' | 'warning' | 'alert') => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;

  toggleFocusMode: () => void;
  toggleTheme: () => void;
  updateScore: () => void;
  checkStreak: () => void;
  initializeDevice: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      notifications: [],
      tags: [],
      archivedTasks: [],
      userScore: 50,
      streak: 0,
      lastActiveDate: null,
      isFocusMode: false,
      isDarkMode: false,
      deviceId: '',
      selectedTags: [],
      searchQuery: '',

      initializeDevice: () => {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
          deviceId = `device-${nanoid()}`;
          localStorage.setItem('deviceId', deviceId);
        }
        set({ deviceId });
      },

      addTask: (taskData) => {
        const { deviceId } = get();
        const newTask: Task = {
          id: nanoid(),
          status: 'Todo',
          createdAt: new Date().toISOString(),
          deviceId,
          ...taskData,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        get().updateScore();
        get().addNotification(`New task created: ${newTask.title}`, 'info');
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              return { ...t, ...updates };
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
        const { deviceId } = get();
        const newTask: Task = {
          ...taskToDuplicate,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          status: 'Todo',
          completedAt: undefined,
          startedAt: undefined,
          deviceId,
          title: `${taskToDuplicate.title} (Copy)`,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        get().addNotification(`Task duplicated: ${newTask.title}`, 'info');
      },

      archiveTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
            archivedTasks: [{ ...task, status: 'Archived' }, ...state.archivedTasks],
          }));
        }
      },

      restoreTask: (id) => {
        const task = get().archivedTasks.find((t) => t.id === id);
        if (task) {
          set((state) => ({
            archivedTasks: state.archivedTasks.filter((t) => t.id !== id),
            tasks: [{ ...task, status: 'Todo' }, ...state.tasks],
          }));
        }
      },

      // Tag Management
      addTag: (name, color) => {
        const tagId = nanoid();
        const newTag: TaskTag = { id: tagId, name, color };
        set((state) => ({ tags: [...state.tags, newTag] }));
        return tagId;
      },

      removeTag: (tagId) => {
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== tagId),
          tasks: state.tasks.map((task) => ({
            ...task,
            tags: task.tags?.filter((t) => t !== tagId),
          })),
        }));
      },

      addTagToTask: (taskId, tagId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                tags: [...(t.tags || []), tagId].filter((t, i, arr) => arr.indexOf(t) === i),
              };
            }
            return t;
          }),
        }));
      },

      removeTagFromTask: (taskId, tagId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                tags: t.tags?.filter((tag) => tag !== tagId),
              };
            }
            return t;
          }),
        }));
      },

      setSelectedTags: (tagIds) => set({ selectedTags: tagIds }),

      // Subtask Management
      addSubtask: (taskId, title) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                subtasks: [
                  ...(t.subtasks || []),
                  {
                    id: nanoid(),
                    title,
                    completed: false,
                    createdAt: new Date().toISOString(),
                  },
                ],
              };
            }
            return t;
          }),
        }));
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                subtasks: t.subtasks?.map((s) => {
                  if (s.id === subtaskId) {
                    return { ...s, completed: !s.completed };
                  }
                  return s;
                }),
              };
            }
            return t;
          }),
        }));
      },

      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                subtasks: t.subtasks?.filter((s) => s.id !== subtaskId),
              };
            }
            return t;
          }),
        }));
      },

      // Time Tracking
      startTimer: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              return { ...t, startedAt: new Date().toISOString() };
            }
            return t;
          }),
        }));
      },

      stopTimer: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (task && task.startedAt) {
          const duration = Math.floor((new Date().getTime() - new Date(task.startedAt).getTime()) / 60000);
          set((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id === taskId) {
                const timeEntries = [...(t.timeEntries || [])];
                timeEntries.push({
                  id: nanoid(),
                  startTime: t.startedAt!,
                  endTime: new Date().toISOString(),
                  duration,
                });
                return {
                  ...t,
                  startedAt: undefined,
                  timeEntries,
                  totalTimeSpent: (t.totalTimeSpent || 0) + duration,
                };
              }
              return t;
            }),
          }));
        }
      },

      addTimeEntry: (taskId, duration) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              const now = new Date().toISOString();
              return {
                ...t,
                timeEntries: [
                  ...(t.timeEntries || []),
                  {
                    id: nanoid(),
                    startTime: now,
                    duration,
                  },
                ],
                totalTimeSpent: (t.totalTimeSpent || 0) + duration,
              };
            }
            return t;
          }),
        }));
      },

      createRecurringTask: (taskId, recurrenceType, endDate) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                recurrence: recurrenceType,
                recurrenceEnd: endDate,
                lastRecurrenceDate: new Date().toISOString(),
              };
            }
            return t;
          }),
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      // Notifications
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
        set((state) => ({
          notifications: state.notifications.map((n) => {
            if (n.id === id) {
              return { ...n, isRead: true };
            }
            return n;
          }),
        }));
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
      },
    }),
    {
      name: 'task-master-storage',
      partialize: (state) => ({
        tasks: state.tasks.filter((t) => t.deviceId === state.deviceId),
        notifications: state.notifications,
        tags: state.tags,
        archivedTasks: state.archivedTasks.filter((t) => t.deviceId === state.deviceId),
        userScore: state.userScore,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        isFocusMode: state.isFocusMode,
        isDarkMode: state.isDarkMode,
        deviceId: state.deviceId,
        selectedTags: state.selectedTags,
        searchQuery: state.searchQuery,
      }),
    }
  )
);