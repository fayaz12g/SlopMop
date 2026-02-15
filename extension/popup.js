// Get references to DOM elements
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const settingsBtn = document.getElementById('settingsBtn');
const backBtn = document.getElementById('backBtn');

const scanningDiv = document.getElementById('scanning');
const resultsDiv = document.getElementById('results');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const checkIcon = document.getElementById('checkIcon');
const warningIcon = document.getElementById('warningIcon');
const maliciousSection = document.getElementById('maliciousSection');
const trackersSection = document.getElementById('trackersSection');
const aiSection = document.getElementById('aiSection');
const misinformationSection = document.getElementById('misinformationSection');
const maliciousCount = document.getElementById('maliciousCount');
const trackersCount = document.getElementById('trackersCount');
const aiCount = document.getElementById('aiCount');
const misinformationCount = document.getElementById('misinformationCount');
const rescanBtn = document.getElementById('rescanBtn');
const scanBtn = document.getElementById('scanBtn');
const scanSection = document.getElementById('scanSection');

// Settings elements
const apiKeyInput = document.getElementById('apiKey');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMessage = document.getElementById('statusMessage');
const apiStatusBadge = document.getElementById('apiStatusBadge');
const apiStatusText = document.getElementById('apiStatusText');
const resetSafeBtn = document.getElementById('resetSafeBtn');

// Toggle states stored in chrome storage
const threatToggles = {
  malicious: document.getElementById('toggle-malicious'),
  trackers: document.getElementById('toggle-trackers'),
  ai: document.getElementById('toggle-ai'),
  misinformation: document.getElementById('toggle-misinformation')
};

// Store toggle states
const toggleStates = {
  malicious: true,
  trackers: true,
  ai: true,
  misinformation: true
};

// Initialize popup when opened
document.addEventListener('DOMContentLoaded', () => {
  loadToggleStates();
  addToggleListeners();
  loadApiKey();
  checkApiKeyStatus();

  // View switching
  if (settingsBtn) settingsBtn.addEventListener('click', showSettings);
  if (backBtn) backBtn.addEventListener('click', showMain);

  // reset button listener
  resetSafeBtn.addEventListener('click', resetSafeElements);

  // Scan button handler
  if (scanBtn) scanBtn.addEventListener('click', () => { scanPage(); });

  // Settings handlers
  if (saveBtn) saveBtn.addEventListener('click', saveApiKey);
  if (clearBtn) clearBtn.addEventListener('click', clearApiKey);
  if (apiKeyInput) apiKeyInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveApiKey(); });

  // Safety timeout: if still scanning after 3 seconds, show API key warning
  setTimeout(() => {
    if (!scanningDiv.classList.contains('hidden')) {
      console.log('Safety timeout: forcing API key warning display');
      showApiKeyWarning();
    }
  }, 3000);
});

// View Management
function showSettings() {
  mainView.classList.add('hidden');
  settingsView.classList.remove('hidden');
  loadApiKey(); // Refresh API key display
}

function showMain() {
  settingsView.classList.add('hidden');
  mainView.classList.remove('hidden');
}

// API Key Management
function loadApiKey() {
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
      updateApiStatus(true);
    } else {
      apiKeyInput.value = '';
      updateApiStatus(false);
    }
  });
}

function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showMessage('Please enter an API key', 'error');
    return;
  }

  // Basic validation
  if (!apiKey.startsWith('AIza')) {
    showMessage('Invalid API key format. Gemini API keys typically start with "AIza"', 'error');
    return;
  }

  // Save to storage
  chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
    if (chrome.runtime.lastError) {
      showMessage('Error saving API key: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showMessage('API key saved successfully!', 'success');
      updateApiStatus(true);
      
      // Auto-hide success message and return to main view after 1.5 seconds
      setTimeout(() => {
        statusMessage.style.display = 'none';
        showMain();
        // Trigger a scan with the new API key
        scanPage();
      }, 1500);
    }
  });
}

function resetSafeElements() {
  if (!confirm('Are you sure you want to clear all marked safe elements?')) {
    return;
  }

  chrome.storage.local.remove('safeElements', () => {
    if (chrome.runtime.lastError) {
      showMessage('Error clearing safe list: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showMessage('Safe list cleared successfully!', 'success');
      console.log('All safe elements removed');
    }
  });
}

function clearApiKey() {
  chrome.storage.local.remove('geminiApiKey', () => {
    apiKeyInput.value = '';
    showMessage('API key cleared', 'success');
    updateApiStatus(false);
    
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 2000);
  });
}

