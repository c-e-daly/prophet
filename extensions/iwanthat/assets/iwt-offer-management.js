document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 iwt-offer-management.js loaded");

    // Wait a bit for other scripts to load
    await new Promise(resolve => setTimeout(resolve, 50));

    // Append modal to body on load
    const iwtModal = document.getElementById('iwt-modal');
    if (iwtModal) {
        // Only append if not already in body
        if (!document.body.contains(iwtModal)) {
            document.body.appendChild(iwtModal);
            console.log("✅ Modal appended to body");
        } else {
            console.log("✅ Modal already in body");
        }
    } else {
        console.error("❌ Modal element is not found.");
    }

    // Check if the URL contains ?iwt parameter and open modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('iwt')) {
        console.log("🎯 Detected Customer Generated Offer in URL. Launching modal.");
        // Wait longer for all scripts to be fully loaded
        setTimeout(() => {
            if (typeof window.iwtOpenOfferModal === 'function') {
                window.iwtOpenOfferModal({
                    sUrl: window.location.href,
                    template: "cart",
                    dVID: null
                });
            } else {
                console.error("❌ iwtOpenOfferModal function is not available.");
            }
        }, 200); 
    }

    // Setup all event listeners with better error handling
    setupEventListeners();
});

// Centralized event listener setup
function setupEventListeners() {
    // Close button event listener
    const closeBtn = document.getElementById('iwt-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            if (typeof window.iwtCloseModal === 'function') {
                window.iwtCloseModal(e);
            } else {
                console.error("❌ iwtCloseModal function is not available.");
            }
        });
        console.log("✅ Close button listener attached");
    }

    // Modal backdrop click listener
    const modal = document.getElementById('iwt-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && typeof window.iwtCloseModal === 'function') {
                window.iwtCloseModal();
            }
        });
        console.log("✅ Modal backdrop listener attached");
    }

    // Submit button event listener
    const submitBtn = document.getElementById('iwt-submit-offer');
    if (submitBtn) {
        submitBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            if (typeof window.iwtHandleSubmit === 'function') {
                await window.iwtHandleSubmit(event);
            } else {
                console.error("❌ iwtHandleSubmit function is not available.");
            }
        });
        console.log("✅ Submit button listener attached");
    }

    // Setup dynamic event listeners (for elements that may not exist yet)
    setupDynamicEventListeners();
}

// Setup event listeners for elements that are created dynamically
function setupDynamicEventListeners() {
    // Use event delegation for dynamically created elements
    document.addEventListener('click', function(e) {
        // Handle retry button clicks
        if (e.target.classList.contains('iwt-retry-offer-button')) {
            if (typeof window.iwtRetry === 'function') {
                window.iwtRetry();
            } else {
                console.error("❌ iwtRetry function is not available.");
            }
        }

        // Handle copy code button clicks
        if (e.target.classList.contains('click-to-copy')) {
            if (typeof window.iwtCopyCode === 'function') {
                window.iwtCopyCode();
            } else {
                console.error("❌ iwtCopyCode function is not available.");
            }
        }

        // Handle checkout button clicks
        if (e.target.id === 'iwt-checkout-button') {
            if (typeof window.iwtCheckout === 'function') {
                window.iwtCheckout();
            } else {
                console.error("❌ iwtCheckout function is not available.");
            }
        }
    });
    
    console.log("✅ Dynamic event listeners setup with delegation");
}

// Function to check if all required functions are available
function checkDependencies() {
    const requiredFunctions = [
        'iwtOpenOfferModal',
        'iwtCloseModal', 
        'iwtHandleSubmit',
        'iwtFetchCart',
        'iwtRenderTable'
    ];

    const missing = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
    
    if (missing.length > 0) {
        console.warn("⚠️ Missing functions:", missing.join(', '));
        return false;
    }
    
    console.log("✅ All required functions are available");
    return true;
}

// Debug function to check system status
window.iwtDebugManagement = function() {
    console.group("🔍 IWT Management Debug");
    console.log("Modal element:", !!document.getElementById('iwt-modal'));
    console.log("Cart table element:", !!document.getElementById('iwt-cart-table'));
    console.log("Submit button element:", !!document.getElementById('iwt-submit-offer'));
    console.log("Dependencies check:", checkDependencies());
    console.log("Available IWT functions:", Object.keys(window).filter(key => key.startsWith('iwt')));
    console.groupEnd();
};

// Auto-run dependency check after a delay
setTimeout(() => {
    checkDependencies();
    
    // Auto-debug if URL contains debug parameter
    if (window.location.search.includes('debug=iwt')) {
        window.iwtDebugManagement();
    }
}, 500);

console.log("✅ iwt-offer-management.js setup complete");


/*
document.addEventListener('DOMContentLoaded', async () => {
    console.log(" iwt-offer-management.js loaded");

    // Append modal to body on load
    const iwtModal = document.getElementById('iwt-modal');
    if (iwtModal) {
        document.body.appendChild(iwtModal);
    } else {
        console.error(" Modal element is not found.");
    }


    // Check if the URL contains ?iwt=customergeneratedoffer and open modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('iwt')) {
        console.log(" Detected Customer generarted Offer in URL. Launching modal.");
        setTimeout(() => {
            if (typeof window.iwtOpenOfferModal === 'function') {
                window.iwtOpenOfferModal({
                    sUrl: window.location.href,
                    template: "cart",
                    dVID: null
                });
            } else {
                console.error("Offer Modal function is not available.");
            }
        }, 100); 
    }

    document.getElementById('iwt-modal-btn')?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (typeof window.iwtCloseModal === 'function') {
            window.iwtCloseModal(e);
        } else {
            console.error("Close Modal function is not available.");
        }
    });
        // Event Listener: Close modal when clicking outside
        document.getElementById('iwt-modal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('iwt-modal') && typeof window.iwtCloseModal === 'function') {
                window.iwtCloseModal();
            }
        });


    // Event Listener: Handle Offer Submission
    document.getElementById('iwt-submit-offer')?.addEventListener('click', async (event) => {
        event.preventDefault();
        if (typeof window.iwtHandleSubmit === 'function') {
            window.iwtHandleSubmit(event);
        } else {
            console.error("Submit function is not available.");
        }
    });

    // Event Listener: Handle Offer Response (Retry)
    document.querySelector('.iwt-retry-offer-button')?.addEventListener('click', () => {
        if (typeof window.iwtRetry === 'function') {
            window.iwtRetry();
        } else {
            console.error(" Retry function is not available.");
        }
    });

    // Event Listener: Copy Discount Code
    document.querySelector('.click-to-copy')?.addEventListener('click', () => {
        if (typeof window.iwtCopyCode === 'function') {
            window.iwtCopyCode();
        } else {
            console.error(" Copy Code function is not available.");
        }
    });

    // Event Listener: Proceed to Checkout
    document.getElementById('iwt-checkout-button')?.addEventListener('click', () => {
        if (typeof window.iwtCheckout === 'function') {
            window.iwtCheckout();
        } else {
            console.error(" Checkout function is not available.");
        }
    });
});
*/