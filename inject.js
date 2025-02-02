


// Debug log for injected script
console.log('Injected script executing...');
console.log('Monkey patching XHR and fetch...');
// Monkey patch XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

const cidMap = {};

XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    // console.log('XHR Open intercepted:', method, url);
    return originalXHROpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
    if (this._url && this._url.includes('maps/preview/place')) {
        // console.log('XHR intercepted:', this._url);
        
        // Store the original handlers
        const originalOnReadyStateChange = this.onreadystatechange;
        const originalOnLoad = this.onload;
        
        // Create our response handler
        const handleResponse = () => {
            // console.log('XHR Response:', this.responseText);

            if (this.readyState === 4 && this.status === 200) {
                try {
                    // console.log('XHR Response received:', this.responseText);
                    //\["\d+","(\d+)"\],"\/g\/
                    const nameMatch = /"0x[^\:]+:0x[^"]+","([^"]+)"/.exec(this.responseText);
                    const cidMatch = /\["\d+","(\d+)"\],"\/g\//.exec(this.responseText);
                    if (cidMatch && nameMatch) {
                        const cid = cidMatch[1];
                        const name = nameMatch[1];
                        cidMap[name] = cid;
                        console.log(`[2]CID found for "${name}":`, cid);
                    }
                } catch (e) {
                    console.error('Error reading XHR response:', e);
                }
            }
        };

        // Add our response handler
        this.addEventListener('readystatechange', handleResponse);
        
        // Chain the original handlers if they exist
        if (originalOnReadyStateChange) {
            this.onreadystatechange = function() {
                handleResponse();
                return originalOnReadyStateChange.apply(this, arguments);
            };
        }
        
        if (originalOnLoad) {
            this.onload = function() {
                handleResponse();
                return originalOnLoad.apply(this, arguments);
            };
        }
    }
    return originalXHRSend.apply(this, arguments);
};

// Monkey patch Fetch
const originalFetch = window.fetch;
window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    
    if (url && url.includes('https://www.google.com/maps/preview/place')) {
        console.log('Fetch intercepted:', url);
        return originalFetch.apply(this, arguments).then(response => {
            response.clone().text().then(text => {
                console.log('Fetch Response:', text);
            });
            return response;
        });
    }
    return originalFetch.apply(this, arguments);
}; 

// Start observing h1 changes once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Function to create CID display elements
    const createCidDisplay = () => {
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
        
        copyButton.onmouseenter = () => {
            copyButton.style.background = 'rgba(0, 0, 0, 0.08)';
        };
        copyButton.onmouseleave = () => {
            copyButton.style.background = 'rgba(0, 0, 0, 0.05)';
        };
        copyButton.onclick = () => {
            navigator.clipboard.writeText(cidValue.textContent)
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
    };

    // Function to update CID display position and content
    const updateCidDisplay = (anchorEl, value) => {
        if (!anchorEl) return;

        // Check if element already has a CID display
        let display = anchorEl.querySelector('[data-cid-display]');
        if (!display) {
            // Create new display if none exists
            const { outerWrapper, cidValue } = createCidDisplay();
            outerWrapper.dataset.cidDisplay = 'true';
            display = outerWrapper;
            anchorEl.appendChild(display);
        }

        // Update the CID value
        const cidValue = display.querySelector('span:last-child');
        if (cidValue) {
            cidValue.textContent = value;
        }
        
        display.style.display = 'block';
    };

    const cidMatch = /\[\\"0x[0-9a-z]+\:(0x[0-9a-z]+)\\",\\"([^"]+)\\"/.exec(document.documentElement.innerHTML);
    if (cidMatch) {
        const cid = BigInt('0x' + cidMatch[1].substring(2)).toString();
        const name = cidMatch[2];
        cidMap[name] = cid;
        // issue with how chrome delivers tags for SEO when not directly navigated to from maps.app.goo.gl
        const title = document.documentElement.innerHTML.match(/aria-label="([^"]+)" role="main" jslog=/);
        if (title) {
            cidMap[title[1]] = cid;
        }
        console.log(`[1]CID found for "${name}":`, cid);
    }

    // Function to check elements for CID matches
    const checkElements = () => {
        // Check both h1 and fontHeadlineSmall elements
        const elements = [...document.querySelectorAll('h1, .fontHeadlineSmall')];
        elements.forEach(element => {
            const name = element.innerText;
            if (cidMap[name]) {
                console.log(`FINAL Found matching CID for "${name}":`, cidMap[name]);
                updateCidDisplay(element, cidMap[name]);
                // Dispatch custom event for content script
                document.dispatchEvent(new CustomEvent('CID_FOUND', {
                    detail: {
                        cid: cidMap[name],
                        name: name
                    }
                }));
            }
        });
    };

    // Set up observer for document body to watch for relevant changes
    const bodyObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            // Check for added/removed nodes
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'H1' || 
                    node.classList?.contains('fontHeadlineSmall') ||
                    node.querySelector?.('h1, .fontHeadlineSmall')) {
                    checkElements();
                }
            });
        });

        // Also check for any text changes that might have been missed
        checkElements();
    });

    // Start observing document body
    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Do initial check
    checkElements();
});
