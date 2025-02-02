let foundCID = null;

function findCID() {
    try {
        const htmlContent = (function() {
            // Use a safer way to get HTML content in eval context
            try {
                return document.documentElement.innerHTML || '';
            } catch (e) {
                return '';
            }
        })();
        
        const match = htmlContent.match(/ludocid\\\\u003d(\d+)\\\\u/);
        
        if (match && match[1]) {
            foundCID = match[1];
            try {
                chrome.runtime.sendMessage({ type: 'CID_FOUND', cid: foundCID });
            } catch (e) {
                // Ignore chrome runtime errors in eval context
                console.debug('Chrome runtime not available:', e);
            }
            return foundCID;
        }
        return null;
    } catch (error) {
        if (error.message.includes('Extension context invalidated')) {
            console.debug('Extension context was invalidated');
            return null;
        }
        // Log error but don't throw in eval context
        console.error('Error in findCID:', error);
        return null;
    }
}

// Wait for page to be fully loaded
window.addEventListener('load', () => {
    try {
        findCID();
    } catch (error) {
        console.debug('Error in content script:', error);
    }

    // Listen for DOM changes with a debounced observer
    let timeout;
    const observer = new MutationObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(findCID, 1000);  // Debounce to avoid too frequent checks
    });
    
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CID' && foundCID) {
        sendResponse({ cid: foundCID });
    } else if (request.type === 'COPY_TO_CLIPBOARD' && request.cid) {
        navigator.clipboard.writeText(request.cid).then(() => {
            // Show a small notification that it was copied
            const notification = document.createElement('div');
            notification.textContent = chrome.i18n.getMessage('placeIdCopied');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 999999;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        });
    }
    return true;
});

// Listen for CID_FOUND events from injected script
document.addEventListener('CID_FOUND', (event) => {
    foundCID = event.detail.cid;
    chrome.runtime.sendMessage({ type: 'CID_FOUND', cid: foundCID });
}); 