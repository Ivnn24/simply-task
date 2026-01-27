// Advanced AI Summarization Service with Google Gemini Integration
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GOOGLE_API_KEY, GEMINI_CONFIG, isGeminiConfigured } from './ai-config';

let genAI: GoogleGenerativeAI | null = null;

// Initialize Gemini AI only if API key is configured
if (isGeminiConfigured()) {
  genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
}

/**
 * Generate enhanced summary using Google Gemini API (PRIMARY SUMMARIZER)
 * Provides the most accurate and intelligent summaries
 */
export async function generateGeminiSummary(text: string): Promise<string | null> {
  if (!genAI) {
    console.warn('Google Gemini API not configured. Using local summarization.');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.model,
      generationConfig: {
        temperature: GEMINI_CONFIG.temperature,
        topK: GEMINI_CONFIG.top_k,
        topP: GEMINI_CONFIG.top_p,
        maxOutputTokens: GEMINI_CONFIG.max_output_tokens,
      },
    });

    const prompt = `You are an expert content analyst with deep understanding across all domains. Analyze the following text and provide a comprehensive, well-structured summary with 7-10 key points. 

Each point should:
- Be clear, concise, and actionable
- Highlight the most important information
- Include relevant context
- Bold key terms using **term** format

Format as bullet points (use •). Include insights that would matter to someone reading this summary.

Text to analyze:
${text}

Provide ONLY the numbered bullet points without any preamble or explanation. Start immediately with the points.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text();
    
    // Clean up the response - preserve formatting
    return summaryText
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Remove bullet markers at start but keep formatting
        return line.replace(/^[\d+\.\s•\-\*\s]+/, '• ').trim();
      })
      .filter(line => line.length > 0)
      .map(line => line.startsWith('•') ? line : `• ${line}`)
      .join('\n');
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}

/**
 * Generate detailed analysis using Gemini for complex documents
 */
export async function generateDetailedAnalysis(text: string): Promise<{ topics: string[]; findings: string[]; insights: string[]; keywords: string[] } | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.model,
      generationConfig: {
        temperature: GEMINI_CONFIG.temperature,
        maxOutputTokens: GEMINI_CONFIG.max_output_tokens,
      },
    });

    const prompt = `Analyze this document deeply and extract:

1. MAIN TOPICS (3-5 main topics)
2. KEY FINDINGS (3-5 critical findings)
3. ACTIONABLE INSIGHTS (3-5 insights)
4. IMPORTANT KEYWORDS (5-10 keywords)

Format your response EXACTLY as:
TOPICS: topic1, topic2, topic3
FINDINGS: finding1, finding2, finding3
INSIGHTS: insight1, insight2, insight3
KEYWORDS: keyword1, keyword2, keyword3

Document:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    // Parse the response
    const topicsMatch = analysisText.match(/TOPICS:\s*(.+?)(?=\n|FINDINGS)/i);
    const findingsMatch = analysisText.match(/FINDINGS:\s*(.+?)(?=\n|INSIGHTS)/i);
    const insightsMatch = analysisText.match(/INSIGHTS:\s*(.+?)(?=\n|KEYWORDS)/i);
    const keywordsMatch = analysisText.match(/KEYWORDS:\s*(.+?)(?=\n|$)/i);

    return {
      topics: topicsMatch ? topicsMatch[1].split(',').map(t => t.trim()) : [],
      findings: findingsMatch ? findingsMatch[1].split(',').map(f => f.trim()) : [],
      insights: insightsMatch ? insightsMatch[1].split(',').map(i => i.trim()) : [],
      keywords: keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [],
    };
  } catch (error) {
    console.error('Detailed analysis error:', error);
    return null;
  }
}

/**
 * Generate sentiment analysis and tone detection
 */
export async function analyzeSentiment(text: string): Promise<{ sentiment: string; tone: string; confidence: number } | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.model,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 100,
      },
    });

    const prompt = `Analyze the sentiment and tone of this text. Respond EXACTLY in format:
SENTIMENT: [positive/negative/neutral]
TONE: [professional/casual/formal/urgent/friendly]
CONFIDENCE: [0-100]

Text: ${text.substring(0, 500)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    const sentimentMatch = analysisText.match(/SENTIMENT:\s*(\w+)/i);
    const toneMatch = analysisText.match(/TONE:\s*(\w+)/i);
    const confidenceMatch = analysisText.match(/CONFIDENCE:\s*(\d+)/i);

    return {
      sentiment: sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral',
      tone: toneMatch ? toneMatch[1].toLowerCase() : 'professional',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 75,
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return null;
  }
}

/**
 * Extract key Q&A from document
 */
export async function generateQA(text: string): Promise<Array<{ question: string; answer: string }> | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: GEMINI_CONFIG.max_output_tokens,
      },
    });

    const prompt = `Based on this document, generate 4-6 important Q&A pairs that would help someone quickly understand the content.

Format EXACTLY as:
Q1: [question]
A1: [answer]
Q2: [question]
A2: [answer]

Keep answers concise (1-2 sentences each).

