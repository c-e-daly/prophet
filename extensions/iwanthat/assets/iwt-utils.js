window.iwtGetEl = function(id) {
    return document.getElementById(id);
};


// Main validation function
window.iwtValidateForm = function () {
  const nameEl   = iwtGetEl('iwt-name').value;
  const emailEl  = iwtGetEl('iwt-email').value;
  const phoneEl  = iwtGetEl('iwt-mobile').value;
  const postalEl = iwtGetEl('iwt-postal').value;
  const offerEl  = parseFloat(iwtGetEl('iwt-offer-price').value).toFixed(2)
  const tosEl    = iwtGetEl('iwt-tos-checkbox').checked;
  const totalEl  = parseFloat(iwtGetEl('iwt-cart-total').value).toFixed(2)

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
}



//----------------------------------------//
//  working through form validations      //
//----------------------------------------//

    function validateForm() {
        let isValid = true;
        const name = document.getElementById('iwt-name');
        const email = document.getElementById('iwt-email');
        const mobile = document.getElementById('iwt-mobile');
        const postal = document.getElementById('iwt-postal');
        const offer = document.getElementById('iwt-offer-price');
        const tos = document.getElementById('iwt-tos-checkbox');

        if (name.value.trim() === '') {
            displayError(name, 'Username is required.');
            isValid = false;
        } else {
            clearError(username);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            displayError(email, 'Invalid email format.');
            isValid = false;
        } else {
            clearError(email);
        }

        return isValid;
    }
