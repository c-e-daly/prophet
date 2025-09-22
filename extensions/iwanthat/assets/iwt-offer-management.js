document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 iwt-offer-management.js loaded");

    // Wait longer for all scripts to load
    await new Promise(resolve => setTimeout(resolve, 300));

    // Append modal to body on load
    const iwtModal = document.getElementById('iwt-modal');
    if (iwtModal) {
        if (!document.body.contains(iwtModal)) {
            document.body.appendChild(iwtModal);
            console.log("✅ Modal appended to body");
        } else {
            console.log("✅ Modal already in body");
        }
    } else {
        console.error("❌ Modal element is not found.");
    }

    // Wait for dependencies before setting up
    await waitForDependencies();

    // Setup event listeners
    setupEventListeners();

    // Check if the URL contains ?iwt parameter (for remarketing)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('iwt')) {
        console.log("🎯 Detected Customer Generated Offer in URL. Launching modal.");
        setTimeout(() => {
            if (typeof window.iwtOpenOfferModal === 'function') {
                window.iwtOpenOfferModal({
                    sUrl: window.location.href,
                    template: "cart",
                    dVID: null
                });
            } else {
                console.error("❌ iwtOpenOfferModal function still not available.");
            }
        }, 100); 
    }

    console.log("✅ iwt-offer-management.js setup complete");
});

// Wait for required dependencies to load
async function waitForDependencies(maxWait = 5000) {
    const requiredFunctions = ['iwtOpenOfferModal', 'iwtCloseModal'];
    const startTime = Date.now();

    return new Promise((resolve) => {
        const checkFunctions = () => {
            const missing = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
            
            if (missing.length === 0) {
                console.log("✅ All required functions are available");
                resolve(true);
                return;
            }

            if (Date.now() - startTime > maxWait) {
                console.warn("⚠️ Timeout waiting for functions:", missing.join(', '));
                resolve(false);
                return;
            }

            setTimeout(checkFunctions, 100);
        };

        checkFunctions();
    });
}

// Centralized event listener setup
function setupEventListeners() {
    // Setup main offer button click handler (CRITICAL FOR CART PAGE)
    setupOfferButtonHandler();

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

    // Setup dynamic event listeners
    setupDynamicEventListeners();
}

// CRITICAL: Setup the main "Wanna Make a Deal?" button handler
function setupOfferButtonHandler() {
    // Find the main offer button
    const offerButton = document.getElementById('iwt-modal-offer-button');
    
    if (offerButton) {
        // Remove any existing onclick attribute to avoid conflicts
        offerButton.removeAttribute('onclick');
        
        // Add proper event listener
        offerButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log("🎯 Offer button clicked!");
            
            if (typeof window.iwtOpenOfferModal === 'function') {
                // Determine template based on current page
                const template = getPageTemplate();
                const storeUrl = window.location.origin;
                const defaultVariant = offerButton.dataset.variant || null;
                
                console.log(`🚀 Opening modal - Template: ${template}`);
                
                window.iwtOpenOfferModal({
                    sUrl: storeUrl,
                    dVID: defaultVariant,
                    template: template
                });
            } else {
                console.error("❌ iwtOpenOfferModal function is not available when button clicked");
                alert("Sorry, the offer system is not ready yet. Please refresh the page and try again.");
            }
        });
        
        console.log("✅ Main offer button handler attached");
    } else {
        console.log("ℹ️ Main offer button not found on this page");
    }
}

// Determine the current page template
function getPageTemplate() {
    // Check if we're on cart page
    if (window.location.pathname.includes('/cart')) {
        return 'cart';
    }
    
    // Check if we're on product page
    if (window.location.pathname.includes('/products/')) {
        // Check for template suffixes
        if (document.body.classList.contains('template-product-iwtclearance')) {
            return 'iwtclearance';
        } else if (document.body.classList.contains('template-product-iwtstandard')) {
            return 'iwtstandard';
        } else {
            return 'product';
        }
    }
    
    // Default fallback
    return 'product';
}

// Setup event listeners for dynamically created elements
function setupDynamicEventListeners() {
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

// Debug function
window.iwtDebugManagement = function() {
    console.group("🔍 IWT Management Debug");
    console.log("Modal element:", !!document.getElementById('iwt-modal'));
    console.log("Cart table element:", !!document.getElementById('iwt-cart-table'));
    console.log("Submit button element:", !!document.getElementById('iwt-submit-offer'));
    console.log("Offer button element:", !!document.getElementById('iwt-modal-offer-button'));
    console.log("Current page template:", getPageTemplate());
    console.log("Available IWT functions:", Object.keys(window).filter(key => key.startsWith('iwt')));
    console.groupEnd();
};


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