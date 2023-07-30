document.getElementById('saveButton').onclick = function () {
  let taxRate = document.getElementById('taxRate').value;
  let shippingCost = document.getElementById('shipping-cost').value;
  let currency = document.getElementById('currency').value;
  let shipping = document.getElementById('shipping').value;

  chrome.storage.sync.set({
    taxRate: taxRate,
    shippingCost: shippingCost,
    currency: currency,
    shipping: shipping
  }, function () {
    // Display a success message
    let status = document.getElementById('status');
    status.textContent = 'Options saved.';

    // Clear the message after a few seconds
    setTimeout(function () {
      status.textContent = '';
    }, 3000);

    chrome.storage.sync.get('tabId', function (data) {
      let tabId = data.tabId;

      // Check if we have a valid tabId
      if (tabId) {
        // Reload the tab
        chrome.tabs.reload(tabId);
      }
    });
  });
};

window.onload = function () {
  chrome.storage.sync.get(['taxRate', 'shippingCost', 'currency', 'shipping'], function (data) {
    document.getElementById('shipping').value = data.shipping || '';
    document.getElementById('taxRate').value = data.taxRate || '';
    document.getElementById('shipping-cost').value = data.shippingCost || '19.99';
    document.getElementById('currency').value = data.currency || 'USD';
  });
};

// Function to update the datalist options with all original entries
function resetDatalistOptions(datalist) {
  const originalOptions = datalist.innerHTML;
  datalist.innerHTML = originalOptions;
}

// Event listener for the input fields' input event
const searchInputs = document.querySelectorAll('input[type="text"]');
searchInputs.forEach(searchInput => {
  const associatedDatalist = document.getElementById(searchInput.getAttribute('list'));

  // Event listener for the input field's input event
  searchInput.addEventListener('input', () => {
    if (searchInput.value === '') {
      resetDatalistOptions(associatedDatalist);
    }
  });

  // Event listener for the datalist's click event
  associatedDatalist.addEventListener('click', () => {
    if (searchInput.value === '') {
      resetDatalistOptions(associatedDatalist);
    }
  });
});