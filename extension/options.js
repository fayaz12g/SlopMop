// Options page script
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusMessage = document.getElementById('statusMessage');
  const apiStatus = document.getElementById('apiStatus');

  // Load existing API key
  loadApiKey();

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

  // Load API key from storage
  function loadApiKey() {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
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
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
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
    chrome.storage.sync.remove('geminiApiKey', () => {
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
});
