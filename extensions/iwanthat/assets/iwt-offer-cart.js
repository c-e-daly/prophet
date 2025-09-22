// Ensure cart is available globally
window.cart = null;

// Fetch the cart data from Shopify
window.iwtFetchCart = async function() {
    try {
        const response = await fetch('/cart.js');
        if (!response.ok) throw new Error('Network response was not ok');
        window.cart = await response.json();
        console.log('✅ Cart fetched:', window.cart);
        return window.cart;
    } catch (error) {
        console.error('❌ Error fetching cart:', error);
        return null;
    }
};

// Function to add items to the cart
window.iwtAddToCart = async function({ ID, quantity, template }) {
    try {
        if (!ID) {
            console.error("❌ Missing Variant ID. Cannot add to cart.");
            return null;
        }

        const data = {
            items: [{ id: ID, quantity, properties: { template } }]
        };

        console.log('🛒 Adding to cart:', data);

        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        const result = await response.json();
        console.log("✅ Cart Updated After Adding Item:", result);

        // Fetch fresh cart data after adding
        window.cart = await window.iwtFetchCart();
        return window.cart;
    } catch (error) {
        console.error("❌ Error adding to cart:", error);
        return null;
    }
};

// Update cart item quantity
window.iwtUpdateCart = async function(lineItemKey, newQty) {
    try {
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lineItemKey, quantity: newQty })
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        window.iwtRenderTable(window.cart);
        return window.cart;
    } catch (error) {
        console.error('❌ Error updating cart:', error);
    }
};

// Remove an item from the cart
window.iwtRemoveItem = async function(lineItemKey) {
    try {
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lineItemKey, quantity: 0 })
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        window.iwtRenderTable(window.cart);
    } catch (error) {
        console.error('❌ Error removing item from cart:', error);
    }
};

// Format price display
const iwtFormatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;


