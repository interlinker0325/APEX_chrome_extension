// Simple popup script - no classes, just functions!

// Get all the elements we need
const targetUrlInput = document.getElementById('targetUrl');
const inputTextInput = document.getElementById('inputText');
const accountTypeDisplay = document.getElementById('accountTypeDisplay');
const cardStatus = document.getElementById('cardStatus');
const startButton = document.getElementById('startAutomation');
const settingsButton = document.getElementById('openOptions');
const statusMessage = document.getElementById('statusMessage');

// Show status messages to user
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // Hide message after 3 seconds
    setTimeout(function() {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }, 3000);
}

// Load settings from Chrome storage
function loadSettings() {
    chrome.storage.local.get(['targetUrl', 'inputText', 'accountType', 'cardNumber'], function(result) {
        // Fill in the URL if we have one saved
        if (result.targetUrl) {
            targetUrlInput.value = result.targetUrl;
        }
        
        // Fill in the text if we have one saved
        if (result.inputText) {
            inputTextInput.value = result.inputText;
        }
        
        // Show account type
        const accountType = result.accountType || 'personal';
        if (accountType === 'personal') {
            accountTypeDisplay.textContent = 'Personal';
        } else if (accountType === 'business') {
            accountTypeDisplay.textContent = 'Business';
        } else if (accountType === 'premium') {
            accountTypeDisplay.textContent = 'Premium';
        }
        
        // Show if card is configured
        const hasCard = result.cardNumber && result.cardNumber.length > 0;
        if (hasCard) {
            cardStatus.textContent = '✅ Configured';
            cardStatus.style.color = '#28a745';
        } else {
            cardStatus.textContent = '❌ Not set';
            cardStatus.style.color = '#dc3545';
        }
    });
}

// Save URL and text when user types
function saveQuickSettings() {
    const settings = {
        targetUrl: targetUrlInput.value,
        inputText: inputTextInput.value
    };
    
    chrome.storage.local.set(settings, function() {
        console.log('Quick settings saved');
    });
}

// Wait a bit before saving (so we don't save every keystroke)
function waitAndSave() {
    clearTimeout(window.saveTimer);
    window.saveTimer = setTimeout(saveQuickSettings, 500);
}

// Start the automation
function startAutomation() {
    // Check if URL is entered
    if (!targetUrlInput.value.trim()) {
        showStatus('Please enter a target URL', 'error');
        return;
    }
    
    // Check if text is entered
    if (!inputTextInput.value.trim()) {
        showStatus('Please enter input text', 'error');
        return;
    }
    
    // Save current inputs first
    saveQuickSettings();
    
    // Get all settings from storage
    chrome.storage.local.get([
        'accountType', 'accountNumber', 'cardNumber', 'expiryDate', 
        'cvv', 'cardName', 'autoNavigate', 'showNotifications'
    ], function(allSettings) {
        
        // Prepare data for automation
        const automationData = {
            accountType: allSettings.accountType || 'personal',
            accountNumber: allSettings.accountNumber || '1',
            cardNumber: allSettings.cardNumber || '',
            expiryDate: allSettings.expiryDate || '',
            cvv: allSettings.cvv || '',
            cardName: allSettings.cardName || '',
            targetUrl: targetUrlInput.value,
            inputText: inputTextInput.value,
            autoNavigate: allSettings.autoNavigate || false,
            showNotifications: allSettings.showNotifications !== false
        };
        
        // Warn if no card info
        if (!automationData.cardNumber) {
            const proceed = confirm('No card information configured. The automation will only fill text fields. Continue?');
            if (!proceed) return;
        }
        
        // Show loading on button
        startButton.classList.add('loading');
        startButton.disabled = true;
        
        // Get current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // Send message to background script to start automation
            chrome.runtime.sendMessage({
                action: 'startAutomation',
                data: automationData,
                tabId: tabs[0].id
            }, function(response) {
                if (response && response.success) {
                    showStatus('Automation started!', 'success');
                    // Close popup after 1 second
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                } else {
                    showStatus('Error starting automation', 'error');
                }
                
                // Remove loading after 2 seconds
                setTimeout(function() {
                    startButton.classList.remove('loading');
                    startButton.disabled = false;
                }, 2000);
            });
        });
    });
}

// Open options page
function openOptions() {
    chrome.runtime.openOptionsPage();
    window.close();
}

// Listen for status messages from background
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'automationStatus') {
        showStatus(message.message, message.type);
    }
});

// Set up event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    
    // Load saved settings
    loadSettings();
    
    // Save when user types in URL or text
    targetUrlInput.addEventListener('input', waitAndSave);
    inputTextInput.addEventListener('input', waitAndSave);
    
    // Button clicks
    startButton.addEventListener('click', startAutomation);
    settingsButton.addEventListener('click', openOptions);
});