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

// Render cart table in the modal - FIXED VERSION
// Enhanced render table function with extensive debugging
window.iwtRenderTable = function(cart, offerAcceptedPrice = null) {
    console.log('🔄 iwtRenderTable called with cart:', cart);
    
    if (!cart || !cart.items) {
        console.error('❌ Cart is empty or missing items.');
        return;
    }

    console.log('📊 Cart has', cart.items.length, 'items');

    const renderTableContent = (cartTable) => {
        console.log('🎨 Starting to render table content...');
        
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
        tableContent += `<th>${labels.line_price}</th><th>Remove</th></tr></thead><tbody>`; 
        
        let subtotal = 0;  

        cart.items.forEach((item, index) => {
            console.log(`📦 Processing item ${index + 1}:`, item.product_title, 'Price:', item.price);
            
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
                    tableContent += `<td><input type="number" class="iwt-input-number" value="${item[key]}" min="1" onchange="window.iwtUpdateCart('${item.key}', this.value)" data-line-item-key="${item.key}"></td>`;
                } else if (key === 'price') {
                    // Use the price in cents for consistency
                    const priceInCents = item.price; // This is already in cents (12999)
                    const formattedPrice = `$${(priceInCents / 100).toFixed(2)}`;
                    tableContent += `<td>${formattedPrice}</td>`;
                }
            });

            const lineTotal = item.price * item.quantity; // Both in cents
            subtotal += lineTotal;
            const formattedLineTotal = `$${(lineTotal / 100).toFixed(2)}`;
            tableContent += `<td>${formattedLineTotal}</td>`; 
            tableContent += `
              <td style="background-color: white;">
                <button class="iwt-remove-item" onclick="window.iwtRemoveItem('${item.key}')" title="Remove item" style="color: red; font-size: 16px; border: none; background: none; cursor: pointer;">
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
              <td colspan="${allowedKeys.length + 1}">Subtotal</td>
              <td id="iwt-cart-total">${formattedSubtotal}</td>
            </tr>
        `;

        if (offerAcceptedPrice !== null) {
            const formattedOfferPrice = `$${(offerAcceptedPrice / 100).toFixed(2)}`;
            tableContent += `
            <tr style="background-color: #28a745; color: #fff;">
              <td colspan="${allowedKeys.length + 1}">Accepted Offer Price</td>
              <td>${formattedOfferPrice}</td>
            </tr>
          `;
        }

        tableContent += '</tfoot></table>';
        
        console.log('✅ Table content generated, length:', tableContent.length);
        console.log('🔍 Table preview:', tableContent.substring(0, 200) + '...');
        
        // Set the content
        cartTable.innerHTML = tableContent;
        console.log('✅ Table content set in DOM');
        
        // Verify it was set
        if (cartTable.innerHTML.length > 0) {
            console.log('✅ Table successfully rendered with content');
        } else {
            console.error('❌ Table content was not set properly');
        }
        
        return tableContent;
    };

    const waitForTable = () => {
        console.log('🔍 Looking for iwt-cart-table...');
        
        // Try multiple methods to find the table
        let cartTable = null;
        
        // Method 1: Use iwtGetEl if available
        if (typeof window.iwtGetEl === 'function') {
            cartTable = window.iwtGetEl('iwt-cart-table');
            console.log('📋 Method 1 (iwtGetEl):', !!cartTable);
        }
        
        // Method 2: Direct getElementById
        if (!cartTable) {
            cartTable = document.getElementById('iwt-cart-table');
            console.log('📋 Method 2 (getElementById):', !!cartTable);
        }
        
        // Method 3: Query selector
        if (!cartTable) {
            cartTable = document.querySelector('#iwt-cart-table');
            console.log('📋 Method 3 (querySelector):', !!cartTable);
        }
        
        // Method 4: Look inside modal
        if (!cartTable) {
            const modal = document.getElementById('iwt-modal');
            if (modal) {
                cartTable = modal.querySelector('#iwt-cart-table');
                console.log('📋 Method 4 (inside modal):', !!cartTable);
            }
        }
        
        if (!cartTable) {
            console.log('⏳ Still waiting for iwt-cart-table... DOM ready:', document.readyState);
            
            // Debug: Show what elements ARE available
            const allTables = document.querySelectorAll('table');
            const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            console.log('🔍 Available tables:', allTables.length);
            console.log('🔍 Available IDs containing "cart":', allIds.filter(id => id.includes('cart')));
            console.log('🔍 Available IDs containing "iwt":', allIds.filter(id => id.includes('iwt')));
            
            setTimeout(waitForTable, 100);
            return;
        }
        
        console.log('✅ Found iwt-cart-table!');
        console.log('📋 Table element:', cartTable);
        console.log('📋 Table parent:', cartTable.parentElement);
        console.log('📋 Table visible:', cartTable.offsetParent !== null);
        
        renderTableContent(cartTable);
    };
    
    // Start the process
    waitForTable();
};

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