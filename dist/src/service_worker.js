
/*
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  const censored = {};
  for(const item of request.data) {
    const endpoint = `http://127.0.0.1:5000/predict?src=${item}`;
    fetch(endpoint)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Error in fetching");
        }
      })
      .then(data => {
        if(data.class == 'gore' || data.class == 'pornography'){
          censored[item] = data.class;
        }
      })
      .catch(error => {
        console.log(error);
      })
    }
    setTimeout(function() {
      sendResponse({ type: 'response', data: censored });
    }, 1000);
  return true;
});

*/




chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const censored = {};
  const TIMEOUT_MS = 4500;

  // Helper function to convert image URL to base64
  async function fetchImageAsBase64(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  // Process all fetches
  const fetchPromises = request.data.map(async (item) => {
    try {
      const imageBase64 = await fetchImageAsBase64(item);
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 })
      });
      const data = await response.json();
      if (data.class === 'gore' || data.class === 'pornography') {
        censored[item] = data.class;
      }
    } catch (err) {
      console.error("Error processing", item, err);
    }
  });

  // Fallback timeout to avoid losing response
  const timeoutId = setTimeout(() => {
    console.warn("Timeout reached before fetches completed");
    sendResponse({ type: 'response', data: censored });
  }, TIMEOUT_MS);

  Promise.allSettled(fetchPromises).then(() => {
    clearTimeout(timeoutId);
    sendResponse({ type: 'response', data: censored });
  });

  return true; // Keeps the message channel open
});