function showMessage(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';
}

function updateApiStatus(isConfigured) {
  if (isConfigured) {
    apiStatusBadge.className = 'api-status-badge configured';
    apiStatusText.textContent = 'API Key Configured ✓';
  } else {
    apiStatusBadge.className = 'api-status-badge not-configured';
    apiStatusText.textContent = 'API Key Not Configured';
  }
}

// Check if API key is configured (without auto-scanning)
async function checkApiKeyStatus() {
  try {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        showApiKeyWarning();
        return;
      }
      if (!result.geminiApiKey) {
        showApiKeyWarning();
      } else {
        // API key is configured, show scan button
        showScanReady();
      }
    });
  } catch (error) {
    console.error('Error checking API key:', error);
    showApiKeyWarning();
  }
}

// Show ready-to-scan state
function showScanReady() {
  scanSection.classList.remove('hidden');
  scanningDiv.classList.add('hidden');
  resultsDiv.classList.add('hidden');
  
  // Clear any previous API status messages in main view
  const apiMessage = document.querySelector('.api-key-message');
  if (apiMessage) {
    apiMessage.remove();
  }
}

// Show warning if API key is not configured
function showApiKeyWarning() {
  scanSection.classList.add('hidden');
  scanningDiv.classList.add('hidden');
  resultsDiv.classList.remove('hidden');
  
  statusIndicator.className = 'status-indicator status-warning';
  checkIcon.classList.add('hidden');
  warningIcon.classList.remove('hidden');
  statusText.textContent = 'API Key Required';
  
  // Hide all sections
  maliciousSection.style.display = 'none';
  trackersSection.style.display = 'none';
  aiSection.style.display = 'none';
  misinformationSection.style.display = 'none';
  
  // Update rescan button to open settings
  rescanBtn.textContent = 'Configure API Key';
  rescanBtn.onclick = () => {
    showSettings();
  };
}

// Load toggle states from storage
function loadToggleStates() {
  chrome.storage.local.get(['threatToggles'], (result) => {
    if (result.threatToggles) {
      Object.assign(toggleStates, result.threatToggles);
      updateToggleUI();
    }
  });
}

// Update toggle UI based on state
function updateToggleUI() {
  Object.entries(toggleStates).forEach(([key, value]) => {
    if (threatToggles[key]) {
      threatToggles[key].checked = value;
    }
  });
}

// Add listeners to different toggle switches
function addToggleListeners() {
  Object.entries(threatToggles).forEach(([key, toggle]) => {
    if (!toggle) return;
    toggle.addEventListener('change', (e) => {
      toggleStates[key] = e.target.checked;
      chrome.storage.local.set({ threatToggles: toggleStates });
      
      // Notify content scripts of the toggle change
      notifyContentScriptsOfToggleChange(toggleStates);
    });
  });
}

// Notify all content scripts when toggle states change  
async function notifyContentScriptsOfToggleChange(toggleStates) {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Skip browser internal pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('about:') || tab.url.startsWith('moz-extension://')) {
      return;
    }
    
    try {
      // Send toggle update message to the active tab's content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'updateToggleStates',
        toggleStates: toggleStates
      });
      
      console.log(`Popup notified content script of toggle change:`, response);
      
      // Update the displayed results based on new toggle states
      if (response && response.scanResults) {
        displayResults(response.scanResults);
      }
    } catch (error) {
      // Content script might not be loaded or no scan results yet
      console.log(`Couldn't notify content script:`, error.message);
    }
  } catch (error) {
    console.error('Error notifying content script:', error);
  }
}

