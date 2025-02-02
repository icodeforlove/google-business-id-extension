// Function to parse and convert hex CID to decimal
const cidMap = {};

function parseCidFromUrl(url, element) {
    if (url && url.includes('/maps/place')) {
        const match = url.match(/0x0:([0-9a-fx]+)/i);
        if (match) {
            const hexCid = match[1];
            const decimalCid = BigInt(hexCid).toString();
            if (element) {
                const titleElement = document.querySelector('h2[data-attrid="title"], [aria-level="2"][data-attrid="title"][role="heading"]');
                if (titleElement) {
                    cidMap[titleElement.textContent] = decimalCid;
                }
                displayCidInterface(decimalCid, element);
            }
            return decimalCid;
        }
    }
    return null;
}

// Function to parse CID from data-fid attribute
function parseCidFromFid(fid, element) {
    if (fid) {
        const match = fid.match(/0x[0-9a-f]+:([0-9a-fx]+)/i);
        if (match) {
            const hexCid = match[1];
            const decimalCid = BigInt(hexCid).toString();
            if (element) {
                const titleElement = document.querySelector('h2[data-attrid="title"], [aria-level="2"][data-attrid="title"][role="heading"]');
                if (titleElement) {
                    cidMap[titleElement.textContent] = decimalCid;
                }
                displayCidInterface(decimalCid, element);
            }
            return decimalCid;
        }
    }
    return null;
}

function isValidCID(cid) {
    return typeof cid === 'string' && /^\d+$/.test(cid);
}

// Function to create CID display elements
function createCidDisplay() {
    // Create an outer wrapper for positioning
    const outerWrapper = document.createElement('div');
    outerWrapper.style.display = 'block';
    
    // Create a wrapper container
    const wrapperContainer = document.createElement('div');
    wrapperContainer.style.display = 'flex';
    wrapperContainer.style.alignItems = 'center';
    wrapperContainer.style.gap = '6px';
    wrapperContainer.style.marginTop = '4px';

    // Create a sticky element to display CID
    const cidDisplay = document.createElement('div');
    cidDisplay.style.display = 'flex';
    cidDisplay.style.alignItems = 'center';
    cidDisplay.style.gap = '4px';
    cidDisplay.style.padding = '1px 4px';
    cidDisplay.style.background = 'rgba(66, 133, 244, 0.1)';
    cidDisplay.style.borderRadius = '2px';
    cidDisplay.style.fontSize = '11px';
    cidDisplay.style.color = '#1a73e8';
    cidDisplay.style.fontFamily = 'Google Sans, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    
    // Create left container for label and value
    const leftContainer = document.createElement('div');
    leftContainer.style.display = 'flex';
    leftContainer.style.alignItems = 'center';
    leftContainer.style.gap = '4px';
    
    // Create the label
    const cidLabel = document.createElement('span');
    cidLabel.textContent = 'CID';
    cidLabel.style.fontSize = '10px';
    cidLabel.style.fontWeight = '500';
    cidLabel.style.color = '#1a73e8';
    cidLabel.style.opacity = '0.8';
    leftContainer.appendChild(cidLabel);
    
    // Create the CID value display
    const cidValue = document.createElement('span');
    cidValue.style.fontFamily = 'Roboto Mono, monospace';
    cidValue.style.fontWeight = '500';
    cidValue.style.color = '#1a73e8';
    leftContainer.appendChild(cidValue);
    
    cidDisplay.appendChild(leftContainer);
    wrapperContainer.appendChild(cidDisplay);
    
    // Create the copy button
    const copyButton = document.createElement('button');
    copyButton.innerHTML = 'COPY';
    copyButton.style.background = 'rgba(0, 0, 0, 0.05)';
    copyButton.style.border = 'none';
    copyButton.style.borderRadius = '2px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.padding = '1px 4px';
    copyButton.style.fontSize = '10px';
    copyButton.style.fontWeight = '500';
    copyButton.style.color = 'rgba(0, 0, 0, 0.65)';
    copyButton.style.transition = 'all 0.2s ease';
    copyButton.style.textTransform = 'uppercase';
    copyButton.style.height = '18px';
    copyButton.style.display = 'flex';
    copyButton.style.alignItems = 'center';
    copyButton.style.justifyContent = 'center';
    copyButton.style.minWidth = '40px';
    
    copyButton.onmouseenter = () => {
        copyButton.style.background = 'rgba(0, 0, 0, 0.08)';
    };
    copyButton.onmouseleave = () => {
        copyButton.style.background = 'rgba(0, 0, 0, 0.05)';
    };
    copyButton.onclick = () => {
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
    };
    wrapperContainer.appendChild(copyButton);

    outerWrapper.appendChild(wrapperContainer);
    
    return {
        outerWrapper,
        wrapperContainer,
        cidValue
    };
}

