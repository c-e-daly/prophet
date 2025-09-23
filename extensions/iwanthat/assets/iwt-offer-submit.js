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
        
        const resp = await fetch('/apps/process-offer', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offerData),
        });
        
        if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`API Response Error: ${resp.status} - ${errorText}`);
        }
        
        const data = await resp.json();
        console.log('✅ Offer response received:', data);
        
        if (data?.response && typeof window.iwtDisplayResponse === 'function') {
            await window.iwtDisplayResponse(data.response);
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

/*
const $ = (id) => document.getElementById(id);
const stripNum = (x) => parseFloat(String(x||'').replace(/[^\d.]/g,'')) || 0;

window.iwtSubmitOfferToAPI = async function(cart){
  try{
    const form = $('iwt-form');
    const fd   = new FormData(form);
    const f    = Object.fromEntries(fd.entries());   // { consumerName, consumerEmail, ... }
    // Fix types/format
    const offerPrice = stripNum(f.offerPrice).toFixed(2);
    const tosChecked = $('iwt-tos-checkbox')?.checked === true; // checkboxes need this
    const templates = [...new Set(cart.items.map(i => i.properties?.template || 'regular'))];
    const cartComposition = templates.length>1 ? 'mixed' : (templates[0]==='iwtclearance' ? 'clearance only' : 'regular only');
    const offerData = {
      ...f,
      offerPrice,
      tosChecked,
      storeUrl: location.origin.replace(/^https?:\/\//,''),
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
      cartItems: new Set(cart.items.map(i=>i.sku)).size,
      cartUnits: cart.items.reduce((n,i)=>n+i.quantity,0),
      cartTotalPrice: (cart.total_price/100).toFixed(2),
    };

    const resp = await fetch('apps/process-offer', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(offerData),
    });
    if(!resp.ok) throw new Error(`API Response Error: ${resp.status}`);
    const data = await resp.json();

    if (data?.response && typeof window.iwtDisplayResponse==='function'){
      await window.iwtDisplayResponse(data.response);
    } else {
      alert('Unexpected response. Please try again later.');
    }
  }catch(err){
    console.error('Error when submitting offer:', err);
    alert('Error when submitting offer. Please try again later.');
  }
};






window.iwtHandleSubmit = async function(event) {
    event.preventDefault();

    const submitBtn = iwtGetEl('iwt-submit-offer');
    if (!submitBtn || submitBtn.disabled) return;
    
    if (!iwtValidateForm()) {
        console.log(' Form validation failed. Submission prevented.');
        return;
    }

    submitBtn.disabled = true;

    try {
        console.log(' Form is valid. Fetching cart...')
        const cart = await window.iwtFetchCart();
        if (!cart || !cart.items || cart.items.length === 0) {
            console.error(" Cart is empty or failed to load.");
            alert("Your cart is empty. Please add items before making an offer.");
            return;
        }

        console.log("Cart fetched successfully:", cart);
        await iwtSubmitOfferToAPI(cart);

    } catch (error) {
        console.error(" Error during submission:", error);
    } finally {
        submitBtn.disabled = false;
    }
};

window.iwtSubmitOfferToAPI = async function(cart) {
    try {
        console.log("Preparing offer submission...");
        const storeUrl = window.location.origin.replace(/^https?:\/\//, '');
        console.log(" Store URL: ", storeUrl);
        const cartComposition = (() => {
            const templates = [...new Set(cart.items.map(i => i.properties?.template || 'regular'))];
            return templates.length > 1 ? 'mixed' : templates[0] === 'iwtclearance' ? 'clearance only' : 'regular only';
        })();
        console.log(" Cart Composition:", cartComposition);

        // Prepare offer data
        const offerData = {
            storeUrl: storeUrl,  
            consumerName: iwtGetEl('iwt-name').value,
            consumerEmail: iwtGetEl('iwt-email').value,
            consumerMobile: iwtGetEl('iwt-mobile').value,
            consumerPostalCode: iwtGetEl('iwt-postal').value,
            currency: cart.currency,
            offerPrice: parseFloat(iwtGetEl('iwt-offer-price').value).toFixed(2),
            tosChecked: iwtGetEl('iwt-tos-checkbox').checked,
            tosCheckedDate: new Date().toISOString(),
            cartToken: cart.token,
            cartCreateDate: window.iwtCartCreated || new Date().toISOString(),
            cartUpdateDate: window.iwtCartUpdated || new Date().toISOString(),
            offerCreateDate: new Date().toISOString(),
            cartComposition: cartComposition,
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
            cartItems: new Set(cart.items.map(item => item.sku)).size,
            cartUnits: cart.items.reduce((totalUnits, item) => totalUnits + item.quantity, 0),
            cartTotalPrice: (cart.total_price / 100).toFixed(2),
        };

        console.log("Submitting offer: ", offerData);
      
        const response = await fetch('apps/process-offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offerData),
        });

        if (!response.ok) throw new Error(` API Response Error: ${response.status}`);

        const apiResp = await response.json();
        console.log("Offer Response Received:", apiResp.response);

        if (apiResp?.response) {
            if (typeof window.iwtDisplayResponse === 'function') {
                console.log(" Calling iwtDisplayResponse...");
                await window.iwtDisplayResponse(apiResp.response);
                console.log(" Display Response executed.");
            } else {
                console.error(" iwtDisplayResponse is missing. Ensure iwt-offer-response.js is loaded.");
                alert('Offer submitted, but response handling failed.');
            }
        } else {
            console.warn(" Unexpected response format. Please try again.");
            alert('Unexpected response. Please try again later.');
        }

    } catch (error) {
        console.error(" Error when submitting offer:", error);
        alert('Error when submitting offer. Please try again later.');
    }
};

// Attach event listener once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('iwt-submit-offer');
    if (submitBtn) {
        submitBtn.addEventListener('click', window.iwtHandleSubmit);
    }
});
*/