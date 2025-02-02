// Debug log for content script execution
console.log('Content script executing...', window.location.href);

// Create and inject the script element
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = () => {
    console.log('Injection script loaded');
    script.remove();  // Optional: remove the script tag after loading
};
document.documentElement.appendChild(script);

// Log injection status
console.log('Script injection initiated');
