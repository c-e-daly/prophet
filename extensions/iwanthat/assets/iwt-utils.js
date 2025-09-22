// Complete self-contained validation system for IWT forms
// This includes all helper functions to avoid dependency issues

// Utility function to get element by ID with error handling
window.iwtGetEl = function(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️ Element with ID "${id}" not found`);
    }
    return element;
};

// Email validation
window.iwtVEmail = function(email) {
    return /^[\w.+-]+@[a-zA-Z\d-]+\.[a-zA-Z]{2,}$/.test(email);
};

// Phone validation (10 digits)
window.iwtVPhone = function(phone) {
    return /^\d{10}$/.test(phone);
};

// Show error function
window.iwtShowError = function(element, message) {
    if (!element) {
        console.warn('⚠️ Cannot show error: element is null');
        return;
    }
    
    element.style.borderColor = 'red';
    element.style.borderWidth = '2px';
    
    // Remove existing tooltip
    const existingTooltip = element.parentElement.querySelector('.iwt-custom-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create new tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'iwt-custom-tooltip';
    tooltip.innerText = message;
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        max-width: 200px;
        word-wrap: break-word;
    `;
    
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

// Clear error function
window.iwtClearError = function(element) {
    if (!element) {
        console.warn('⚠️ Cannot clear error: element is null');
        return;
    }
    
    element.style.borderColor = '';
    element.style.borderWidth = '';
    
    const tooltip = element.parentElement.querySelector('.iwt-custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
};

// Individual validation functions
window.iwtValidateName = function(nameElement) {
    if (!nameElement) return false;
    
    if (!nameElement.value.trim()) {
        iwtShowError(nameElement, 'Please fill in your first and last name');
        return false;
    }
    iwtClearError(nameElement);
    return true;
};

window.iwtValidateEmail = function(emailElement) {
    if (!emailElement) return false;
    
    if (!emailElement.value.trim()) {
        iwtShowError(emailElement, 'Please fill in your email');
        return false;
    } else if (!iwtVEmail(emailElement.value)) {
        iwtShowError(emailElement, 'Please enter a valid email');
        return false;
    }
    iwtClearError(emailElement);
    return true;
};

window.iwtValidatePhone = function(mobileElement) {
    if (!mobileElement) return false;
    
    if (!mobileElement.value.trim()) {
        iwtShowError(mobileElement, 'Please fill in your mobile number');
        return false;
    } else if (!iwtVPhone(mobileElement.value)) {
        iwtShowError(mobileElement, 'Please enter a valid phone number');
        return false;
    }
    iwtClearError(mobileElement);
    return true;
};

window.iwtValidatePostalCode = function(postalElement) {
    if (!postalElement) return false;
    
    if (!postalElement.value.trim()) {
        iwtShowError(postalElement, 'Please fill in your postal code');
        return false;
    }
    iwtClearError(postalElement);
    return true;
};

window.iwtValidateTerms = function(tosElement) {
    if (!tosElement) return false;
    
    const tosError = iwtGetEl('iwt-tos-error');
    if (!tosElement.checked) {
        if (tosError) tosError.style.display = 'block';
        return false;
    }
    if (tosError) tosError.style.display = 'none';
    return true;
};

// Offer price validation functions
window.iwtValidateOfferPriceMin = function(offerElement) {
    if (!offerElement) return false;
    
    const raw = (offerElement.value || '').toString();
    const num = parseFloat(raw.replace(/[^\d.]/g, ''));
    const isValid = Number.isFinite(num) && num > 0;
    
    if (!isValid) {
        iwtShowError(offerElement, 'Enter a valid offer greater than 0.');
    } else {
        iwtClearError(offerElement);
    }
    
    return isValid;
};

window.iwtValidateOfferPriceVsCart = function(offerElement, cartTotal) {
    if (!offerElement) return false;
    
    const raw = (offerElement.value || '').toString();
    const offer = parseFloat(raw.replace(/[^\d.]/g, ''));
    const total = Number(cartTotal) || 0;
    
    const isValid = Number.isFinite(offer) && (total <= 0 || offer <= total);
    
    if (!isValid) {
        iwtShowError(offerElement, 'Offer must be less than or equal to the subtotal.');
    } else {
        iwtClearError(offerElement);
    }
    
    return isValid;
};

// Clear all errors function
window.iwtClearAllErrors = function() {
    console.log('🧹 Clearing all form errors...');
    
    const errorFieldPatterns = [
        ['iwt-name', 'iwt-consumer-name'],
        ['iwt-email', 'iwt-consumer-email'], 
        ['iwt-mobile', 'iwt-consumer-mobile'],
        ['iwt-postal', 'iwt-consumer-postal'],
        ['iwt-offer-price', 'iwt-consumer-offer']
    ];
    
    let clearedCount = 0;
    errorFieldPatterns.forEach(patterns => {
        patterns.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                iwtClearError(field);
                clearedCount++;
            }
        });
    });
    
    // Clear TOS errors
    const tosErrorIds = ['iwt-tos-error'];
    tosErrorIds.forEach(errorId => {
        const tosError = document.getElementById(errorId);
        if (tosError) {
            tosError.style.display = 'none';
            clearedCount++;
        }
    });
    
    console.log(`🧹 Cleared ${clearedCount} error states`);
};