// Updated render table function for div container
window.iwtRenderTable = function(cart, offerAcceptedPrice = null) {
    console.log('🔄 iwtRenderTable called with cart:', cart);
    
    if (!cart || !cart.items) {
        console.error('❌ Cart is empty or missing items.');
        return;
    }

    console.log('📊 Cart has', cart.items.length, 'items');


    const renderTableContent = (container) => {
  console.log('🎨 Starting to render table content...');

  const allowedKeys = ['product_title', 'quantity', 'price'];
  const labels = {
    product_title: 'Product Name',
    quantity: 'Units',
    price: 'Price',
    line_price: 'Subtotal'
  };

  let tableContent = `
    <table class="cart-table">
      <thead class="table-header">
        <tr class="tr">
          ${allowedKeys.map(k => `<th class="th">${labels[k]}</th>`).join('')}
          <th class="th">${labels.line_price}</th>
          <th class="th"></th> <!-- headerless Remove column -->
        </tr>
      </thead>
      <tbody>
  `;

  let subtotal = 0;

  cart.items.forEach((item, index) => {
    console.log(`📦 Processing item ${index + 1}:`, item.product_title, 'Price:', item.price);

    tableContent += `<tr class="tr">`;

    allowedKeys.forEach(key => {
      if (key === 'product_title') {
        tableContent += `
          <td class="td">
            <div class="product-title">${item.product_title}</div>
            <div class="sku-txt">SKU: ${item.sku || 'N/A'}</div>
          </td>`;
      } else if (key === 'quantity') {
        tableContent += `
          <td class="td">
            <input
              type="number"
              class="iwt-input-number"
              value="${item[key]}"
              min="1"
              onchange="window.iwtUpdateCart('${item.key}', this.value)"
              data-line-item-key="${item.key}"
            />
          </td>`;
      } else if (key === 'price') {
        const priceInCents = item.price;
        const formattedPrice = `$${(priceInCents / 100).toFixed(2)}`;
        tableContent += `<td class="td">${formattedPrice}</td>`;
      }
    });

    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;
    const formattedLineTotal = `$${(lineTotal / 100).toFixed(2)}`;

    tableContent += `<td class="td">${formattedLineTotal}</td>`;

    tableContent += `
      <td class="td" style="text-align:center;">
        <button
          class="iwt-remove-item"
          onclick="window.iwtRemoveItem('${item.key}')"
          title="Remove item"
          aria-label="Remove item"
        >✕</button>
      </td>`;

    tableContent += `</tr>`;
  });

  const formattedSubtotal = `$${(subtotal / 100).toFixed(2)}`;

  tableContent += `
      </tbody>
      <tfoot>
        <tr class="tr">
        <td></td>
        <td></td>
        <td>Subtotal: </td>
          <td class="td" id="iwt-cart-total">${formattedSubtotal}</td>
        </tr>
        ${offerAcceptedPrice !== null ? `
          <tr class="tr">
            <td class="td" colspan="${allowedKeys.length + 1}">Accepted Offer Price</td>
            <td class="td">$${(offerAcceptedPrice / 100).toFixed(2)}</td>
          </tr>` : ``}
      </tfoot>
    </table>
  `;

  console.log('✅ Table content generated, length:', tableContent.length);

  container.innerHTML = tableContent;
  console.log('✅ Table content set in div container');

  if (container.innerHTML.length > 0) {
    console.log('✅ Table successfully rendered with content');
  } else {
    console.error('❌ Table content was not set properly');
  }

  return tableContent;
};


    /*
    const renderTableContent = (container) => {
        console.log('🎨 Starting to render table content...');
        
        // Now we create the complete table HTML (not nested inside existing table)
        let tableContent = '<table style="width: 100%; border-collapse: collapse;"><thead class="table-header"><tr>';
        const allowedKeys = ['product_title', 'quantity', 'price'];
        const labels = {
            product_title: 'Product Name',
            quantity: 'Units', 
            price: 'Price',
            line_price: 'Subtotal'
        };
        
        allowedKeys.forEach(key => {
            tableContent += `<th style="padding: 8px 12px; text-align: left; background-color: #f8f9fa; font-weight: bold; border-bottom: 2px solid #ddd;">${labels[key]}</th>`;
        });
        tableContent += `<th style="padding: 8px 12px; text-align: left; background-color: #f8f9fa; font-weight: bold; border-bottom: 2px solid #ddd;">${labels.line_price}</th>`;
        tableContent += `<th style="padding: 8px 12px; text-align: left; background-color: #f8f9fa; font-weight: bold; border-bottom: 2px solid #ddd;">Remove</th></tr></thead><tbody>`; 
        
        let subtotal = 0;  

        cart.items.forEach((item, index) => {
            console.log(`📦 Processing item ${index + 1}:`, item.product_title, 'Price:', item.price);
            
            const rowColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
            tableContent += `<tr style="background-color: ${rowColor};">`; 
            
            allowedKeys.forEach(key => {
                if (key === 'product_title') {
                    tableContent += `
                        <td style="padding: 8px 12px; border-bottom: 1px solid #ddd;">
                            <div style="font-weight: 500;">${item.product_title}</div>
                            <div style="font-size: 0.8em; color: #666;">SKU: ${item.sku || 'N/A'}</div>
                        </td>`;
                } else if (key === 'quantity') {
                    tableContent += `
                        <td style="padding: 8px 12px; border-bottom: 1px solid #ddd;">
                            <input type="number" 
                                   class="iwt-input-number" 
                                   value="${item[key]}" 
                                   min="1" 
                                   onchange="window.iwtUpdateCart('${item.key}', this.value)" 
                                   data-line-item-key="${item.key}"
                                   style="width: 60px; padding: 4px; border: 1px solid #ccc; border-radius: 4px;">
                        </td>`;
                } else if (key === 'price') {
                    const priceInCents = item.price;
                    const formattedPrice = `$${(priceInCents / 100).toFixed(2)}`;
                    tableContent += `<td style="padding: 8px 12px; border-bottom: 1px solid #ddd;">${formattedPrice}</td>`;
                }
            });

            const lineTotal = item.price * item.quantity;
            subtotal += lineTotal;
            const formattedLineTotal = `$${(lineTotal / 100).toFixed(2)}`;
            tableContent += `<td style="padding: 8px 12px; border-bottom: 1px solid #ddd; font-weight: 500;">${formattedLineTotal}</td>`; 
            tableContent += `
              <td style="padding: 8px 12px; border-bottom: 1px solid #ddd; text-align: center;">
                <button class="iwt-remove-item" 
                        onclick="window.iwtRemoveItem('${item.key}')" 
                        title="Remove item" 
                        style="background: none; border: none; color: red; font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 4px;">
                  ✕
                </button>
              </td>
            `;
            tableContent += '</tr>';
        });

        const formattedSubtotal = `$${(subtotal / 100).toFixed(2)}`;
        
        tableContent += `
          </tbody>
          <tfoot>
            <tr style="background-color: #0442b4; color: #fff;">
              <td colspan="${allowedKeys.length + 1}" style="padding: 12px; font-weight: bold;">Subtotal</td>
              <td id="iwt-cart-total" style="padding: 12px; font-weight: bold;">${formattedSubtotal}</td>
            </tr>
        `;

        if (offerAcceptedPrice !== null) {
            const formattedOfferPrice = `$${(offerAcceptedPrice / 100).toFixed(2)}`;
            tableContent += `
            <tr style="background-color: #28a745; color: #fff;">
              <td colspan="${allowedKeys.length + 1}" style="padding: 12px; font-weight: bold;">Accepted Offer Price</td>
              <td style="padding: 12px; font-weight: bold;">${formattedOfferPrice}</td>
            </tr>
          `;
        }

        tableContent += '</tfoot></table>';
        
        console.log('✅ Table content generated, length:', tableContent.length);
        
        // Set the content in the div container
        container.innerHTML = tableContent;
        console.log('✅ Table content set in div container');
        
        // Verify it was set
        if (container.innerHTML.length > 0) {
            console.log('✅ Table successfully rendered with content');
        } else {
            console.error('❌ Table content was not set properly');
        }
        
        return tableContent;
    };
*/
    const waitForContainer = () => {
        console.log('🔍 Looking for iwt-cart-table container...');
        
        // Try multiple methods to find the container
        let container = null;
        
        if (typeof window.iwtGetEl === 'function') {
            container = window.iwtGetEl('iwt-table-container');
            console.log('📋 Method 1 (iwtGetEl):', !!container);
        }
        
        if (!container) {
            container = document.getElementById('iwt-table-container');
            console.log('📋 Method 2 (getElementById):', !!container);
        }
        
        if (!container) {
            container = document.querySelector('#iwt-table-container');
            console.log('📋 Method 3 (querySelector):', !!container);
        }
        
        if (!container) {
            const modal = document.getElementById('iwt-modal');
            if (modal) {
                container = modal.querySelector('#iwt-table-container');
                console.log('📋 Method 4 (inside modal):', !!container);
            }
        }
        
        if (!container) {
            console.log('⏳ Still waiting for iwt-cart-table container... DOM ready:', document.readyState);
            
            const allDivs = document.querySelectorAll('div[id]');
            const allIds = Array.from(allDivs).map(el => el.id);
            console.log('🔍 Available div IDs containing "cart":', allIds.filter(id => id.includes('cart')));
            console.log('🔍 Available div IDs containing "iwt":', allIds.filter(id => id.includes('iwt')));
            
            setTimeout(waitForContainer, 100);
            return;
        }
        
        console.log('✅ Found iwt-cart-table container!');
        console.log('📋 Container element:', container);
        console.log('📋 Container tag name:', container.tagName);
        console.log('📋 Container visible:', container.offsetParent !== null);
        
        renderTableContent(container);
    };
    
    // Start the process
    waitForContainer();
};



