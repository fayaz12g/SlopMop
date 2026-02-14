// Get references to DOM elements
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

// Run scan when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadToggleStates();
  addToggleListeners();
  scanPage();
});

// Rescan button handler
rescanBtn.addEventListener('click', () => {
  scanPage();
});

// Load toggle states from storage
function loadToggleStates() {
  chrome.storage.sync.get(['threatToggles'], (result) => {
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
      chrome.storage.sync.set({ threatToggles: toggleStates });
      scanPage(); // Rescan when toggles change
    });
  });
}

async function scanPage() {
  // Show scanning state
  scanningDiv.classList.remove('hidden');
  resultsDiv.classList.add('hidden');

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Inject and execute content script
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Wait a bit for scanning to complete
    setTimeout(async () => {
      // Get results from content script
      const results = await chrome.tabs.sendMessage(tab.id, { 
        action: 'getScanResults',
        enabledThreats: toggleStates
      });
      
      displayResults(results);
    }, 1500); // Simulate scanning time
  } catch (error) {
    console.error('Error scanning page:', error);
    displayError();
  }
}

function displayResults(results) {
  // Hide scanning, show results
  scanningDiv.classList.add('hidden');
  resultsDiv.classList.remove('hidden');

  const malicious = results.malicious || 0;
  const trackers = results.trackers || 0;
  const ai = results.ai || 0;
  const misinformation = results.misinformation || 0;
  const total = malicious + trackers + ai + misinformation;

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

function displayError() {
  scanningDiv.classList.add('hidden');
  resultsDiv.classList.remove('hidden');
  statusIndicator.className = 'status-indicator status-error';
  checkIcon.classList.add('hidden');
  warningIcon.classList.remove('hidden');
  statusText.textContent = 'Error scanning page';
}