// Main validation function with enhanced debugging
window.iwtValidateForm = function() {
    console.log('🔍 Starting form validation...');
    
    // Clear all previous errors first
    iwtClearAllErrors();
    
    // Define possible ID patterns for each field
    const fieldPatterns = {
        name: ['iwt-name', 'iwt-consumer-name'],
        email: ['iwt-email', 'iwt-consumer-email'],
        mobile: ['iwt-mobile', 'iwt-consumer-mobile'],
        postal: ['iwt-postal', 'iwt-consumer-postal'],
        offer: ['iwt-offer-price', 'iwt-consumer-offer'],
        tos: ['iwt-tos-checkbox'],
        cartTotal: ['iwt-cart-total']
    };
    
    // Helper function to find element by trying multiple IDs
    function findElement(patterns, fieldName) {
        for (const id of patterns) {
            const element = document.getElementById(id);
            if (element) {
                console.log(`✅ Found ${fieldName} element with ID: ${id}`);
                return element;
            }
        }
        console.error(`❌ ${fieldName} element not found. Tried IDs: ${patterns.join(', ')}`);
        return null;
    }
    
    // Find all form elements
    const elements = {
        name: findElement(fieldPatterns.name, 'name'),
        email: findElement(fieldPatterns.email, 'email'),
        mobile: findElement(fieldPatterns.mobile, 'mobile'),
        postal: findElement(fieldPatterns.postal, 'postal'),
        offer: findElement(fieldPatterns.offer, 'offer'),
        tos: findElement(fieldPatterns.tos, 'terms of service'),
        cartTotal: findElement(fieldPatterns.cartTotal, 'cart total')
    };
    
    // Calculate cart total
    let cartTotal = 0;
    if (elements.cartTotal && elements.cartTotal.textContent) {
        cartTotal = parseFloat(elements.cartTotal.textContent.replace(/[^\d.-]/g, '')) || 0;
        console.log(`💰 Cart total: ${cartTotal}`);
    } else {
        console.warn('⚠️ Cart total element not found or empty');
    }
    
    // Perform validations
    const validations = [];
    
    // Name validation
    const nameValid = elements.name ? iwtValidateName(elements.name) : false;
    validations.push({ field: 'name', valid: nameValid, value: elements.name?.value || 'N/A' });
    
    // Email validation
    const emailValid = elements.email ? iwtValidateEmail(elements.email) : false;
    validations.push({ field: 'email', valid: emailValid, value: elements.email?.value || 'N/A' });
    
    // Mobile validation
    const mobileValid = elements.mobile ? iwtValidatePhone(elements.mobile) : false;
    validations.push({ field: 'mobile', valid: mobileValid, value: elements.mobile?.value || 'N/A' });
    
    // Postal validation
    const postalValid = elements.postal ? iwtValidatePostalCode(elements.postal) : false;
    validations.push({ field: 'postal', valid: postalValid, value: elements.postal?.value || 'N/A' });
    
    // Offer validations
    const offerMinValid = elements.offer ? iwtValidateOfferPriceMin(elements.offer) : false;
    const offerMaxValid = elements.offer ? iwtValidateOfferPriceVsCart(elements.offer, cartTotal) : false;
    validations.push({ field: 'offer (min)', valid: offerMinValid, value: elements.offer?.value || 'N/A' });
    validations.push({ field: 'offer (vs cart)', valid: offerMaxValid, value: `${elements.offer?.value || 'N/A'} vs ${cartTotal}` });
    
    // Terms validation
    const tosValid = elements.tos ? iwtValidateTerms(elements.tos) : false;
    validations.push({ field: 'terms', valid: tosValid, value: elements.tos?.checked || 'N/A' });
    
    // Log detailed results
    console.log('📊 Validation Results:');
    validations.forEach((validation, index) => {
        const status = validation.valid ? '✅' : '❌';
        console.log(`   ${index + 1}. ${validation.field}: ${status} (${validation.value})`);
    });
    
    // Calculate overall result
    const allValid = validations.every(v => v.valid);
    const passedCount = validations.filter(v => v.valid).length;
    const totalCount = validations.length;
    
    console.log(`📋 Summary: ${passedCount}/${totalCount} validations passed`);
    console.log(`🎯 Overall result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!allValid) {
        const failedFields = validations.filter(v => !v.valid).map(v => v.field);
        console.log(`🚫 Failed fields: ${failedFields.join(', ')}`);
    }
    
    return allValid;
};

console.log('✅ Complete validation system loaded!');

/*
// Get an element by ID
window.iwtGetEl = function(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️ Element with ID "${id}" not found`);
    }
    return element;
};

window.iwtVEmail = function(email) {
    return /^[\w.+-]+@[a-zA-Z\d-]+\.[a-zA-Z]{2,}$/.test(email);
};

window.iwtVPhone = function(phone) {
    return /^\d{10}$/.test(phone);
};


window.iwtShowError = function(element, message) {
    if (!element) return;
    element.style.borderColor = 'red';
    element.style.borderWidth = '2px';
    
    const existingTooltip = element.parentElement.querySelector('.iwt-custom-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'iwt-custom-tooltip';
    tooltip.innerText = message;
    element.parentElement.appendChild(tooltip);

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
        !!iwtValidateName(name),
        !!iwtValidateEmail(email),
        !!iwtValidatePhone(mobile),
        !!iwtValidatePostalCode(postalCode),
        !!iwtValidateOfferPriceMin(offer),
        !!iwtValidateOfferPriceVsCart(offer, cartTotal),
        !!iwtValidateTerms(tosCheckbox),
    ];
    
    const isValid = validations.every(Boolean);
    
    if (isValid) {
        console.log('✅ Form validation passed');
    } else {
        console.log('❌ Form validation failed');
    }
    
    return isValid;
};
*/