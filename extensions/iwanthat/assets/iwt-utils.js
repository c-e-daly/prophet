// Minimal utility functions for IWT offer system
window.iwtGetEl = function(id) {
    return document.getElementById(id);
};

// Alternative shorter version for internal use
window.$ = function(id) {
    return document.getElementById(id);
};

// Simple number parsing utility
window.iwtStripNum = function(x) {
    return parseFloat(String(x || '').replace(/[^\d.]/g, '')) || 0;
};

// Debug utility to check if element exists
window.iwtCheckEl = function(id) {
    const el = document.getElementById(id);
    console.log(`Element ${id}:`, el ? '✅ Found' : '❌ Not found');
    return !!el;
};

console.log("✅ iwt-utils.js loaded");