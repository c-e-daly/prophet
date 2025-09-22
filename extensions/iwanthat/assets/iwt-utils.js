// Get an element by ID
window.iwtGetEl = function(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️ Element with ID "${id}" not found`);
    }
    return element;
};

console.log("✅ iwt-utils.js Loaded");

// Email and Phone validation regex
window.iwtVEmail = function(email) {
    return /^[\w.+-]+@[a-zA-Z\d-]+\.[a-zA-Z]{2,}$/.test(email);
};

window.iwtVPhone = function(phone) {
    return /^\d{10}$/.test(phone);
};

// ERROR DISPLAY FUNCTIONS (these were missing!)
window.iwtShowError = function(element, message) {
    if (!element) return;
    
    element.style.borderColor = 'red';
    element.style.borderWidth = '2px';
    
    // Remove existing tooltip if present
    const existingTooltip = element.parentElement.querySelector('.iwt-custom-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create new tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'iwt-custom-tooltip';
    tooltip.innerText = message;
    element.parentElement.appendChild(tooltip);
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    
    // Auto-remove tooltip after 5 seconds
    setTimeout(() => {
        tooltip.classList.add("fade-out");
        setTimeout(() => {
            if (tooltip.parentElement) {
                tooltip.remove();
            }
        }, 1800);
    }, 5000);
};

window.iwtClearError = function(element) {
    if (!element) return;
    
    element.style.borderColor = '';
    element.style.borderWidth = '';
    
    const tooltip = element.parentElement.querySelector('.iwt-custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
};

// Clear all form errors
window.iwtClearAllErrors = function() {
    const errorFields = ['iwt-name', 'iwt-email', 'iwt-mobile', 'iwt-postal', 'iwt-offer-price'];
    errorFields.forEach(fieldId => {
        const field = iwtGetEl(fieldId);
        if (field) {
            iwtClearError(field);
        }
    });
    
    // Clear TOS error
    const tosError = iwtGetEl('iwt-tos-error');
    if (tosError) {
        tosError.style.display = 'none';
    }
};

// Validation helper functions
window.iwtValidateName = function(name) {
    if (!name.value.trim()) {
        iwtShowError(name, 'Please fill in your first and last name');
        return false;
    }
    iwtClearError(name);
    return true;
};

window.iwtValidateEmail = function(email) {
    if (!email.value.trim()) {
        iwtShowError(email, 'Please fill in your email');
        return false;
    } else if (!iwtVEmail(email.value)) {
        iwtShowError(email, 'Please enter a valid email');
        return false;
    }
    iwtClearError(email);
    return true;
};

window.iwtValidatePhone = function(mobile) {
    if (!mobile.value.trim()) {
        iwtShowError(mobile, 'Please fill in your mobile number');
        return false;
    } else if (!iwtVPhone(mobile.value)) {
        iwtShowError(mobile, 'Please enter a valid phone number');
        return false;
    }
    iwtClearError(mobile);
    return true;
};

window.iwtValidatePostalCode = function(postalCode) {
    if (!postalCode.value.trim()) {
        iwtShowError(postalCode, 'Please fill in your postal code');
        return false;
    }
    iwtClearError(postalCode);
    return true;
};

window.iwtValidateTerms = function(tosCheckbox) {
    const tosError = iwtGetEl('iwt-tos-error');
    if (!tosCheckbox.checked) {
        if (tosError) tosError.style.display = 'block';
        return false;
    }
    if (tosError) tosError.style.display = 'none';
    return true;
};

// --- New validators (plain JS) ---

function iwtValidateOfferPriceMin(offerEl) {
  if (!offerEl) return false;
  var raw = (offerEl.value || '').toString();
  var num = parseFloat(raw.replace(/[^\d.]/g, ''));

  var ok = Number.isFinite(num) && num > 0; // tweak threshold if you want: >= 0.01
  // Optional: show/hide error if your helpers exist
  if (typeof iwtShowError === 'function' && typeof iwtClearError === 'function') {
    if (!ok) iwtShowError(offerEl, 'Enter a valid offer greater than 0.');
    else iwtClearError(offerEl);
  }
  return ok;
}

function iwtValidateOfferPriceVsCart(offerEl, cartTotal) {
  if (!offerEl) return false;
  var raw = (offerEl.value || '').toString();
  var offer = parseFloat(raw.replace(/[^\d.]/g, ''));
  var total = Number(cartTotal) || 0;

  // If you allow offers above subtotal, relax this.
  var ok = Number.isFinite(offer) && (total <= 0 || offer <= total);

  if (typeof iwtShowError === 'function' && typeof iwtClearError === 'function') {
    if (!ok) iwtShowError(offerEl, 'Offer must be less than or equal to the subtotal.');
    else iwtClearError(offerEl);
  }
  return ok;
}

// Main validation function (auto-fetches input fields)
window.iwtValidateForm = function() {

    iwtClearAllErrors();
    
    const name = iwtGetEl('iwt-name');
    const email = iwtGetEl('iwt-email');
    const mobile = iwtGetEl('iwt-mobile');
    const postalCode = iwtGetEl('iwt-postal');
    const offer = iwtGetEl('iwt-offer-price');
    const tosCheckbox = iwtGetEl('iwt-tos-checkbox');
    const cartTotalElement = iwtGetEl('iwt-cart-total');

    let cartTotal = 0;
    if (cartTotalElement && cartTotalElement.textContent) {
        cartTotal = parseFloat(cartTotalElement.textContent.replace(/[^\d.-]/g, '')) || 0;
    }

    // Validation array for easy iteration
    const validations = [
        iwtValidateName(name),
        iwtValidateEmail(email),
        iwtValidatePhone(mobile),
        iwtValidatePostalCode(postalCode),
        iwtValidateOfferPriceMin(offer),
        iwtValidateOfferPriceVsCart(offer, cartTotal),
        iwtValidateTerms(tosCheckbox),
    ];
    
    const isValid = validations.every(Boolean);
    
    if (isValid) {
        console.log('✅ Form validation passed');
    } else {
        console.log('❌ Form validation failed');
    }
    
    return isValid;
};