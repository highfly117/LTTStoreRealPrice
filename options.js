// options.js
document.getElementById('saveButton').onclick = function() {
    let taxRate = document.getElementById('taxRate').value;
    let currency = document.getElementById('currency').value;
    chrome.storage.sync.set({taxRate: taxRate, currency: currency}, function() {
      console.log('Options saved.');
    });
  };
  
  window.onload = function() {
    chrome.storage.sync.get(['taxRate', 'currency'], function(data) {
      document.getElementById('taxRate').value = data.taxRate || '';
      document.getElementById('currency').value = data.currency || 'USD';
    });
  };
  