// Function to display CID interface under the element
function displayCidInterface(cid, element) {
    if (!element) {
        return;
    }

    // First check if there's already a CID display anywhere in the document with this CID
    const existingDisplays = document.querySelectorAll('[data-cid-display]');
    for (const existing of existingDisplays) {
        const cidValue = existing.querySelector('span:last-child');
        if (cidValue && cidValue.textContent === cid) {
            return;
        }
    }

    // Find the title element
    const titleElement = document.querySelector('h2[data-attrid="title"], [aria-level="2"][data-attrid="title"][role="heading"]');
    if (!titleElement) {
        return;
    }

    // Check if there's already a CID display after the title
    let display = titleElement.nextElementSibling?.getAttribute('data-cid-display') ? 
                 titleElement.nextElementSibling : null;

    if (!display) {
        // Create new display if none exists
        const { outerWrapper, cidValue } = createCidDisplay();
        outerWrapper.dataset.cidDisplay = 'true';
        outerWrapper.dataset.cid = cid; // Add CID to dataset for easier checking
        display = outerWrapper;
        
        // Insert after the title element
        titleElement.parentNode.insertBefore(display, titleElement.nextSibling);
    }

    // Update the CID value
    const cidValue = display.querySelector('span:last-child');
    if (cidValue) {
        cidValue.textContent = cid;
    }
    
    display.style.display = 'block';

    // Dispatch custom event for background page
    document.dispatchEvent(new CustomEvent('CID_FOUND', {
        detail: {
            cid: cid,
            name: titleElement.textContent
        }
    }));
}

// Function to scan page for map links
function scanPageForMapLinks() {
    // Look for any links containing maps/place
    const mapLinks = document.querySelectorAll('a[href*="maps/place"], a[href*="maps/search"], [data-url*="maps/place"], h2[data-attrid="title"]');
    
    mapLinks.forEach(el => {
        const url = el.href || el.getAttribute('data-url');
        if (url) {
            parseCidFromUrl(url, el);
        }
    });

    // Look for elements with data-fid attributes
    const fidElements = document.querySelectorAll('[data-fid]');
    fidElements.forEach(el => {
        const fid = el.getAttribute('data-fid');
        if (fid) {
            parseCidFromFid(fid, el);
        }
    });

    // Also look for elements with inline onclick handlers containing maps URLs
    document.querySelectorAll('[onclick*="maps/place"]').forEach(el => {
        const onclickContent = el.getAttribute('onclick');
        if (onclickContent) {
            const match = onclickContent.match(/maps\/place[^'"]+/);
            if (match) {
                parseCidFromUrl(match[0], el);
            }
        }
    });
}

// Set up observer to watch for changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Scan the new node and its children
                    const elements = [node, ...node.querySelectorAll('*')];
                    elements.forEach(el => {
                        const url = el.href || el.getAttribute('data-url');
                        if (url && url.includes('maps/place')) {
                            parseCidFromUrl(url, el);
                        }
                        const fid = el.getAttribute('data-fid');
                        if (fid) {
                            parseCidFromFid(fid, el);
                        }
                    });
                }
            });
        } else if (mutation.type === 'attributes') {
            if (mutation.attributeName === 'data-fid') {
                const fid = mutation.target.getAttribute('data-fid');
                if (fid) {
                    parseCidFromFid(fid, mutation.target);
                }
            } else {
                const url = mutation.target.href || mutation.target.getAttribute('data-url');
                if (url && url.includes('maps/place')) {
                    parseCidFromUrl(url, mutation.target);
                }
            }
        }
    });
});

// Do initial scan immediately
scanPageForMapLinks();

// Wait for DOM to be ready before starting observation
document.addEventListener('DOMContentLoaded', () => {
    // Do another scan when DOM is ready
    scanPageForMapLinks();

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-url', 'href', 'onclick', 'data-fid']
    });
});

// Listen for CID_FOUND events and send to background page
document.addEventListener('CID_FOUND', (event) => {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
            type: 'CID_FOUND',
            data: event.detail
        });
    }
});

// Listen for extension icon clicks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.type === 'GET_CID') {
        // First try to get CID from cidMap using the current title
        const titleElement = document.querySelector('h2[data-attrid="title"], [aria-level="2"][data-attrid="title"][role="heading"]');
        if (titleElement && cidMap[titleElement.textContent]) {
            const cid = cidMap[titleElement.textContent];
            if (!isValidCID(cid)) {
                console.error('Invalid CID format detected in cidMap, clipboard operation blocked');
                sendResponse({ success: false, error: 'Invalid CID format' });
                return true;
            }
            console.log('Found CID in map:', cid);
            // Send CID_FOUND message to background script
            chrome.runtime.sendMessage({
                type: 'CID_FOUND',
                data: {
                    cid: cid,
                    name: titleElement.textContent
                }
            });

            navigator.clipboard.writeText(cid).then(() => {
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

            // COPY_TO_CLIPBOARD
            // chrome.runtime.sendMessage({
            //     type: 'COPY_TO_CLIPBOARD',
            //     cid: cid
            // });

            sendResponse({ success: true });
            return true;
        }

        // Fallback to looking for displayed CID
        const cidDisplays = document.querySelectorAll('[data-cid-display]');
        console.log('Found CID displays:', cidDisplays.length);
        
        if (cidDisplays.length > 0) {
            const cidValue = cidDisplays[0].querySelector('span:last-child');
            if (cidValue && cidValue.textContent) {
                const cid = cidValue.textContent;
                if (!isValidCID(cid)) {
                    console.error('Invalid CID format detected in displayed CID, clipboard operation blocked');
                    sendResponse({ success: false, error: 'Invalid CID format' });
                    return true;
                }
                console.log('Found CID value:', cid);
                // Send CID_FOUND message to background script
                chrome.runtime.sendMessage({
                    type: 'CID_FOUND',
                    data: {
                        cid: cid,
                        name: titleElement ? titleElement.textContent : 'Unknown'
                    }
                });
                sendResponse({ success: true });
                return true;
            }
        }
        console.log('No CID found on page');
        sendResponse({ success: false, error: 'No CID found on page' });
    }
    return true;
});

// Also try after a short delay to catch any dynamic content
setTimeout(scanPageForMapLinks, 1000);
setTimeout(scanPageForMapLinks, 2000);