Document:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const qaText = response.text();

    const qaArray: Array<{ question: string; answer: string }> = [];
    const qMatches = qaText.match(/Q\d+:\s*(.+?)(?=A\d+:|$)/g) || [];
    const aMatches = qaText.match(/A\d+:\s*(.+?)(?=Q\d+:|$)/g) || [];

    for (let i = 0; i < Math.min(qMatches.length, aMatches.length); i++) {
      const q = qMatches[i].replace(/Q\d+:\s*/, '').trim();
      const a = aMatches[i].replace(/A\d+:\s*/, '').trim();
      if (q && a) {
        qaArray.push({ question: q, answer: a });
      }
    }

    return qaArray.length > 0 ? qaArray : null;
  } catch (error) {
    console.error('Q&A generation error:', error);
    return null;
  }
}

/**
 * Generate action items and recommendations
 */
export async function generateActionItems(text: string): Promise<Array<{ action: string; priority: 'high' | 'medium' | 'low'; dueIn?: string }> | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.model,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: GEMINI_CONFIG.max_output_tokens,
      },
    });

    const prompt = `Extract action items and recommendations from this document. For each item, determine priority level.

Format EXACTLY as:
1. [Action Item] | Priority: HIGH
2. [Action Item] | Priority: MEDIUM
3. [Action Item] | Priority: LOW

Be specific and actionable.

Document:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const actionsText = response.text();

    const actionArray: Array<{ action: string; priority: 'high' | 'medium' | 'low'; dueIn?: string }> = [];
    const actionLines = actionsText.split('\n').filter(line => line.trim().match(/^\d+\./));

    actionLines.forEach(line => {
      const match = line.match(/\d+\.\s*(.+?)\s*\|\s*Priority:\s*(\w+)/i);
      if (match) {
        actionArray.push({
          action: match[1].trim(),
          priority: match[2].toLowerCase() as 'high' | 'medium' | 'low',
        });
      }
    });

    return actionArray.length > 0 ? actionArray : null;
  } catch (error) {
    console.error('Action items generation error:', error);
    return null;
  }
}

/**
 * Extract structured data from text using Gemini
 */
export async function extractStructuredData(
  text: string,
  extractionType: 'entities' | 'relationships' | 'concepts' = 'entities'
): Promise<string[] | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.model,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    let prompt = '';
    switch (extractionType) {
      case 'entities':
        prompt = `Extract all named entities (people, places, organizations, products, dates) from this text. Return only the entities, one per line, no duplicates, no numbering.
Text: ${text.substring(0, 1000)}`;
        break;
      case 'relationships':
        prompt = `Identify key relationships between concepts in this text. Format: "concept1 → relationship → concept2", one per line. Be specific and meaningful.
Text: ${text.substring(0, 1000)}`;
        break;
      case 'concepts':
        prompt = `Extract all important concepts, ideas, and themes from this text. Return only the concepts, one per line, no duplicates, no numbering.
Text: ${text.substring(0, 1000)}`;
        break;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const items = response.text()
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('*'));
    return items.length > 0 ? items : null;
  } catch (error) {
    console.error(`Error extracting ${extractionType}:`, error);
    return null;
  }
}

/**
 * Generate title, description, and metadata from content (GOD-TIER AI)
 */
export async function generateTitleAndDescription(
  text: string
): Promise<{ title: string; description: string; category: string; difficulty: string } | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.model,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 200,
      },
    });

    const prompt = `Based on this text, generate:
1. A compelling title (max 60 characters) - should be catchy and informative
2. A brief description (max 150 characters) - should summarize the essence
3. Document category (e.g., Technical, Business, Educational, Legal, Personal, Other)
4. Difficulty/Complexity level (Beginner, Intermediate, Advanced)

Format as:
TITLE: [your title]
DESCRIPTION: [your description]
CATEGORY: [category]
DIFFICULTY: [level]

Text: ${text.substring(0, 800)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text_response = response.text();

    const titleMatch = text_response.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const descMatch = text_response.match(/DESCRIPTION:\s*(.+?)(?:\n|$)/i);
    const categoryMatch = text_response.match(/CATEGORY:\s*(.+?)(?:\n|$)/i);
    const difficultyMatch = text_response.match(/DIFFICULTY:\s*(.+?)(?:\n|$)/i);

    return {
      title: titleMatch ? titleMatch[1].trim() : 'Untitled Document',
      description: descMatch ? descMatch[1].trim() : 'No description available',
      category: categoryMatch ? categoryMatch[1].trim() : 'General',
      difficulty: difficultyMatch ? difficultyMatch[1].trim() : 'Intermediate',
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return null;
  }
}

/**
 * Smart document analyzer - provides comprehensive analysis (GOD-TIER)
 */
export async function smartAnalyzeDocument(text: string): Promise<{
  summary: string | null;
  analysis: any;
  sentiment: any;
  qa: any;
  actions: any;
  metadata: any;
} | null> {
  if (!genAI) return null;

  try {
    // Run all analyses in parallel for efficiency
    const [
      summaryResult,
      analysisResult,
      sentimentResult,
      qaResult,
      actionsResult,
      metadataResult,
    ] = await Promise.all([
      generateGeminiSummary(text),
      generateDetailedAnalysis(text),
      analyzeSentiment(text),
      generateQA(text),
      generateActionItems(text),
      generateTitleAndDescription(text),
    ]);

    return {
      summary: summaryResult,
      analysis: analysisResult,
      sentiment: sentimentResult,
      qa: qaResult,
      actions: actionsResult,
      metadata: metadataResult,
    };
  } catch (error) {
    console.error('Smart analysis error:', error);
    return null;
  }
}

export { isGeminiConfigured };
