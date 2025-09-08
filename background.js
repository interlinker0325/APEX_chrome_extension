// Simple background script - no classes, just functions!

// Wait for a tab to finish loading
function waitForTabToLoad(tabId, timeout) {
    return new Promise(function(resolve, reject) {
        const startTime = Date.now();
        
        function checkTab() {
            chrome.tabs.get(tabId, function(tab) {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                if (tab.status === 'complete') {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Tab load timeout'));
                } else {
                    setTimeout(checkTab, 500);
                }
            });
        }
        
        checkTab();
    });
}

// Start automation process
function startAutomation(data, tabId) {
    return new Promise(function(resolve, reject) {
        console.log('Starting automation for tab:', tabId);
        console.log('Automation data:', data);
        
        // Get current tab info
        chrome.tabs.get(tabId, function(tab) {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            
            // Check if we need to navigate to target URL
            if (tab.url !== data.targetUrl) {
                console.log('Navigating to target URL:', data.targetUrl);
                
                chrome.tabs.update(tabId, { url: data.targetUrl }, function() {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    
                    // Wait for page to load
                    waitForTabToLoad(tabId, 10000).then(function() {
                        // Execute automation script
                        executeAutomationScript(tabId, data).then(resolve).catch(reject);
                    }).catch(reject);
                });
            } else {
                // Already on correct page, execute directly
                executeAutomationScript(tabId, data).then(resolve).catch(reject);
            }
        });
    });
}

// Execute the automation script on the page
function executeAutomationScript(tabId, data) {
    return new Promise(function(resolve, reject) {
        // Inject script to trigger automation
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: function(automationData) {
                // This function runs in the page context
                if (window.formAutomator) {
                    window.formAutomator.executeAutomation(automationData);
                } else {
                    // Send message to content script
                    window.postMessage({
                        type: 'FORM_AUTOMATOR_EXECUTE',
                        data: automationData
                    }, '*');
                }
            },
            args: [data]
        }, function(result) {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

// Send status message to popup (if open)
function sendStatusToPopup(message) {
    // Get all extension views (popups)
    const views = chrome.extension.getViews({ type: 'popup' });
    
    if (views.length > 0) {
        // Send message to popup
        chrome.runtime.sendMessage({
            action: 'automationStatus',
            message: message.message,
            type: message.type
        });
    }
}

// Handle messages from popup and content scripts
function handleMessage(message, sender, sendResponse) {
    console.log('Received message:', message);
    
    if (message.action === 'startAutomation') {
        // Start automation
        startAutomation(message.data, message.tabId).then(function() {
            sendResponse({ success: true });
        }).catch(function(error) {
            console.error('Automation error:', error);
            sendResponse({ success: false, error: error.message });
        });
        
        return true; // Keep message channel open
        
    } else if (message.action === 'automationStatus') {
        // Forward status to popup
        sendStatusToPopup(message);
        sendResponse({ success: true });
        
    } else {
        console.log('Unknown message action:', message.action);
        sendResponse({ success: false, error: 'Unknown action' });
    }
}

// Handle tab updates (for continuing automation after navigation)
function handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        // Check if we have ongoing automation for this tab
        chrome.storage.session.get([`automation_${tabId}`], function(result) {
            const automationData = result[`automation_${tabId}`];
            if (automationData) {
                // Continue automation on the new page
                setTimeout(function() {
                    chrome.tabs.sendMessage(tabId, {
                        action: 'executeAutomation',
                        data: automationData
                    });
                }, 1000);
            }
        });
    }
}

// Set up default settings when extension is installed
function setupDefaultSettings() {
    const defaultSettings = {
        accountType: 'personal',
        accountNumber: '1',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardName: '',
        targetUrl: '',
        inputText: '',
        autoNavigate: false,
        showNotifications: true
    };
    
    chrome.storage.local.set(defaultSettings, function() {
        console.log('Default settings initialized');
    });
}

// Set up event listeners
chrome.runtime.onMessage.addListener(handleMessage);
chrome.tabs.onUpdated.addListener(handleTabUpdate);

// Handle extension installation
chrome.runtime.onInstalled.addListener(function(details) {
    console.log('Auto Form Filler extension installed/updated');
    
    if (details.reason === 'install') {
        setupDefaultSettings();
    }
});

console.log('Background script loaded');