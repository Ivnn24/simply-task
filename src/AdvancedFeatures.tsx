import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Tag, CheckSquare2, Timer, Archive, Plus } from 'lucide-react';
import { useStore } from './store';
import type { Task } from './store';
import { getSubtaskProgress, formatTimeSpent } from './featureUtils';

// Tag Selector Component
export const TagSelector: React.FC<{
  isDarkMode: boolean;
  task: Task;
  onClose: () => void;
}> = ({ isDarkMode, task, onClose }) => {
  const { tags, addTag, addTagToTask, removeTagFromTask } = useStore();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const tagId = addTag(newTagName, newTagColor);
      addTagToTask(task.id, tagId);
      setNewTagName('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`absolute top-12 right-0 w-80 p-4 rounded-lg shadow-lg z-50 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold flex items-center gap-2">
          <Tag className="w-4 h-4" /> Tags
        </span>
        <button onClick={onClose} className="hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Existing Tags */}
      <div className="mb-4 flex flex-wrap gap-2">
        {task.tags?.map((tagId) => {
          const tag = tags.find((t) => t.id === tagId);
          return tag ? (
            <button
              key={tagId}
              onClick={() => removeTagFromTask(task.id, tagId)}
              className="px-3 py-1 rounded-full text-sm text-white flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <X className="w-3 h-3" />
            </button>
          ) : null;
        })}
      </div>

      {/* Add New Tag */}
      <div className="space-y-2 border-t pt-3">
        <input
          type="text"
          placeholder="New tag name"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg text-sm border ${
            isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-300'
          }`}
        />

        <div className="flex gap-1 flex-wrap">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setNewTagColor(color)}
              className={`w-6 h-6 rounded-full transition-all ${newTagColor === color ? 'ring-2 ring-offset-2' : ''}`}
              style={{
                backgroundColor: color,
              }}
            />
          ))}
        </div>

        <button
          onClick={handleAddTag}
          className="w-full py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Tag
        </button>
      </div>
    </motion.div>
  );
};

// Subtasks Component
export const SubtasksPanel: React.FC<{
  isDarkMode: boolean;
  task: Task;
}> = ({ isDarkMode, task }) => {
  const { addSubtask, toggleSubtask, deleteSubtask } = useStore();
  const [newSubtask, setNewSubtask] = useState('');
  const progress = getSubtaskProgress(task.subtasks);

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      addSubtask(task.id, newSubtask);
      setNewSubtask('');
    }
  };

  return (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-indigo-900/20 border border-indigo-700/30' : 'bg-blue-50 border border-blue-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold flex items-center gap-2">
          <CheckSquare2 className="w-4 h-4" /> Subtasks
        </span>
        {task.subtasks && task.subtasks.length > 0 && (
          <span className="text-xs font-bold opacity-70">
            {progress.completed}/{progress.total}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mb-3 h-2 bg-slate-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}

      {/* Subtask List */}
      <div className="space-y-2 mb-3">
        {task.subtasks?.map((subtask) => (
          <div
            key={subtask.id}
            className={`flex items-center gap-2 p-2 rounded-lg ${
              isDarkMode ? 'bg-slate-700/30' : 'bg-white'
            }`}
          >
            <button
              onClick={() => toggleSubtask(task.id, subtask.id)}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                subtask.completed
                  ? 'bg-green-500 border-green-500'
                  : isDarkMode
                    ? 'border-slate-600'
                    : 'border-slate-300'
              }`}
            >
              {subtask.completed && <CheckSquare2 className="w-3 h-3 text-white" />}
            </button>
            <span
              className={`flex-1 text-sm ${subtask.completed ? 'line-through opacity-50' : ''}`}
            >
              {subtask.title}
            </span>
            <button
              onClick={() => deleteSubtask(task.id, subtask.id)}
              className="text-red-500 hover:opacity-70 text-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Subtask */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add subtask..."
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
          className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
            isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-300'
          }`}
        />
        <button
          onClick={handleAddSubtask}
          className="px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Time Tracker Component
export const TimeTracker: React.FC<{
  isDarkMode: boolean;
  task: Task;
}> = ({ isDarkMode, task }) => {
  const { startTimer, stopTimer, addTimeEntry } = useStore();
  const [manualMinutes, setManualMinutes] = useState('');

  const isRunning = !!task.startedAt;
  const totalTime = task.totalTimeSpent || 0;

  return (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-indigo-900/20 border border-indigo-700/30' : 'bg-purple-50 border border-purple-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold flex items-center gap-2">
          <Timer className="w-4 h-4" /> Time Tracking
        </span>
        <span className="text-lg font-bold text-blue-600">{formatTimeSpent(totalTime)}</span>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => (isRunning ? stopTimer(task.id) : startTimer(task.id))}
          className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-all ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Minutes"
          value={manualMinutes}
          onChange={(e) => setManualMinutes(e.target.value)}
          className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
            isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-300'
          }`}
        />
        <button
          onClick={() => {
            if (manualMinutes) {
              addTimeEntry(task.id, parseInt(manualMinutes));
              setManualMinutes('');
            }
          }}
          className="px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
};

// Archive Component
export const ArchivePanel: React.FC<{
  isDarkMode: boolean;
  onArchive: () => void;
}> = ({ isDarkMode, onArchive }) => {
  return (
    <button
      onClick={onArchive}
      className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
        isDarkMode
          ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
      }`}
    >
      <Archive className="w-4 h-4" /> Archive Task
    </button>
  );
};
