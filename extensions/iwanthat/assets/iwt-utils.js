// Enhanced validation function with debugging and flexible ID handling
window.iwtValidateForm = function() {
    console.log('🔍 Starting form validation...');
    
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
    function findElement(patterns) {
        for (const id of patterns) {
            const element = document.getElementById(id);
            if (element) {
                console.log(`✅ Found element with ID: ${id}`);
                return element;
            } else {
                console.log(`❌ Element not found with ID: ${id}`);
            }
        }
        return null;
    }
    
    // Find all form elements
    const elements = {
        name: findElement(fieldPatterns.name),
        email: findElement(fieldPatterns.email),
        mobile: findElement(fieldPatterns.mobile),
        postal: findElement(fieldPatterns.postal),
        offer: findElement(fieldPatterns.offer),
        tos: findElement(fieldPatterns.tos),
        cartTotal: findElement(fieldPatterns.cartTotal)
    };
    
    // Log which elements were found/missing
    Object.keys(elements).forEach(key => {
        if (!elements[key]) {
            console.error(`🚨 Missing element: ${key} (tried IDs: ${fieldPatterns[key].join(', ')})`);
        }
    });
    
    // Calculate cart total
    let cartTotal = 0;
    if (elements.cartTotal && elements.cartTotal.textContent) {
        cartTotal = parseFloat(elements.cartTotal.textContent.replace(/[^\d.-]/g, '')) || 0;
        console.log(`💰 Cart total: ${cartTotal}`);
    } else {
        console.warn('⚠️ Cart total element not found or empty');
    }
    
    // Perform validations with detailed logging
    const validationResults = [];
    
    // Name validation
    if (elements.name) {
        const nameValid = iwtValidateName(elements.name);
        validationResults.push(nameValid);
        console.log(`Name validation: ${nameValid ? '✅' : '❌'} (value: "${elements.name.value}")`);
    } else {
        validationResults.push(false);
        console.log('Name validation: ❌ (element not found)');
    }
    
    // Email validation
    if (elements.email) {
        const emailValid = iwtValidateEmail(elements.email);
        validationResults.push(emailValid);
        console.log(`Email validation: ${emailValid ? '✅' : '❌'} (value: "${elements.email.value}")`);
    } else {
        validationResults.push(false);
        console.log('Email validation: ❌ (element not found)');
    }
    
    // Mobile validation
    if (elements.mobile) {
        const mobileValid = iwtValidatePhone(elements.mobile);
        validationResults.push(mobileValid);
        console.log(`Mobile validation: ${mobileValid ? '✅' : '❌'} (value: "${elements.mobile.value}")`);
    } else {
        validationResults.push(false);
        console.log('Mobile validation: ❌ (element not found)');
    }
    
    // Postal code validation
    if (elements.postal) {
        const postalValid = iwtValidatePostalCode(elements.postal);
        validationResults.push(postalValid);
        console.log(`Postal validation: ${postalValid ? '✅' : '❌'} (value: "${elements.postal.value}")`);
    } else {
        validationResults.push(false);
        console.log('Postal validation: ❌ (element not found)');
    }
    
    // Offer price validation
    if (elements.offer) {
        const offerMinValid = iwtValidateOfferPriceMin(elements.offer);
        const offerMaxValid = iwtValidateOfferPriceVsCart(elements.offer, cartTotal);
        validationResults.push(offerMinValid);
        validationResults.push(offerMaxValid);
        console.log(`Offer min validation: ${offerMinValid ? '✅' : '❌'} (value: "${elements.offer.value}")`);
        console.log(`Offer max validation: ${offerMaxValid ? '✅' : '❌'} (offer: ${elements.offer.value}, cart: ${cartTotal})`);
    } else {
        validationResults.push(false);
        validationResults.push(false);
        console.log('Offer validation: ❌ (element not found)');
    }
    
    // Terms validation
    if (elements.tos) {
        const tosValid = iwtValidateTerms(elements.tos);
        validationResults.push(tosValid);
        console.log(`Terms validation: ${tosValid ? '✅' : '❌'} (checked: ${elements.tos.checked})`);
    } else {
        validationResults.push(false);
        console.log('Terms validation: ❌ (element not found)');
    }
    
    // Calculate overall validation result
    const totalValidations = validationResults.length;
    const passedValidations = validationResults.filter(Boolean).length;
    const isValid = validationResults.every(Boolean);
    
    console.log(`📊 Validation Summary:`);
    console.log(`   Total validations: ${totalValidations}`);
    console.log(`   Passed: ${passedValidations}`);
    console.log(`   Failed: ${totalValidations - passedValidations}`);
    console.log(`   Overall result: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    
    if (isValid) {
        console.log('🎉 Form validation passed - ready to submit!');
    } else {
        console.log('🚫 Form validation failed - submission prevented');
        
        // List specific failures
        const failures = [];
        if (validationResults[0] === false) failures.push('Name');
        if (validationResults[1] === false) failures.push('Email');
        if (validationResults[2] === false) failures.push('Mobile');
        if (validationResults[3] === false) failures.push('Postal');
        if (validationResults[4] === false) failures.push('Offer (min)');
        if (validationResults[5] === false) failures.push('Offer (vs cart)');
        if (validationResults[6] === false) failures.push('Terms');
        
        console.log(`   Failed fields: ${failures.join(', ')}`);
    }
    
    return isValid;
};

// Enhanced clear all errors function to handle multiple ID patterns
window.iwtClearAllErrors = function() {
    const errorFieldPatterns = [
        ['iwt-name', 'iwt-consumer-name'],
        ['iwt-email', 'iwt-consumer-email'], 
        ['iwt-mobile', 'iwt-consumer-mobile'],
        ['iwt-postal', 'iwt-consumer-postal'],
        ['iwt-offer-price', 'iwt-consumer-offer']
    ];
    
    errorFieldPatterns.forEach(patterns => {
        patterns.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                iwtClearError(field);
            }
        });
    });
    
    // Clear TOS errors (try multiple patterns)
    const tosErrorIds = ['iwt-tos-error'];
    tosErrorIds.forEach(errorId => {
        const tosError = document.getElementById(errorId);
        if (tosError) {
            tosError.style.display = 'none';
        }
    });
};

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