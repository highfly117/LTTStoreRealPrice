document.getElementById('saveButton').onclick = function() {
  let taxRate = document.getElementById('taxRate').value;
  let shippingCost = document.getElementById('shipping-cost').value;
  let currency = document.getElementById('currency').value;

  chrome.storage.sync.set({taxRate: taxRate, shippingCost: shippingCost, currency: currency}, function() {
    // Display a success message
    let status = document.getElementById('status');
    status.textContent = 'Options saved.';
    
    // Clear the message after a few seconds
    setTimeout(function() {
      status.textContent = '';
    }, 3000);
  });
};

window.onload = function() {
  chrome.storage.sync.get(['taxRate', 'shippingCost', 'currency'], function(data) {
    document.getElementById('taxRate').value = data.taxRate || '';
    document.getElementById('shipping-cost').value = data.shippingCost || '19.99';
    document.getElementById('currency').value = data.currency || 'USD';
  });
};
