// background.js
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (tab.url.includes("https://www.lttstore.com/cart")) {
        return;
      }

    if (changeInfo.status === 'complete' && tab.url.startsWith('http')) {
        chrome.storage.sync.get(['taxRate', 'currency', 'rates', 'lastFetch'], function (data) {
            let taxRate = data.taxRate || 0;
            let currency = data.currency || 'USD';
            let rates = data.rates || {};
            let lastFetch = data.lastFetch;

            let now = Date.now();
            let twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            if (!lastFetch || now - lastFetch > twentyFourHours) {
                // Rates are more than 24 hours old or don't exist, fetch them
                fetch('https://open.er-api.com/v6/latest/USD')
                    .then(response => response.json())
                    .then(data => {
                        rates = data.rates; // Extract the rates from the response
                        chrome.storage.sync.set({ rates: rates, lastFetch: now }, function () {
                            executeScript(tabId, taxRate, currency, rates);
                        });
                    });
            } else {
                // Rates are less than 24 hours old, use them
                executeScript(tabId, taxRate, currency, rates);
            }
        });
    }
});

function executeScript(tabId, taxRate, currency, rates) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: replacePrices,
        args: [taxRate, currency, rates]
    });
}

function replacePrices(taxRate, currency, rates) {
    function currencySymbol(currency) {
        switch (currency) {
            case 'USD':
                return '$';
            case 'EUR':
                return '€';
            case 'GBP':
                return '£';
            // Add more cases here for other currencies
            default:
                return '';
        }
    }

    function convertCurrency(amount, currency, rates) {
        // The exchange rate to USD
        let rate = rates[currency];
        return amount * rate;
    }

    let priceSpans = document.querySelectorAll('.money');
  priceSpans.forEach(priceSpan => {
    if (priceSpan) {
        let price = parseFloat(priceSpan.textContent.replace(/[^\d.-]/g, ''));
        let convertedPrice = convertCurrency(price, currency, rates);
  
        // add shipping
        let shippingCost = convertCurrency(19.99, currency, rates);
        let costBeforeTax = convertedPrice + shippingCost;
        
        // calculate tax
        let taxAmount = costBeforeTax * taxRate / 100;
        
        // display the converted price
        priceSpan.textContent = `${currencySymbol(currency)}${convertedPrice.toFixed(2)}`;
  
        let shippingSpan = document.createElement("span");
        shippingSpan.textContent = ` (+ Shipping ${currencySymbol(currency)}${shippingCost.toFixed(2)})`;
        priceSpan.parentNode.appendChild(shippingSpan);
  
        let taxSpan = document.createElement("span");
        taxSpan.textContent = ` (Tax: ${currencySymbol(currency)}${taxAmount.toFixed(2)})`;
        priceSpan.parentNode.appendChild(taxSpan);
  
        // Calculate total cost (price + tax) and add it
        let totalCost = costBeforeTax + taxAmount;
        let totalSpan = document.createElement("span");
        totalSpan.textContent = ` (Total: ${currencySymbol(currency)}${totalCost.toFixed(2)})`;
        priceSpan.parentNode.appendChild(totalSpan);
        }
    });
}
