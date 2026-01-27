import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Download, CheckCircle, Sparkles, Zap, BookOpen, ChevronDown, ChevronUp,
  MessageCircle, CheckSquare, ThumbsUp
} from 'lucide-react';
import { useState } from 'react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  metadata?: any;
  sentiment?: any;
  qaData?: any;
  actionItems?: any;
}

export const SummaryModal = ({
  isOpen,
  onClose,
  summary,
  metadata,
  sentiment,
  qaData,
  actionItems,
}: SummaryModalProps) => {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'qa' | 'actions' | 'sentiment'>('summary');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-12 lg:inset-24 bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-black text-white">AI Summary</h2>
                  <p className="text-white/80 text-sm font-semibold">
                    {metadata ? `${metadata.title}` : 'Document Analysis'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 bg-slate-50 px-8 flex gap-0">
              {[
                { id: 'summary', label: 'Summary', icon: BookOpen, count: summary.split('\n').length },
                { id: 'qa', label: 'Q&A', icon: MessageCircle, count: qaData?.length || 0 },
                { id: 'actions', label: 'Actions', icon: CheckSquare, count: actionItems?.length || 0 },
                { id: 'sentiment', label: 'Sentiment', icon: ThumbsUp, count: 1 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`px-6 py-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
                    selectedTab === tab.id
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Summary Tab */}
              {selectedTab === 'summary' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {metadata && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border-2 border-purple-200/50">
                      <h3 className="font-bold text-lg text-purple-900 mb-2">{metadata.title}</h3>
                      <p className="text-sm text-purple-800 mb-3">{metadata.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs font-bold px-3 py-1 bg-white rounded-full border border-purple-200 text-purple-700">
                          {metadata.category}
                        </span>
                        <span className="text-xs font-bold px-3 py-1 bg-white rounded-full border border-blue-200 text-blue-700">
                          {metadata.difficulty}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {summary.split('\n').map((line, idx) => (
                      line.trim() && (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                        >
                          <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed text-slate-800 flex-grow">
                            {line.replace(/^[•\-\*]\s*/, '')}
                          </span>
                          <button
                            onClick={() => handleCopy(line, idx)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all flex-shrink-0 ${
                              copiedIndex === idx
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-600'
                            }`}
                          >
                            {copiedIndex === idx ? '✓' : <Copy className="w-3 h-3" />}
                          </button>
                        </motion.div>
                      )
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Q&A Tab */}
              {selectedTab === 'qa' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {qaData && qaData.length > 0 ? (
                    qaData.map((qa: any, idx: number) => (
                      <QACard key={idx} question={qa.question} answer={qa.answer} />
                    ))
                  ) : (
                    <div className="text-center py-12 opacity-50">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500">No Q&A data available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Actions Tab */}
              {selectedTab === 'actions' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {actionItems && actionItems.length > 0 ? (
                    actionItems.map((action: any, idx: number) => (
                      <ActionCard
                        key={idx}
                        action={action.action}
                        priority={action.priority}
                        onCopy={() => handleCopy(action.action, idx)}
                        isCopied={copiedIndex === idx}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 opacity-50">
                      <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500">No action items available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Sentiment Tab */}
              {selectedTab === 'sentiment' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {sentiment ? (
                    <>
                      <SentimentCard
                        sentiment={sentiment.sentiment}
                        tone={sentiment.tone}
                        confidence={sentiment.confidence}
                      />
                    </>
                  ) : (
                    <div className="text-center py-12 opacity-50">
                      <ThumbsUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500">No sentiment data available</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 flex gap-3 justify-end">
              <button
                onClick={() => handleCopy(summary)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <Copy className="w-4 h-4" />
                Copy All
              </button>
              <button
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([summary], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = `summary-${Date.now()}.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg font-semibold text-sm transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Helper Components
const QACard = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:bg-blue-50/50 transition-all"
      whileHover={{ y: -2 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-start justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex gap-3 flex-grow">
          <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <span className="font-semibold text-slate-800">{question}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-50 border-t border-slate-200 px-4 py-3"
        >
          <p className="text-sm text-slate-700 leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

const ActionCard = ({
  action,
  priority,
  onCopy,
  isCopied,
}: {
  action: string;
  priority: 'high' | 'medium' | 'low';
  onCopy: () => void;
  isCopied: boolean;
}) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <motion.div
      className="flex gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
      whileHover={{ y: -2 }}
    >
      <div className={`px-2 py-1 rounded text-xs font-bold border ${priorityColors[priority]} flex-shrink-0`}>
        {priority.toUpperCase()}
      </div>
      <span className="text-sm text-slate-800 flex-grow">{action}</span>
      <button
        onClick={onCopy}
        className={`px-3 py-1 rounded text-xs font-semibold transition-all flex-shrink-0 ${
          isCopied
            ? 'bg-green-100 text-green-700'
            : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600'
        }`}
      >
        {isCopied ? '✓' : <Copy className="w-3 h-3" />}
      </button>
    </motion.div>
  );
};

const SentimentCard = ({
  sentiment,
  tone,
  confidence,
}: {
  sentiment: string;
  tone: string;
  confidence: number;
}) => {
  const sentimentColorMap: Record<string, string> = {
    positive: 'from-green-500 to-emerald-500',
    negative: 'from-red-500 to-rose-500',
    neutral: 'from-slate-500 to-slate-600',
  };

  const sentimentColor = sentimentColorMap[sentiment.toLowerCase()] || 'from-slate-500 to-slate-600';

  return (
    <motion.div
      className={`bg-gradient-to-br ${sentimentColor} p-8 rounded-2xl text-white shadow-lg`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center">
          <ThumbsUp className="w-12 h-12 mx-auto mb-2 opacity-80" />
          <p className="text-sm opacity-80">Sentiment</p>
          <p className="text-2xl font-bold mt-1 capitalize">{sentiment}</p>
        </div>
        <div className="text-center border-l border-r border-white/30">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-80" />
          <p className="text-sm opacity-80">Tone</p>
          <p className="text-2xl font-bold mt-1 capitalize">{tone}</p>
        </div>
        <div className="text-center">
          <Zap className="w-12 h-12 mx-auto mb-2 opacity-80" />
          <p className="text-sm opacity-80">Confidence</p>
          <p className="text-2xl font-bold mt-1">{confidence}%</p>
        </div>
      </div>
      {/* Confidence Bar */}
      <div className="mt-6 bg-white/20 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-white/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </div>
    </motion.div>
  );
};
