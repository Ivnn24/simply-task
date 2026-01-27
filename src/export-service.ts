/**
 * Export and Report Generation Module
 * - PDF export
 * - CSV export
 * - Analytics reports
 */

import type { Task } from './store';
import { format, parseISO } from 'date-fns';

/**
 * Generate and download CSV export of tasks
 */
export function exportTasksToCSV(tasks: Task[], filename: string = 'tasks.csv'): void {
  const headers = ['Title', 'Subject', 'Priority', 'Status', 'Due Date', 'Created Date', 'Estimated Time (min)', 'Notes'];
  
  const rows = tasks.map(task => [
    `"${task.title.replace(/"/g, '""')}"`,
    `"${task.subject}"`,
    task.priority,
    task.status,
    format(parseISO(task.dueDate), 'yyyy-MM-dd HH:mm'),
    format(parseISO(task.createdAt), 'yyyy-MM-dd HH:mm'),
    task.estimatedTime || '',
    `"${(task.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Generate and download PDF report
 * Note: Using simple HTML to PDF conversion
 */
export function exportTasksToPDF(tasks: Task[], filename: string = 'tasks-report.pdf'): void {
  try {
    // Create HTML content
    const completedTasks = tasks.filter(t => t.status === 'Done');
    const pendingTasks = tasks.filter(t => t.status === 'Todo');
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Task Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            color: #333;
            background: white;
          }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; border-left: 4px solid #2563eb; padding-left: 10px; }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .stat-box {
            background: #f0f9ff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            border-radius: 5px;
          }
          .stat-number { font-size: 28px; font-weight: bold; color: #2563eb; }
          .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .priority-urgent { color: #dc2626; font-weight: bold; }
          .priority-high { color: #ea580c; font-weight: bold; }
          .priority-medium { color: #2563eb; }
          .priority-low { color: #059669; }
          .status-done { color: #059669; }
          .status-todo { color: #dc2626; }
          .page-break { page-break-after: always; }
          footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h1>📊 Task Master Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>

        <div class="summary">
          <div class="stat-box">
            <div class="stat-number">${tasks.length}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${completedTasks.length}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${pendingTasks.length}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${completionRate}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>

        <h2>✅ Completed Tasks (${completedTasks.length})</h2>
        ${completedTasks.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${completedTasks.map(task => `
                <tr>
                  <td>${task.title}</td>
                  <td>${task.subject}</td>
                  <td><span class="priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                  <td>${format(parseISO(task.dueDate), 'MMM dd, yyyy')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p>No completed tasks yet.</p>'}

        <div class="page-break"></div>

        <h2>⏳ Pending Tasks (${pendingTasks.length})</h2>
        ${pendingTasks.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${pendingTasks.map(task => `
                <tr>
                  <td>${task.title}</td>
                  <td>${task.subject}</td>
                  <td><span class="priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                  <td>${format(parseISO(task.dueDate), 'MMM dd, yyyy')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p>No pending tasks.</p>'}

        <footer>
          <p>Task Master © 2024 | Productivity Report</p>
        </footer>
      </body>
      </html>
    `;

    // Convert HTML to PDF using html2pdf library (fallback: trigger download as HTML)
    const element = document.createElement('div');
    element.innerHTML = html;

    // For now, trigger HTML download (can be replaced with actual PDF library like pdfkit)
    downloadFile(html, filename, 'text/html;charset=utf-8;');
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Error generating PDF. Please try CSV export instead.');
  }
}

/**
 * Generate analytics summary
 */
export function generateAnalyticsSummary(tasks: Task[]): string {
  const completedTasks = tasks.filter(t => t.status === 'Done');
  const pendingTasks = tasks.filter(t => t.status === 'Todo');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const subjectStats = new Map<string, { completed: number; pending: number }>();
  tasks.forEach(task => {
    const current = subjectStats.get(task.subject) || { completed: 0, pending: 0 };
    if (task.status === 'Done') current.completed++;
    else current.pending++;
    subjectStats.set(task.subject, current);
  });

  const avgTime = tasks.length > 0
    ? Math.round(tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0) / tasks.length)
    : 0;

  const priorityCounts = {
    Urgent: tasks.filter(t => t.priority === 'Urgent').length,
    High: tasks.filter(t => t.priority === 'High').length,
    Medium: tasks.filter(t => t.priority === 'Medium').length,
    Low: tasks.filter(t => t.priority === 'Low').length,
  };

  return `
=== TASK ANALYTICS SUMMARY ===

📊 OVERVIEW
Total Tasks: ${tasks.length}
Completed: ${completedTasks.length} (${completionRate}%)
Pending: ${pendingTasks.length}

🎯 PRIORITY DISTRIBUTION
Urgent: ${priorityCounts.Urgent}
High: ${priorityCounts.High}
Medium: ${priorityCounts.Medium}
Low: ${priorityCounts.Low}

📚 BY SUBJECT
${Array.from(subjectStats.entries()).map(([subject, stats]) => 
  `${subject}: ${stats.completed}✓ ${stats.pending}⏳`
).join('\n')}

⏱️ STATISTICS
Average Task Duration: ${avgTime} minutes
Generated: ${new Date().toLocaleString()}
  `;
}

/**
 * Helper function to download file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Import tasks from CSV
 */
export function importTasksFromCSV(file: File): Promise<Array<{ title: string; subject: string; priority: string; dueDate: string }>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n').slice(1); // Skip header
        const tasks = lines
          .filter(line => line.trim())
          .map(line => {
            const match = line.match(/"([^"]*)"|([^,]*)/g) || [];
            const values = match.map(m => m.replace(/^"|"$/g, ''));
            return {
              title: values[0] || 'Untitled',
              subject: values[1] || 'General',
              priority: (values[2] || 'Medium') as any,
              dueDate: new Date(values[4] || new Date()).toISOString(),
            };
          });
        resolve(tasks);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    reader.readAsText(file);
  });
}
