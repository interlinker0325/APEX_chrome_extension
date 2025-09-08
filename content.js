// Simple content script - no classes, just functions!

// Variables to track automation state
let isRunning = false;
let currentStep = 0;
let automationData = null;

// Wait for some time
function wait(milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, milliseconds);
    });
}

// Send status message back to popup
function sendStatus(message, type) {
    chrome.runtime.sendMessage({
        action: 'automationStatus',
        message: message,
        type: type || 'info'
    });
}

// Check if an element is visible on the page
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           element.offsetParent !== null;
}

// Type text into an input field like a human
function typeText(element, text) {
    return new Promise(function(resolve) {
        element.focus();
        element.value = '';
        
        let i = 0;
        function typeNextChar() {
            if (i < text.length) {
                element.value += text[i];
                element.dispatchEvent(new Event('input', { bubbles: true }));
                i++;
                setTimeout(typeNextChar, 50 + Math.random() * 50); // Random delay 50-100ms
            } else {
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.blur();
                resolve();
            }
        }
        
        typeNextChar();
    });
}

// Click an element like a human
function clickElement(element) {
    return new Promise(function(resolve) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(function() {
            // Simulate mouse events
            element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            setTimeout(function() {
                element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                resolve();
            }, 50);
        }, 500);
    });
}

// Find input fields for text
function findTextInput() {
    const selectors = [
        'input[type="text"]',
        'input[type="email"]',
        'textarea',
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"])'
    ];
    
    for (let selector of selectors) {
        const fields = document.querySelectorAll(selector);
        for (let field of fields) {
            if (isElementVisible(field)) {
                return field;
            }
        }
    }
    
    return null;
}

// Find card number input field
function findCardNumberField() {
    const selectors = [
        'input[name*="card"][name*="number"]',
        'input[id*="card"][id*="number"]',
        'input[placeholder*="card"][placeholder*="number"]',
        'input[autocomplete="cc-number"]',
        'input[data-testid*="card"][data-testid*="number"]'
    ];
    
    for (let selector of selectors) {
        const field = document.querySelector(selector);
        if (field && isElementVisible(field)) {
            return field;
        }
    }
    
    return null;
}

// Find expiry date input field
function findExpiryField() {
    const selectors = [
        'input[name*="expir"]',
        'input[id*="expir"]',
        'input[placeholder*="expir"]',
        'input[autocomplete="cc-exp"]',
        'input[name*="month"]',
        'input[placeholder*="MM/YY"]'
    ];
    
    for (let selector of selectors) {
        const field = document.querySelector(selector);
        if (field && isElementVisible(field)) {
            return field;
        }
    }
    
    return null;
}

// Find CVV input field
function findCVVField() {
    const selectors = [
        'input[name*="cvv"]',
        'input[name*="cvc"]',
        'input[name*="security"]',
        'input[id*="cvv"]',
        'input[id*="cvc"]',
        'input[autocomplete="cc-csc"]',
        'input[placeholder*="CVV"]'
    ];
    
    for (let selector of selectors) {
        const field = document.querySelector(selector);
        if (field && isElementVisible(field)) {
            return field;
        }
    }
    
    return null;
}

// Find cardholder name input field
function findCardNameField() {
    const selectors = [
        'input[name*="name"][name*="card"]',
        'input[name*="holder"]',
        'input[id*="name"][id*="card"]',
        'input[autocomplete="cc-name"]',
        'input[placeholder*="name"][placeholder*="card"]'
    ];
    
    for (let selector of selectors) {
        const field = document.querySelector(selector);
        if (field && isElementVisible(field)) {
            return field;
        }
    }
    
    return null;
}

// Find "Next" button
function findNextButton() {
    const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a');
    
    for (let button of buttons) {
        const text = button.textContent || button.value || '';
        if (text.toLowerCase().includes('next') || 
            text.toLowerCase().includes('continue') || 
            text.toLowerCase().includes('proceed')) {
            if (isElementVisible(button)) {
                return button;
            }
        }
    }
    
    // Fallback: any submit button
    const submitButton = document.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton && isElementVisible(submitButton)) {
        return submitButton;
    }
    
    return null;
}

