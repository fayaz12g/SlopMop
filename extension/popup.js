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
  settingsBtn.addEventListener('click', showSettings);
  backBtn.addEventListener('click', showMain);

  // Scan button handler
  scanBtn.addEventListener('click', () => {
    scanPage();
  });

  // Settings handlers
  saveBtn.addEventListener('click', saveApiKey);
  clearBtn.addEventListener('click', clearApiKey);
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveApiKey();
  });

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
    toggle.addEventListener('change', (e) => {
      toggleStates[key] = e.target.checked;
      chrome.storage.local.set({ threatToggles: toggleStates });
    });
  });
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
  maliciousSection.style.display = (malicious > 0 && toggleStates.malicious) ? 'block' : 'none';
  trackersSection.style.display = (trackers > 0 && toggleStates.trackers) ? 'block' : 'none';
  aiSection.style.display = (ai > 0 && toggleStates.ai) ? 'block' : 'none';
  misinformationSection.style.display = (misinformation > 0 && toggleStates.misinformation) ? 'block' : 'none';

  // Calculate visible total based on enabled threats
  let visibleTotal = 0;
  if (toggleStates.malicious) visibleTotal += malicious;
  if (toggleStates.trackers) visibleTotal += trackers;
  if (toggleStates.ai) visibleTotal += ai;
  if (toggleStates.misinformation) visibleTotal += misinformation;

  // Update status indicator
  if (visibleTotal === 0) {
    // All clear
    statusIndicator.className = 'status-indicator status-safe';
    checkIcon.classList.remove('hidden');
    warningIcon.classList.add('hidden');
    statusText.textContent = 'All Clear!';
  } else {
    // Issues found
    statusIndicator.className = 'status-indicator status-warning';
    checkIcon.classList.add('hidden');
    warningIcon.classList.remove('hidden');
    statusText.textContent = `${visibleTotal} Issue${visibleTotal !== 1 ? 's' : ''} Found`;
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