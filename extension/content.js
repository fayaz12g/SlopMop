// Content script that runs on the page
(function() {
  'use strict';

  // Store scan results
  let scanResults = {
    malicious: 0,
    ai: 0
  };

  // Keywords to detect (fake detection for now)
  const MALICIOUS_KEYWORDS = ['this is malicious', 'malicious link', 'dangerous'];
  const AI_KEYWORDS = ['this is AI', 'ai generated', 'this is false', 'misinformation'];

  // Clear any existing highlights
  function clearHighlights() {
    document.querySelectorAll('.scanner-highlight').forEach(el => {
      el.classList.remove('scanner-highlight', 'scanner-malicious', 'scanner-ai');
    });
  }

  // Scan text nodes for keywords
  function scanElement(element) {
    const text = element.textContent.toLowerCase();
    
    // Check for malicious content
    for (const keyword of MALICIOUS_KEYWORDS) {
      if (text.includes(keyword)) {
        highlightElement(element, 'malicious');
        scanResults.malicious++;
        return; // Only apply one highlight per element
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
  }

  // Highlight an element
  function highlightElement(element, type) {
    element.classList.add('scanner-highlight', `scanner-${type}`);
  }

  // Scan all text-containing elements
  function scanPage() {
    // Clear previous results
    clearHighlights();
    scanResults = { malicious: 0, ai: 0 };

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
          break;
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