async function scanPage() {
  // Check if API key is configured first
  const hasKey = await new Promise((resolve) => {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      resolve(!!result.geminiApiKey);
    });
  });

  if (!hasKey) {
    showApiKeyWarning();
    return;
  }

  // Reset rescan button if it was changed
  rescanBtn.textContent = 'Rescan Page';

  // Rescan button handler
  rescanBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
      // Tell content script to clear all existing overlays/highlights
      await chrome.tabs.sendMessage(tab.id, { action: 'clearScanHighlights' });
    } catch (e) {
      console.warn('No content script to clear (probably first scan)');
    }

    // Now perform fresh scan
    scanPage();
  });

  // Show scanning state with progress
  scanSection.classList.add('hidden');
  scanningDiv.classList.remove('hidden');
  resultsDiv.classList.add('hidden');
  
  // Update scanning text to show progress
  updateScanProgress('Initializing scan...', 0);

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Check if we can access this page
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:') || tab.url.startsWith('moz-extension://')) {
    displayError('Cannot scan browser internal pages');
    return;
  }

  // Inject and execute content scripts
  try {
    // First inject gemini.js, then content.js
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['gemini.js']
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Wait a bit for scripts to load
    console.log('🔌 POPUP: Scripts injected, waiting 500ms...');
    setTimeout(async () => {
      try {
        console.log('🔌 POPUP: Sending getScanResults message to tab', tab.id);
        // Get results from content script
        const results = await chrome.tabs.sendMessage(tab.id, { 
          action: 'getScanResults',
          enabledThreats: toggleStates
        });
        
        console.log('🔌 POPUP: Received scan results:', results);
        displayResults(results);
      } catch (error) {
        console.error('🔌 POPUP ERROR getting scan results:', error);
        displayError('Scan failed. Please try again.');
      }
    }, 500);
  } catch (error) {
    console.error('Error scanning page:', error);
    displayError('Unable to scan this page');
  }
}

