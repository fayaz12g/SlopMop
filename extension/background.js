// Background script for SlopMop - handles API calls to bypass page CSP

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-09-2025:generateContent';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeContent') {
    handleAnalyzeContent(request.contentElements)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

async function handleAnalyzeContent(contentElements) {
  try {
    // Get API key from storage
    const result = await chrome.storage.local.get(['geminiApiKey']);
    const apiKey = result.geminiApiKey;
    
    if (!apiKey) {
      return { error: 'API key not configured' };
    }
    
    const prompt = createAnalysisPrompt(contentElements);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
      ]
    };
    
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('No response from Gemini');
    }

    return parseGeminiResponse(resultText);
  } catch (error) {
    console.error('Gemini API error:', error);
    return { error: error.message };
  }
}

function createAnalysisPrompt(contentElements) {
  const elementsJson = JSON.stringify(contentElements, null, 2);
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const year = now.getFullYear();

  return `You are a content safety analyzer. Analyze the following web page elements and classify them into threat categories.

CURRENT DATE: ${dateStr} (Year: ${year})

Categories:
- malicious: Phishing attempts, malware distribution, scams, dangerous links, security threats
- trackers: Tracking pixels, analytics, third-party trackers
- ai: AI-generated content that may be unreliable or lack proper attribution
- misinformation: False claims, misleading information, unverified statements presented as facts

IMPORTANT GUIDELINES:
1. HIGH CONFIDENCE ONLY: Only flag content if you're 80%+ confident it matches a category
2. CONTEXT IS EVERYTHING: The same words can be safe or dangerous depending on context
3. DISCUSSING ≠ SPREADING: An article about phishing/scams/misinformation is NOT the same as the threat itself
4. REQUIRE EVIDENCE: Don't guess - only flag if there's clear evidence in the text

EXAMPLES OF FALSE POSITIVES TO AVOID:
- "Learn about AI safety" → SAFE (educational content about AI)
- "Warning: this site contains trackers" → SAFE (disclosure/privacy notice)
- "How to spot misinformation" → SAFE (fact-checking resource)
- "Report a scam here" → SAFE (help resource, not the scam)
- "Our privacy policy" → SAFE (legitimate disclosure)
- Mentions of "AI", "malware", "phishing" in neutral context → SAFE
- Links to the same domain → NOT trackers by themselves

EXAMPLES OF TRUE POSITIVES:
- "Click here to download free movies" with suspicious URL → MALICIOUS
- "Your account will be deleted in 24 hours" with urgency + suspicious link → MALICIOUS
- Third-party analytics URLs (google-analytics, facebook pixel) → TRACKERS
- Text with generic AI patterns (repetitive phrases, no sources, too perfect) → AI
- "The earth is flat and scientists are lying" presented as fact → MISINFORMATION

Web page elements to analyze:
${elementsJson}

For each element, analyze carefully:
1. What does the text actually say?
2. Is it making a claim or discussing a topic?
3. Is there clear evidence of the threat?
4. Would a normal user want to see this highlighted?

Respond ONLY with valid JSON in this exact format (no markdown, no additional text):
{
  "results": [
    {
      "elementId": "element-1",
      "category": "malicious",
      "confidence": 0.85,
      "reason": "Clear evidence of threat"
    }
  ]
}

When choosing an element ID, consider the nesting patterns. If something is nested within multiple divs or containers, ensure to pass the higher level div so that z index is not an issue for the overlays.

Only include elements where you have HIGH confidence they are actual threats. err on the side of marking as safe.`;
}

function parseGeminiResponse(responseText) {
  try {
    let cleanText = responseText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(cleanText);
    
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
