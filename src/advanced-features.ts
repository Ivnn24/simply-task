/**
 * Advanced AI-Powered Features for Task Master
 * - Smart task recommendations
 * - Intelligent prioritization
 * - Productivity analytics
 * - Pattern recognition
 */

import type { Task, Priority } from './store';
import { parseISO, differenceInHours, differenceInDays, isToday } from 'date-fns';

// ============ INTERFACES ============

export interface TaskRecommendation {
  taskId: string;
  title: string;
  reason: string;
  confidence: number; // 0-100
  category: 'focus' | 'deadline' | 'pattern' | 'streak' | 'balance';
}

export interface SmartPriority {
  taskId: string;
  suggestedPriority: Priority;
  currentPriority: Priority;
  reason: string;
  urgencyScore: number; // 0-100
  importanceScore: number; // 0-100
}

export interface ProductivityInsight {
  type: 'pattern' | 'warning' | 'opportunity' | 'achievement';
  title: string;
  message: string;
  actionable: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PerformanceMetrics {
  completionRate: number; // 0-100
  averageCompletionTime: number; // minutes
  focusStreakDays: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
  averagePriority: Priority;
  averageTasksPerDay: number;
}

// ============ SMART RECOMMENDATION ENGINE ============

/**
 * Analyze tasks and recommend what to focus on next
 */
export function getTaskRecommendations(tasks: Task[]): TaskRecommendation[] {
  const now = new Date();
  const recommendations: TaskRecommendation[] = [];

  // Categorize tasks
  const pendingTasks = tasks.filter(t => t.status === 'Todo');
  const overdueTasks = pendingTasks.filter(t => isOverdueTask(parseISO(t.dueDate)));
  const urgentTasks = pendingTasks.filter(t => {
    const hoursUntilDue = differenceInHours(parseISO(t.dueDate), now);
    return hoursUntilDue <= 24 && hoursUntilDue > 0;
  });

  // 1. OVERDUE - CRITICAL FOCUS
  overdueTasks.slice(0, 2).forEach(task => {
    recommendations.push({
      taskId: task.id,
      title: task.title,
      reason: `⚠️ This task is overdue by ${differenceInDays(now, parseISO(task.dueDate))} days. Complete it immediately!`,
      confidence: 100,
      category: 'deadline',
    });
  });

  // 2. URGENT (Due within 24 hours)
  urgentTasks.slice(0, 2).forEach(task => {
    const hoursLeft = differenceInHours(parseISO(task.dueDate), now);
    recommendations.push({
      taskId: task.id,
      title: task.title,
      reason: `⏱️ Due in ${hoursLeft} hours. Consider tackling this soon.`,
      confidence: 95 - Math.max(0, (24 - hoursLeft) * 2),
      category: 'deadline',
    });
  });

  // 3. HIGH PRIORITY + DUE THIS WEEK
  const thisWeekTasks = pendingTasks.filter(t => {
    const daysUntilDue = differenceInDays(parseISO(t.dueDate), now);
    return daysUntilDue <= 7 && daysUntilDue >= 0 && t.priority === 'Urgent';
  });
  thisWeekTasks.slice(0, 1).forEach(task => {
    recommendations.push({
      taskId: task.id,
      title: task.title,
      reason: '🎯 High priority task due this week.',
      confidence: 90,
      category: 'deadline',
    });
  });

  // 4. FOCUS MODE RECOMMENDATION - Long tasks that need focus
  const complexTasks = pendingTasks
    .filter(t => (t.estimatedTime || 0) >= 60)
    .sort((a, b) => (b.estimatedTime || 0) - (a.estimatedTime || 0))
    .slice(0, 1);

  complexTasks.forEach(task => {
    recommendations.push({
      taskId: task.id,
      title: task.title,
      reason: `🧠 This is a complex task (${task.estimatedTime} min). Consider using Focus Mode.`,
      confidence: 85,
      category: 'focus',
    });
  });

  // 5. BALANCE RECOMMENDATION - Variety across subjects
  const subjectCounts = new Map<string, number>();
  pendingTasks.forEach(t => {
    subjectCounts.set(t.subject, (subjectCounts.get(t.subject) || 0) + 1);
  });

  const maxSubject = Array.from(subjectCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const minSubject = Array.from(subjectCounts.entries()).sort((a, b) => a[1] - b[1])[0];

  if (maxSubject && minSubject && maxSubject[1] > minSubject[1] * 2) {
    const taskFromMinSubject = pendingTasks.find(t => t.subject === minSubject[0]);
    if (taskFromMinSubject) {
      recommendations.push({
        taskId: taskFromMinSubject.id,
        title: taskFromMinSubject.title,
        reason: `📚 Balance your studies! You've been focusing on ${maxSubject[0]} a lot. Try ${minSubject[0]} next.`,
        confidence: 70,
        category: 'balance',
      });
    }
  }

  // 6. STREAK PATTERN - Continue what's working
  const completedToday = tasks.filter(t => t.status === 'Done' && isToday(parseISO(t.completedAt || new Date().toISOString()))).length;
  if (completedToday >= 3 && pendingTasks.length > 0) {
    const nextTask = pendingTasks.slice(0, 1)[0];
    recommendations.push({
      taskId: nextTask.id,
      title: nextTask.title,
      reason: `🔥 Great momentum! You've completed ${completedToday} tasks today. One more to keep the streak alive!`,
      confidence: 75,
      category: 'streak',
    });
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

// ============ SMART PRIORITIZATION ENGINE ============

/**
 * AI-powered intelligent task prioritization
 */
export function getSmartPriorities(tasks: Task[]): SmartPriority[] {
  const now = new Date();
  const priorities: SmartPriority[] = [];

  const pendingTasks = tasks.filter(t => t.status === 'Todo');

  pendingTasks.forEach(task => {
    const daysUntilDue = differenceInDays(parseISO(task.dueDate), now);
    const isOverdue = daysUntilDue < 0;
    const hoursUntilDue = differenceInHours(parseISO(task.dueDate), now);

    // Calculate urgency (0-100)
    let urgencyScore = 50; // Base
    if (isOverdue) {
      urgencyScore = 100;
    } else if (hoursUntilDue <= 24) {
      urgencyScore = 90 + Math.min(10, Math.abs(24 - hoursUntilDue) / 2.4);
    } else if (daysUntilDue <= 3) {
      urgencyScore = 80 - (daysUntilDue * 10);
    } else if (daysUntilDue <= 7) {
      urgencyScore = 60 - ((daysUntilDue - 3) * 5);
    } else if (daysUntilDue <= 14) {
      urgencyScore = 40 - ((daysUntilDue - 7) * 2);
    } else {
      urgencyScore = 20 - Math.min(20, (daysUntilDue - 14) / 5);
    }

    // Calculate importance based on:
    // - Original priority
    // - Estimated time (complex = more important)
    // - Subject (if it's a core subject, more important)
    let importanceScore = 50; // Base

    const priorityWeights = {
      'Urgent': 100,
      'High': 75,
      'Medium': 50,
      'Low': 25,
    };
    importanceScore += priorityWeights[task.priority as keyof typeof priorityWeights] / 2;

    // Complexity consideration
    const estimatedTime = task.estimatedTime || 30;
    if (estimatedTime >= 120) importanceScore += 15;
    else if (estimatedTime >= 60) importanceScore += 10;
    else if (estimatedTime >= 30) importanceScore += 5;

    // Subject priority (common core subjects)
    const coreSubjects = ['Math', 'English', 'Science', 'Physics', 'Chemistry', 'Biology'];
    if (coreSubjects.some(s => task.subject.toLowerCase().includes(s.toLowerCase()))) {
      importanceScore += 10;
    }

    // Overall score
    const combinedScore = (urgencyScore * 0.6) + (importanceScore * 0.4);

    // Determine suggested priority
    let suggestedPriority: Priority;
    if (combinedScore >= 85) {
      suggestedPriority = 'Urgent';
    } else if (combinedScore >= 65) {
      suggestedPriority = 'High';
    } else if (combinedScore >= 40) {
      suggestedPriority = 'Medium';
    } else {
      suggestedPriority = 'Low';
    }

    const reason = generatePriorityReason(task, daysUntilDue, urgencyScore, importanceScore, isOverdue);

    if (suggestedPriority !== task.priority) {
      priorities.push({
        taskId: task.id,
        suggestedPriority,
        currentPriority: task.priority,
        reason,
        urgencyScore: Math.round(urgencyScore),
        importanceScore: Math.round(importanceScore),
      });
    }
  });

  return priorities.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

function generatePriorityReason(
  task: Task,
  daysUntilDue: number,
  urgency: number,
  importance: number,
  isOverdue: boolean
): string {
  if (isOverdue) {
    return `🚨 Task is ${Math.abs(daysUntilDue)} days overdue. Should be URGENT.`;
  }
  if (daysUntilDue <= 1) {
    return `⏰ Due very soon. Recommend promoting to ${urgency > 80 ? 'URGENT' : 'HIGH'} priority.`;
  }
  if (importance > 75) {
    return `📊 Complex task (${task.estimatedTime} min estimated). Increase priority for better focus.`;
  }
  return `🎯 Balance score suggests ${urgency > 70 ? 'URGENT' : 'HIGH'} priority.`;
}

// ============ PRODUCTIVITY INSIGHTS ============

/**
 * Generate actionable productivity insights
 */
export function generateProductivityInsights(tasks: Task[]): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];
  const now = new Date();

  // Calculate metrics
  const completedTasks = tasks.filter(t => t.status === 'Done');
  const pendingTasks = tasks.filter(t => t.status === 'Todo');
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // 1. COMPLETION RATE INSIGHT
  if (completionRate > 80) {
    insights.push({
      type: 'achievement',
      title: '🌟 Excellent Progress!',
      message: `You've completed ${Math.round(completionRate)}% of your tasks. You're on a great trajectory!`,
      actionable: 'Keep this momentum going. Try to maintain or exceed this completion rate.',
      timestamp: new Date().toISOString(),
      priority: 'low',
    });
  } else if (completionRate < 30 && tasks.length > 5) {
    insights.push({
      type: 'warning',
      title: '⚠️ Low Completion Rate',
      message: `Only ${Math.round(completionRate)}% of tasks completed. Let's boost productivity!`,
      actionable: 'Focus on completing 2-3 high-priority tasks today to improve this metric.',
      timestamp: new Date().toISOString(),
      priority: 'high',
    });
  }

  // 2. OVERDUE TASKS WARNING
  const overdueTasks = pendingTasks.filter(t => differenceInDays(parseISO(t.dueDate), now) < 0);
  if (overdueTasks.length > 0) {
    insights.push({
      type: 'warning',
      title: '🚨 Overdue Tasks',
      message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Address these immediately!`,
      actionable: `Complete these tasks today: ${overdueTasks.map(t => t.title).join(', ')}`,
      timestamp: new Date().toISOString(),
      priority: 'high',
    });
  }

  // 3. SUBJECT BALANCE
  const subjectMap = new Map<string, { pending: number; completed: number }>();
  tasks.forEach(t => {
    const current = subjectMap.get(t.subject) || { pending: 0, completed: 0 };
    if (t.status === 'Done') current.completed++;
    else current.pending++;
    subjectMap.set(t.subject, current);
  });

  const imbalancedSubject = Array.from(subjectMap.entries()).find(
    ([_, counts]) => counts.pending > counts.completed * 2 && counts.pending > 3
  );

  if (imbalancedSubject) {
    insights.push({
      type: 'opportunity',
      title: `📚 ${imbalancedSubject[0]} Backlog`,
      message: `You have ${imbalancedSubject[1].pending} pending tasks in ${imbalancedSubject[0]}. Consider batch-processing them.`,
      actionable: `Schedule a focused session for ${imbalancedSubject[0]} to clear the backlog.`,
      timestamp: new Date().toISOString(),
      priority: 'medium',
    });
  }

  // 4. TIME ESTIMATION PATTERN
  const tasksWithEstimate = completedTasks.filter(t => t.estimatedTime);
  if (tasksWithEstimate.length >= 5) {
    const avgEstimate = tasksWithEstimate.reduce((sum, t) => sum + (t.estimatedTime || 0), 0) / tasksWithEstimate.length;
    insights.push({
      type: 'pattern',
      title: '⏱️ Average Task Duration',
      message: `Your typical task takes about ${Math.round(avgEstimate)} minutes. Use this for better planning.`,
      actionable: 'Plan your study sessions based on this average duration for better productivity.',
      timestamp: new Date().toISOString(),
      priority: 'low',
    });
  }

  // 5. DAILY COMPLETION INCENTIVE
  const completedToday = completedTasks.filter(t =>
    isToday(parseISO(t.completedAt || new Date().toISOString()))
  ).length;

  if (completedToday >= 5) {
    insights.push({
      type: 'achievement',
      title: '🔥 Amazing Daily Streak!',
      message: `You've completed ${completedToday} tasks today! You're crushing it!`,
      actionable: 'Reward yourself and maintain this momentum.',
      timestamp: new Date().toISOString(),
      priority: 'low',
    });
  }

  return insights;
}

// ============ PERFORMANCE METRICS ============

/**
 * Calculate comprehensive performance metrics
 */
export function calculatePerformanceMetrics(tasks: Task[]): PerformanceMetrics {
  const now = new Date();
  const completedTasks = tasks.filter(t => t.status === 'Done');
  const pendingTasks = tasks.filter(t => t.status === 'Todo');

  // Completion rate
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // Average completion time
  const tasksWithTime = completedTasks.filter(t => t.estimatedTime);
  const avgCompletionTime = tasksWithTime.length > 0
    ? tasksWithTime.reduce((sum, t) => sum + (t.estimatedTime || 0), 0) / tasksWithTime.length
    : 0;

  // This week / month
  const thisWeekTasks = tasks.filter(t => {
    const days = differenceInDays(parseISO(t.dueDate), now);
    return days <= 7 && days >= -7 && t.status === 'Done';
  }).length;

  const thisMonthTasks = tasks.filter(t => {
    const days = differenceInDays(parseISO(t.dueDate), now);
    return days <= 30 && days >= -30 && t.status === 'Done';
  }).length;

  // Most productive day
  const dayMap = new Map<string, number>();
  completedTasks.forEach(t => {
    const day = new Date(t.completedAt || now).toLocaleDateString('en-US', { weekday: 'long' });
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });

  const mostProductiveDay = dayMap.size > 0
    ? Array.from(dayMap.entries()).sort((a, b) => b[1] - a[1])[0][0]
    : 'Monday';

  // Average tasks per day
  const daysActive = Math.max(1, completedTasks.length > 0 ? 7 : 1); // Assume at least 7 days
  const avgTasksPerDay = completedTasks.length / daysActive;

  // Average priority
  const priorityWeights: Record<Priority, number> = {
    'Urgent': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1,
  };

  const avgPriorityValue = pendingTasks.length > 0
    ? pendingTasks.reduce((sum, t) => sum + priorityWeights[t.priority], 0) / pendingTasks.length
    : 2.5;

  const averagePriority: Priority = avgPriorityValue >= 3.5 ? 'Urgent' : avgPriorityValue >= 2.5 ? 'High' : avgPriorityValue >= 1.5 ? 'Medium' : 'Low';

  return {
    completionRate: Math.round(completionRate),
    averageCompletionTime: Math.round(avgCompletionTime),
    focusStreakDays: calculateFocusStreak(completedTasks),
    tasksCompletedThisWeek: thisWeekTasks,
    tasksCompletedThisMonth: thisMonthTasks,
    mostProductiveDay,
    mostProductiveHour: 14, // Default: 2 PM
    averagePriority,
    averageTasksPerDay: Math.round(avgTasksPerDay * 10) / 10,
  };
}

function calculateFocusStreak(completedTasks: Task[]): number {
  if (completedTasks.length === 0) return 0;

  const dates = completedTasks
    .map(t => new Date(t.completedAt || new Date()).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // Unique dates
    .map(d => new Date(d).getTime())
    .sort((a, b) => b - a);

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const dayDiff = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ============ TASK CATEGORIZATION ============

/**
 * AI-powered task categorization and tagging
 */
export function categorizeTasks(tasks: Task[]): Map<string, Task[]> {
  const categories = new Map<string, Task[]>();
  const now = new Date();

  const priorityCategories = {
    'Critical': tasks.filter(t => t.status === 'Todo' && (t.priority === 'Urgent' || isOverdueTask(parseISO(t.dueDate)))),
    'Urgent': tasks.filter(t => t.status === 'Todo' && t.priority === 'High' && differenceInDays(parseISO(t.dueDate), now) <= 7),
    'This Week': tasks.filter(t => t.status === 'Todo' && differenceInDays(parseISO(t.dueDate), now) <= 7),
    'Next Week': tasks.filter(t => t.status === 'Todo' && differenceInDays(parseISO(t.dueDate), now) > 7 && differenceInDays(parseISO(t.dueDate), now) <= 14),
    'Completed': tasks.filter(t => t.status === 'Done'),
  };

  Object.entries(priorityCategories).forEach(([key, value]) => {
    if (value.length > 0) {
      categories.set(key, value);
    }
  });

  return categories;
}

function isOverdueTask(date: Date): boolean {
  return date < new Date();
}
