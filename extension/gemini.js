// Gemini API service for content analysis
(function () {
  "use strict";

  console.log("🔥 GEMINI.JS LOADED AND RUNNING");

  // Gemini API configuration - Updated to correct endpoint
  const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-09-2025:generateContent";

  // Content analysis using Gemini
  async function analyzeContent(contentElements) {
    try {
      // Get API key from storage
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.error("No Gemini API key found");
        return { error: "API key not configured" };
      }

      // Prepare the prompt for Gemini
      const prompt = createAnalysisPrompt(contentElements);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1.0,
          topK: 1,
          topP: 1,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      console.log(
        "🌐 Making request to:",
        `${GEMINI_API_URL}?key=${apiKey.substring(0, 10)}...`,
      );

      // Call Gemini API with correct format
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", response.status, errorText);
        throw new Error(
          `API request failed: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      // Extract and parse the response
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        throw new Error("No response from Gemini");
      }

      // Parse the JSON response
      const results = parseGeminiResponse(resultText);
      return results;
    } catch (error) {
      console.error("Gemini API error:", error);
      return { error: error.message };
    }
  }

  // Create the analysis prompt for Gemini
  function createAnalysisPrompt(contentElements) {
    const elementsJson = JSON.stringify(contentElements, null, 2);

    return `You are a content safety analyzer. Analyze the following web page elements and classify them into threat categories.

Categories:
- malicious: Phishing attempts, malware distribution, scams, dangerous links, security threats
- trackers: Tracking pixels, analytics, third-party trackers
- ai: AI-generated content that may be unreliable or lack proper attribution
- misinformation: False claims, misleading information, unverified statements

Web page elements to analyze:
${elementsJson}

For each element, determine if it belongs to any category. Consider:
1. The actual text content and context
2. Link destinations (if present)
3. Suspicious patterns or language
4. Claims that seem unverified or false

When choosing an element ID, consider the nesting patterns. If something is nested within multiple divs or containers, ensure to pass the higher level div so that z index is not an issue for the overlays.

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

Only include elements that match a category. If an element is safe, don't include it in results. If an element mentions a category, but is not explicitly malicious, trackers, AI, or misinformation, classify it as "safe" and do not include it in results.
Only include something in the results if it is something a user would not want to interact with. For example, a tool for finding malicious links is helpful and safe, but a link that leads to malware is not safe.
A database of malicious sites is helpful to a user and not dangerous, but the links within the database are dangerous. A news article that contains misinformation is not safe, but a news article that discusses misinformation is safe.
Mentions of AI or AI companies is NOT AI generated content. If the text is likely AI generated due to it's structure, classify it as "ai". If the text is discussing AI or mentions AI but does not seem to be AI generated itself, classify it as "safe" and do not include it in results.
A link to the same site is not considered a tracker by itself.
- Trackers include: Google Analytics, Facebook Pixel, Mixpanel, Hotjar, advertising networks, retargeting pixels, fingerprinting scripts
- Analyze the href URL for known tracker domains
- URLs containing: /pixel/, /track/, /analytics/, /collect/ are likely trackers
- Same-domain links are NOT trackers by themselves
- Mentions of analytics in text ("we use analytics") are NOT trackers - they are disclosures
- Privacy policy links are NOT trackers
`;
  }

  // Parse Gemini's response
  function parseGeminiResponse(responseText) {
    try {
      // Remove markdown code blocks if present
      let cleanText = responseText.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/```\n?/g, "");
      }

      const parsed = JSON.parse(cleanText);

      // Validate the response structure
      if (!parsed.results || !Array.isArray(parsed.results)) {
        throw new Error("Invalid response format");
      }

      return parsed;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      console.error("Raw response:", responseText);
      return { results: [] };
    }
  }

  // Get API key from Chrome storage
  function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["geminiApiKey"], (result) => {
        resolve(result.geminiApiKey || null);
      });
    });
  }

  // Set API key in Chrome storage
  function setApiKey(apiKey) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
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
    hasApiKey,
  };

  console.log("🚀 GEMINI SERVICE EXPORTED TO WINDOW:", window.GeminiService);
})();
