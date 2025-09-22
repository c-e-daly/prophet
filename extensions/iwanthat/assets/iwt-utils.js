// Diagnostic specifically for text input issues

window.iwtGetEl=function(t){
    return document.getElementById(t)};

    // Deep CSS visibility diagnostic
window.iwtDiagnoseCSSVisibility = function() {
    console.log('🔍 CSS VISIBILITY DEEP DIVE');
    console.log('============================');
    
    const textInputIds = ['iwt-name', 'iwt-email', 'iwt-mobile', 'iwt-postal'];
    const workingId = 'iwt-offer-price'; // We know this one works
    
    function analyzeElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.log(`❌ ${id}: NOT FOUND`);
            return null;
        }
        
        const computed = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        console.log(`\n📋 ${id} ANALYSIS:`);
        console.log(`   Element: ${element.tagName}`);
        console.log(`   .offsetParent: ${element.offsetParent ? element.offsetParent.tagName : 'null'}`);
        console.log(`   .offsetWidth: ${element.offsetWidth}`);
        console.log(`   .offsetHeight: ${element.offsetHeight}`);
        console.log(`   .clientWidth: ${element.clientWidth}`);
        console.log(`   .clientHeight: ${element.clientHeight}`);
        console.log(`   getBoundingClientRect(): ${rect.width}x${rect.height} at (${rect.left}, ${rect.top})`);
        console.log(`   CSS display: ${computed.display}`);
        console.log(`   CSS visibility: ${computed.visibility}`);
        console.log(`   CSS opacity: ${computed.opacity}`);
        console.log(`   CSS position: ${computed.position}`);
        console.log(`   CSS overflow: ${computed.overflow}`);
        console.log(`   CSS clip: ${computed.clip}`);
        console.log(`   CSS clipPath: ${computed.clipPath}`);
        console.log(`   CSS transform: ${computed.transform}`);
        console.log(`   CSS zIndex: ${computed.zIndex}`);
        
        // Check parent containers
        let parent = element.parentElement;
        let level = 1;
        while (parent && level <= 3) {
            const parentComputed = window.getComputedStyle(parent);
            console.log(`   Parent ${level} (${parent.tagName}#${parent.id || 'no-id'}.${parent.className}):`);
            console.log(`     display: ${parentComputed.display}`);
            console.log(`     visibility: ${parentComputed.visibility}`);
            console.log(`     opacity: ${parentComputed.opacity}`);
            console.log(`     overflow: ${parentComputed.overflow}`);
            console.log(`     offsetParent: ${parent.offsetParent ? parent.offsetParent.tagName : 'null'}`);
            parent = parent.parentElement;
            level++;
        }
        
        return {
            element,
            computed,
            rect,
            isActuallyVisible: rect.width > 0 && rect.height > 0 && computed.visibility !== 'hidden' && computed.display !== 'none'
        };
    }
    
    // Analyze the working field first
    console.log(`🟢 WORKING FIELD (${workingId}):`);
    const workingAnalysis = analyzeElement(workingId);
    
    // Analyze the problematic fields
    console.log(`\n🔴 PROBLEMATIC FIELDS:`);
    const problematicAnalyses = textInputIds.map(id => ({
        id,
        analysis: analyzeElement(id)
    }));
    
    // Compare and find differences
    console.log(`\n🔍 COMPARISON WITH WORKING FIELD:`);
    problematicAnalyses.forEach(({id, analysis}) => {
        if (analysis) {
            console.log(`\n${id} vs ${workingId}:`);
            
            const differences = [];
            if (analysis.computed.display !== workingAnalysis.computed.display) {
                differences.push(`display: ${analysis.computed.display} vs ${workingAnalysis.computed.display}`);
            }
            if (analysis.computed.visibility !== workingAnalysis.computed.visibility) {
                differences.push(`visibility: ${analysis.computed.visibility} vs ${workingAnalysis.computed.visibility}`);
            }
            if (analysis.computed.opacity !== workingAnalysis.computed.opacity) {
                differences.push(`opacity: ${analysis.computed.opacity} vs ${workingAnalysis.computed.opacity}`);
            }
            if (analysis.rect.width !== workingAnalysis.rect.width) {
                differences.push(`width: ${analysis.rect.width} vs ${workingAnalysis.rect.width}`);
            }
            if (analysis.rect.height !== workingAnalysis.rect.height) {
                differences.push(`height: ${analysis.rect.height} vs ${workingAnalysis.rect.height}`);
            }
            
            if (differences.length > 0) {
                console.log(`   DIFFERENCES: ${differences.join(', ')}`);
            } else {
                console.log(`   ✅ CSS properties match working field`);
            }
            
            console.log(`   Actually visible: ${analysis.isActuallyVisible ? '✅' : '❌'}`);
        }
    });
    
    return { workingAnalysis, problematicAnalyses };
};