function displayResults(results) {
  // Check for API errors
  if (results.error) {
    let message = 'Error scanning page';
    if (results.error.includes('429')) {
      message = 'Rate limit exceeded. Please wait a moment before scanning again.';
    } else if (results.error.includes('API key') || results.error.includes('API_KEY')) {
      message = 'Invalid API key. Please check your settings.';
    } else if (results.error.includes('network') || results.error.includes('fetch')) {
      message = 'Network error. Please check your connection.';
    } else {
      message = 'Scan failed: ' + results.error;
    }
    displayError(message);
    return;
  }
  
  // Hide scanning, show results
  scanningDiv.classList.add('hidden');
  resultsDiv.classList.remove('hidden');
  scanSection.classList.add('hidden');

  const malicious = results.malicious || 0;
  const trackers = results.trackers || 0;
  const ai = results.ai || 0;
  const misinformation = results.misinformation || 0;

  // Update counts
  maliciousCount.textContent = `${malicious} item${malicious !== 1 ? 's' : ''} found`;
  trackersCount.textContent = `${trackers} item${trackers !== 1 ? 's' : ''} found`;
  aiCount.textContent = `${ai} item${ai !== 1 ? 's' : ''} found`;
  misinformationCount.textContent = `${misinformation} item${misinformation !== 1 ? 's' : ''} found`;

  // Show/hide sections based on findings and toggle state
  if (maliciousSection) maliciousSection.style.display = (malicious > 0 && toggleStates.malicious) ? 'block' : 'none';
  if (trackersSection) trackersSection.style.display = (trackers > 0 && toggleStates.trackers) ? 'block' : 'none';
  if (aiSection) aiSection.style.display = (ai > 0 && toggleStates.ai) ? 'block' : 'none';
  if (misinformationSection) misinformationSection.style.display = (misinformation > 0 && toggleStates.misinformation) ? 'block' : 'none';

  // Helper to render first up to 5 examples for a category
  function renderExamplesForCategory(category, containerId, toggleBtnId) {
    let container = document.getElementById(containerId);
    let toggleBtn = document.getElementById(toggleBtnId);
    // If elements don't exist (older popup markup), create them
    const sectionMap = {
      malicious: 'maliciousSection',
      trackers: 'trackersSection',
      ai: 'aiSection',
      misinformation: 'misinformationSection'
    };
    const parentSection = document.getElementById(sectionMap[category]);
    if (parentSection && !toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.className = 'examples-toggle';
      toggleBtn.id = toggleBtnId;
      parentSection.appendChild(toggleBtn);
    }
    if (parentSection && !container) {
      container = document.createElement('div');
      container.className = 'examples-list hidden';
      container.id = containerId;
      parentSection.appendChild(container);
    }
    // Clear existing
    if (!container) return;
    container.innerHTML = '';

    const items = (results.items && results.items[category]) ? results.items[category] : [];
    const total = items.length;
    const shown = Math.min(5, total);

    if (total === 0) {
      if (container) container.innerHTML = '<div class="example-empty">No examples</div>';
      if (toggleBtn) toggleBtn.style.display = 'none';
      console.log(`Popup: no examples for ${category}`);
      return;
    }

    if (toggleBtn) {
      toggleBtn.style.display = 'inline-block';
      toggleBtn.textContent = `Threats Found (${shown})`;
      // Ensure toggle hides/shows the container
      toggleBtn.onclick = () => {
        const hidden = container.classList.toggle('hidden');
        toggleBtn.textContent = hidden ? `Threats Found (${shown})` : `Hide Threats (${shown})`;
      };
    }

    // Render the first N items as streamlined entries with a Jump button
    const list = document.createElement('div');
    list.className = 'examples-list-inner';
    for (let i = 0; i < shown; i++) {
      const it = items[i];
      const itemDiv = document.createElement('div');
      itemDiv.className = 'example-item';

      const label = document.createElement('div');
      label.className = 'example-label';
      // Show only the threat level (derived from confidence) as the visible label
      const confVal = (typeof it.confidence === 'number') ? it.confidence : (it.confidence ? Number(it.confidence) : null);
      let threatLevel = 'Unknown';
      if (confVal !== null && !isNaN(confVal)) {
        if (confVal >= 0.8) threatLevel = 'High';
        else if (confVal >= 0.5) threatLevel = 'Medium';
        else threatLevel = 'Low';
      }
      label.textContent = threatLevel;
      // Hover shows the AI reason if available (no snippet)
      label.title = it.reason || '';
      itemDiv.appendChild(label);

      // Optional confidence indicator
      if (it.confidence) {
        const conf = document.createElement('div');
        conf.className = 'example-confidence';
        conf.textContent = `Confidence: ${Math.round((it.confidence || 0) * 100)}%`;
        itemDiv.appendChild(conf);
      }

      const jumpBtn = document.createElement('button');
      jumpBtn.className = 'example-jump-btn';
      jumpBtn.textContent = 'Jump';
      jumpBtn.onclick = async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab) return;

          // First try: ask content script to jump (preferred)
          try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'jumpToElement', permanentId: it.permanentId });
            console.log('Jump response from content script:', response);
            if (response && response.jumped) return;
          } catch (msgErr) {
            console.warn('Jump message to content script failed, will try fallback executeScript', msgErr);
          }

          // Fallback: inject a small script into the page to find the element and scroll to it.
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (pid) => {
                try {
                  const el = document.querySelector(`[data-scanner-permanent-id="${pid}"]`);
                  if (!el) return { jumped: false, error: 'not-found' };
                  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                  const prevOutline = el.style.outline;
                  el.style.outline = '4px solid #ffd54f';
                  setTimeout(() => { el.style.outline = prevOutline || ''; }, 2500);
                  return { jumped: true };
                } catch (e) {
                  return { jumped: false, error: e && e.message };
                }
              },
              args: [it.permanentId]
            });
            console.log('Fallback jump executed via scripting API');
          } catch (execErr) {
            console.error('Fallback executeScript jump failed:', execErr);
          }
        } catch (e) {
          console.error('Error during jump handling:', e);
        }
      };

      itemDiv.appendChild(jumpBtn);
      list.appendChild(itemDiv);
    }
    container.appendChild(list);
    // Keep container hidden until user toggles
    container.classList.add('hidden');
  }

  // Render examples for each category
  try {
    renderExamplesForCategory('malicious', 'maliciousExamples', 'maliciousToggleBtn');
    renderExamplesForCategory('trackers', 'trackersExamples', 'trackersToggleBtn');
    renderExamplesForCategory('ai', 'aiExamples', 'aiToggleBtn');
    renderExamplesForCategory('misinformation', 'misinformationExamples', 'misinformationToggleBtn');
  } catch (e) {
    console.warn('Error rendering examples:', e);
  }

  // Calculate visible total based on enabled threats
  let visibleTotal = 0;
  if (toggleStates.malicious) visibleTotal += malicious;
  if (toggleStates.trackers) visibleTotal += trackers;
  if (toggleStates.ai) visibleTotal += ai;
  if (toggleStates.misinformation) visibleTotal += misinformation;

  // Create or get disclaimer element dynamically
  let disclaimerEl = document.getElementById('resultsDisclaimer');
  if (!disclaimerEl) {
    disclaimerEl = document.createElement('div');
    disclaimerEl.id = 'resultsDisclaimer';
    disclaimerEl.className = 'disclaimer hidden';
    disclaimerEl.textContent = 'Note: only the first 5 results per threat category are shown here.';
    const findings = document.querySelector('.findings');
    if (findings && findings.parentNode) {
      findings.parentNode.insertBefore(disclaimerEl, findings.nextSibling);
    }
  }

  // Update status indicator
  if (visibleTotal === 0) {
    // All clear
    statusIndicator.className = 'status-indicator status-safe';
    checkIcon.classList.remove('hidden');
    warningIcon.classList.add('hidden');
    statusText.textContent = 'All Clear!';
    if (disclaimerEl) disclaimerEl.classList.add('hidden');
  } else {
    // Issues found
    statusIndicator.className = 'status-indicator status-warning';
    checkIcon.classList.add('hidden');
    warningIcon.classList.remove('hidden');
    statusText.textContent = `${visibleTotal} Issue${visibleTotal !== 1 ? 's' : ''} Found`;
    if (disclaimerEl) disclaimerEl.classList.remove('hidden');
  }
}

