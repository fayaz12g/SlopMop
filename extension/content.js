// Content script that runs on the page - Now powered by Gemini AI
(function() {
  'use strict';

  console.log('📝 CONTENT.JS LOADED AND RUNNING');

  // Store scan results
  let scanResults = {
    malicious: 0,
    trackers: 0,
    ai: 0,
    misinformation: 0
  };

  // Category descriptions for tooltips
  const DESCRIPTIONS = {
    malicious: 'This content has been flagged as potentially malicious by AI analysis. It may contain phishing attempts, malware distribution, scams, or other security threats.',
    trackers: 'This element appears to be related to tracking or analytics. It may collect data about your browsing behavior or contain third-party tracking pixels.',
    ai: 'This content shows characteristics of AI-generated text. It may lack proper source attribution, contain unverified claims, or exhibit patterns typical of synthetic content.',
    misinformation: 'This content has been identified as potentially containing false, misleading, or unverified information that could spread misinformation.'
  };

  // Generate unique ID for elements
  let elementIdCounter = 0;

  // Clear any existing highlights and labels
  function clearHighlights() {
    document.querySelectorAll('.scanner-highlight').forEach(el => {
      el.classList.remove('scanner-highlight', 'scanner-malicious', 'scanner-trackers', 'scanner-ai', 'scanner-misinformation');
      // Remove any attached labels
      const label = el.querySelector('.scanner-label');
      if (label) label.remove();
    });
    // Remove any orphaned tooltips
    document.querySelectorAll('.scanner-tooltip').forEach(tooltip => tooltip.remove());
  }

  // Extract content elements for analysis
  function extractContentElements() {
    const elements = [];
    
    // Get all text-containing elements
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th, article, section');
    
    textElements.forEach((element, index) => {
      // Skip if element is too large (likely a container)
      if (element.children.length > 5) return;
      
      // Get direct text content (not from children)
      const directText = Array.from(element.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join(' ');
      
      if (directText.length < 10) return; // Skip very short text
      if (directText.length > 500) return; // Skip very long text (likely containers)
      
      // Generate unique ID for this element
      const elementId = `scanner-el-${index}`;
      element.setAttribute('data-scanner-temp-id', elementId);
      
      // Prepare element data for Gemini
      const elementData = {
        elementId: elementId,
        text: directText.substring(0, 500), // Limit text length
        tagName: element.tagName.toLowerCase(),
        href: element.href || null
      };
      
      elements.push(elementData);
    });
    
    return elements;
  }

  // Scan page with Gemini AI and respect enabled threats
  async function scanPageWithGemini(enabledThreats = null) {
    console.log('🔍 Starting Gemini-powered scan...');
    console.log('🔍 Available on window:', Object.keys(window));
    console.log('🔍 GeminiService available:', typeof window.GeminiService);
    console.log('🔍 Enabled threats:', enabledThreats);
    
    // Clear previous results
    clearHighlights();
    scanResults = { malicious: 0, trackers: 0, ai: 0, misinformation: 0 };

    // Check if Gemini service is available
    if (typeof window.GeminiService === 'undefined') {
      console.error('❌ GeminiService not loaded');
      // Fall back to showing error
      return scanResults;
    }

    console.log('✅ GeminiService found, checking API key...');

    // Check if API key is configured
    const hasKey = await window.GeminiService.hasApiKey();
    if (!hasKey) {
      console.warn('Gemini API key not configured');
      return scanResults;
    }

    // Extract content elements
    const contentElements = extractContentElements();
    console.log(`Extracted ${contentElements.length} elements for analysis`);
    
    if (contentElements.length === 0) {
      console.log('No content elements found to analyze');
      return scanResults;
    }

    // Batch elements for API calls (max 20 elements per call to avoid token limits)
    const batchSize = 20;
    const batches = [];
    for (let i = 0; i < contentElements.length; i += batchSize) {
      batches.push(contentElements.slice(i, i + batchSize));
    }

    console.log(`Processing ${batches.length} batch(es)...`);

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length}...`);
      
      try {
        const analysis = await window.GeminiService.analyzeContent(batch);
        
        if (analysis.error) {
          console.error('Analysis error:', analysis.error);
          continue;
        }

        // Process results and check if threat type is enabled
        if (analysis.results && Array.isArray(analysis.results)) {
          console.log(`Received ${analysis.results.length} flagged items from batch ${i + 1}`);
          
          analysis.results.forEach(result => {
            const element = document.querySelector(`[data-scanner-temp-id="${result.elementId}"]`);
            if (element && result.category) {
              // Only highlight if this threat type is enabled
              const shouldHighlight = !enabledThreats || enabledThreats[result.category] === true;
              
              if (shouldHighlight) {
                highlightElement(element, result.category, result.reason);
                scanResults[result.category]++;
                console.log(`Highlighted ${result.category} element (enabled: ${shouldHighlight})`);
              } else {
                console.log(`Skipped highlighting ${result.category} element (disabled in settings)`);
              }
            }
          });
        }
      } catch (error) {
        console.error(`Error processing batch ${i + 1}:`, error);
      }

      // Small delay between batches to avoid rate limits
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Clean up temporary IDs
    document.querySelectorAll('[data-scanner-temp-id]').forEach(el => {
      el.removeAttribute('data-scanner-temp-id');
    });

    console.log('Scan complete:', scanResults);
    return scanResults;
  }

  // Highlight an element and add interactive label
  function highlightElement(element, type, reason) {
    element.classList.add('scanner-highlight', `scanner-${type}`);
    
    // Generate unique ID for this element
    const elementId = `scanner-element-${elementIdCounter++}`;
    element.setAttribute('data-scanner-id', elementId);
    
    // Create label element
    const label = createLabel(type, elementId, reason);
    
    element.appendChild(label);
  }

  // Create interactive label with hover functionality
  function createLabel(type, elementId, reason) {
    const label = document.createElement('div');
    label.className = `scanner-label scanner-label-${type}`;
    
    // Set emoji and text based on type
    const labelText = {
      malicious: 'Malicious',
      trackers: 'Tracker',
      ai: 'AI Generated',
      misinformation: 'Misinformation'
    };
    
    label.textContent = labelText[type] || '⚠️ Flagged';
    
    // Create tooltip (hidden by default)
    const tooltip = createTooltip(type, elementId, reason);
    label.appendChild(tooltip);
    
    let hideTimeout = null;
    
    // Show tooltip on hover
    label.addEventListener('mouseenter', () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      tooltip.style.display = 'block';
    });
    
    label.addEventListener('mouseleave', () => {
      // Delay hiding to allow mouse to move to tooltip
      hideTimeout = setTimeout(() => {
        tooltip.style.display = 'none';
      }, 200);
    });
    
    // Keep tooltip open when hovering over it
    tooltip.addEventListener('mouseenter', () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      tooltip.style.display = 'block';
    });
    
    tooltip.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        tooltip.style.display = 'none';
      }, 200);
    });
    
    return label;
  }

  // Create tooltip with description and mark as safe button
  function createTooltip(type, elementId, reason) {
    const tooltip = document.createElement('div');
    tooltip.className = 'scanner-tooltip';
    
    // Description
    const description = document.createElement('div');
    description.className = 'scanner-tooltip-description';
    
    // Use AI-provided reason if available, otherwise use default
    if (reason) {
      description.textContent = `AI Analysis: ${reason}`;
    } else {
      description.textContent = DESCRIPTIONS[type];
    }
    
    tooltip.appendChild(description);
    
    // Mark as Safe button
    const button = document.createElement('button');
    button.className = 'scanner-tooltip-button';
    button.textContent = 'Mark as Safe';
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      markAsSafe(elementId, type);
    });
    tooltip.appendChild(button);
    
    return tooltip;
  }

  // Mark element as safe
  function markAsSafe(elementId, type) {
    const element = document.querySelector(`[data-scanner-id="${elementId}"]`);
    if (!element) return;
    
    // Save to localStorage for persistence
    async function saveToLocalStorage(elementId, elementInfo) {
      try {
        // Get existing safe list
        const result = await chrome.storage.local.get(['safeElements']);
        const safeElements = result.safeElements || {};
        
        // Add this element to safe list
        const domain = window.location.hostname;
        const key = `${domain}:${elementId}`;
        
        safeElements[key] = {
          text: element.textContent.substring(0, 100),
          markedAt: Date.now(),
          type: type,
          url: window.location.href
        };
        
        // Save back to storage
        await chrome.storage.local.set({ safeElements });
        console.log('Saved to safe list:', key);
      } catch (error) {
        console.error('Error saving to safe list:', error);
      }
    }
    
    // Call the function
    saveToLocalStorage(elementId, {
      text: element.textContent.substring(0, 100),
      type: type
    });
    
    // Remove the highlight visually
    element.classList.remove('scanner-highlight', `scanner-${type}`);
    const label = element.querySelector('.scanner-label');
    if (label) {
      label.remove();
    }
    
    // Update scan results
    scanResults[type] = Math.max(0, scanResults[type] - 1);
    
    // Show confirmation
    showNotification('Marked as safe');
  }

  // Show brief notification
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'scanner-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📥 CONTENT: Received message from popup:', request);

  // 🔹 NEW: Clear highlights handler
  if (request.action === 'clearScanHighlights') {
    clearHighlights();
    scanResults = { malicious: 0, trackers: 0, ai: 0, misinformation: 0 };
    sendResponse({ cleared: true });
    return true;
  }

  if (request.action === 'getScanResults') {
    console.log('📥 CONTENT: Starting scan with Gemini...');
    console.log('📥 CONTENT: Enabled threats:', request.enabledThreats);
    
    // Run scan with Gemini and pass enabled threats
    scanPageWithGemini(request.enabledThreats).then(results => {
      console.log('📥 CONTENT: Scan completed, sending results:', results);
      sendResponse(results);
    }).catch(error => {
      console.error('📥 CONTENT: Scan error:', error);
      const fallbackResults = { malicious: 0, trackers: 0, ai: 0, misinformation: 0 };
      console.log('📥 CONTENT: Sending fallback results:', fallbackResults);
      sendResponse(fallbackResults);
    });

    return true;
  }
});


  // Auto-scan on load (optional)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Don't auto-scan, wait for user to click
    });
  }

})();
