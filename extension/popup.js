// Get references to DOM elements
const scanningDiv = document.getElementById('scanning');
const resultsDiv = document.getElementById('results');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const checkIcon = document.getElementById('checkIcon');
const warningIcon = document.getElementById('warningIcon');
const maliciousSection = document.getElementById('maliciousSection');
const aiSection = document.getElementById('aiSection');
const maliciousCount = document.getElementById('maliciousCount');
const aiCount = document.getElementById('aiCount');
const rescanBtn = document.getElementById('rescanBtn');

// Run scan when popup opens
document.addEventListener('DOMContentLoaded', () => {
  scanPage();
});

// Rescan button handler
rescanBtn.addEventListener('click', () => {
  scanPage();
});

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
      const results = await chrome.tabs.sendMessage(tab.id, { action: 'getScanResults' });
      
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
  const ai = results.ai || 0;
  const total = malicious + ai;

  // Update counts
  maliciousCount.textContent = `${malicious} item${malicious !== 1 ? 's' : ''} found`;
  aiCount.textContent = `${ai} item${ai !== 1 ? 's' : ''} found`;

  // Show/hide sections based on findings
  if (malicious > 0) {
    maliciousSection.style.display = 'block';
  } else {
    maliciousSection.style.display = 'none';
  }

  if (ai > 0) {
    aiSection.style.display = 'block';
  } else {
    aiSection.style.display = 'none';
  }

  // Update status indicator
  if (total === 0) {
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
    statusText.textContent = `${total} Issue${total !== 1 ? 's' : ''} Found`;
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