// Find "Buy" or "Purchase" button
function findBuyButton() {
    const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a');
    
    for (let button of buttons) {
        const text = button.textContent || button.value || '';
        if (text.toLowerCase().includes('buy') || 
            text.toLowerCase().includes('purchase') || 
            text.toLowerCase().includes('pay') ||
            text.toLowerCase().includes('complete') ||
            text.toLowerCase().includes('submit')) {
            if (isElementVisible(button)) {
                return button;
            }
        }
    }
    
    return null;
}

// Fill the first form with text and click next
function fillFirstForm() {
    return new Promise(async function(resolve, reject) {
        try {
            console.log('Filling first form...');
            
            // Find text input
            const textInput = findTextInput();
            if (textInput) {
                console.log('Found text input:', textInput);
                await typeText(textInput, automationData.inputText);
                sendStatus('Text input filled', 'success');
            } else {
                console.log('No text input found');
            }
            
            // Wait a bit
            await wait(1000);
            
            // Find and click next button
            const nextButton = findNextButton();
            if (nextButton) {
                console.log('Found next button:', nextButton);
                await clickElement(nextButton);
                currentStep = 1;
                sendStatus('Clicked next button', 'success');
                
                // Wait for page to load, then continue
                setTimeout(function() {
                    fillCardForm().then(resolve).catch(reject);
                }, 2000);
            } else {
                reject(new Error('Next button not found'));
            }
            
        } catch (error) {
            reject(error);
        }
    });
}

// Fill card information and complete purchase
function fillCardForm() {
    return new Promise(async function(resolve, reject) {
        try {
            console.log('Filling card information...');
            
            await wait(1000);
            
            // Fill card number
            const cardField = findCardNumberField();
            if (cardField && automationData.cardNumber) {
                await typeText(cardField, automationData.cardNumber.replace(/\s/g, ''));
                console.log('Card number filled');
            }
            
            // Fill expiry date
            const expiryField = findExpiryField();
            if (expiryField && automationData.expiryDate) {
                await typeText(expiryField, automationData.expiryDate);
                console.log('Expiry date filled');
            }
            
            // Fill CVV
            const cvvField = findCVVField();
            if (cvvField && automationData.cvv) {
                await typeText(cvvField, automationData.cvv);
                console.log('CVV filled');
            }
            
            // Fill cardholder name
            const nameField = findCardNameField();
            if (nameField && automationData.cardName) {
                await typeText(nameField, automationData.cardName);
                console.log('Cardholder name filled');
            }
            
            sendStatus('Card information filled', 'success');
            
            // Wait a bit
            await wait(1000);
            
            // Find and click buy button
            const buyButton = findBuyButton();
            if (buyButton) {
                console.log('Found buy button:', buyButton);
                await clickElement(buyButton);
                sendStatus('Purchase completed!', 'success');
            } else {
                console.log('Buy button not found');
                sendStatus('Card info filled - manual completion may be needed', 'info');
            }
            
            resolve();
            
        } catch (error) {
            reject(error);
        } finally {
            isRunning = false;
        }
    });
}

// Main function to start automation
function startAutomation(data) {
    if (isRunning) {
        console.log('Automation already running');
        return;
    }
    
    isRunning = true;
    automationData = data;
    currentStep = 0;
    
    console.log('Starting automation with data:', data);
    
    // Check if we're on the right URL
    if (window.location.href !== data.targetUrl) {
        console.log('Navigating to target URL:', data.targetUrl);
        window.location.href = data.targetUrl;
        return;
    }
    
    // Start with first form
    fillFirstForm().then(function() {
        console.log('Automation completed successfully');
    }).catch(function(error) {
        console.error('Automation failed:', error);
        sendStatus('Automation failed: ' + error.message, 'error');
        isRunning = false;
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'executeAutomation') {
        startAutomation(message.data);
        sendResponse({ success: true });
    }
    return true;
});

// Listen for window messages (alternative way)
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'FORM_AUTOMATOR_EXECUTE') {
        startAutomation(event.data.data);
    }
});

// Make functions available globally
window.formAutomator = {
    executeAutomation: startAutomation
};

console.log('Content script loaded');