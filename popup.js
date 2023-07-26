// popup.js
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('changePrice').addEventListener('click', function() {
    let taxRate = document.getElementById('taxRateInput').value;
    console.log("Button clicked, tax rate is", taxRate);
    chrome.runtime.sendMessage({
      message: "replace_price",
      taxRate: taxRate
    });
  });
});