//-------------------
//
//
// Also add this debug function to check modal state
window.iwtDebugModal = function() {
    console.group('🔍 Modal Debug Info');
    const modal = document.getElementById('iwt-modal');
    console.log('Modal element:', !!modal);
    if (modal) {
        console.log('Modal display:', modal.style.display);
        console.log('Modal in DOM:', document.body.contains(modal));
        const table = modal.querySelector('#iwt-cart-table');
        console.log('Table inside modal:', !!table);
        if (table) {
            console.log('Table classes:', table.className);
            console.log('Table innerHTML length:', table.innerHTML.length);
        }
    }
    console.groupEnd();
};

// Sync cart data with modal
window.iwtSyncTableCart = function() {
    const qtyInput = document.getElementById('iwt-qty');
    const subtotalInput = document.getElementById('iwt-subtotal');

    if (qtyInput && window.cart) {
        qtyInput.value = window.cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    if (subtotalInput && window.cart) {
        subtotalInput.value = window.cart.total_price;
    }
};

// Get current date/time
const iwtGCDT = () => new Date().toISOString();

// Update cart timestamps
window.iwtUpdateCartDates = function(isNewItem) {
    const currentDateTime = iwtGCDT();
    if (isNewItem && !window.cartCreateDate) {
        window.cartCreateDate = currentDateTime;
    }
    window.cartUpdateDate = currentDateTime;
};

// Debugging to ensure functions are assigned correctly
console.log("✅ iwt-offer-cart.js Loaded");


/*
// Ensure cart is available globally
window.cart = null;

// Fetch the cart data from Shopify
window.iwtFetchCart = async function() {
    try {
        const response = await fetch('/cart.js');
        if (!response.ok) throw new Error('Network response was not ok');
        window.cart = await response.json();
        return window.cart;
    } catch (error) {
        console.error(' Error fetching cart:', error);
        return null;
    }
};

// Function to add items to the cart
window.iwtAddToCart = async function({ ID, quantity, template }) {
    try {
        if (!ID) {
            console.error(" Missing Variant ID. Cannot add to cart.");
            return;
        }

        const data = {
            items: [{ id: ID, quantity, properties: { template } }]
        };

        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        console.log("Cart Updated After Adding Item:", window.cart);

        return window.cart;
    } catch (error) {
        console.error(" Error adding to cart:", error);
        return null;
    }
};

// Update cart item quantity
window.iwtUpdateCart = async function(lineItemKey, newQty) {
    try {
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lineItemKey, quantity: newQty })
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        window.iwtRenderTable(window.cart);
        return window.cart;
    } catch (error) {
        console.error(' Error updating cart:', error);
    }
};

// Remove an item from the cart
window.iwtRemoveItem = async function(lineItemKey) {
    try {
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lineItemKey, quantity: 0 })
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        window.iwtRenderTable(window.cart);
    } catch (error) {
        console.error(' Error removing item from cart:', error);
    }
};

// Render cart table in the modal
window.iwtRenderTable = function(cart, offerAcceptedPrice = null) {
    if (!cart || !cart.items) {
        console.error(' Cart is empty or missing items.');
        return;
    }

    const waitForTable = () => {
        const cartTable = window.iwtGetEl('iwt-cart-table');
        if (!cartTable) {
            console.log('⏳ Waiting for iwt-cart-table...');
            setTimeout(waitForTable, 100);
            return;
        }
        
        // Proceed with table rendering
        console.log('✅ Found iwt-cart-table, rendering...');
        // ... existing table rendering logic
    };
    
    waitForTable();


    let tableContent = '<table><thead class="table-header"><tr>';
    const allowedKeys = ['product_title', 'quantity', 'price'];
    const labels = {
        product_title: 'Product Name',
        quantity: 'Units',
        price: 'Price',
        line_price: 'Subtotal'
    };
    allowedKeys.forEach(key => {
        tableContent += `<th>${labels[key]}</th>`;
    });
    tableContent += `<th>${labels.line_price}</th></tr></thead><tbody>`; 
    let subtotal = 0;  

    cart.items.forEach((item, index) => {
        const rowColor = index % 2 === 0 ? '#fff' : '#f2f2f2';
        tableContent += `<tr style="background-color: ${rowColor};">`; 
        allowedKeys.forEach(key => {
            if (key === 'product_title') {
                tableContent += `
                    <td>
                        <div>${item.product_title}</div>
                        <div style="font-size: 0.8em; color: #666;">SKU: ${item.sku || 'N/A'}</div>
                    </td>`;
            } else if (key === 'quantity') {
                tableContent += `<td><input type="number" class="iwt-input-number" value="${item[key]}" min="1" onchange="iwtUpdateCart('${item.key}', this.value)" data-line-item-key="${item.key}"></td>`;
            } else {
                const value = key === 'price' ? iwtFormatPrice(item[key]) : item[key];
                tableContent += `<td>${value || ''}</td>`;
            }
        });

        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;
        tableContent += `<td>${iwtFormatPrice(lineTotal)}</td>`; 
        tableContent += `
          <td style="background-color: white;">
            <button class="iwt-remove-item" onclick="iwtRemoveItem('${item.key}')" title="Remove item" style="color: red; font-size: 16px; border: none; background: none;">
              &cross;
            </button>
          </td>
        `;
        tableContent += '</tr>';
    });

    tableContent += `
      </tbody>
      <tfoot>
        <tr style="background-color: #0442b4; color: #fff;">
          <td colspan="${allowedKeys.length}">Subtotal</td>
          <td id="iwt-cart-total">${iwtFormatPrice(subtotal)}</td>
        </tr>
    `;

    if (offerAcceptedPrice !== null) {
        tableContent += `
        <tr>
          <td colspan="${allowedKeys.length}">Accepted Offer Price</td>
          <td>${iwtFormatPrice(offerAcceptedPrice)}</td>
        </tr>
      `;
    }

    tableContent += '</tfoot></table>';
    const cartTable = document.getElementById('iwt-cart-table');
    if (cartTable) {
        cartTable.innerHTML = tableContent;
    } else {
        console.error('❌ Element with ID iwt-cart-table not found');
    }
};

// Sync cart data with modal
window.iwtSyncTableCart = function() {
    const qtyInput = document.getElementById('iwt-qty');
    const subtotalInput = document.getElementById('iwt-subtotal');

    if (qtyInput && window.cart) {
        qtyInput.value = window.cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    if (subtotalInput && window.cart) {
        subtotalInput.value = window.cart.total_price;
    }
};

// Get current date/time
const iwtGCDT = () => new Date().toISOString();

// Update cart timestamps
window.iwtUpdateCartDates = function(isNewItem) {
    const currentDateTime = iwtGCDT();
    if (isNewItem && !window.cartCreateDate) {
        window.cartCreateDate = currentDateTime;
    }
    window.cartUpdateDate = currentDateTime;
};

// Format price display
const iwtFormatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

// Debugging to ensure functions are assigned correctly
console.log("✅ iwt-offer-cart.js Loaded");
*/