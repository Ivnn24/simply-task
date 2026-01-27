import { useState, useMemo, useEffect } from 'react';
import { useStore } from './store';
import type { Task, Priority, TaskFile } from './store';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInCalendarDays, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  CheckCircle2, Trash2, Calendar, Flame, Plus, BookOpen,
  Clock, TrendingUp, BarChart3, Focus,
  AlertTriangle, Zap, X, Check, Upload, FileText, File, Presentation, BarChart3 as BarChart3Icon, Copy, Sparkles, Loader,
  Search, Download, ChevronUp, ChevronDown, Info, CheckCircle, ListChecks, Eye, Brain
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis } from 'recharts';
import { nanoid } from 'nanoid';
import JSZip from 'jszip';
import { generateGeminiSummary, isGeminiConfigured, analyzeSentiment, generateQA, generateActionItems, generateTitleAndDescription } from './ai-service';
import { SummaryModal } from './SummaryModal';

// ============ UTILS & CONFIG ============

// Enhanced AI Summarization Utility with Gemini fallback
const generateSummary = (text: string): string => {
  if (!text || text.length === 0) return '';
  
  // Clean and normalize text - preserve structure
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/\t/g, ' ')
    .trim();
  
  // Split into sentences with better segmentation
  const sentencePattern = /(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s+(?=Slide)/g;
  let sentences = cleanText.split(sentencePattern)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 500); // Filter too short/long sentences
  
  if (sentences.length === 0) return text.substring(0, 200);
  
  // Enhanced keywords with context-based categories and semantic depth
  const keywordCategories = {
    critical: ['must', 'critical', 'important', 'required', 'essential', 'necessary', 'significant', 'urgent', 'crucial', 'vital', 'mandatory', 'mandatory', 'demanding', 'imperative', 'pressing'],
    data: ['data', 'evidence', 'research', 'study', 'analysis', 'findings', 'result', 'conclusion', 'statistic', 'metric', 'information', 'insight', 'discovery', 'observation', 'measurement', 'benchmark', 'figure', 'value', 'number'],
    action: ['demonstrates', 'shows', 'proves', 'indicates', 'reveals', 'suggests', 'highlights', 'presents', 'exhibits', 'illustrates', 'displays', 'manifests', 'signifies', 'underscores', 'exemplifies', 'validates', 'confirms', 'establishes'],
    definition: ['is', 'are', 'defined', 'means', 'refers', 'called', 'known', 'termed', 'designated', 'constitutes', 'represents', 'symbolizes', 'embodies', 'characterizes', 'describes', 'denotes'],
    process: ['process', 'procedure', 'method', 'technique', 'approach', 'system', 'framework', 'strategy', 'workflow', 'algorithm', 'mechanism', 'implementation', 'execution', 'application', 'protocol', 'methodology', 'sequence', 'step', 'phase', 'stage'],
    concept: ['concept', 'theory', 'principle', 'idea', 'philosophy', 'framework', 'model', 'pattern', 'paradigm', 'notion', 'doctrine', 'hypothesis', 'thesis', 'schema', 'structure', 'architecture'],
    impact: ['impact', 'effect', 'result', 'consequence', 'benefit', 'advantage', 'disadvantage', 'challenge', 'outcome', 'implication', 'repercussion', 'influence', 'bearing', 'significance', 'relevance', 'worth'],
    qualitative: ['quality', 'excellent', 'superior', 'inferior', 'better', 'worse', 'effective', 'ineffective', 'successful', 'successful', 'optimal', 'suboptimal', 'robust', 'fragile', 'reliable', 'unreliable'],
    quantitative: ['increase', 'decrease', 'expand', 'reduce', 'grow', 'shrink', 'scale', 'multiply', 'divide', 'percentage', 'proportion', 'ratio', 'average', 'median', 'total', 'aggregate'],
    semantic: ['important', 'key', 'main', 'core', 'primary', 'secondary', 'central', 'peripheral', 'major', 'minor', 'substantial', 'trivial', 'considerable', 'negligible', 'noteworthy'],
  };
  
  // Detect document type and context
  const textLower = cleanText.toLowerCase();
  const isAcademic = /abstract|introduction|methodology|conclusion|reference|citation/i.test(textLower);
  const isLegal = /clause|contract|agreement|party|hereby|whereas|liability/i.test(textLower);
  const isTechnical = /algorithm|function|parameter|variable|implementation|code|error|bug|fix/i.test(textLower);
  const isPresentation = /slide \d+:|presentation|agenda|objective|summary/i.test(textLower);
  
  // Score sentences with advanced factors
  const scoredSentences = sentences.map((sentence, index) => {
    const trimmed = sentence.trim();
    const wordsArray = trimmed.split(/\s+/);
    const wordCount = wordsArray.length;
    const sentenceLower = trimmed.toLowerCase();
    
    let score = 0;
    
    // === POSITION-BASED SCORING ===
    if (index === 0) score += 30; // First sentence/intro is critical
    if (index === sentences.length - 1) score += 25; // Last sentence/conclusion
    if (index <= 2) score += 15; // Early context
    if (index >= sentences.length - 3) score += 10; // Closing context
    
    // === LENGTH OPTIMIZATION ===
    // Ideal length: 12-25 words (substantive without being verbose)
    if (wordCount >= 12 && wordCount <= 25) score += 18;
    else if (wordCount >= 10 && wordCount <= 30) score += 12;
    else if (wordCount >= 8 && wordCount <= 35) score += 8;
    else if (wordCount > 45) score -= 10; // Too verbose
    else if (wordCount < 8) score -= 5; // Too short
    
    // === ADVANCED KEYWORD CATEGORY SCORING ===
    for (const [category, keywords] of Object.entries(keywordCategories)) {
      const matchCount = keywords.filter(kw => sentenceLower.includes(kw)).length;
      if (matchCount > 0) {
        if (category === 'critical') score += matchCount * 14;
        else if (category === 'data') score += matchCount * 11;
        else if (category === 'action') score += matchCount * 10;
        else if (category === 'impact') score += matchCount * 10;
        else if (category === 'definition') score += matchCount * 9;
        else if (category === 'process') score += matchCount * 8;
        else if (category === 'concept') score += matchCount * 8;
        else if (category === 'qualitative') score += matchCount * 6;
        else if (category === 'quantitative') score += matchCount * 9;
        else if (category === 'semantic') score += matchCount * 7;
      }
    }
    
    // === SENTENCE IMPORTANCE RANKING (TF-IDF-like scoring) ===
    const sentenceWordFreq = new Map<string, number>();
    wordsArray.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length > 2) {
        sentenceWordFreq.set(clean, (sentenceWordFreq.get(clean) || 0) + 1);
      }
    });
    const importantWordCount = Array.from(sentenceWordFreq.values()).filter(freq => freq === 1).length;
    score += Math.min(importantWordCount / 2, 5); // Bonus for unique words
    
    // === SEMANTIC COMPLEXITY ANALYSIS ===
    const hasSubordinate = /\b(which|that|where|because|although|if|unless|while|whenever|since)\b/i.test(trimmed);
    if (hasSubordinate) score += 6; // Complex sentences are often more informative
    
    // === NUMERICAL DATA DENSITY ===
    const numbers = trimmed.match(/\d+(?:\.\d+)?(?:\s*(?:%|million|billion|thousand|years?|months?|days?|hours?|minutes?|seconds?|dollars?|pounds?|euros?|etc))?/gi) || [];
    const hasStats = /statistic|percent|average|total|sum|number|count|rate|ratio|proportion|metric|benchmark|performance/i.test(sentenceLower);
    score += Math.min(numbers.length * 9, 25);
    if (hasStats) score += 8;
    
    // === ADVANCED TRANSITION QUALITY ===
    const transitionWords = /^(however|moreover|furthermore|therefore|thus|consequently|meanwhile|additionally|specifically|particularly|notably|importantly|essentially|ultimately|initially|finally|clearly|obviously|significantly|notably|remarkably|interestingly|surprisingly|unfortunately|fortunately)/i;
    const isConnective = transitionWords.test(trimmed);
    if (isConnective) score += 10;
    
    // === CAUSAL RELATIONSHIP DETECTION ===
    const hasCausal = /\b(cause|effect|result|lead to|result in|cause by|due to|because of|as a result|consequently)\b/i.test(trimmed);
    if (hasCausal) score += 8;
    
    // === INFORMATION DENSITY WITH WORD FREQUENCY ANALYSIS ===
    const unique = new Set(wordsArray.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')));
    const diversity = unique.size / wordCount;
    if (diversity > 0.75) score += 12;
    else if (diversity > 0.65) score += 8;
    else if (diversity > 0.55) score += 4;
    
    // === QUOTED/CITED INFORMATION ===
    const hasQuote = /["'].*["']|cited|quoted|according to|states that|claims that|research shows|study found/i.test(trimmed);
    if (hasQuote) score += 8;
    
    // === EXPERT MENTION & AUTHORITY ===
    const hasExpert = /\b(professor|doctor|researcher|expert|scholar|scientist|analyst|specialist|engineer|architect|authority)\b/i.test(trimmed);
    if (hasExpert) score += 6;
    
    // === CONTEXT-BASED ADJUSTMENTS (ADVANCED) ===
    if (isAcademic && /abstract|conclusion|findings|methodology|hypothesis|result|significant|p\s*=|correlation|regression|statistical/i.test(sentenceLower)) score += 10;
    if (isLegal && /clause|agreement|liable|responsible|party|hereby|whereas|shall|must|prohibited|violation|penalty/i.test(sentenceLower)) score += 10;
    if (isTechnical && /algorithm|function|implementation|code|variable|parameter|database|API|system|architecture|optimization|performance|efficiency/i.test(sentenceLower)) score += 10;
    if (isPresentation && /slide|objective|summary|key point|conclusion|recommendation|action item|next step/i.test(sentenceLower)) score += 10;
    
    // === PROBLEM-SOLUTION DETECTION ===
    const hasProblem = /\b(problem|issue|challenge|difficulty|obstacle|barrier|limitation|constraint|drawback|weakness|deficiency)\b/i.test(trimmed);
    const hasSolution = /\b(solution|fix|resolve|address|solve|improve|enhance|mitigate|overcome|remedy|approach)\b/i.test(trimmed);
    if (hasProblem) score += 7;
    if (hasSolution) score += 8;
    if (hasProblem && hasSolution) score += 5; // Bonus for problem-solution pairs
    
    // === QUESTION HANDLING (ADVANCED) ===
    if (trimmed.endsWith('?')) score += 8; // Questions often signal important inquiries
    
    // === STRUCTURE QUALITY ===
    const hasCommas = (trimmed.match(/,/g) || []).length;
    const hasSemicolons = (trimmed.match(/;/g) || []).length;
    if (hasCommas >= 3 || hasSemicolons >= 1) score += 6; // Very complex structure
    else if (hasCommas >= 2) score += 4;
    
    // === SENTENCE COHERENCE & FLOW ===
    const consecutiveConsonants = (trimmed.match(/[bcdfghjklmnpqrstvwxyz]{3,}/gi) || []).length;
    const flow = (trimmed.match(/[aeiou]{2,}/gi) || []).length;
    if (flow > consecutiveConsonants) score += 2; // Better flow
    
    // === NEGATION HANDLING ===
    const hasNegation = /\b(not|no|never|neither|nor|cannot|not able|unable|don't|doesn't|didn't|won't|wouldn't|shouldn't|can't|couldn't|shan't)\b/i.test(trimmed);
    if (hasNegation) score += 4; // Negations often carry important information
    
    // === NEGATIVE SCORING (ADVANCED) ===
    const fluffPhrases = /\b(basically|really|just|kind of|sort of|like|actually|literally|very|quite|somewhat|pretty|obviously|clearly|actually|honestly|frankly|personally|arguably|essentially)\b/gi;
    const fluffCount = (sentenceLower.match(fluffPhrases) || []).length;
    score -= fluffCount * 5;
    
    const weakeningPhrases = /\b(might|may|could|perhaps|possibly|apparently|allegedly|supposedly|seems|appears|looks like)\b/gi;
    const weakeningCount = (sentenceLower.match(weakeningPhrases) || []).length;
    score -= weakeningCount * 2;
    
    // Penalize pure filler sentences
    if (/^(and|but|or|the|a|an|this|that|these|those|such|some|any|so|very)\s+/i.test(trimmed)) score -= 6;
    
    // === REPETITION PENALTY (within the same paragraph) ===
    const hasHighRepetition = /\b(\w+)\b.*\b\1\b/i.test(trimmed);
    if (hasHighRepetition) score -= 3;
    
    return {
      sentence: trimmed,
      score: Math.max(0, score), // Ensure non-negative
      index,
      wordCount,
      category: Object.keys(keywordCategories).find(cat => 
        keywordCategories[cat as keyof typeof keywordCategories].some(kw => sentenceLower.includes(kw))
      ) || 'general'
    };
  });
  
  // === INTELLIGENT FILTERING ===
  // Keep sentences with balanced scoring
  const validSentences = scoredSentences
    .filter(s => s.score > 5) // Lower threshold to capture more content
    .sort((a, b) => b.score - a.score);
  
  if (validSentences.length === 0) {
    return sentences[0]?.trim() || '';
  }
  
  // === SMART SELECTION ALGORITHM ===
  // Select comprehensive summaries to capture ALL important content (60% selection rate minimum)
  const targetCount = Math.max(
    5,
    Math.min(20, Math.ceil(validSentences.length * 0.60)) // Max 20 points, 60% selection rate for maximum comprehensive coverage
  );
  
  // Diversify by avoiding same categories
  const selected = new Set<number>();
  const categoryCount = new Map<string, number>();
  
  validSentences.forEach(sent => {
    if (selected.size >= targetCount) return;
    
    const catCount = categoryCount.get(sent.category) || 0;
    // Allow max 40% from one category
    if (catCount < Math.ceil(targetCount * 0.4)) {
      selected.add(sent.index);
      categoryCount.set(sent.category, catCount + 1);
    }
  });
  
  // If we didn't get enough, add remaining high-scoring sentences
  validSentences.forEach(sent => {
    if (selected.size >= targetCount) return;
    if (!selected.has(sent.index)) {
      selected.add(sent.index);
    }
  });
  
  const selectedIndices = Array.from(selected).sort((a, b) => a - b);
  let selectedSentences = selectedIndices.map(idx => scoredSentences[idx]);
  
  // === MERGE RELATED SENTENCES FOR RICHER CONTENT ===
  // Combine adjacent/related sentences to create more comprehensive summary points
  const mergedSentences = [];
  let currentGroup = [selectedSentences[0]];
  
  for (let i = 1; i < selectedSentences.length; i++) {
    const prev = selectedSentences[i - 1];
    const curr = selectedSentences[i];
    
    // Merge if sentences are very close (within 2 indices) and same/related category
    if ((curr.index - prev.index) <= 2 && 
        (curr.category === prev.category || 
         prev.category === 'general' || 
         curr.category === 'general' ||
         ['data', 'analysis', 'research'].some(cat => curr.category === cat && prev.category === cat))) {
      currentGroup.push(curr);
    } else {
      // Finalize group
      if (currentGroup.length > 0) {
        const sentenceText = currentGroup.length === 1 
          ? currentGroup[0].sentence 
          : currentGroup.map(s => s.sentence).join(' ');
        
        mergedSentences.push({
          sentence: sentenceText,
          score: currentGroup.reduce((a, b) => a + b.score, 0),
          index: currentGroup[0].index,
          wordCount: currentGroup.reduce((a, b) => a + b.wordCount, 0),
          category: currentGroup[0].category
        });
      }
      currentGroup = [curr];
    }
  }
  
  // Add last group
  if (currentGroup.length > 0) {
    const sentenceText = currentGroup.length === 1 
      ? currentGroup[0].sentence 
      : currentGroup.map(s => s.sentence).join(' ');
    
    mergedSentences.push({
      sentence: sentenceText,
      score: currentGroup.reduce((a, b) => a + b.score, 0),
      index: currentGroup[0].index,
      wordCount: currentGroup.reduce((a, b) => a + b.wordCount, 0),
      category: currentGroup[0].category
    });
  }
  
  selectedSentences = mergedSentences.length > 0 ? mergedSentences : selectedSentences;
  
  // === FORMAT & HIGHLIGHT ===
  const boldKeywords = ['plagiarism', 'ownership', 'creative commons', 'intellectual property', 'trademark', 'patent', 'fair use', 'license', 'attribution', 'data', 'analysis', 'research', 'study', 'findings', 'conclusion', 'evidence', 'important', 'critical', 'significant', 'key', 'result', 'impact', 'benefit', 'challenge', 'solution', 'essential', 'required', 'method', 'principle', 'concept', 'algorithm', 'process', 'system', 'framework', 'strategy', 'approach', 'technique', 'implementation', 'development', 'testing', 'validation', 'performance', 'efficiency', 'quality', 'standard', 'requirement', 'specification', 'objective', 'goal', 'purpose', 'example', 'case', 'scenario', 'factor', 'variable', 'parameter', 'advantage', 'disadvantage', 'opportunity', 'risk', 'threat', 'strength', 'weakness', 'conclusion', 'summary', 'recommendation', 'suggestion', 'insight', 'observation', 'note', 'important', 'critical', 'essential', 'must', 'should', 'required', 'necessary', 'implement', 'execute', 'deploy', 'integrate', 'optimize', 'improve', 'enhance', 'strengthen', 'support', 'demonstrate', 'confirm', 'verify', 'validate', 'achieve', 'accomplish', 'complete', 'success', 'failure', 'error', 'issue', 'problem', 'concern', 'risk', 'mitigation', 'strategy', 'plan', 'schedule', 'timeline', 'budget', 'resource', 'team', 'stakeholder', 'client', 'customer', 'user', 'requirement', 'specification', 'design', 'architecture', 'interface', 'component', 'module', 'function', 'feature', 'capability', 'functionality'];

  
  const bulletPoints = selectedSentences.map(s => {
    let sentence = s.sentence.trim();
    
    // Bold important keywords intelligently
    boldKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      sentence = sentence.replace(regex, `**${keyword}**`);
    });
    
    return `• ${sentence}`;
  });
  
  const summary = bulletPoints.join('\n\n');
  return summary;
};

