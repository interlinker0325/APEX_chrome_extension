// Options page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings on page load
    loadSettings();
    
    // Add event listeners
    setupEventListeners();
    
    // Update selected account type display
    updateSelectedAccountType();
});

function setupEventListeners() {
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    cardNumberInput.addEventListener('input', formatCardNumber);
    
    // CVV validation
    const cvvInput = document.getElementById('cvv');
    cvvInput.addEventListener('input', validateCVV);
    
    // Number of accounts validation
    const numberOfAccountsInput = document.getElementById('numberOfAccounts');
    numberOfAccountsInput.addEventListener('input', validateNumberOfAccounts);
    
    // Account type radio buttons
    const accountTypeRadios = document.querySelectorAll('input[name="accountType"]');
    accountTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateSelectedAccountType);
    });
    
    // Action buttons
    document.getElementById('saveSettings').addEventListener('click', handleSaveSettings);
    document.getElementById('defaultSettings').addEventListener('click', handleDefaultSettings);
    
    // Auto-save settings when form changes
    const formElements = document.querySelectorAll('input, select');
    formElements.forEach(element => {
        element.addEventListener('change', saveSettings);
        element.addEventListener('input', debounce(saveSettings, 500));
    });
}

function formatCardNumber(event) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 16 digits
    if (value.length > 16) {
        value = value.slice(0, 16);
    }
    
    // Format with spaces every 4 digits
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    event.target.value = value;
}

function validateCVV(event) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 4 digits (some cards have 4-digit CVV)
    if (value.length > 4) {
        value = value.slice(0, 4);
    }
    
    event.target.value = value;
}

function validateNumberOfAccounts(event) {
    const value = parseInt(event.target.value);
    
    if (isNaN(value) || value < 1) {
        event.target.value = 1;
    } else if (value > 10) {
        event.target.value = 10;
    }
}

function updateSelectedAccountType() {
    const selectedRadio = document.querySelector('input[name="accountType"]:checked');
    const selectedInfo = document.getElementById('selectedAccountType');
    
    if (selectedRadio) {
        const accountType = selectedRadio.value;
        selectedInfo.textContent = `Selected: ${accountType}k-Tradovate`;
    }
}

function saveSettings() {
    const settings = {
        paymentDetails: {
            cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''), // Remove spaces for storage
            expiryMonth: document.getElementById('expiryMonth').value,
            expiryYear: document.getElementById('expiryYear').value,
            cvv: document.getElementById('cvv').value
        },
        settings: {
            numberOfAccounts: document.getElementById('numberOfAccounts').value,
            accountType: document.querySelector('input[name="accountType"]:checked')?.value || '50k'
        }
    };
    
    // Save to Chrome storage
    chrome.storage.sync.set({ extensionSettings: settings }, function() {
        if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
            showStatus('Error saving settings', 'error');
        } else {
            console.log('Settings saved successfully');
            // Don't show success message for auto-save to avoid spam
        }
    });
}

function loadSettings() {
    chrome.storage.sync.get(['extensionSettings'], function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error loading settings:', chrome.runtime.lastError);
            return;
        }
        
        const settings = result.extensionSettings;
        
        if (settings) {
            // Load payment details
            if (settings.paymentDetails) {
                const cardNumber = settings.paymentDetails.cardNumber;
                if (cardNumber) {
                    // Format card number for display
                    document.getElementById('cardNumber').value = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
                }
                document.getElementById('expiryMonth').value = settings.paymentDetails.expiryMonth || '01';
                document.getElementById('expiryYear').value = settings.paymentDetails.expiryYear || '2025';
                document.getElementById('cvv').value = settings.paymentDetails.cvv || '';
            }
            
            // Load settings
            if (settings.settings) {
                document.getElementById('numberOfAccounts').value = settings.settings.numberOfAccounts || '1';
                
                const accountType = settings.settings.accountType || '50k';
                const accountRadio = document.querySelector(`input[name="accountType"][value="${accountType}"]`);
                if (accountRadio) {
                    accountRadio.checked = true;
                }
            }
            
            updateSelectedAccountType();
        }
    });
}

