// Options page script
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusMessage = document.getElementById('statusMessage');
  const apiStatus = document.getElementById('apiStatus');

  // Threat toggle elements
  const threatToggles = {
    malicious: document.getElementById('toggle-malicious'),
    trackers: document.getElementById('toggle-trackers'),
    ai: document.getElementById('toggle-ai'),
    misinformation: document.getElementById('toggle-misinformation')
  };

  // Load existing API key and toggles
  loadApiKey();
  loadToggleStates();

  // Save button handler
  saveBtn.addEventListener('click', saveApiKey);

  // Clear button handler
  clearBtn.addEventListener('click', clearApiKey);

  // Enter key handler
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveApiKey();
    }
  });

  // Add toggle listeners
  Object.entries(threatToggles).forEach(([key, toggle]) => {
    toggle.addEventListener('change', (e) => {
      saveToggleState(key, e.target.checked);
    });
  });

  // Load API key from storage
  function loadApiKey() {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        apiKeyInput.value = result.geminiApiKey;
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    });
  }

  // Save API key to storage
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
        updateStatus(true);
      }
    });
  }

  // Clear API key
  function clearApiKey() {
    chrome.storage.local.remove('geminiApiKey', () => {
      apiKeyInput.value = '';
      showMessage('API key cleared', 'success');
      updateStatus(false);
    });
  }

  // Show status message
  function showMessage(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // Hide after 3 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 3000);
    }
  }

  // Update API status indicator
  function updateStatus(isConfigured) {
    if (isConfigured) {
      apiStatus.className = 'api-status configured';
      apiStatus.innerHTML = '<span class="status-dot"></span><span>API Key Configured ✓</span>';
    } else {
      apiStatus.className = 'api-status not-configured';
      apiStatus.innerHTML = '<span class="status-dot"></span><span>API Key Not Configured</span>';
    }
  }

  // Load toggle states from storage
  function loadToggleStates() {
    chrome.storage.local.get(['threatToggles'], (result) => {
      const savedStates = result.threatToggles || {
        malicious: true,
        trackers: true,
        ai: true,
        misinformation: true
      };
      
      // Update toggle UI
      Object.entries(savedStates).forEach(([key, value]) => {
        if (threatToggles[key]) {
          threatToggles[key].checked = value;
        }
      });
    });
  }

  // Save individual toggle state
  function saveToggleState(key, value) {
    chrome.storage.local.get(['threatToggles'], (result) => {
      const currentStates = result.threatToggles || {
        malicious: true,
        trackers: true,
        ai: true,
        misinformation: true
      };
      
      currentStates[key] = value;
      
      chrome.storage.local.set({ threatToggles: currentStates }, () => {
        console.log(`Toggle ${key} saved as ${value}`);
      });
    });
  }
});
