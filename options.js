// Simple options page script - no classes, just functions!

// Get all the form elements
const accountRadios = document.querySelectorAll('input[name="accountType"]');
const accountNumberInput = document.getElementById('accountNumber');
const cardNumberInput = document.getElementById('cardNumber');
const expiryDateInput = document.getElementById('expiryDate');
const cvvInput = document.getElementById('cvv');
const cardNameInput = document.getElementById('cardName');
const defaultUrlInput = document.getElementById('defaultUrl');
const defaultTextInput = document.getElementById('defaultText');
const autoNavigateCheckbox = document.getElementById('autoNavigate');
const showNotificationsCheckbox = document.getElementById('showNotifications');
const saveButton = document.getElementById('saveSettings');
const resetButton = document.getElementById('resetSettings');
const clearButton = document.getElementById('clearData');
const statusDiv = document.getElementById('statusMessage');

// Show status messages
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    
    // Hide after 3 seconds
    setTimeout(function() {
        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
    }, 3000);
}

// Format card number with spaces (1234 5678 9012 3456)
function formatCardNumber(value) {
    // Remove all spaces and non-numbers
    const cleanValue = value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    
    // Add spaces every 4 digits
    let formatted = '';
    for (let i = 0; i < cleanValue.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formatted += ' ';
        }
        formatted += cleanValue[i];
    }
    
    return formatted;
}

// Format expiry date (MM/YY)
function formatExpiryDate(value) {
    // Remove non-numbers
    const cleanValue = value.replace(/\D/g, '');
    
    // Add slash after 2 digits
    if (cleanValue.length >= 2) {
        return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4);
    }
    return cleanValue;
}

// Check if card number is valid
function isValidCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19 && /^\d+$/.test(cleaned);
}

// Check if expiry date is valid
function isValidExpiryDate(expiryDate) {
    const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    return month >= 1 && month <= 12 && 
           (year > currentYear || (year === currentYear && month >= currentMonth));
}

// Check if CVV is valid
function isValidCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

// Check if URL is valid
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Load all settings from storage
function loadSettings() {
    chrome.storage.local.get([
        'accountType', 'accountNumber', 'cardNumber', 'expiryDate', 
        'cvv', 'cardName', 'defaultUrl', 'defaultText', 
        'autoNavigate', 'showNotifications'
    ], function(result) {
        
        // Set account type radio
        if (result.accountType) {
            const radio = document.querySelector(`input[name="accountType"][value="${result.accountType}"]`);
            if (radio) radio.checked = true;
        }
        
        // Set account number
        if (result.accountNumber) {
            accountNumberInput.value = result.accountNumber;
        }
        
        // Set card info
        if (result.cardNumber) {
            cardNumberInput.value = result.cardNumber;
        }
        if (result.expiryDate) {
            expiryDateInput.value = result.expiryDate;
        }
        if (result.cvv) {
            cvvInput.value = result.cvv;
        }
        if (result.cardName) {
            cardNameInput.value = result.cardName;
        }
        
        // Set navigation settings
        if (result.defaultUrl) {
            defaultUrlInput.value = result.defaultUrl;
        }
        if (result.defaultText) {
            defaultTextInput.value = result.defaultText;
        }
        if (result.autoNavigate !== undefined) {
            autoNavigateCheckbox.checked = result.autoNavigate;
        }
        if (result.showNotifications !== undefined) {
            showNotificationsCheckbox.checked = result.showNotifications;
        }
        
        console.log('Settings loaded');
    });
}