// Alternative validation that ignores offsetParent check
window.iwtValidateFormIgnoreVisibility = function() {
    console.log('🔍 Starting validation (IGNORING visibility check)...');
    
    // Clear all previous errors
    iwtClearAllErrors();
    
    // Find elements regardless of visibility
    const findElementAnyway = (patterns) => {
        for (const id of patterns) {
            const element = document.getElementById(id);
            if (element) {
                console.log(`✅ Found element: ${id} (ignoring visibility)`);
                return element;
            }
        }
        console.error(`❌ No element found for patterns: ${patterns.join(', ')}`);
        return null;
    };
    
    // Get elements
    const elements = {
        name: findElementAnyway(['iwt-name']),
        email: findElementAnyway(['iwt-email']),
        mobile: findElementAnyway(['iwt-mobile']),
        postal: findElementAnyway(['iwt-postal']),
        offer: findElementAnyway(['iwt-offer-price']),
        tos: findElementAnyway(['iwt-tos-checkbox'])
    };
    
    // Get cart total
    let cartTotal = 0;
    const cartTotalEl = document.getElementById('iwt-cart-total');
    if (cartTotalEl && cartTotalEl.textContent) {
        cartTotal = parseFloat(cartTotalEl.textContent.replace(/[^\d.-]/g, '')) || 0;
        console.log(`💰 Cart total: ${cartTotal}`);
    }
    
    // Alternative value getter that forces focus to trigger value updates
    const getValueWithForcedUpdate = (element) => {
        if (!element) return '';
        
        // Try to force the browser to update the value
        element.focus();
        element.blur();
        
        const value = element.value || '';
        console.log(`📝 Got value for ${element.id}: "${value}"`);
        return value;
    };
    
    // Custom validation functions that use forced value getter
    const validateWithForce = {
        name: (el) => {
            const value = getValueWithForcedUpdate(el);
            return value.trim().length > 0;
        },
        email: (el) => {
            const value = getValueWithForcedUpdate(el);
            return value.trim().length > 0 && iwtVEmail(value);
        },
        mobile: (el) => {
            const value = getValueWithForcedUpdate(el);
            return value.trim().length > 0 && iwtVPhone(value);
        },
        postal: (el) => {
            const value = getValueWithForcedUpdate(el);
            return value.trim().length > 0;
        },
        offer: (el) => {
            const value = getValueWithForcedUpdate(el);
            const num = parseFloat(value);
            return Number.isFinite(num) && num > 0;
        },
        tos: (el) => {
            return el.checked;
        }
    };
    
    // Perform validations
    const validations = [];
    
    Object.keys(elements).forEach(key => {
        if (elements[key] && validateWithForce[key]) {
            const isValid = validateWithForce[key](elements[key]);
            validations.push(isValid);
            console.log(`${key}: ${isValid ? '✅' : '❌'}`);
        } else {
            validations.push(false);
            console.log(`${key}: ❌ (not found)`);
        }
    });
    
    const allValid = validations.every(Boolean);
    const passedCount = validations.filter(Boolean).length;
    
    console.log(`\n🎯 Ignore-Visibility Validation: ${allValid ? '✅ PASS' : '❌ FAIL'} (${passedCount}/${validations.length})`);
    
    return allValid;
};

console.log('🔧 CSS visibility diagnostic loaded!');
console.log('📋 Run iwtDiagnoseCSSVisibility() to analyze the visibility issue');
console.log('🔄 Run iwtValidateFormIgnoreVisibility() to test validation without visibility checks');