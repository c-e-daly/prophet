window.iwtValidateName = function(name) {
    if (!name.value.trim()) {
        iwtShowError(name, 'Please fill in your first and last name');
        return false;
    }
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
    return true;
};

window.iwtValidatePostalCode = function(postalCode) {
    if (!postalCode.value.trim()) {
        iwtShowError(postalCode, 'Please fill in your postal code');
        return false;
    }
    return true;
};

window.iwtValidateOfferPrice = function(offer, cartTotal) {
    if (!offer.value.trim() || parseFloat(offer.value) <= 0) {
        iwtShowError(offer, 'Offer price must be greater than zero');
        return false;
    } else if (parseFloat(offer.value) > cartTotal) {
        iwtShowError(offer, 'Offer price cannot exceed the cart total');
        return false;
    }
    return true;
};

window.iwtValidateTerms = function(tosCheckbox) {
    if (!tosCheckbox.checked) {
        document.getElementById('iwt-tos-error').style.display = 'block';
        return false;
    }
    return true;
};

// Main validation function
window.iwtValidateForm = function () {
  const nameEl   = iwtGetEl('iwt-name');
  const emailEl  = iwtGetEl('iwt-email');
  const phoneEl  = iwtGetEl('iwt-mobile');
  const postalEl = iwtGetEl('iwt-postal');
  const offerEl  = iwtGetEl('iwt-offer-price');
  const tosEl    = iwtGetEl('iwt-tos-checkbox');
  const totalEl  = iwtGetEl('iwt-cart-total');

  const cartTotal = totalEl?.textContent
    ? parseFloat(totalEl.textContent.replace(/[^\d.-]/g, '')) || 0
    : 0;

  return [
    iwtValidateName(nameEl),
    iwtValidateEmail(emailEl),
    iwtValidatePhone(phoneEl),
    iwtValidatePostalCode(postalEl),
    iwtValidateOfferPrice(offerEl, cartTotal),
    iwtValidateTerms(tosEl),
  ].every(Boolean);
};

/*
window.iwtValidateForm = function(name, email, mobile, postalCode, offer, cartTotal, tosCheckbox) {
    let isValid = true;

    isValid &= iwtValidateName(name);
    isValid &= iwtValidateEmail(email);
    isValid &= iwtValidatePhone(mobile);
    isValid &= iwtValidatePostalCode(postalCode);
    isValid &= iwtValidateOfferPrice(offer, cartTotal);
    isValid &= iwtValidateTerms(tosCheckbox);

    return !!isValid; // Ensure boolean return
};
*/

window.iwtVEmail = function(email) {
    return /^[\w.+-]+@[a-zA-Z\d-]+\.[a-zA-Z]{2,}$/.test(email);
};

window.iwtVPhone = function(phone) {
    return /^\d{10}$/.test(phone);
};



window.iwtGetEl = function(id) {
    return document.getElementById(id);
};
