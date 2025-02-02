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
        
        const ludocidMatch = htmlContent.match(/ludocid\\\\u003d(\d+)\\\\u/);
        const altMatch = htmlContent.match(/\["\d+","(\d+)"\],"\/g\//);
        const signoutMatch = htmlContent.match(/guidedhelpid=\\"gbacsw\\" href=\\"([^"]+)\\"/);

        let foundHexCid;
        if (signoutMatch) {
            const signoutUrl = signoutMatch[1];
            const cidMatch = signoutUrl.match(/0x[a-z0-9]+:0x([a-z0-9]+)/);
            if (cidMatch) {
                foundHexCid = cidMatch[1];
            }
        }


        if (ludocidMatch?.length > 1 || altMatch?.length > 1 || foundHexCid) {
            let potentialCID;
            if (foundHexCid) {
                potentialCID = BigInt('0x' + foundHexCid).toString();
            } else {
                potentialCID = ludocidMatch ? ludocidMatch[1] : altMatch[1];
            }

            // Validate CID before setting and using it
            if (!isValidCID(potentialCID)) {
                console.error('Invalid CID format detected at source:', potentialCID);
                return null;
            }
            
            foundCID = potentialCID;
            
            // Add DOM display logic here
            const elements = [...document.querySelectorAll('h1')];
            elements.forEach(element => {
                updateCidDisplay(element, foundCID);
            });

            try {
                console.log('Sending CID_FOUND message:', foundCID);
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

function isValidCID(cid) {
    return typeof cid === 'string' && /^\d+$/.test(cid);
}

// Add the helper functions for creating and updating CID display
function createCidDisplay() {
    const outerWrapper = document.createElement('div');
    outerWrapper.style.display = 'block';
    
    const wrapperContainer = document.createElement('div');
    wrapperContainer.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-top: 4px;';

    const cidDisplay = document.createElement('div');
    cidDisplay.style.cssText = 'display: flex; align-items: center; gap: 4px; padding: 1px 4px; background: rgba(66, 133, 244, 0.1); border-radius: 2px; font-size: 11px; color: #1a73e8; font-family: Google Sans, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;';
    
    const leftContainer = document.createElement('div');
    leftContainer.style.cssText = 'display: flex; align-items: center; gap: 4px;';
    
    const cidLabel = document.createElement('span');
    cidLabel.textContent = 'CID';
    cidLabel.style.cssText = 'font-size: 10px; font-weight: 500; color: #1a73e8; opacity: 0.8;';
    
    const cidValue = document.createElement('span');
    cidValue.style.cssText = 'font-family: Roboto Mono, monospace; font-weight: 500; color: #1a73e8;';
    
    leftContainer.append(cidLabel, cidValue);
    cidDisplay.appendChild(leftContainer);
    
    const copyButton = document.createElement('button');
    copyButton.innerHTML = 'COPY';
    copyButton.style.cssText = 'background: rgba(0, 0, 0, 0.05); border: none; border-radius: 2px; cursor: pointer; padding: 1px 4px; font-size: 10px; font-weight: 500; color: rgba(0, 0, 0, 0.65); transition: all 0.2s ease; text-transform: uppercase;';
    
    copyButton.addEventListener('mouseenter', () => copyButton.style.background = 'rgba(0, 0, 0, 0.08)');
    copyButton.addEventListener('mouseleave', () => copyButton.style.background = 'rgba(0, 0, 0, 0.05)');
    copyButton.addEventListener('click', () => {
        const cidText = cidValue.textContent;
        if (!isValidCID(cidText)) {
            console.error('Invalid CID format detected, clipboard operation blocked');
            return;
        }
        navigator.clipboard.writeText(cidText)
            .then(() => {
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = 'COPIED';
                copyButton.style.background = 'rgba(0, 0, 0, 0.08)';
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.style.background = 'rgba(0, 0, 0, 0.05)';
                }, 1000);
            });
    });

    wrapperContainer.append(cidDisplay, copyButton);
    outerWrapper.appendChild(wrapperContainer);
    
    return { outerWrapper, cidValue };
}

function updateCidDisplay(anchorEl, value) {
    if (!anchorEl) return;

    let display = anchorEl.querySelector('[data-cid-display]');
    if (!display) {
        const { outerWrapper, cidValue } = createCidDisplay();
        outerWrapper.dataset.cidDisplay = 'true';
        display = outerWrapper;
        anchorEl.appendChild(display);
    }

    const cidValue = display.querySelector('span:last-child');
    if (cidValue) {
        cidValue.textContent = value;
    }
    
    display.style.display = 'block';
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
        if (!isValidCID(request.cid)) {
            console.error('Invalid CID format detected in message, clipboard operation blocked');
            return;
        }
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