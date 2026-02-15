// Content script that runs on the page - Now powered by Gemini AI
(function() {
  'use strict';

  console.log('📝 CONTENT.JS LOADED AND RUNNING');

  let activeScanId = 0;

  // Store scan results
  let scanResults = {
    malicious: 0,
    trackers: 0,
    ai: 0,
    misinformation: 0
  };

  // Store the last AI analysis results for dynamic toggle updates
  let lastAnalysisResults = [];
  
  // Current toggle states
  let currentToggleStates = {
    malicious: true,
    trackers: true,
    ai: true,
    misinformation: true
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
    
    // Find all videos on the page
    const videoData = getAllVideosOnPage();
    console.log(`Found ${videoData.length} video(s) on the page`);
    
    // Send video count and URLs to popup
    chrome.runtime.sendMessage({
      action: 'videoCount',
      count: videoData.length,
      videos: videoData
    });
    
    return elements;
  }
  
  // Get all video elements on the page
  function getAllVideosOnPage() {
    const videos = [];
    const currentUrl = window.location.href;

    // 1. Prioritize Social Media/Video Platforms (Use Page URL)
    // yt-dlp works best with the main page URL for these sites
    const isSocialVideoSite = 
      currentUrl.includes('youtube.com/watch') || 
      currentUrl.includes('youtube.com/shorts/') ||
      currentUrl.includes('youtu.be/') ||
      currentUrl.includes('tiktok.com/') ||
      currentUrl.includes('instagram.com/reels/') ||
      currentUrl.includes('instagram.com/p/');

    if (isSocialVideoSite) {
      console.log('📍 Social media site detected, using Page URL for analysis.');
      videos.push({ 
        url: currentUrl, 
        type: 'platform_url' 
      });
      // On these sites, the <video> tags are usually blobs, so we stop here.
      return videos; 
    }
    
    // 2. Fallback: Find standard <video> elements for non-platform sites
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach((video) => {
      const src = video.src || video.currentSrc || video.getAttribute('src');
      
      // VALIDATION: Only push if it's a real URL and NOT a blob
      if (src && src.startsWith('http') && !src.startsWith('blob:')) {
        videos.push({ url: src, type: 'direct_video' });
      }
    });

    // 3. Check for IFrames (YouTube/Vimeo Embeds)
    const embeds = document.querySelectorAll('iframe');
    embeds.forEach((iframe) => {
      const src = iframe.src;
      if (!src) return;

      if (src.includes('youtube.com/embed/') || src.includes('player.vimeo.com/video/')) {
        // For embeds, the iframe src is a valid URL that yt-dlp can usually parse
        videos.push({ url: src, type: 'embed' });
      }
    });

    // 4. Deduplicate results (in case a site has multiple tags for one video)
    const uniqueVideos = Array.from(new Set(videos.map(v => v.url)))
      .map(url => videos.find(v => v.url === url));

    return uniqueVideos;
  }

  function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit int
  }
  return hash.toString();
}

  // Scan page with Gemini AI and respect enabled threats
  async function scanPage(enabledThreats = null) {
    console.log('🔍 Starting Gemini-powered scan...');
    console.log('🔍 Available on window:', Object.keys(window));
    console.log('🔍 GeminiService available:', typeof window.GeminiService);
    console.log('🔍 Enabled threats:', enabledThreats);
    const thisScanId = ++activeScanId;
    
    // Clear previous results
    clearHighlights();
    scanResults = { malicious: 0, trackers: 0, ai: 0, misinformation: 0 };

    // Collect sample items per category for the popup (we'll limit display there)
    const itemsByCategory = { malicious: [], trackers: [], ai: [], misinformation: [] };

    const storageResult = await chrome.storage.local.get(['safeElements']);
    const safeElements = storageResult.safeElements || {};
    const domain = window.location.hostname;
    

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
      
      // Abort if a newer scan started
      if (thisScanId !== activeScanId) {
        console.log('⛔ Aborting outdated scan');
        return scanResults;
      }

      try {
        const analysis = await window.GeminiService.analyzeContent(batch);
        
        if (analysis.error) {
          console.error('Analysis error:', analysis.error);
          scanResults.error = analysis.error;
          continue;
        }

        // Process results and check if threat type is enabled
        if (analysis.results && Array.isArray(analysis.results)) {
          console.log(`Received ${analysis.results.length} flagged items from batch ${i + 1}`);
          
          // Filter out safe elements BEFORE storing
          const filteredResults = analysis.results.filter(result => {
            const element = document.querySelector(`[data-scanner-temp-id="${result.elementId}"]`);
            if (element && result.category) {
              const elementText = element.textContent.substring(0, 200);
              const textHash = hashText(elementText);
              const safeKey = `${domain}:${textHash}`;

              if (safeElements[safeKey]) {
                return;
              }
              // Add permanent scanner ID for later reference (used by popup to jump)
              const permanentId = `scanner-permanent-${elementIdCounter++}`;
              element.setAttribute('data-scanner-permanent-id', permanentId);
              result.permanentId = permanentId;

              // Save a short sample for the popup (avoid heavy payloads) including permanentId
              try {
                const snippet = (element.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 300);
                if (itemsByCategory[result.category] && itemsByCategory[result.category].length < 50) {
                  itemsByCategory[result.category].push({
                    permanentId,
                    snippet,
                    reason: result.reason || null,
                    confidence: result.confidence || null
                  });
                }
              } catch (e) {
                // ignore snippet extraction errors
              }
              
              // Only highlight if this threat type is enabled
              const shouldHighlight = !enabledThreats || enabledThreats[result.category] === true;
              
              if (shouldHighlight) {
                highlightElement(element, result.category, result.reason, result.confidence);
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

    // Clean up temporary IDs but keep permanent ones
    document.querySelectorAll('[data-scanner-temp-id]').forEach(el => {
      el.removeAttribute('data-scanner-temp-id');
    });

    // Update current toggle states
    currentToggleStates = enabledThreats || currentToggleStates;

    console.log('Scan complete:', scanResults);
    console.log('Stored analysis results:', lastAnalysisResults.length);
    // Return counts plus collected example items (popup will show the first 5)
    return Object.assign({}, scanResults, { items: itemsByCategory });
  }

  // Highlight an element and add interactive label
  function highlightElement(element, type, reason, confidence) {
    element.classList.add('scanner-highlight', `scanner-${type}`);
    
    // Generate unique ID for this element
    const elementId = `scanner-element-${elementIdCounter++}`;
    element.setAttribute('data-scanner-id', elementId);
    
    // Create label element
    const label = createLabel(type, elementId, reason, confidence);
    
    element.appendChild(label);
  }

  // Create interactive label with hover functionality
  function createLabel(type, elementId, reason, confidence) {
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
    const tooltip = createTooltip(type, elementId, reason, confidence);
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
  function createTooltip(type, elementId, reason, confidence) {
    const tooltip = document.createElement('div');
    tooltip.className = 'scanner-tooltip';
    
    // Description
    const description = document.createElement('div');
    description.className = 'scanner-tooltip-description';
    
    // Use AI-provided reason if available, otherwise use default
    let tooltipText = reason ? reason : DESCRIPTIONS[type];
    
    // Add confidence if available
    if (confidence !== undefined) {
      tooltipText += ' [Confidence: ' + Math.round(confidence * 100) + '%]';
    }
    
    description.textContent = tooltipText;
    
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
        const textSnippet = element.textContent.substring(0, 200);
        const textHash = hashText(textSnippet);
        const key = `${domain}:${textHash}`;

        safeElements[key] = {
          text: textSnippet,
          hash: textHash,
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

  // Apply highlighting based on current analysis results and toggle states
  function applyHighlightingFromStoredResults(toggleStates) {
    // Clear all current highlights first
    clearHighlights();
    scanResults = { malicious: 0, trackers: 0, ai: 0, misinformation: 0 };
    
    // Re-apply highlights based on stored results and current toggle states
    lastAnalysisResults.forEach(result => {
      const element = document.querySelector(`[data-scanner-permanent-id="${result.permanentId}"]`);
      if (element && result.category && toggleStates[result.category] === true) {
        highlightElement(element, result.category, result.reason, result.confidence);
        scanResults[result.category]++;
      }
    });
    
    console.log('Re-applied highlights based on toggle states:', toggleStates);
    console.log('Updated scan results:', scanResults);
  }

  // Listen for messages from popup and options
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📥 CONTENT: Received message:', request);

    // Handle toggle state updates from options page
    if (request.action === 'updateToggleStates') {
      console.log('📥 CONTENT: Updating toggle states:', request.toggleStates);
      currentToggleStates = request.toggleStates;
      
      // Re-apply highlighting based on stored results and new toggle states
      if (lastAnalysisResults.length > 0) {
        applyHighlightingFromStoredResults(request.toggleStates);
      }
      
      sendResponse({ updated: true, scanResults: scanResults });
      return true;
    }

    // Clear highlights handler
    if (request.action === 'clearScanHighlights') {
      clearHighlights();
      scanResults = { malicious: 0, trackers: 0, ai: 0, misinformation: 0 };
      lastAnalysisResults = []; // Clear stored results too
      sendResponse({ cleared: true });
      return true;
    }

    if (request.action === 'getScanResults') {
      console.log('📥 CONTENT: Starting scan with Gemini...');
      console.log('📥 CONTENT: Enabled threats:', request.enabledThreats);
      
      // Clear previous analysis results
      lastAnalysisResults = [];
      
      // Run scan with Gemini and pass enabled threats
      scanPage(request.enabledThreats).then(results => {
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

    // Jump to element request from popup (smooth scroll + highlight)
    if (request.action === 'jumpToElement' && request.permanentId) {
      try {
        const el = document.querySelector(`[data-scanner-permanent-id="${request.permanentId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          // Flash outline
          const prevOutline = el.style.outline;
          el.style.outline = '4px solid #ffd54f';
          el.style.transition = 'outline 0.3s ease';
          setTimeout(() => {
            el.style.outline = prevOutline || '';
          }, 2500);
          sendResponse({ jumped: true });
        } else {
          // Not found
          sendResponse({ jumped: false, error: 'element not found' });
        }
      } catch (e) {
        console.error('Error jumping to element:', e);
        sendResponse({ jumped: false, error: e.message });
      }
      return true;
    }
  });
})();
