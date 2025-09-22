window.iwtGetEl = function(id) {
    return document.getElementById(id);
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
}