function validateForm() {
    const errors = [];
    
    // Validate card number
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
        errors.push('Please enter a valid card number (13-19 digits)');
        document.getElementById('cardNumber').parentElement.classList.add('error');
    } else {
        document.getElementById('cardNumber').parentElement.classList.remove('error');
    }
    
    // Validate CVV
    const cvv = document.getElementById('cvv').value;
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
        errors.push('Please enter a valid CVV (3-4 digits)');
        document.getElementById('cvv').parentElement.classList.add('error');
    } else {
        document.getElementById('cvv').parentElement.classList.remove('error');
    }
    
    // Validate expiry date
    const expiryMonth = parseInt(document.getElementById('expiryMonth').value);
    const expiryYear = parseInt(document.getElementById('expiryYear').value);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
        errors.push('Card expiry date cannot be in the past');
        document.getElementById('expiryMonth').parentElement.classList.add('error');
        document.getElementById('expiryYear').parentElement.classList.add('error');
    } else {
        document.getElementById('expiryMonth').parentElement.classList.remove('error');
        document.getElementById('expiryYear').parentElement.classList.remove('error');
    }
    
    return errors;
}

function handleSaveSettings() {
    // Validate form first
    const errors = validateForm();
    
    if (errors.length > 0) {
        showStatus('Please fix the following errors:\n• ' + errors.join('\n• '), 'error');
        return;
    }
    
    // Save settings
    const settings = {
        paymentDetails: {
            cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            expiryMonth: document.getElementById('expiryMonth').value,
            expiryYear: document.getElementById('expiryYear').value,
            cvv: document.getElementById('cvv').value
        },
        settings: {
            numberOfAccounts: parseInt(document.getElementById('numberOfAccounts').value),
            accountType: document.querySelector('input[name="accountType"]:checked')?.value || '50k'
        }
    };
    
    // Save to Chrome storage
    chrome.storage.sync.set({ extensionSettings: settings }, function() {
        if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
            showStatus('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
        } else {
            console.log('Settings saved successfully');
            showStatus('Settings saved successfully!', 'success');
        }
    });
}

function handleDefaultSettings() {
    console.log('DEFAULT SETTINGS BUTTON CLICKED!');
    
    // Reset all form fields to their default state first
    resetFormToDefaults();
    
    // Then clear all stored settings completely
    chrome.storage.sync.clear(function() {
        if (chrome.runtime.lastError) {
            console.error('Error clearing storage:', chrome.runtime.lastError);
            showStatus('Error clearing settings: ' + chrome.runtime.lastError.message, 'error');
            return;
        }
        
        console.log('All stored settings cleared');
        showStatus('All settings cleared and reset to defaults!', 'success');
    });
}

function resetFormToDefaults() {
    console.log('STARTING FORM RESET...');
    alert('Starting form reset...'); // Debug alert
    
    // DIRECT RESET - Set each field manually with debugging
    console.log('Resetting Card Number...');
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.value = '';
        console.log('Card number reset to empty');
    } else {
        console.error('Card number field not found!');
    }
    
    console.log('Resetting CVV...');
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.value = '';
        console.log('CVV reset to empty');
    } else {
        console.error('CVV field not found!');
    }
    
    console.log('Resetting Expiry Month...');
    const expiryMonth = document.getElementById('expiryMonth');
    if (expiryMonth) {
        expiryMonth.value = '01';
        console.log('Expiry month reset to 01');
    } else {
        console.error('Expiry month field not found!');
    }
    
    console.log('Resetting Expiry Year...');
    const expiryYear = document.getElementById('expiryYear');
    if (expiryYear) {
        expiryYear.value = '2025';
        console.log('Expiry year reset to 2025');
    } else {
        console.error('Expiry year field not found!');
    }
    
    console.log('Resetting Number of Accounts...');
    const numberOfAccounts = document.getElementById('numberOfAccounts');
    if (numberOfAccounts) {
        numberOfAccounts.value = '1';
        console.log('Number of accounts reset to 1');
    } else {
        console.error('Number of accounts field not found!');
    }
    
    console.log('Resetting Radio Buttons...');
    // Clear all radio buttons
    const allRadios = document.querySelectorAll('input[name="accountType"]');
    console.log(`Found ${allRadios.length} radio buttons`);
    allRadios.forEach((radio, index) => {
        radio.checked = false;
        console.log(`Unchecked radio ${index}: ${radio.id}`);
    });
    
    // Set default radio
    const defaultRadio = document.getElementById('tradovate50k');
    if (defaultRadio) {
        defaultRadio.checked = true;
        console.log('50k radio button checked as default');
    } else {
        console.error('50k radio button not found!');
    }
    
    // Update display
    updateSelectedAccountType();
    
    // Clear errors
    const errorGroups = document.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => {
        group.classList.remove('error');
    });
    
    console.log('FORM RESET COMPLETED!');
    alert('Form reset completed!'); // Debug alert
}

function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    
    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStatus') {
        showStatus(message.message, message.type || 'info');
    }
});
