chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log("Message received, request is", request); // Debugging line
      if (request.message === "replace_price") {
        let priceSpans = document.querySelectorAll('.money');  // Get all spans by class
        priceSpans.forEach(priceSpan => {
          if (priceSpan) {
            let price = parseFloat(priceSpan.textContent.replace(/[^\d.-]/g, ''));
            let newPrice = price + (price * request.taxRate / 100);
            priceSpan.textContent = `$${newPrice.toFixed(2)} USD`;
          }
        });
      }
    }
  );
  