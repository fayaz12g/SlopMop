# Content Scanner Chrome Extension

A Chrome extension that scans web pages for AI-generated content, malicious links, and misinformation.

## Features

- 🚨 Detects malicious content and links (red highlighting)
- ⚠️ Identifies AI-generated content and misinformation (yellow highlighting)
- ✅ Shows green checkmark when page is safe
- 🔄 Real-time scanning with rescan capability

## Current Implementation (Demo Mode)

This is a **shell version** that uses fake detection based on keywords:

**Malicious triggers:**
- "this is malicious"
- "malicious link"
- "dangerous"

**AI/Misinformation triggers:**
- "this is AI"
- "ai generated"
- "this is false"
- "misinformation"

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension icon should appear in your toolbar

## Usage

1. Navigate to any webpage
2. Click the extension icon in your toolbar
3. The extension will automatically scan the page
4. View results:
   - **Green checkmark**: All clear, no issues found
   - **Warning icon**: Issues detected
5. Suspicious content will be highlighted on the page:
   - **Red boxes**: Malicious content/links
   - **Yellow boxes**: AI-generated content/misinformation

## Testing

A test page is included (`test-page.html`) that contains sample text with the trigger keywords. Open it in Chrome to test the extension.

## Project Structure

```
content-scanner-extension/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.js           # Popup logic
├── popup.css          # Popup styles
├── content.js         # Content script (page scanning)
├── content.css        # Highlight styles
└── icons/             # Extension icons (need to add)
```

## Next Steps (Production)

To make this production-ready with actual Gemini API integration:

1. **Add API Integration:**
   - Create a background service worker
   - Implement Gemini API calls
   - Add API key management

2. **Improve Detection:**
   - Send page content to Gemini API
   - Process AI response for threat assessment
   - Implement more sophisticated highlighting

3. **Add Features:**
   - User settings/preferences
   - Whitelist/blacklist domains
   - Detailed threat reports
   - Export scan results

4. **Security:**
   - Secure API key storage
   - Rate limiting
   - Error handling

## Technologies

- Chrome Extension Manifest V3
- Vanilla JavaScript
- Chrome APIs (tabs, scripting, runtime)

## Notes

- This extension does NOT use Next.js (Chrome extensions are client-side only)
- For API integration, you'll add a service worker (background script)
- Content scripts have limited access to Chrome APIs for security
