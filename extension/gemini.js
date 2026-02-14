// Gemini API service for content analysis
(function() {
  'use strict';

  console.log('🔥 GEMINI.JS LOADED AND RUNNING');

  // Gemini API configuration
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  // Content analysis using Gemini
  async function analyzeContent(contentElements) {
    try {
      // Get API key from storage
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.error('No Gemini API key found');
        return { error: 'API key not configured' };
      }
      
      // Prepare the prompt for Gemini
      const prompt = createAnalysisPrompt(contentElements);
      
      // Call Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract and parse the response
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        throw new Error('No response from Gemini');
      }

      // Parse the JSON response
      const results = parseGeminiResponse(resultText);
      return results;

    } catch (error) {
      console.error('Gemini API error:', error);
      return { error: error.message };
    }
  }

  // Create the analysis prompt for Gemini
  function createAnalysisPrompt(contentElements) {
    const elementsJson = JSON.stringify(contentElements, null, 2);
    
    return `You are a content safety analyzer. Analyze the following web page elements and classify them into threat categories.

Categories:
- malicious: Phishing attempts, malware distribution, scams, dangerous links, security threats
- trackers: Tracking pixels, analytics, third-party trackers, privacy concerns
- ai: AI-generated content that may be unreliable or lack proper attribution
- misinformation: False claims, misleading information, unverified statements

Web page elements to analyze:
${elementsJson}

For each element, determine if it belongs to any category. Consider:
1. The actual text content and context
2. Link destinations (if present)
3. Suspicious patterns or language
4. Claims that seem unverified or false

Respond ONLY with valid JSON in this exact format (no markdown, no additional text):
{
  "results": [
    {
      "elementId": "element-1",
      "category": "malicious",
      "confidence": 0.85,
      "reason": "Contains phishing language"
    }
  ]
}

Only include elements that match a category. If an element is safe, don't include it in results.`;
  }

  // Parse Gemini's response
  function parseGeminiResponse(responseText) {
    try {
      // Remove markdown code blocks if present
      let cleanText = responseText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(cleanText);
      
      // Validate the response structure
      if (!parsed.results || !Array.isArray(parsed.results)) {
        throw new Error('Invalid response format');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Raw response:', responseText);
      return { results: [] };
    }
  }

  // Get API key from Chrome storage
  function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['geminiApiKey'], (result) => {
        resolve(result.geminiApiKey || null);
      });
    });
  }

  // Set API key in Chrome storage
  function setApiKey(apiKey) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        resolve();
      });
    });
  }

  // Check if API key is configured
  async function hasApiKey() {
    const key = await getApiKey();
    return !!key;
  }

  // Export functions to global scope for use in content.js
  window.GeminiService = {
    analyzeContent,
    getApiKey,
    setApiKey,
    hasApiKey
  };

  console.log('🚀 GEMINI SERVICE EXPORTED TO WINDOW:', window.GeminiService);

})();