// Enhanced Priority Config with Gradients
const priorityConfig: Record<Priority, { bg: string; border: string; text: string; icon: React.ReactNode; ring: string }> = {
  Urgent: { 
    bg: 'bg-red-50', 
    border: 'border-red-200',
    text: 'text-red-700',
    ring: 'focus:ring-red-500',
    icon: <AlertTriangle className="w-3.5 h-3.5" />
  },
  High: { 
    bg: 'bg-orange-50', 
    border: 'border-orange-200',
    text: 'text-orange-700',
    ring: 'focus:ring-orange-500',
    icon: <Zap className="w-3.5 h-3.5" />
  },
  Medium: { 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    ring: 'focus:ring-yellow-500',
    icon: <Clock className="w-3.5 h-3.5" />
  },
  Low: { 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    ring: 'focus:ring-emerald-500',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />
  }
};

// Deterministic color generator for subjects
const getSubjectColor = (subject: string) => {
  const colors = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },
    { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-500' },
    { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', accent: 'bg-fuchsia-500' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', accent: 'bg-cyan-500' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-500' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', accent: 'bg-indigo-500' }
  ];
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// ============ SMART TASK CREATION FORM ============
export const TaskForm = ({ onClose }: { onClose?: () => void }) => {
  const { addTask, tasks } = useStore();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('30');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [isExpanded, setIsExpanded] = useState(false);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [summary, setSummary] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isExpandedSummary, setIsExpandedSummary] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [qaData, setQAData] = useState<any>(null);
  const [actionItems, setActionItems] = useState<any>(null);
  const [documentMetadata, setDocumentMetadata] = useState<any>(null);

  const handleDrag = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const fileList = e.dataTransfer.files;
    if (fileList && fileList.length > 0) {
      // Create a synthetic event to reuse handleFileUpload
      const event = {
        target: { files: fileList }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(event);
    }
  };

  // Get unique subjects for auto-suggestions
  const existingSubjects = useMemo(() => 
    [...new Set(tasks.map(t => t.subject))].slice(0, 4), 
  [tasks]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    setIsLoadingFiles(true);
    setSummaryProgress(10);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          setSummaryProgress(Math.min(50 + (i / fileList.length) * 40, 85));
          let content = '';

          if (fileType === 'txt') {
            content = e.target?.result as string;
          } else if (fileType === 'pdf') {
            // Extract text from PDF
            const pdfText = await extractPdfText(e.target?.result as ArrayBuffer);
            content = pdfText || `PDF file: ${file.name}`;
          } else if (fileType === 'docx' || fileType === 'doc') {
            // Extract text from DOCX/DOC
            content = await extractDocxText(e.target?.result as ArrayBuffer);
          } else if (fileType === 'pptx' || fileType === 'ppt') {
            // Extract text from PPTX/PPT
            content = await extractPptText(e.target?.result as ArrayBuffer);
          } else if (fileType === 'xlsx' || fileType === 'xls') {
            content = `Spreadsheet file: ${file.name} (Content extraction for Excel coming soon)`;
          } else {
            content = `File: ${file.name} (Type: ${fileType})`;
          }

          const newFile: TaskFile = {
            id: nanoid(),
            name: file.name,
            type: fileType,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            content: content
          };

          setFiles(prev => {
            const updated = [...prev, newFile];
            // Combine content from all files for summary
            const allContent = updated.map(f => f.content).join('\n\n');
            if (allContent.trim().length > 50) {
              setSummaryProgress(15);
              setIsGeneratingSummary(true);
              
              // GEMINI API IS PRIMARY (not fallback)
              if (isGeminiConfigured() && allContent.length < 30000) {
                generateGeminiSummary(allContent).then(async (geminiSummary) => {
                  if (geminiSummary) {
                    setSummaryProgress(50);
                    setSummary(geminiSummary);
                    
                    // Load additional analysis in background
                    try {
                      const sentiment = await analyzeSentiment(allContent);
                      if (sentiment) setSentimentData(sentiment);
                      setSummaryProgress(65);
                      
                      const qa = await generateQA(allContent);
                      if (qa) setQAData(qa);
                      setSummaryProgress(80);
                      
                      const actions = await generateActionItems(allContent);
                      if (actions) setActionItems(actions);
                      setSummaryProgress(95);

                      const metadata = await generateTitleAndDescription(allContent);
                      if (metadata) setDocumentMetadata(metadata);
                    } catch (e) {
                      console.error('Error loading additional analysis:', e);
                    }
                  } else {
                    // Fallback to local algorithm
                    const generatedSummary = generateSummary(allContent);
                    setSummary(generatedSummary);
                  }
                  setIsGeneratingSummary(false);
                  setSummaryProgress(100);
                }).catch((error) => {
                  // Fallback to local algorithm on error
                  console.error('Gemini error, using local:', error);
                  const generatedSummary = generateSummary(allContent);
                  setSummary(generatedSummary);
                  setIsGeneratingSummary(false);
                  setSummaryProgress(100);
                });
              } else {
                // Use local algorithm when Gemini not configured
                const generatedSummary = generateSummary(allContent);
                setSummary(generatedSummary);
                setIsGeneratingSummary(false);
                setSummaryProgress(100);
              }
              
              // Don't auto-populate notes - let user decide
              // Only set if completely empty initially
            }
            
            return updated;
          });
        } catch (error) {
          console.error('Error reading file:', error);
          setSummaryProgress(0);
        }
      };

      if (fileType === 'pdf' || fileType === 'docx' || fileType === 'doc' || fileType === 'pptx' || fileType === 'ppt' || fileType === 'xlsx' || fileType === 'xls') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }

    setIsLoadingFiles(false);
    setSummaryProgress(0);
    event.target.value = ''; // Reset input
  };

  const extractDocxText = async (buffer: ArrayBuffer): Promise<string> => {
    // Proper DOCX extraction using JSZip with robust text parsing
    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(buffer);
      
      // Get document.xml which contains the actual text
      const docXml = zipData.file('word/document.xml');
      if (!docXml) return 'Document content extracted';
      
      const xmlContent = await docXml.async('text');
      
      // Extract all text runs <w:t> first (more reliable than paragraph matching)
      const textRuns: string[] = [];
      const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let match;
      while ((match = textRegex.exec(xmlContent)) !== null) {
        if (match[1] && match[1].trim()) {
          textRuns.push(match[1].trim());
        }
      }
      
      // If we got text runs, join them
      if (textRuns.length > 0) {
        // Try to split into paragraphs based on <w:p> boundaries for better spacing
        const paragraphs: string[] = [];
        
        // Split by paragraph tags to maintain structure
        const paraSections = xmlContent.split(/<w:p>/);
        
        for (let i = 1; i < paraSections.length; i++) {
          const paraSection = paraSections[i];
          const paraEndIndex = paraSection.indexOf('</w:p>');
          if (paraEndIndex > -1) {
            const paraPart = paraSection.substring(0, paraEndIndex);
            // Extract text from this paragraph
            const paraTextMatches = paraPart.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
            const paraText = paraTextMatches
              .map(m => m.replace(/<[^>]*>/g, ''))
              .join('')
              .trim();
            
            if (paraText.length > 0) {
              paragraphs.push(paraText);
            }
          }
        }
        
        // Return paragraphs with proper spacing, or fallback to joined text runs
        const result = paragraphs.length > 0 
          ? paragraphs.join('\n\n')
          : textRuns.join(' ');
        
        return result.trim() || 'Document content extracted';
      }
      
      return 'Document content extracted';
    } catch (error) {
      console.error('DOCX extraction error:', error);
      return 'Document content extracted';
    }
  };

  const extractPdfText = async (buffer: ArrayBuffer): Promise<string> => {
    // PDF text extraction with binary-safe handling
    try {
      const uint8Array = new Uint8Array(buffer);
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(uint8Array);
      
      // Extract text between common PDF markers
      let extracted = '';
      
      // Try to extract text from BT...ET blocks (text blocks in PDF)
      const btMatches = text.match(/BT([\s\S]*?)ET/g) || [];
      if (btMatches.length > 0) {
        extracted = btMatches
          .map(block => {
            // Extract readable text from PDF operators
            const textMatches = block.match(/\((.*?)\)\s*Tj/g) || [];
            return textMatches
              .map(m => m.replace(/[()Tj\s]/g, ''))
              .join(' ');
          })
          .join(' ');
      }
      
      // Fallback: extract any readable text
      if (!extracted || extracted.length < 20) {
        extracted = text
          .replace(/[^\x20-\x7E\n]/g, ' ')
          .split('\n')
          .filter(line => line.trim().length > 3)
          .slice(0, 50)
          .join(' ');
      }
      
      return extracted.trim() || 'PDF content extracted';
    } catch (error) {
      console.error('PDF extraction error:', error);
      return 'PDF content extracted';
    }
  };

  const extractPptText = async (buffer: ArrayBuffer): Promise<string> => {
    // Proper PPTX extraction using JSZip - Extract text from all slides with proper ordering
    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(buffer);
      
      // Get the ppt/slides folder
      const slidesFolder = zipData.folder('ppt/slides');
      if (!slidesFolder) return 'Presentation content extracted';
      
      // Extract all slide files and sort them numerically
      const slideFiles: { name: string; order: number }[] = [];
      slidesFolder.forEach((relativePath) => {
        const match = relativePath.match(/slide(\d+)\.xml$/);
        if (match) {
          slideFiles.push({
            name: relativePath,
            order: parseInt(match[1])
          });
        }
      });
      
      // Sort slides by order
      slideFiles.sort((a, b) => a.order - b.order);
      
      // Extract text from each slide
      const slides: string[] = [];
      for (const slideFile of slideFiles) {
        const slide = zipData.file(`ppt/slides/${slideFile.name}`);
        if (slide) {
          try {
            const xmlContent = await slide.async('text');
            // Extract text from <a:t> tags (text elements in PowerPoint)
            const textMatches = xmlContent.match(/<a:t>([^<]*)<\/a:t>/g) || [];
            const slideText = textMatches
              .map(m => m.replace(/<[^>]*>/g, ''))
              .filter(t => t.trim().length > 0)
              .join(' ');
            
            if (slideText.trim().length > 0) {
              slides.push(`Slide ${slideFile.order}: ${slideText}`);
            }
          } catch (e) {
            console.error(`Error processing slide ${slideFile.order}:`, e);
          }
        }
      }
      
      // Combine all slides with separators for better context
      const allText = slides.join(' | ');
      return allText.trim() || 'Presentation content extracted';
    } catch (error) {
      console.error('PPTX extraction error:', error);
      return 'Presentation content extracted';
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Update summary when file is removed
      const allContent = updated.map(f => f.content).join('\n\n');
      const newSummary = allContent.length > 0 ? generateSummary(allContent) : '';
      setSummary(newSummary);
      
      return updated;
    });
  };

  const getFileIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'pdf':
      case 'txt': return <FileText className="w-4 h-4" />;
      case 'docx':
      case 'doc': return <File className="w-4 h-4" />;
      case 'pptx':
      case 'ppt': return <Presentation className="w-4 h-4" />;
      case 'xlsx':
      case 'xls': return <BarChart3Icon className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    addTask({
      title,
      subject: subject || 'General',
      dueDate,
      estimatedTime: parseInt(estimatedTime) || 30,
      notes,
      priority,
      files: files.length > 0 ? files : undefined,
      summary: summary.length > 0 ? summary : undefined,
      startedAt: new Date().toISOString()
    });

    // Reset
    setTitle('');
    setSubject('');
    setDueDate('');
    setEstimatedTime('30');
    setNotes('');
    setPriority('Medium');
    setFiles([]);
    setSummary('');
    onClose?.();
    setIsExpanded(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/80 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl relative overflow-hidden group transition-all duration-500 ${isExpanded ? 'ring-2 ring-blue-500/20' : ''}`}
    >
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 pointer-events-none -z-10" />

      <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
               <Plus className="w-4 h-4 text-blue-600" />
            </div>
            New Task
          </h3>
          {onClose && (
            <button onClick={onClose} type="button" className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Title Input - Always Visible */}
        <div className="relative group">
          <input
            placeholder="What needs to be done?"
            value={title}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full pl-4 pr-4 py-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg font-medium shadow-sm"
          />
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject Input with Suggestions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subject</label>
                  <input
                    placeholder="e.g. Math"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  />
                  {/* Quick Select Pills */}
                  {existingSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {existingSubjects.map(sub => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSubject(sub)}
                          className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-md transition-colors font-medium text-slate-600"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Priority & Time Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Priority</label>
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                       {(['Urgent', 'Medium', 'Low'] as Priority[]).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${priority === p ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {p.charAt(0)}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Est. Time</label>
                     <div className="relative">
                        <input
                          type="number"
                          value={estimatedTime}
                          onChange={(e) => setEstimatedTime(e.target.value)}
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                        <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                     </div>
                 </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                  {summary.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNotes(summary)}
                      className="text-[10px] font-bold px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition-colors"
                      title="Use AI Summary as notes"
                    >
                      Use Summary
                    </button>
                  )}
                </div>
                 <textarea
                  placeholder="Additional details..."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                  }}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:border-blue-500 outline-none transition-all shadow-sm resize-none"
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Attach Files (Optional)</label>
                  <span className="text-[10px] font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Powered
                  </span>
                </div>
                
                {/* Help Text */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Info className="w-3.5 h-3.5 text-purple-900" />
                    <p className="text-[11px] font-semibold text-purple-900">How to use AI Summarization:</p>
                  </div>
                  <ul className="text-[10px] text-purple-800 space-y-0.5 ml-6">
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Upload PDF, TXT, DOCX, PPTX, or XLSX files</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> AI will automatically extract and analyze the content</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Smart summary appears below your files</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Click "Use Summary" to add it to Notes</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Copy, Download, or Expand the summary anytime</li>
                  </ul>
                </div>
                
                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-600 uppercase">Attached Files ({files.length})</p>
                      <button
                        type="button"
                        onClick={() => setShowExtractedText(!showExtractedText)}
                        className="text-[10px] font-bold px-2 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded transition-colors"
                        title="View extracted text from files"
                      >
                        {showExtractedText ? '- Hide Text' : '+ View Text'}
                      </button>
                    </div>
                    {showExtractedText && (
                      <div className="bg-white p-2 rounded border border-slate-200 max-h-[250px] overflow-y-auto">
                        {files.map((file) => (
                          <div key={file.id} className="mb-3 pb-3 border-b border-slate-100 last:border-b-0">
                            <p className="text-[10px] font-bold text-slate-600 mb-1">{file.name}:</p>
                            <p className="text-[9px] text-slate-500 whitespace-pre-wrap line-clamp-4">{file.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      {files.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="text-slate-400 flex-shrink-0">{getFileIcon(file.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 flex-shrink-0 rounded"
                            title="Remove file and regenerate summary"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button with Drag-and-Drop */}
                <label 
                  className={`block p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                  } ${isLoadingFiles ? 'opacity-60 pointer-events-none' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.docx,.doc,.pptx,.ppt,.xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isLoadingFiles}
                    className="hidden"
                  />
                  <div className="text-center">
                    {isLoadingFiles ? (
                      <>
                        <div className="inline-block animate-spin mb-2">
                          <Loader className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-xs font-bold text-blue-600">Processing & Analyzing Files...</p>
                        <p className="text-[10px] text-blue-500 mt-1">Extracting text and generating summary</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                        <p className="text-xs font-medium text-slate-600">Click to upload or drag files</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PDF, TXT, DOCX, PPTX, XLSX</p>
                      </>
                    )}
                  </div>
                </label>

                {/* Summary Display with Enhancement */}
                {(summary || isGeneratingSummary) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Loading Progress Bar */}
                    {isGeneratingSummary && (
                      <motion.div 
                        className="mb-4 p-4 bg-gradient-to-r from-purple-400/30 to-blue-400/30 rounded-lg border-2 border-purple-400/60 backdrop-blur-sm shadow-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div
                            className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          ></motion.div>
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-purple-700" />
                            <span className="text-sm font-bold text-purple-700">Analyzing Content...</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200/50 rounded-full h-3 overflow-hidden border border-purple-300/50">
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: `${summaryProgress}%` }}
                            transition={{ duration: 0.4 }}
                            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-full shadow-lg"
                          ></motion.div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs font-semibold text-purple-600">Scanning all documents...</p>
                          <span className="text-xs font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">{summaryProgress}%</span>
                        </div>
                      </motion.div>
                    )}

                    {summary && !isGeneratingSummary && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 bg-gradient-to-br from-purple-100/80 via-blue-100/60 to-indigo-100/80 border-2 rounded-xl transition-all shadow-2xl backdrop-blur-sm max-h-[750px] flex flex-col ${isExpandedSummary ? 'ring-2 ring-purple-500 shadow-purple-500/30' : 'shadow-lg'}`}
                        style={{
                          borderImage: 'linear-gradient(135deg, #a855f7, #3b82f6, #6366f1) 1'
                        }}
                      >
                        {/* Header with Stats */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Sparkles className="w-6 h-6 text-purple-600" />
                            </motion.div>
                            <div>
                              <p className="text-sm font-black bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">AI SUMMARY</p>
                              <p className="text-[10px] text-purple-600 font-semibold">Intelligent Content Analysis</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-xs font-bold px-3 py-1 bg-purple-200/80 text-purple-800 rounded-full shadow-md flex items-center gap-1">
                              <ListChecks className="w-3 h-3" />
                              {summary.split('\n').filter(l => l.trim()).length} points
                            </span>
                            <span className="text-xs font-bold px-3 py-1 bg-blue-200/80 text-blue-800 rounded-full shadow-md flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {summary.split(/\s+/).length} words
                            </span>
                          </div>
                        </div>

                        {/* Summary Length Control */}
                        <div className="flex gap-2 mb-4 pb-4 border-b border-purple-300/40">
                          <button
                            type="button"
                            onClick={() => setSummaryLength('short')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${summaryLength === 'short' ? 'bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-400' : 'bg-purple-200/60 text-purple-700 hover:bg-purple-300/70 border border-purple-300/50'}`}
                          >
                            <Zap className="w-4 h-4" />
                            Short (3)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSummaryLength('medium')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${summaryLength === 'medium' ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-400' : 'bg-blue-200/60 text-blue-700 hover:bg-blue-300/70 border border-blue-300/50'}`}
                          >
                            <ListChecks className="w-4 h-4" />
                            Medium (6)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSummaryLength('long')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${summaryLength === 'long' ? 'bg-indigo-600 text-white shadow-lg scale-105 ring-2 ring-indigo-400' : 'bg-indigo-200/60 text-indigo-700 hover:bg-indigo-300/70 border border-indigo-300/50'}`}
                          >
                            <BookOpen className="w-4 h-4" />
                            Complete
                          </button>
                        </div>

                        {/* Summary Content with Enhanced Styling & Better Readability */}
                        <div className={`overflow-y-auto transition-all ${isExpandedSummary ? 'max-h-[600px]' : 'max-h-[450px]'}`}>
                          <div className="space-y-3 pr-2">
                            {summary.split('\n').filter(l => l.trim()).slice(0, summaryLength === 'short' ? 3 : summaryLength === 'medium' ? 6 : 999).map((line, idx) => {
                              if (line.includes('**')) {
                                const parts = line.split(/(\*\*[^*]+\*\*)/);
                                return (
                                  <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 bg-white/70 border border-purple-200/60 rounded-lg hover:bg-white/90 hover:border-purple-300/80 hover:shadow-md transition-all group"
                                  >
                                    <div className="flex gap-3">
                                      <CheckCircle className="w-5 h-5 text-purple-600 min-w-fit mt-0.5 flex-shrink-0" />
                                      <span className="text-sm leading-relaxed text-gray-800 flex-grow">
                                        {parts.map((part, i) => 
                                          part.startsWith('**') && part.endsWith('**') ? 
                                            <span key={i} className="font-bold text-purple-800 bg-yellow-100/50 px-1.5 py-0.5 rounded">{part.slice(2, -2)}</span> : 
                                            <span key={i}>{part}</span>
                                        )}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const plainText = line.replace(/\*\*([^*]+)\*\*/g, '$1');
                                          navigator.clipboard.writeText(plainText);
                                          // Visual feedback
                                          const target = event?.currentTarget as HTMLButtonElement;
                                          if (target) {
                                            target.classList.add('bg-green-100');
                                            setTimeout(() => target.classList.remove('bg-green-100'), 1000);
                                          }
                                        }}
                                        className="hidden group-hover:flex items-center gap-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs font-semibold transition-all flex-shrink-0"
                                        title="Copy this point"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </motion.div>
                                );
                              }
                              return (
                                <motion.div 
                                  key={idx} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="p-4 bg-white/70 border border-purple-200/60 rounded-lg hover:bg-white/90 hover:border-purple-300/80 hover:shadow-md transition-all group"
                                >
                                  <div className="flex gap-3">
                                    <CheckCircle className="w-5 h-5 text-purple-600 min-w-fit mt-0.5 flex-shrink-0" />
                                    <span className="text-sm leading-relaxed text-gray-800 flex-grow">{line}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(line);
                                        // Visual feedback
                                        const target = event?.currentTarget as HTMLButtonElement;
                                        if (target) {
                                          target.classList.add('bg-green-100');
                                          setTimeout(() => target.classList.remove('bg-green-100'), 1000);
                                        }
                                      }}
                                      className="hidden group-hover:flex items-center gap-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs font-semibold transition-all flex-shrink-0"
                                      title="Copy this point"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-purple-300/40">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(summary.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/• /g, ''));
                              setCopiedSummary(true);
                              setTimeout(() => setCopiedSummary(false), 2000);
                            }}
                            className={`flex-1 text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 ${
                              copiedSummary 
                                ? 'bg-green-500 text-white ring-2 ring-green-400' 
                                : 'bg-purple-500 hover:bg-purple-600 text-white hover:shadow-lg active:scale-95'
                            }`}
                          >
                            {copiedSummary ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy Summary
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const element = document.createElement('a');
                              const file = new Blob([summary.replace(/\*\*([^*]+)\*\*/g, '$1')], {type: 'text/plain'});
                              element.href = URL.createObjectURL(file);
                              element.download = `summary-${Date.now()}.txt`;
                              document.body.appendChild(element);
                              element.click();
                              document.body.removeChild(element);
                            }}
                            className="flex-1 text-xs font-bold px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsExpandedSummary(!isExpandedSummary)}
                            className="flex-1 text-xs font-bold px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            {isExpandedSummary ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Collapse
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Expand
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSummaryModal(true)}
                            className="flex-1 text-xs font-bold px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                            title="Open full summary in beautiful modal with Q&A, actions, and more"
                          >
                            <Brain className="w-4 h-4" />
                            Open Modal
                          </button>
                        </div>

                        {/* View Extracted Text Button */}
                        <motion.button
                          type="button"
                          onClick={() => setShowExtractedText(!showExtractedText)}
                          whileHover={{ scale: 1.02 }}
                          className="w-full mt-3 px-3 py-2 text-xs font-bold rounded-lg bg-gray-200/60 hover:bg-gray-300/70 text-gray-700 transition-all border border-gray-300/50 shadow-sm flex items-center justify-center gap-2"
                        >
                          {showExtractedText ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Show
                            </>
                          )}
                          Extracted Text ({files.length} files)
                        </motion.button>

                        {/* Extracted Text Display */}
                        {showExtractedText && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-4 bg-gray-100/70 rounded-lg border border-gray-300/60"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-gray-700" />
                              <h4 className="font-bold text-gray-800 text-xs">Extracted Content:</h4>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {files.map((file, index) => (
                                <div key={index} className="p-2 bg-white rounded border border-gray-200">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <File className="w-3 h-3 text-gray-600" />
                                    <p className="text-xs font-semibold text-gray-700">{file.name}</p>
                                  </div>
                                  <p className="text-[11px] text-gray-600 whitespace-pre-wrap break-words line-clamp-3">
                                    {file.content?.substring(0, 300)}...
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Summary Info Footer */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-200/40 text-[10px] text-purple-600">
                          {!isExpandedSummary && summary.split('\n').length > 6 && (
                            <span className="italic flex items-center gap-1">
                              <ChevronUp className="w-3 h-3" />
                              Click Expand to see full summary
                            </span>
                          )}
                          <span className="ml-auto font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            Analysis Complete
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!title || !dueDate}
                  className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  Create Task
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
      
      {/* Summary Modal - Beautiful clickable modal with Q&A, actions, and analysis */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        summary={summary}
        metadata={documentMetadata}
        sentiment={sentimentData}
        qaData={qaData}
        actionItems={actionItems}
      />
    </motion.div>
  );
};

// ============ ENHANCED COUNTDOWN TIMER COMPONENT WITH REAL-TIME ACCURACY ============
const CountdownTimer = ({ task, addNotification }: { task: Task; addNotification: (msg: string, type: 'info' | 'warning' | 'alert') => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [notifiedThresholds, setNotifiedThresholds] = useState<Set<number>>(new Set());
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (task.status === 'Done') return;

    // Use requestAnimationFrame for smoother, more accurate updates
    let animationFrameId: number;
    let lastUpdateTime = Date.now();

    const updateTimer = () => {
      const now = Date.now();
      // Only update if at least 100ms has passed to avoid excessive re-renders while staying smooth
      if (now - lastUpdateTime < 100) {
        animationFrameId = requestAnimationFrame(updateTimer);
        return;
      }
      lastUpdateTime = now;

      const currentDate = new Date();
      const startTime = task.startedAt ? parseISO(task.startedAt) : parseISO(task.createdAt);
      const estimatedMs = task.estimatedTime * 60 * 1000; // Convert minutes to ms
      const elapsedMs = currentDate.getTime() - startTime.getTime();
      const remainingMs = Math.max(0, estimatedMs - elapsedMs);

      if (remainingMs <= 0) {
        setTimeLeft('Finished');
        setProgressPercent(100);
        if (!notifiedThresholds.has(0)) {
          addNotification(`Task completed: "${task.title}"`, 'alert');
          setNotifiedThresholds(prev => new Set(prev).add(0));
        }
        animationFrameId = requestAnimationFrame(updateTimer);
        return;
      }

      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

      const totalMins = Math.floor(remainingMs / (1000 * 60));
      const progress = Math.round((elapsedMs / estimatedMs) * 100);

      setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      setProgressPercent(Math.min(progress, 100));

      // Notify at 20 minutes remaining
      if (totalMins === 20 && !notifiedThresholds.has(20)) {
        addNotification(`20 minutes left for: "${task.title}"`, 'warning');
        setNotifiedThresholds(prev => new Set(prev).add(20));
      }

      // Notify at 5 minutes remaining
      if (totalMins === 5 && !notifiedThresholds.has(5)) {
        addNotification(`Only 5 minutes left for: "${task.title}" - Hurry up!`, 'alert');
        setNotifiedThresholds(prev => new Set(prev).add(5));
      }

      // Notify at 1 minute remaining
      if (totalMins === 1 && secs === 0 && !notifiedThresholds.has(1)) {
        addNotification(`Final minute! Task ending soon: "${task.title}"`, 'alert');
        setNotifiedThresholds(prev => new Set(prev).add(1));
      }

      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animationFrameId);
  }, [task, notifiedThresholds, addNotification]);

  if (task.status === 'Done') return null;

  const isFinished = timeLeft.includes('Finished');
  const isUrgent = timeLeft.startsWith('0h');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-2 ${
        isFinished
          ? 'bg-green-100 text-green-700 border border-green-200'
          : isUrgent
            ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
            : 'bg-blue-100 text-blue-700 border border-blue-200'
      }`}
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'animate-spin' : ''}`} />
      <div className="flex items-center gap-1.5">
        <span>{timeLeft || 'Loading...'}</span>
        {!isFinished && (
          <div className="w-16 h-1.5 bg-gray-300 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                isUrgent ? 'bg-red-500' : 'bg-blue-500'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============ ENHANCED TASK CARD ============
export const TaskCard = ({ task }: { task: Task }) => {
  const { toggleTaskStatus, deleteTask, duplicateTask, addNotification } = useStore();
  const daysLeft = differenceInCalendarDays(parseISO(task.dueDate), new Date());
  const isOverdue = daysLeft < 0 && task.status === 'Todo';
  const isToday = daysLeft === 0 && task.status === 'Todo';
  const config = priorityConfig[task.priority];
  const subjectColor = getSubjectColor(task.subject);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.90 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className={`group relative p-5 rounded-2xl border transition-all duration-300
        ${task.status === 'Done'
          ? 'bg-slate-50/50 border-slate-200/50 opacity-60 grayscale-[0.5]'
          : isOverdue
            ? 'bg-red-50/30 border-red-200 shadow-lg shadow-red-500/5'
            : 'bg-white border-slate-200/60 hover:border-blue-300/50 shadow-sm hover:shadow-xl hover:shadow-blue-900/5'
        }`}
    >
      {/* Visual Priority Indicator Line */}
      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${task.status === 'Done' ? 'bg-slate-300' : config.text.replace('text-', 'bg-')}`} />

      <div className="flex gap-4 pl-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskStatus(task.id);
          }}
          className="mt-1 flex-shrink-0 focus:outline-none group/check"
        >
          {task.status === 'Done' ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-emerald-500 rounded-full p-1 text-white shadow-sm shadow-emerald-500/30">
               <Check className="w-4 h-4" strokeWidth={3} />
            </motion.div>
          ) : (
            <div className={`w-6 h-6 rounded-full border-2 border-slate-300 group-hover/check:border-blue-500 transition-colors bg-white group-hover/check:bg-blue-50`} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={`font-semibold text-base transition-all leading-snug ${
                  task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800'
                }`}
              >
                {task.title}
              </h4>
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${subjectColor.bg} ${subjectColor.border} ${subjectColor.text} flex items-center gap-1`}>
                    <BookOpen className="w-3 h-3" /> {task.subject}
                 </span>
                 
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isOverdue ? 'bg-red-100 border-red-200 text-red-700' : isToday ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-slate-100 border-slate-200 text-slate-600'} flex items-center gap-1`}>
                    <Calendar className="w-3 h-3" />
                    {isOverdue ? 'Overdue' : isToday ? 'Today' : format(parseISO(task.dueDate), 'MMM d')}
                 </span>

                 {/* Countdown Timer */}
                 <CountdownTimer task={task} addNotification={addNotification} />

                 <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                   <Clock className="w-3 h-3" /> {task.estimatedTime}m
                 </span>
              </div>
            </div>

            {/* Priority Badge (Mini) */}
            <div className={`p-1.5 rounded-lg ${config.bg} ${config.text}`}>
               {config.icon}
            </div>
          </div>
          
          {/* Notes (Conditional) */}
          {task.notes && (
            <p className="text-xs text-slate-500 mt-3 pl-2 border-l-2 border-slate-200 line-clamp-1 italic">
              {task.notes}
            </p>
          )}
        </div>

        {/* Delete Action - Only on Hover */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateTask(task.id);
            }}
            className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all self-center"
            title="Duplicate task"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all self-center"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============ SCORE CARD WITH ANIMATION ============
