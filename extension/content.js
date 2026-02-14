// Content script that runs on the page
(function() {
  'use strict';

  // Store scan results
  let scanResults = {
    malicious: 0,
    trackers: 0,
    ai: 0,
    misinformation: 0
  };

  // Keywords to detect (fake detection for now)
  const MALICIOUS_KEYWORDS = ['this is malicious', 'malicious link', 'dangerous'];
  const TRACKER_KEYWORDS = ['tracker', 'tracking', 'pixel', 'facebook pixel', 'google analytics'];
  const AI_KEYWORDS = ['this is AI', 'ai generated', 'ai-generated', 'generated with ai'];
  const MISINFORMATION_KEYWORDS = ['this is false', 'misinformation', 'false claim', 'misleading'];

  // Hardcoded descriptions for each category
  const DESCRIPTIONS = {
    malicious: 'This content contains patterns commonly associated with phishing attempts, malware distribution, or other malicious activities. The language and structure suggest potential security risks.',
    ai: 'This content shows characteristics typical of AI-generated text, including repetitive patterns, unnatural phrasing, or potential misinformation. It may lack proper source attribution or contain unverified claims.'
  };

  // Generate unique ID for elements
  let elementIdCounter = 0;

  // Clear any existing highlights and labels
  function clearHighlights() {
    document.querySelectorAll('.scanner-highlight').forEach(el => {
      el.classList.remove('scanner-highlight', 'scanner-malicious', 'scanner-ai');
      // Remove any attached labels
      const label = el.querySelector('.scanner-label');
      if (label) label.remove();
    });
    // Remove any orphaned tooltips
    document.querySelectorAll('.scanner-tooltip').forEach(tooltip => tooltip.remove());
  }

  // Scan text nodes for keywords
  function scanElement(element) {
    const text = element.textContent.toLowerCase();
    
    // Check for malicious content (highest priority)
    for (const keyword of MALICIOUS_KEYWORDS) {
      if (text.includes(keyword)) {
        highlightElement(element, 'malicious');
        scanResults.malicious++;
        return; // Only apply one highlight per element
      }
    }

    // Check for tracker links
    for (const keyword of TRACKER_KEYWORDS) {
      if (text.includes(keyword)) {
        highlightElement(element, 'trackers');
        scanResults.trackers++;
        return;
      }
    }

    // Check for AI-generated content
    for (const keyword of AI_KEYWORDS) {
      if (text.includes(keyword)) {
        highlightElement(element, 'ai');
        scanResults.ai++;
        return;
      }
    }

    // Check for misinformation (lowest priority)
    for (const keyword of MISINFORMATION_KEYWORDS) {
      if (text.includes(keyword)) {
        highlightElement(element, 'misinformation');
        scanResults.misinformation++;
        return;
      }
    }
  }

  // Highlight an element and add interactive label
  function highlightElement(element, type) {
    element.classList.add('scanner-highlight', `scanner-${type}`);
    
    // Generate unique ID for this element
    const elementId = `scanner-element-${elementIdCounter++}`;
    element.setAttribute('data-scanner-id', elementId);
    
    // Create label element
    const label = createLabel(type, elementId);
    
    // Position label relative to element
    element.style.position = 'relative';
    element.appendChild(label);
  }

  // Create interactive label with hover functionality
  function createLabel(type, elementId) {
    const label = document.createElement('div');
    label.className = `scanner-label scanner-label-${type}`;
    label.textContent = type === 'malicious' ? '🚨 Malicious' : '⚠️ AI/Misinformation';
    
    // Create tooltip (hidden by default)
    const tooltip = createTooltip(type, elementId);
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
  function createTooltip(type, elementId) {
    const tooltip = document.createElement('div');
    tooltip.className = 'scanner-tooltip';
    
    // Description
    const description = document.createElement('div');
    description.className = 'scanner-tooltip-description';
    description.textContent = DESCRIPTIONS[type];
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
      // Get existing safe list
      const result = await chrome.storage.local.get(['safeElements']);
      const safeElements = result.safeElements || {};
      
      // Add this element to safe list
      // Key format: domain:elementHash or domain:elementText
      const domain = window.location.hostname;
      const key = `${domain}:${elementId}`;
      
      safeElements[key] = {
        text: element.textContent.substring(0, 100), // Store snippet for reference
        markedAt: Date.now(),
        type: type,
        url: window.location.href
      };
      
      // Save back to storage
      await chrome.storage.local.set({ safeElements });
      console.log('Saved to safe list:', key);
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
    if (type === 'malicious') {
      scanResults.malicious = Math.max(0, scanResults.malicious - 1);
    } else {
      scanResults.ai = Math.max(0, scanResults.ai - 1);
    }
    
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

  // Scan all text-containing elements
  function scanPage() {
    // Clear previous results
    clearHighlights();
    scanResults = { malicious: 0, trackers: 0, ai: 0, misinformation: 0 };

    // Get all elements with text content
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th');
    
    textElements.forEach(element => {
      // Skip if element is too large (likely a container)
      if (element.children.length > 3) return;
      
      // Skip if no direct text content
      const directText = Array.from(element.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join(' ');
      
      if (directText.length > 0) {
        scanElement(element);
      }
    });

    // Also scan links specifically
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.href.toLowerCase();
      const text = link.textContent.toLowerCase();
      
      // Check if link is "malicious"
      for (const keyword of MALICIOUS_KEYWORDS) {
        if (href.includes(keyword) || text.includes(keyword)) {
          highlightElement(link, 'malicious');
          scanResults.malicious++;
          return;
        }
      }

      // Check if link is a tracker
      for (const keyword of TRACKER_KEYWORDS) {
        if (href.includes(keyword) || text.includes(keyword)) {
          highlightElement(link, 'trackers');
          scanResults.trackers++;
          return;
        }
      }
    });

    console.log('Scan complete:', scanResults);
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getScanResults') {
      // Run scan
      scanPage();
      
      // Send results back
      sendResponse(scanResults);
    }
  });

  // Auto-scan on load (optional)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanPage);
  } else {
    scanPage();
  }
})();