function displayError(message) {
  scanningDiv.classList.add('hidden');
  resultsDiv.classList.remove('hidden');
  scanSection.classList.add('hidden');
  
  statusIndicator.className = 'status-indicator status-error';
  checkIcon.classList.add('hidden');
  warningIcon.classList.remove('hidden');
  statusText.textContent = message || 'Error scanning page';
  
  // Hide all sections
  maliciousSection.style.display = 'none';
  trackersSection.style.display = 'none';
  aiSection.style.display = 'none';
  misinformationSection.style.display = 'none';
  
  // Hide video section if exists
  const videoSection = document.getElementById('videoSection');
  if (videoSection) {
    videoSection.style.display = 'none';
  }
}

// Update scanning progress with message and percentage
function updateScanProgress(message, percentage) {
  const scanText = scanningDiv.querySelector('p');
  if (scanText) {
    scanText.textContent = message;
  }
  
  // Add percentage if we want to show it (future enhancement)
  if (percentage !== undefined) {
    const progressBar = scanningDiv.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = percentage + '%';
    }
  }
}

// Listen for video analysis requests from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'videoCount') {
    console.log('Video count:', request.count);
    
    // Show video count in popup
    const findings = document.querySelector('.findings');
    if (findings) {
      // Remove existing video section if present
      const existingVideoSection = document.getElementById('videoSection');
      if (existingVideoSection) {
        existingVideoSection.remove();
      }
      
      let videosHtml = '';
      if (request.videos && request.videos.length > 0) {
        videosHtml = request.videos.map(v => 
          `<a href="${v.url}" class="video-link" target="_blank">${v.url}</a>`
        ).join('');
      }
      
      const videoSection = document.createElement('div');
      videoSection.className = 'finding-section';
      videoSection.id = 'videoSection';
      videoSection.innerHTML = `
        <h3>🎥 Videos</h3>
        <div class="finding-content">
          <p class="count">${request.count} video${request.count !== 1 ? 's' : ''} detected on this page</p>
          <div class="video-links">${videosHtml}</div>
        </div>
      `;
      findings.appendChild(videoSection);
    }
    
    sendResponse({ received: true, count: request.count });
  }
  
  if (request.action === 'analyzeVideo') {
    console.log('Video detected on page:', request.videoUrl);
    
    // Show video found indicator in popup
    const findings = document.querySelector('.findings');
    if (findings) {
      const videoFound = document.createElement('div');
      videoFound.className = 'finding-section';
      videoFound.id = 'videoSection';
      videoFound.innerHTML = `
        <div class="finding-header">
          <span class="finding-icon">🎬</span>
          <span class="finding-title">Video Found</span>
        </div>
        <div class="finding-content">
          <p class="video-url">${request.videoUrl}</p>
          <p class="video-type">Type: ${request.videoType}</p>
        </div>
      `;
      findings.appendChild(videoFound);
    }
    
    // TODO: Integrate with Twelve Labs API
    // To use twelvelabs.js, you need a backend service since it requires Node.js modules.
    // The video URL is available at: request.videoUrl
    // Call your backend API endpoint here to run the analysis
    
    sendResponse({ received: true, videoUrl: request.videoUrl });
  }
  return true;
});