export const ScoreCard = () => {
  const { userScore } = useStore();
  const scoreLevel = userScore >= 80 ? 'Master' : userScore >= 60 ? 'Pro' : userScore >= 40 ? 'Apprentice' : 'Novice';

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 shadow-xl shadow-slate-900/20 text-white border border-white/10 group"
    >
      {/* Animated Gradient Blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 text-blue-300" />
             </div>
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Score</h3>
          </div>
        </div>
        
        <div className="flex items-baseline gap-1 my-2">
          <div className="text-5xl font-black tracking-tight text-white">{Math.round(userScore)}</div>
          <span className="text-sm font-medium text-slate-500">/ 100</span>
        </div>

        <div className="space-y-2">
           <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
             <motion.div
               initial={{ width: 0 }}
               animate={{ width: `${userScore}%` }}
               transition={{ duration: 1.2, type: 'spring' }}
               className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
             />
           </div>
           <p className="text-xs text-blue-200/80 font-medium text-right">{scoreLevel} Level</p>
        </div>
      </div>
    </motion.div>
  );
};

// ============ STREAK CARD ============
export const StreakCard = () => {
  const { streak } = useStore();

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 to-rose-600 p-6 shadow-xl shadow-orange-500/20 text-white border border-white/10"
    >
      <div className="absolute top-0 right-0 p-8 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Flame className="w-4 h-4 text-white animate-pulse" fill="currentColor" />
             </div>
             <h3 className="text-xs font-bold uppercase tracking-widest text-orange-100">Streak</h3>
           </div>
        </div>

        <div className="my-2">
           <div className="text-5xl font-black tracking-tight text-white drop-shadow-sm">{streak}</div>
           <p className="text-xs font-medium text-orange-100 opacity-80 mt-1">
             {streak === 0 ? 'Start your streak today!' : 'Consecutive days active'}
           </p>
        </div>
      </div>
    </motion.div>
  );
};

// ============ FOCUS MODE TOGGLE ============
export const FocusModeButton = () => {
  const { isFocusMode, toggleFocusMode } = useStore();

  return (
    <motion.button
      onClick={toggleFocusMode}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-sm shadow-lg ${
        isFocusMode
          ? 'bg-slate-900 text-white shadow-slate-900/20 ring-2 ring-offset-2 ring-slate-900'
          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
      }`}
    >
      <Focus className={`w-5 h-5 ${isFocusMode ? 'animate-pulse text-indigo-400' : 'text-slate-400'}`} />
      <span className="tracking-tight">{isFocusMode ? 'Focus Active' : 'Enter Focus Mode'}</span>
    </motion.button>
  );
};

// ============ ENHANCED ANALYTICS DASHBOARD ============
export const AnalyticsDashboard = () => {
  const { tasks } = useStore();

  const completed = tasks.filter((t) => t.status === 'Done').length;
  const pending = tasks.filter((t) => t.status === 'Todo').length;
  const urgent = tasks.filter((t) => t.priority === 'Urgent' && t.status === 'Todo').length;

  const priorityData = [
    { name: 'Urgent', value: tasks.filter((t) => t.priority === 'Urgent').length, fill: '#ef4444' },
    { name: 'High', value: tasks.filter((t) => t.priority === 'High').length, fill: '#f97316' },
    { name: 'Medium', value: tasks.filter((t) => t.priority === 'Medium').length, fill: '#eab308' },
    { name: 'Low', value: tasks.filter((t) => t.priority === 'Low').length, fill: '#10b981' },
  ].filter((item) => item.value > 0);

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyData = weekDays.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const comp = tasks.filter((t) => t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === dayStr).length;
    return { day: format(day, 'EEE'), completed: comp };
  });

  // Calculate completion trend (Area Chart)
  const activityData = weeklyData.map(d => ({ ...d, value: d.completed }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Done</p>
          <div className="text-2xl font-bold text-slate-800">{completed}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pending</p>
          <div className="text-2xl font-bold text-blue-600">{pending}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Urgent</p>
          <div className="text-2xl font-bold text-red-500">{urgent}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Priority Breakdown (Donut Chart) */}
        {priorityData.length > 0 && (
          <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-md">
                 <BarChart3 className="w-4 h-4 text-slate-600" />
              </div>
              Task Distribution
            </h4>
            <div className="h-40 relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={priorityData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={40} 
                    outerRadius={60} 
                    paddingAngle={4} 
                    dataKey="value"
                    stroke="none"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} className="outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="text-2xl font-bold text-slate-700">{tasks.length}</span>
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
               {priorityData.map(d => (
                 <div key={d.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                    <span className="text-[10px] text-slate-500 font-medium">{d.name}</span>
                 </div>
               ))}
            </div>
          </motion.div>
        )}

        {/* Weekly Activity (Area Chart) */}
        {activityData.some(d => d.value > 0) && (
          <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-md">
                 <TrendingUp className="w-4 h-4 text-slate-600" />
              </div>
              Activity Trend
            </h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                  <Tooltip 
                     cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                     contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                     itemStyle={{ color: '#fff' }}
                     labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ============ ENHANCED SUBJECT-BASED VIEW ============
export const SubjectView = ({ tasks, viewMode }: { tasks: Task[]; viewMode: 'list' | 'grid' }) => {
  const subjectMap = new Map<string, Task[]>();

  tasks.forEach((task) => {
    if (!subjectMap.has(task.subject)) {
      subjectMap.set(task.subject, []);
    }
    subjectMap.get(task.subject)!.push(task);
  });

  const subjects = Array.from(subjectMap.entries());

  if (subjects.length === 0) {
     return (
        <div className="text-center py-12 opacity-50">
           <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
           <p className="text-slate-500 font-medium">No subjects found.</p>
        </div>
     )
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-8'}>
      <AnimatePresence>
        {subjects.map(([subject, subjectTasks]) => {
          const colors = getSubjectColor(subject);
          const progress = (subjectTasks.filter(t => t.status === 'Done').length / subjectTasks.length) * 100;

          return (
            <motion.div
              key={subject}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-3xl border bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${colors.border} group`}
            >
              <div className={`${colors.bg} px-5 py-4 border-b ${colors.border} flex justify-between items-center`}>
                <div>
                   <h3 className={`font-bold text-base flex items-center gap-2 ${colors.text}`}>
                    <BookOpen className="w-4 h-4" />
                    {subject}
                  </h3>
                   <p className="text-[10px] text-slate-500 font-semibold mt-1 uppercase tracking-wide">
                      {subjectTasks.length} Tasks
                   </p>
                </div>
                {/* Mini Progress Ring */}
                <div className="relative w-8 h-8 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white opacity-50" />
                      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={88} strokeDashoffset={88 - (88 * progress) / 100} className={`${colors.text} transition-all duration-1000`} />
                   </svg>
                </div>
              </div>

              <div className="p-4 space-y-3 bg-white/50">
                <AnimatePresence>
                  {subjectTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// ============ ENHANCED WEEKLY REPORT ============
export const WeeklyReport = () => {
  const { tasks, userScore } = useStore();

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

  const weekTasks = tasks.filter(
    (t) => t.completedAt && parseISO(t.completedAt) >= weekStart && parseISO(t.completedAt) <= weekEnd
  );

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const bestDay = weekDays.reduce((best, day) => {
    const dayTasks = weekTasks.filter((t) => format(parseISO(t.completedAt!), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    return dayTasks.length > (best.count || 0) ? { day, count: dayTasks.length } : best;
  }, { day: new Date(), count: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl shadow-slate-200/50"
    >
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
             <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          Weekly Insight
        </h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
           {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Total Completed</p>
          <div className="text-3xl font-black text-slate-800">{weekTasks.length}</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Efficiency Score</p>
          <div className="text-3xl font-black text-blue-600">{Math.round(userScore)}</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
         <div className="relative z-10">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Highlight of the Week</p>
            {bestDay.count > 0 ? (
               <div>
                  <div className="text-xl font-bold">
                     You crushed it on <span className="text-blue-400">{format(bestDay.day, 'EEEE')}</span>!
                  </div>
                  <p className="text-sm text-slate-300 mt-1">
                     You completed {bestDay.count} tasks that day. Keep that momentum going!
                  </p>
               </div>
            ) : (
               <div>
                  <div className="text-xl font-bold">Ready to start?</div>
                  <p className="text-sm text-slate-300 mt-1">Complete a task to generate your weekly highlights.</p>
               </div>
            )}
         </div>
         {/* Decoration */}
         <BarChart3 className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-white/5" />
      </div>
    </motion.div>
  );
};