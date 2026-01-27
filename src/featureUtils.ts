// Utilities for new features

export const formatTimeSpent = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const getSubtaskProgress = (subtasks?: any[]): { completed: number; total: number; percentage: number } => {
  if (!subtasks || subtasks.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const completed = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;
  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
};

export const generateRecurringTask = (task: any, recurrenceType: string): any => {
  const newDate = new Date(task.dueDate);
  
  switch (recurrenceType) {
    case 'daily':
      newDate.setDate(newDate.getDate() + 1);
      break;
    case 'weekly':
      newDate.setDate(newDate.getDate() + 7);
      break;
    case 'monthly':
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    default:
      return null;
  }
  
  return newDate.toISOString();
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
};
