// iwt-offer-submit.ts - handle form data offer submission
const $ = (id) => document.getElementById(id);
const stripNum = (x) => parseFloat(String(x||'').replace(/[^\d.]/g,'')) || 0;

// MISSING FUNCTION: Add the iwtHandleSubmit function that management.js is looking for
window.iwtHandleSubmit = async function(event) {
    event.preventDefault();
    
    const submitBtn = $('iwt-submit-offer');
    if (!submitBtn || submitBtn.disabled) return;
    
    // Basic inline validation instead of calling external validation
    if (!iwtValidateFormInline()) {
        console.log('🚫 Form validation failed. Submission prevented.');
        return;
    }
    
    submitBtn.disabled = true;
    
    try {
        console.log('✅ Form is valid. Fetching cart...');
        const cart = await window.iwtFetchCart();
        
        if (!cart || !cart.items || cart.items.length === 0) {
            console.error("❌ Cart is empty or failed to load.");
            alert("Your cart is empty. Please add items before making an offer.");
            return;
        }
        
        console.log("✅ Cart fetched successfully:", cart);
        await iwtSubmitOfferToAPI(cart);
        
    } catch (error) {
        console.error("❌ Error during submission:", error);
        alert('Error submitting offer. Please try again.');
    } finally {
        submitBtn.disabled = false;
    }
};

// Simple inline validation function
window.iwtValidateFormInline = function() {
    let isValid = true;
    const errors = [];
    
    // Clear previous errors
    const errorContainer = $('iwt-modal-error');
    if (errorContainer) {
        errorContainer.style.display = 'none';
        errorContainer.innerHTML = '';
    }
    
    // Validate required fields
    const name = $('iwt-name')?.value?.trim();
    const email = $('iwt-email')?.value?.trim();
    const mobile = $('iwt-mobile')?.value?.trim();
    const postal = $('iwt-postal')?.value?.trim();
    const offerPrice = stripNum($('iwt-offer-price')?.value);
    const tosChecked = $('iwt-tos-checkbox')?.checked;
    
    // Validation logic
    if (!name) {
        errors.push('Name is required');
        isValid = false;
    }
    
    if (!email) {
        errors.push('Email is required');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please enter a valid email address');
        isValid = false;
    }
    
    if (!mobile) {
        errors.push('Mobile number is required');
        isValid = false;
    }
    
    if (!postal) {
        errors.push('Postal code is required');
        isValid = false;
    }
    
    if (!offerPrice || offerPrice <= 0) {
        errors.push('Offer price must be greater than zero');
        isValid = false;
    }
    
    // Check if offer exceeds cart total
    const cartTotalElement = $('iwt-cart-total');
    if (cartTotalElement) {
        const cartTotal = stripNum(cartTotalElement.textContent);
        if (offerPrice > cartTotal) {
            errors.push('Offer price cannot exceed cart total');
            isValid = false;
        }
    }
    
    if (!tosChecked) {
        errors.push('You must agree to the Terms of Service');
        isValid = false;
    }
    
    // Display errors if any
    if (!isValid && errorContainer) {
        errorContainer.innerHTML = errors.join('<br>');
        errorContainer.style.display = 'block';
    }
    
    return isValid;
};

// Improved submission function with better error handling
window.iwtSubmitOfferToAPI = async function(cart) {
    try {
        const form = $('iwt-form');
        if (!form) {
            throw new Error('Form element not found');
        }
        
        const fd = new FormData(form);
        const f = Object.fromEntries(fd.entries());
        
        // Fix types/format and use proper field names
        const offerPrice = stripNum(f.consumerName || $('iwt-offer-price')?.value).toFixed(2);
        const tosChecked = $('iwt-tos-checkbox')?.checked === true;
        
        // Determine cart composition
        const templates = [...new Set(cart.items.map(i => i.properties?.template || 'regular'))];
        const cartComposition = templates.length > 1 ? 'mixed' : 
            (templates[0] === 'iwtclearance' ? 'clearance only' : 'regular only');
        
        // Build offer data object
        const offerData = {
            // Use direct field access since FormData might not match our expected names
            consumerName: $('iwt-name')?.value?.trim(),
            consumerEmail: $('iwt-email')?.value?.trim(),
            consumerMobile: $('iwt-mobile')?.value?.trim(),
            consumerPostalCode: $('iwt-postal')?.value?.trim(),
            offerPrice,
            tosChecked,
            storeUrl: location.origin.replace(/^https?:\/\//, ''),
            currency: cart.currency,
            tosCheckedDate: new Date().toISOString(),
            cartToken: cart.token,
            cartCreateDate: window.iwtCartCreated || new Date().toISOString(),
            cartUpdateDate: window.iwtCartUpdated || new Date().toISOString(),
            offerCreateDate: new Date().toISOString(),
            cartComposition,
            items: cart.items.map(item => ({
                productID: item.product_id,
                productName: item.product_title,
                productURL: item.url,
                variantID: item.variant_id,
                sku: item.sku,
                quantity: item.quantity,
                price: item.presentment_price,
                lineTotal: item.quantity * item.presentment_price,
                cartToken: cart.token,
                template: item.properties?.template || 'regular',
            })),
            cartItems: new Set(cart.items.map(i => i.sku)).size,
            cartUnits: cart.items.reduce((n, i) => n + i.quantity, 0),
            cartTotalPrice: (cart.total_price / 100).toFixed(2),
        };
        
        console.log('🚀 Submitting offer:', offerData);
        
        // Include Shopify-specific parameters and headers
        const url = new URL('/apps/process-offer', window.location.origin);
        
        // Preserve any existing query parameters that Shopify might need
        const currentParams = new URLSearchParams(window.location.search);
        ['shop', 'timestamp', 'signature', 'logged_in_customer_id'].forEach(param => {
            if (currentParams.has(param)) {
                url.searchParams.set(param, currentParams.get(param));
            }
        });

        const resp = await fetch(url.toString(), {
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'X-Shopify-Shop-Domain': window.Shopify?.shop || window.location.hostname,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(offerData),
        });
        
        if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`API Response Error: ${resp.status} - ${errorText}`);
        }
        
        const data = await resp.json();
        console.log('✅ Offer response received:', data);
        
        if (data && typeof window.iwtDisplayResponse === 'function') {
            await window.iwtDisplayResponse(data);
        } else {
            console.error('❌ Invalid response format or missing display function');
            alert('Offer submitted, but response handling failed. Please contact support.');
        }
        
    } catch (err) {
        console.error('❌ Error when submitting offer:', err);
        
        // More specific error messages
        if (err.message.includes('fetch')) {
            alert('Network error. Please check your connection and try again.');
        } else if (err.message.includes('API Response Error')) {
            alert('Server error. Please try again later or contact support.');
        } else {
            alert('Error when submitting offer. Please try again later.');
        }
    }
};
