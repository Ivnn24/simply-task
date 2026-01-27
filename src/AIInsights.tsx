/**
 * AI Insights & Recommendations Component
 * Displays smart recommendations, productivity insights, and performance metrics
 */

import { useState } from 'react';
import { useStore } from './store';
import {
  getTaskRecommendations,
  getSmartPriorities,
  generateProductivityInsights,
  calculatePerformanceMetrics,
} from './advanced-features';
import {
  Target,
  Zap,
  CheckCircle,
  Clock,
  Flame,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIInsightsProps {
  isDarkMode: boolean;
}

export function AIInsights({ isDarkMode }: AIInsightsProps) {
  const { tasks } = useStore();
  const [expandedSection, setExpandedSection] = useState<'recommendations' | 'insights' | 'metrics' | null>('recommendations');

  const recommendations = getTaskRecommendations(tasks);
  const smartPriorities = getSmartPriorities(tasks);
  const insights = generateProductivityInsights(tasks);
  const metrics = calculatePerformanceMetrics(tasks);

  const toggleSection = (section: 'recommendations' | 'insights' | 'metrics') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className={`space-y-4 p-6 rounded-2xl border ${isDarkMode ? 'bg-gradient-to-br from-indigo-950/50 via-slate-900/50 to-indigo-900/30 border-indigo-700/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>
      {/* SMART RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-indigo-700/40 bg-indigo-900/20' : 'border-blue-200 bg-white'}`}
        >
          <button
            onClick={() => toggleSection('recommendations')}
            className={`w-full p-4 flex items-center justify-between ${isDarkMode ? 'hover:bg-indigo-900/30' : 'hover:bg-blue-50'} transition-colors`}
          >
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="font-bold flex items-center gap-2">
                🎯 Smart Recommendations
                <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  {recommendations.length}
                </span>
              </span>
            </div>
            {expandedSection === 'recommendations' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {expandedSection === 'recommendations' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`border-t ${isDarkMode ? 'border-indigo-700/40' : 'border-blue-200'} divide-y ${isDarkMode ? 'divide-indigo-700/40' : 'divide-blue-200'}`}
              >
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-4 ${isDarkMode ? 'hover:bg-indigo-900/30' : 'hover:bg-blue-50'} transition-colors`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        rec.category === 'deadline' ? 'bg-red-500/20 text-red-400' :
                        rec.category === 'focus' ? 'bg-purple-500/20 text-purple-400' :
                        rec.category === 'streak' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {rec.confidence > 90 ? '🔥' : rec.confidence > 75 ? '⭐' : '💡'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-indigo-200/70' : 'text-blue-700/70'}`}>{rec.reason}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-medium opacity-60">Confidence: {rec.confidence}%</span>
                          <div className="w-24 h-1.5 bg-slate-400/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                              style={{ width: `${rec.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* PRODUCTIVITY INSIGHTS */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-amber-700/40 bg-amber-900/20' : 'border-amber-200 bg-amber-50/50'}`}
        >
          <button
            onClick={() => toggleSection('insights')}
            className={`w-full p-4 flex items-center justify-between ${isDarkMode ? 'hover:bg-amber-900/30' : 'hover:bg-amber-100/50'} transition-colors`}
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span className="font-bold flex items-center gap-2">
                💡 Productivity Insights
                <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-200 text-amber-800'}`}>
                  {insights.length}
                </span>
              </span>
            </div>
            {expandedSection === 'insights' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {expandedSection === 'insights' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`border-t ${isDarkMode ? 'border-amber-700/40' : 'border-amber-200'} divide-y ${isDarkMode ? 'divide-amber-700/40' : 'divide-amber-200'}`}
              >
                {insights.map((insight, idx) => (
                  <div key={idx} className={`p-4 ${isDarkMode ? 'hover:bg-amber-900/30' : 'hover:bg-amber-100/30'} transition-colors`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-2xl">
                        {insight.type === 'warning' && '⚠️'}
                        {insight.type === 'opportunity' && '💎'}
                        {insight.type === 'achievement' && '🏆'}
                        {insight.type === 'pattern' && '📊'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-amber-100/70' : 'text-amber-900/70'}`}>{insight.message}</p>
                        <p className={`text-xs mt-2 font-medium ${insight.priority === 'high' ? 'text-red-500' : insight.priority === 'medium' ? 'text-amber-500' : 'text-green-500'}`}>
                          💡 {insight.actionable}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* PERFORMANCE METRICS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-green-700/40 bg-green-900/20' : 'border-green-200 bg-green-50/50'}`}
      >
        <button
          onClick={() => toggleSection('metrics')}
          className={`w-full p-4 flex items-center justify-between ${isDarkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-100/50'} transition-colors`}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-green-500" />
            <span className="font-bold">📈 Performance Metrics</span>
          </div>
          {expandedSection === 'metrics' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        <AnimatePresence>
          {expandedSection === 'metrics' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`border-t ${isDarkMode ? 'border-green-700/40 p-4' : 'border-green-200 p-4'}`}
            >
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  icon={<CheckCircle className="w-5 h-5" />}
                  label="Completion Rate"
                  value={`${metrics.completionRate}%`}
                  color="blue"
                  isDarkMode={isDarkMode}
                />
                <MetricCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Avg Task Duration"
                  value={`${metrics.averageCompletionTime}m`}
                  color="purple"
                  isDarkMode={isDarkMode}
                />
                <MetricCard
                  icon={<Flame className="w-5 h-5" />}
                  label="Focus Streak"
                  value={`${metrics.focusStreakDays}d`}
                  color="orange"
                  isDarkMode={isDarkMode}
                />
                <MetricCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="This Week"
                  value={`${metrics.tasksCompletedThisWeek} tasks`}
                  color="green"
                  isDarkMode={isDarkMode}
                />
              </div>
              <div className={`mt-4 p-3 rounded-lg text-sm ${isDarkMode ? 'bg-slate-900/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <p>Most Productive Day: <strong>{metrics.mostProductiveDay}</strong></p>
                <p>Average Tasks/Day: <strong>{metrics.averageTasksPerDay}</strong></p>
                <p>Focus Priority: <strong>{metrics.averagePriority}</strong></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* SMART PRIORITY SUGGESTIONS */}
      {smartPriorities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-rose-700/40 bg-rose-900/20' : 'border-rose-200 bg-rose-50/50'} p-4`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-rose-500" />
            <span className="font-bold">⚡ Priority Adjustments</span>
          </div>
          <div className="space-y-2">
            {smartPriorities.slice(0, 3).map((priority, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${isDarkMode ? 'bg-rose-900/30' : 'bg-rose-100/50'}`}>
                <p className="text-sm font-medium">{priority.reason}</p>
                <p className="text-xs mt-1 opacity-70">
                  {priority.currentPriority} → <strong>{priority.suggestedPriority}</strong>
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============ METRIC CARD COMPONENT ============

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'orange' | 'green';
  isDarkMode: boolean;
}

function MetricCard({ icon, label, value, color, isDarkMode }: MetricCardProps) {
  const colors = {
    blue: isDarkMode ? 'bg-blue-900/30 text-blue-400 border-blue-700/30' : 'bg-blue-100 text-blue-700 border-blue-200',
    purple: isDarkMode ? 'bg-purple-900/30 text-purple-400 border-purple-700/30' : 'bg-purple-100 text-purple-700 border-purple-200',
    orange: isDarkMode ? 'bg-orange-900/30 text-orange-400 border-orange-700/30' : 'bg-orange-100 text-orange-700 border-orange-200',
    green: isDarkMode ? 'bg-green-900/30 text-green-400 border-green-700/30' : 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
