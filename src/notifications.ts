import type { Task } from './store';

/**
 * Notifications Service
 * Handles browser push notifications and reminders for upcoming tasks
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string; // For notification grouping
  requireInteraction?: boolean;
}

/**
 * Request permission for browser notifications (on first call)
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
};

/**
 * Send a browser notification
 */
export const sendNotification = (options: NotificationOptions): void => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/notification-icon.png',
      badge: options.badge || '/notification-badge.png',
      tag: options.tag || 'task-reminder',
      requireInteraction: options.requireInteraction || false,
    });

    // Handle notification click
    notification.addEventListener('click', () => {
      window.focus();
      notification.close();
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * Check for tasks ending soon and send notifications
 */
export const checkAndNotifyUpcomingTasks = (tasks: Task[]): void => {
  const now = new Date();
  const upcomingThreshold = 60 * 60 * 1000; // 1 hour in milliseconds
  const reminderTag = 'upcoming-task';

  tasks.forEach((task) => {
    // Only check incomplete tasks
    if (task.status !== 'Todo') return;

    const dueDate = new Date(task.dueDate);
    const timeUntilDue = dueDate.getTime() - now.getTime();

    // If task is due within threshold and not too overdue
    if (timeUntilDue > 0 && timeUntilDue <= upcomingThreshold) {
      const hours = Math.floor(timeUntilDue / (60 * 60 * 1000));
      const minutes = Math.floor((timeUntilDue % (60 * 60 * 1000)) / (60 * 1000));

      let timeText = '';
      if (hours > 0) {
        timeText = `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
      } else {
        timeText = `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }

      sendNotification({
        title: `⏰ Task Due Soon!`,
        body: `"${task.title}" (${task.subject}) is due in ${timeText}`,
        tag: `${reminderTag}-${task.id}`,
        requireInteraction: hours < 1, // Require interaction if less than 1 hour
      });
    }

    // If task is overdue
    if (timeUntilDue < 0 && Math.abs(timeUntilDue) <= upcomingThreshold) {
      const overdueHours = Math.floor(Math.abs(timeUntilDue) / (60 * 60 * 1000));
      const overdueMinutes = Math.floor((Math.abs(timeUntilDue) % (60 * 60 * 1000)) / (60 * 1000));

      let overdueText = '';
      if (overdueHours > 0) {
        overdueText = `${overdueHours} hour${overdueHours > 1 ? 's' : ''} ${overdueMinutes} min`;
      } else {
        overdueText = `${overdueMinutes} minute${overdueMinutes > 1 ? 's' : ''}`;
      }

      sendNotification({
        title: `🚨 Task Overdue!`,
        body: `"${task.title}" (${task.subject}) was due ${overdueText} ago`,
        tag: `${reminderTag}-${task.id}`,
        requireInteraction: true,
      });
    }
  });
};

/**
 * Set up automatic reminders at regular intervals
 */
export const setupTaskReminders = (
  tasks: Task[],
  checkInterval: number = 5 * 60 * 1000 // Check every 5 minutes by default
): (() => void) => {
  // Initial check
  checkAndNotifyUpcomingTasks(tasks);

  // Set up recurring checks
  const intervalId = setInterval(() => {
    checkAndNotifyUpcomingTasks(tasks);
  }, checkInterval);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
};

/**
 * Close notification by tag
 */
export const closeNotificationByTag = (tag: string): void => {
  if (!('Notification' in window)) return;

  // This is a limitation of the Notification API - we can't directly close by tag
  // We can only track and manage them manually or use Service Workers
  console.log(`Notification with tag "${tag}" should be closed`);
};

/**
 * Show a priority-based task reminder
 */
export const showTaskReminderByPriority = (task: Task): void => {
  const priorityEmoji: Record<string, string> = {
    Urgent: '🔴',
    High: '🟠',
    Medium: '🟡',
    Low: '🟢',
  };

  const priorityText = priorityEmoji[task.priority] || '⚪';

  sendNotification({
    title: `${priorityText} ${task.priority} Priority Task`,
    body: `Don't forget: "${task.title}" (${task.subject})`,
    tag: `task-reminder-${task.id}`,
    requireInteraction: task.priority === 'Urgent' || task.priority === 'High',
  });
};

/**
 * Notify about task completion (celebration)
 */
export const notifyTaskCompletion = (task: Task): void => {
  sendNotification({
    title: '✅ Great Job!',
    body: `You completed "${task.title}"!`,
    tag: `completion-${task.id}`,
    requireInteraction: false,
  });
};

/**
 * Get summarized notification text for multiple tasks
 */
export const getMultipleTasksNotificationText = (tasks: Task[]): string => {
  if (tasks.length === 1) {
    return `You have 1 task due soon`;
  }
  
  const urgent = tasks.filter(t => t.priority === 'Urgent').length;
  const high = tasks.filter(t => t.priority === 'High').length;

  let text = `You have ${tasks.length} tasks due soon`;
  
  if (urgent > 0) {
    text += ` (${urgent} urgent)`;
  } else if (high > 0) {
    text += ` (${high} high priority)`;
  }

  return text;
};

export default {
  requestNotificationPermission,
  sendNotification,
  checkAndNotifyUpcomingTasks,
  setupTaskReminders,
  closeNotificationByTag,
  showTaskReminderByPriority,
  notifyTaskCompletion,
  getMultipleTasksNotificationText,
};
