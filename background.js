// background.js
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url.includes("https://www.lttstore.com/cart")) {
        return;
    }
    chrome.storage.sync.set({ tabId: tabId });
    if (changeInfo.status === 'complete' && tab.url.startsWith('http')) {
        chrome.storage.sync.get(['taxRate', 'currency', 'rates', 'lastFetch', 'shippingCost', 'shipping'], function (data) {
            let taxRate = data.taxRate || 0;
            let currency = data.currency || 'USD';
            let rates = data.rates || {};
            let listenerSet = false;
            let lastFetch = data.lastFetch;
            let shippingCost = Number(data.shippingCost);
            let shipping = data.shipping || 'USA';
            let now = Date.now();
            let twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            if (!lastFetch || now - lastFetch > twentyFourHours) {
                // Rates are more than 24 hours old or don't exist, fetch them
                fetch('https://open.er-api.com/v6/latest/USD')
                    .then(response => response.json())
                    .then(data => {
                        rates = data.rates; // Extract the rates from the response
                        chrome.storage.sync.set({ rates: rates, lastFetch: now }, function () {
                            executeScript(tabId, taxRate, currency, rates, shippingCost, shipping, listenerSet);
                        });
                    });
            } else {
                // Rates are less than 24 hours old, use them
                executeScript(tabId, taxRate, currency, rates, shippingCost, shipping);
            }
        });
    }
});





function executeScript(tabId, taxRate, currency, rates, shippingCost, shipping, listenerSet) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: function (taxRate, currency, rates, shippingCost, shipping, listenerSet) {
            
            function getItemPrice(item) {
                let price;
            
                if (item <= 50) {
                    price = 5.99;
                } else if (item <= 250) {
                    price = 15.99;
                } else if (item <= 483) {
                    price = 17.99;
                } else if (item < 920) {
                    price = 19.99;
                } else if (item <= 1909) {
                    price = 24.99;
                } else {
                    price = 29.99;
                }
            
                return price;
            }

            function currencySymbol(currency) {
                switch (currency) {
                    case 'USD':
                        return '$';
                    case 'EUR':
                        return '€';
                    case 'GBP':
                        return '£';
                    default:
                        return currency + " ";
                }
            }

            function convertCurrency(amount, currency, rates) {
                let rate = rates[currency];
                return amount * rate;
            }

            let data = []
            let variantRadiosElement = document.querySelector('variant-radios');

            if (variantRadiosElement) {
                let scriptElement = variantRadiosElement.querySelector('script[type="application/json"]');
                let jsonText = scriptElement.textContent;
                data = JSON.parse(jsonText);
            
                // Rest of your code...
            
            } 
                

            function replacePrices() {

                let defaultSize = document.querySelector('input.product-variant-size:checked, input.ColorSwatch__Radio:checked');
                let defaultSizeTitle = defaultSize ? defaultSize.value : '';
                let defaultSizeItem = data.find(item => item.title == defaultSizeTitle);
            
                if (defaultSizeItem) {
                    console.log("Weight of default selected item: ", defaultSizeItem.weight);
                    shippingCost = getItemPrice(defaultSizeItem.weight); // Update the shipping cost based on the default size
                }

                let priceSpans = document.querySelectorAll('.money');
                priceSpans.forEach(priceSpan => {
                    let appendedSpans = priceSpan.parentNode.querySelectorAll('.appended');
                    appendedSpans.forEach(span => span.remove());
                    if (priceSpan) {
                        let originalPrice = parseFloat(priceSpan.getAttribute('data-original-price'));
                        if (isNaN(originalPrice)) {
                            originalPrice = parseFloat(priceSpan.textContent.replace(/[^\d.-]/g, ''));
                            priceSpan.setAttribute('data-original-price', originalPrice);
                        }
                        let convertedPrice = convertCurrency(originalPrice, currency, rates);
                        let shippingCostConverted = convertCurrency(shippingCost, currency, rates);

                        let taxAmount = 0;
                        let costBeforeTax = convertedPrice;

                        if (shipping === 'USA') {
                            taxAmount = costBeforeTax * taxRate / 100;
                        }

                        costBeforeTax += shippingCostConverted;

                        if (shipping === 'EU') {
                            taxAmount = costBeforeTax * taxRate / 100;
                        }

                        let totalCost = costBeforeTax + taxAmount;

                        priceSpan.textContent = `${currencySymbol(currency)}${convertedPrice.toFixed(2)}`;

                        if (shippingCost == 0) {

                        } else {
                            let shippingSpan = document.createElement("span");
                            shippingSpan.className = 'appended';
                            shippingSpan.textContent = ` (+ Shipping ${currencySymbol(currency)}${shippingCostConverted.toFixed(2)})`;
                            priceSpan.parentNode.appendChild(shippingSpan);
                        }

                        if (taxAmount == 0 || shipping === "No TAX") {


                        } else {
                            let taxSpan = document.createElement("span");
                            taxSpan.className = 'appended';
                            taxSpan.textContent = ` (Tax: ${currencySymbol(currency)}${taxAmount.toFixed(2)})`;
                            priceSpan.parentNode.appendChild(taxSpan);
                        }

                        let totalSpan = document.createElement("span");
                        totalSpan.className = 'appended';
                        totalSpan.textContent = ` (Total: ${currencySymbol(currency)}${totalCost.toFixed(2)})`;
                        priceSpan.parentNode.appendChild(totalSpan);
                    }
                });

                

                

                


                
                setupSizeChangeListeners(taxRate, currency, rates, data);
            }

            

            function setupSizeChangeListeners(taxRate, currency, rates, data) {
                // Get all size selection radio buttons
                let sizeRadioButtons = document.querySelectorAll('.product-variant-size, .ColorSwatch__Radio');
            
                // Add an event listener to each radio button
                sizeRadioButtons.forEach(button => {
                    // Check if the event listener has already been added
                    if (!button.hasAttribute('data-listener-set')) {
                        button.addEventListener('change', () => {
                            // When a size option is selected, wait a short moment to allow the site to update the price,
                            // then replace the prices
                            let matchedItem = data.find(item => item.title == button.value);
            
                            // If a match is found, log the weight
                            if (matchedItem) {
                                shippingCost = getItemPrice(matchedItem.weight);
                            }
            
                            setTimeout(() => {
                                replacePrices(taxRate, currency, rates)
                            }, 750);
                        });
            
                        // Add a marker to indicate the event listener has been added
                        button.setAttribute('data-listener-set', true);
                    }
                });
            }
            

            

            replacePrices();
        },
        args: [taxRate, currency, rates, shippingCost, shipping]
    });
}