// Save all settings
function saveSettings() {
    // Show loading on save button
    saveButton.classList.add('loading');
    saveButton.disabled = true;
    
    // Get selected account type
    let selectedAccountType = 'personal';
    for (let radio of accountRadios) {
        if (radio.checked) {
            selectedAccountType = radio.value;
            break;
        }
    }
    
    // Collect all settings
    const settings = {
        accountType: selectedAccountType,
        accountNumber: accountNumberInput.value,
        cardNumber: cardNumberInput.value,
        expiryDate: expiryDateInput.value,
        cvv: cvvInput.value,
        cardName: cardNameInput.value,
        defaultUrl: defaultUrlInput.value,
        defaultText: defaultTextInput.value,
        autoNavigate: autoNavigateCheckbox.checked,
        showNotifications: showNotificationsCheckbox.checked
    };
    
    // Validate settings
    const errors = [];
    
    if (settings.cardNumber && !isValidCardNumber(settings.cardNumber)) {
        errors.push('Invalid card number format');
    }
    if (settings.expiryDate && !isValidExpiryDate(settings.expiryDate)) {
        errors.push('Invalid or expired date');
    }
    if (settings.cvv && !isValidCVV(settings.cvv)) {
        errors.push('Invalid CVV format');
    }
    if (settings.defaultUrl && !isValidURL(settings.defaultUrl)) {
        errors.push('Invalid URL format');
    }
    
    if (errors.length > 0) {
        showStatus(errors.join(', '), 'error');
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
        return;
    }
    
    // Save to storage
    chrome.storage.local.set(settings, function() {
        showStatus('Settings saved successfully!', 'success');
        console.log('Settings saved:', settings);
        
        // Remove loading
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
    });
}

// Auto-save settings (without validation)
function autoSave() {
    // Get selected account type
    let selectedAccountType = 'personal';
    for (let radio of accountRadios) {
        if (radio.checked) {
            selectedAccountType = radio.value;
            break;
        }
    }
    
    const settings = {
        accountType: selectedAccountType,
        accountNumber: accountNumberInput.value,
        cardNumber: cardNumberInput.value,
        expiryDate: expiryDateInput.value,
        cvv: cvvInput.value,
        cardName: cardNameInput.value,
        defaultUrl: defaultUrlInput.value,
        defaultText: defaultTextInput.value,
        autoNavigate: autoNavigateCheckbox.checked,
        showNotifications: showNotificationsCheckbox.checked
    };
    
    chrome.storage.local.set(settings, function() {
        console.log('Auto-saved');
    });
}

// Wait before auto-saving
function waitAndAutoSave() {
    clearTimeout(window.autoSaveTimer);
    window.autoSaveTimer = setTimeout(autoSave, 1000);
}

// Reset to default settings
function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
        return;
    }
    
    resetButton.classList.add('loading');
    resetButton.disabled = true;
    
    const defaultSettings = {
        accountType: 'personal',
        accountNumber: '1',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardName: '',
        defaultUrl: '',
        defaultText: '',
        autoNavigate: false,
        showNotifications: true
    };
    
    chrome.storage.local.set(defaultSettings, function() {
        loadSettings();
        showStatus('Settings reset to defaults!', 'success');
        
        resetButton.classList.remove('loading');
        resetButton.disabled = false;
    });
}

// Clear all data
function clearAllData() {
    if (!confirm('Are you sure you want to clear ALL data? This action cannot be undone.')) {
        return;
    }
    
    clearButton.classList.add('loading');
    clearButton.disabled = true;
    
    chrome.storage.local.clear(function() {
        loadSettings();
        showStatus('All data cleared successfully!', 'success');
        
        clearButton.classList.remove('loading');
        clearButton.disabled = false;
    });
}

// Set up everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Options page loaded');
    
    // Load saved settings
    loadSettings();
    
    // Format card inputs as user types
    cardNumberInput.addEventListener('input', function(e) {
        e.target.value = formatCardNumber(e.target.value);
        waitAndAutoSave();
    });
    
    expiryDateInput.addEventListener('input', function(e) {
        e.target.value = formatExpiryDate(e.target.value);
        waitAndAutoSave();
    });
    
    cvvInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
        waitAndAutoSave();
    });
    
    // Auto-save on other inputs
    const inputs = [
        accountNumberInput, cardNameInput, defaultUrlInput, defaultTextInput
    ];
    
    for (let input of inputs) {
        input.addEventListener('input', waitAndAutoSave);
    }
    
    // Auto-save on radio and checkbox changes
    for (let radio of accountRadios) {
        radio.addEventListener('change', autoSave);
    }
    
    autoNavigateCheckbox.addEventListener('change', autoSave);
    showNotificationsCheckbox.addEventListener('change', autoSave);
    
    // Button clicks
    saveButton.addEventListener('click', saveSettings);
    resetButton.addEventListener('click', resetSettings);
    clearButton.addEventListener('click', clearAllData);
});