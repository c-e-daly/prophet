// Diagnostic specifically for text input issues
window.iwtDiagnoseTextInputs = function() {
    console.log('🔍 TEXT INPUT DIAGNOSIS');
    console.log('========================');
    
    const textInputIds = ['iwt-name', 'iwt-email', 'iwt-mobile', 'iwt-postal'];
    
    textInputIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`\n📝 ${id}:`);
            console.log(`   Element found: ✅`);
            console.log(`   Type: ${element.type}`);
            console.log(`   Tag: ${element.tagName}`);
            console.log(`   Visible: ${element.offsetParent !== null}`);
            console.log(`   Display: ${window.getComputedStyle(element).display}`);
            console.log(`   Visibility: ${window.getComputedStyle(element).visibility}`);
            console.log(`   .value: "${element.value}"`);
            console.log(`   .value length: ${element.value ? element.value.length : 'null/undefined'}`);
            console.log(`   .innerText: "${element.innerText || 'N/A'}"`);
            console.log(`   .textContent: "${element.textContent || 'N/A'}"`);
            console.log(`   getAttribute('value'): "${element.getAttribute('value') || 'N/A'}"`);
            console.log(`   .defaultValue: "${element.defaultValue || 'N/A'}"`);
            console.log(`   Placeholder: "${element.placeholder || 'N/A'}"`);
            console.log(`   Disabled: ${element.disabled}`);
            console.log(`   ReadOnly: ${element.readOnly}`);
            
            // Test if we can set/get value
            const originalValue = element.value;
            element.value = 'TEST';
            const testValue = element.value;
            element.value = originalValue;
            console.log(`   Can set/get value: ${testValue === 'TEST' ? '✅' : '❌'}`);
        } else {
            console.log(`\n❌ ${id}: NOT FOUND`);
        }
    });
    
    // Check the offer price field for comparison (this one works)
    const offerElement = document.getElementById('iwt-offer-price');
    if (offerElement) {
        console.log(`\n💰 iwt-offer-price (WORKING FIELD):`);
        console.log(`   .value: "${offerElement.value}"`);
        console.log(`   Type: ${offerElement.type}`);
        console.log(`   Visible: ${offerElement.offsetParent !== null}`);
    }
};

// Enhanced validation functions that use multiple methods to get values
window.iwtGetInputValue = function(element) {
    if (!element) return '';
    
    // Try multiple methods to get the value
    const methods = [
        () => element.value,
        () => element.getAttribute('value'),
        () => element.textContent,
        () => element.innerText
    ];
    
    for (const method of methods) {
        try {
            const value = method();
            if (value && value.trim()) {
                console.log(`✅ Got value "${value}" using method: ${method.toString()}`);
                return value.trim();
            }
        } catch (e) {
            console.warn(`Method failed: ${method.toString()}`, e);
        }
    }
    
    console.warn(`⚠️ No value found for element ${element.id}`);
    return '';
};

// Enhanced validation functions using the robust value getter
window.iwtValidateNameRobust = function(nameElement) {
    if (!nameElement) return false;
    
    const value = iwtGetInputValue(nameElement);
    console.log(`🔍 Name validation - got value: "${value}"`);
    
    if (!value) {
        iwtShowError(nameElement, 'Please fill in your first and last name');
        return false;
    }
    iwtClearError(nameElement);
    return true;
};

window.iwtValidateEmailRobust = function(emailElement) {
    if (!emailElement) return false;
    
    const value = iwtGetInputValue(emailElement);
    console.log(`🔍 Email validation - got value: "${value}"`);
    
    if (!value) {
        iwtShowError(emailElement, 'Please fill in your email');
        return false;
    } else if (!iwtVEmail(value)) {
        iwtShowError(emailElement, 'Please enter a valid email');
        return false;
    }
    iwtClearError(emailElement);
    return true;
};

window.iwtValidatePhoneRobust = function(mobileElement) {
    if (!mobileElement) return false;
    
    const value = iwtGetInputValue(mobileElement);
    console.log(`🔍 Phone validation - got value: "${value}"`);
    
    if (!value) {
        iwtShowError(mobileElement, 'Please fill in your mobile number');
        return false;
    } else if (!iwtVPhone(value)) {
        iwtShowError(mobileElement, 'Please enter a valid phone number');
        return false;
    }
    iwtClearError(mobileElement);
    return true;
};

window.iwtValidatePostalCodeRobust = function(postalElement) {
    if (!postalElement) return false;
    
    const value = iwtGetInputValue(postalElement);
    console.log(`🔍 Postal validation - got value: "${value}"`);
    
    if (!value) {
        iwtShowError(postalElement, 'Please fill in your postal code');
        return false;
    }
    iwtClearError(postalElement);
    return true;
};

// Robust validation function that handles text input issues
window.iwtValidateFormRobust = function() {
    console.log('🔍 Starting ROBUST form validation...');
    
    // First run the text input diagnosis
    iwtDiagnoseTextInputs();
    
    // Clear all previous errors
    iwtClearAllErrors();
    
    // Find elements (try both ID patterns)
    const findElement = (patterns) => {
        for (const id of patterns) {
            const element = document.getElementById(id);
            if (element && element.offsetParent !== null) { // Must be visible
                return element;
            }
        }
        return null;
    };
    
    const elements = {
        name: findElement(['iwt-name', 'iwt-consumer-name']),
        email: findElement(['iwt-email', 'iwt-consumer-email']),
        mobile: findElement(['iwt-mobile', 'iwt-consumer-mobile']),
        postal: findElement(['iwt-postal', 'iwt-consumer-postal']),
        offer: findElement(['iwt-offer-price', 'iwt-consumer-offer']),
        tos: findElement(['iwt-tos-checkbox'])
    };
    
    // Log which elements were found
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            console.log(`✅ Found ${key}: ${elements[key].id}`);
        } else {
            console.log(`❌ Missing ${key}`);
        }
    });
    
    // Get cart total
    let cartTotal = 0;
    const cartTotalEl = document.getElementById('iwt-cart-total');
    if (cartTotalEl && cartTotalEl.textContent) {
        cartTotal = parseFloat(cartTotalEl.textContent.replace(/[^\d.-]/g, '')) || 0;
    }
    
    // Perform validations using robust methods
    const validations = [];
    
    // Use robust validation functions for text inputs
    validations.push(elements.name ? iwtValidateNameRobust(elements.name) : false);
    validations.push(elements.email ? iwtValidateEmailRobust(elements.email) : false);
    validations.push(elements.mobile ? iwtValidatePhoneRobust(elements.mobile) : false);
    validations.push(elements.postal ? iwtValidatePostalCodeRobust(elements.postal) : false);
    
    // Use original validation for numeric/boolean (these work fine)
    validations.push(elements.offer ? iwtValidateOfferPriceMin(elements.offer) : false);
    validations.push(elements.offer ? iwtValidateOfferPriceVsCart(elements.offer, cartTotal) : false);
    validations.push(elements.tos ? iwtValidateTerms(elements.tos) : false);
    
    const allValid = validations.every(Boolean);
    const passedCount = validations.filter(Boolean).length;
    
    console.log(`🎯 Robust Validation Result: ${allValid ? '✅ PASS' : '❌ FAIL'} (${passedCount}/${validations.length})`);
    
    return allValid;
};

// Replace the main validation function
window.iwtValidateForm = window.iwtValidateFormRobust;

console.log('🔧 Robust text input validation loaded! Run iwtDiagnoseTextInputs() to debug.');