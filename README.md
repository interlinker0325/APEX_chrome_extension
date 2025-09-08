# Auto Form Filler Chrome Extension

A Chrome extension that automates form filling and navigation for testing and demonstration purposes.

## Features

- **Dashboard Interface**: Modern popup with radio options, account settings, and card information forms
- **Smart Form Detection**: Automatically detects and fills various input field types
- **Navigation Automation**: Handles multi-step processes with automatic button clicking
- **Card Information Management**: Secure storage and formatting of payment details
- **Real-time Status Updates**: Live feedback during automation process

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the extension directory
4. The extension icon should appear in your toolbar

## Usage

### 1. Configure Settings (One-time setup)
- Click the extension icon and then click "Settings" button
- OR right-click the extension icon and select "Options"
- Configure your preferences:
  - **Account Settings**: Select account type and number of accounts
  - **Payment Information**: Enter card details (stored locally)
  - **Navigation Settings**: Set default URL and automation preferences

### 2. Quick Automation
- Click the extension icon to open the popup
- Enter or verify:
  - **Target URL**: The website where automation should start
  - **Input Text**: Text to enter in the first form field
- The popup shows your current account type and card configuration status

### 3. Start Automation
- Click "Start Automation" to begin the process
- The extension will:
  1. Navigate to the target URL (if auto-navigate is enabled)
  2. Fill the initial form with your text
  3. Click the "Next" button
  4. Fill card information on the next page
  5. Click the "Buy" or "Submit" button

## File Structure

```
apex-chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Quick automation popup
├── popup.css              # Popup styling
├── popup.js               # Popup logic and controls
├── options.html           # Settings/options page
├── options.css            # Options page styling
├── options.js             # Options page logic
├── content.js             # Form automation script
├── background.js          # Background service worker
└── README.md              # This file
```

## How It Works

### Content Script (`content.js`)
- Runs on all web pages
- Detects form fields using multiple selector strategies
- Simulates human-like typing and clicking
- Handles multi-step navigation

### Background Script (`background.js`)
- Manages communication between popup and content script
- Handles tab navigation and URL changes
- Stores automation state across page loads

### Popup Interface (`popup.html/js/css`)
- Provides quick automation controls
- Shows current configuration status
- Launches automation with minimal input
- Links to detailed options page

### Options Page (`options.html/js/css`)
- Comprehensive settings configuration
- Card information management with validation
- Account and navigation preferences
- Auto-save functionality with local storage

## Security Notes

- All data is stored locally in Chrome's storage API
- No data is sent to external servers
- Card information is only used for form filling
- Use only on test/demo websites with fake data

## Browser Compatibility

- Chrome 88+
- Manifest V3 compatible
- Uses modern Chrome APIs

## Development

To modify the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh button on the extension card
4. Test your changes

## Troubleshooting

### Extension Not Loading
- Check that all files are in the same directory
- Verify manifest.json syntax
- Check Chrome developer console for errors

### Automation Not Working
- Ensure target website is accessible
- Check that form fields are detectable
- Verify button selectors match the website
- Check browser console for error messages

### Form Fields Not Filling
- Website may use non-standard field names
- Try different input text or field selectors
- Some sites may have anti-automation measures

## Disclaimer

This extension is for educational and testing purposes only. Always use responsibly and only on websites you own or have permission to test. Never use real payment information.
