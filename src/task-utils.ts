/**
 * Bug Fixes and Performance Optimizations
 * - Improve error handling
 * - Add task duplication with timestamp
 * - Better notification management
 * - Performance optimizations
 */

import type { Task } from './store';

/**
 * Safely parse JSON with error handling
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      func(...args);
      lastCall = now;
    }
  };
}

/**
 * Create a deep copy of a task
 */
export function deepCopyTask(task: Task): Task {
  return JSON.parse(JSON.stringify(task));
}

/**
 * Validate task data
 */
export function validateTask(task: Partial<Task>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!task.title || task.title.trim().length === 0) {
    errors.push('Task title is required');
  } else if (task.title.length > 255) {
    errors.push('Task title must be less than 255 characters');
  }

  if (!task.subject || task.subject.trim().length === 0) {
    errors.push('Subject is required');
  }

  if (!task.priority || !['Urgent', 'High', 'Medium', 'Low'].includes(task.priority)) {
    errors.push('Valid priority is required');
  }

  if (!task.dueDate) {
    errors.push('Due date is required');
  } else {
    const date = new Date(task.dueDate);
    if (isNaN(date.getTime())) {
      errors.push('Invalid due date format');
    }
  }

  if (task.estimatedTime !== undefined && task.estimatedTime < 0) {
    errors.push('Estimated time cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format task for display
 */
export function formatTaskForDisplay(task: Task): string {
  return `${task.title} (${task.subject}) - ${task.priority}`;
}

/**
 * Calculate time until deadline
 */
export function getTimeUntilDeadline(dueDate: string): {
  days: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
  formatted: string;
} {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();

  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  let formatted = '';
  if (isOverdue) {
    formatted = `${days}d ${hours}h overdue`;
  } else {
    if (days > 0) formatted += `${days}d `;
    if (hours > 0) formatted += `${hours}h `;
    formatted += `${minutes}m`;
  }

  return {
    days,
    hours,
    minutes,
    isOverdue,
    formatted,
  };
}

/**
 * Group tasks by subject
 */
export function groupTasksBySubject(tasks: Task[]): Map<string, Task[]> {
  const grouped = new Map<string, Task[]>();

  tasks.forEach(task => {
    if (!grouped.has(task.subject)) {
      grouped.set(task.subject, []);
    }
    grouped.get(task.subject)!.push(task);
  });

  return grouped;
}

/**
 * Filter tasks by multiple criteria
 */
export function filterTasks(
  tasks: Task[],
  criteria: {
    status?: Task['status'];
    priority?: Task['priority'];
    subject?: string;
    search?: string;
  }
): Task[] {
  return tasks.filter(task => {
    if (criteria.status && task.status !== criteria.status) return false;
    if (criteria.priority && task.priority !== criteria.priority) return false;
    if (criteria.subject && task.subject !== criteria.subject) return false;
    if (criteria.search) {
      const query = criteria.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesNotes = (task.notes || '').toLowerCase().includes(query);
      const matchesSubject = task.subject.toLowerCase().includes(query);
      if (!matchesTitle && !matchesNotes && !matchesSubject) return false;
    }
    return true;
  });
}

/**
 * Sort tasks by various criteria
 */
export function sortTasks(
  tasks: Task[],
  sortBy: 'dueDate' | 'priority' | 'title' | 'created' = 'dueDate',
  ascending: boolean = true
): Task[] {
  const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
  const sorted = [...tasks];

  sorted.sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'dueDate':
        compareValue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'priority':
        compareValue = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'title':
        compareValue = a.title.localeCompare(b.title);
        break;
      case 'created':
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }

    return ascending ? compareValue : -compareValue;
  });

  return sorted;
}

/**
 * Get task statistics
 */
export function getTaskStatistics(tasks: Task[]): {
  total: number;
  completed: number;
  pending: number;
  byPriority: Record<string, number>;
  bySubject: Record<string, number>;
  completionPercentage: number;
} {
  const stats = {
    total: tasks.length,
    completed: 0,
    pending: 0,
    byPriority: { Urgent: 0, High: 0, Medium: 0, Low: 0 },
    bySubject: {} as Record<string, number>,
    completionPercentage: 0,
  };

  tasks.forEach(task => {
    if (task.status === 'Done') stats.completed++;
    else stats.pending++;

    stats.byPriority[task.priority]++;
    stats.bySubject[task.subject] = (stats.bySubject[task.subject] || 0) + 1;
  });

  stats.completionPercentage = tasks.length > 0 ? Math.round((stats.completed / tasks.length) * 100) : 0;

  return stats;
}

/**
 * Check if task is due soon (within n hours)
 */
export function isDueSoon(dueDate: string, withinHours: number = 24): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  const hoursUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntil > 0 && hoursUntil <= withinHours;
}

/**
 * Check if task is overdue
 */
export function isTaskOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

/**
 * Estimate remaining work time for the week
 */
export function estimateRemainingWorkTime(tasks: Task[]): number {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return tasks
    .filter(t => t.status === 'Todo' && new Date(t.dueDate) <= weekEnd)
    .reduce((sum, t) => sum + (t.estimatedTime || 0), 0);
}
