// Google Generative AI Configuration
// Note: You need to set VITE_GOOGLE_GEMINI_API_KEY in your .env file
// Get your API key from: https://aistudio.google.com/app/apikeys

export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY || '';

export const GEMINI_CONFIG = {
  model: 'gemini-2.0-flash',
  temperature: 0.7,
  top_k: 40,
  top_p: 0.95,
  max_output_tokens: 1024,
};

// Check if API key is configured
export const isGeminiConfigured = (): boolean => {
  return GOOGLE_API_KEY.length > 0;
};
