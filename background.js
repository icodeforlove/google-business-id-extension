// Keep track of which tabs have CIDs
const tabsWithCID = new Set();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.type === 'CID_FOUND') {
        tabsWithCID.add(sender.tab.id);
        updateIcon(sender.tab.id, true);
    }
});

// Update icon when tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    updateIcon(activeInfo.tabId, tabsWithCID.has(activeInfo.tabId));
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    tabsWithCID.delete(tabId);
});

// Handle icon click
chrome.action.onClicked.addListener(async (tab) => {
    if (tabsWithCID.has(tab.id)) {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CID' });
        if (response && response.cid) {
            // Send message back to content script to copy
            chrome.tabs.sendMessage(tab.id, { 
                type: 'COPY_TO_CLIPBOARD', 
                cid: response.cid 
            });
        }
    }
});

function updateIcon(tabId, hasCID) {
    const iconPath = hasCID ? {
        16: 'icons/icon-active-16.png',
        48: 'icons/icon-active-48.png',
        128: 'icons/icon-active-128.png'
    } : {
        16: 'icons/icon-inactive-16.png',
        48: 'icons/icon-inactive-48.png',
        128: 'icons/icon-inactive-128.png'
    };
    
    chrome.action.setIcon({
        tabId: tabId,
        path: iconPath
    });

    // Set tooltip based on state
    chrome.action.setTitle({
        tabId: tabId,
        title: hasCID ? chrome.i18n.getMessage('copyButton') : chrome.i18n.getMessage('noPlaceIdFound')
    });
} 