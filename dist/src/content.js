// Function to censor image by blurring it and adding a warning text
function censorImage(imgNode, className) {
    const originalParent = imgNode.parentElement;
    imgNode.style.filter = 'blur(30px)';
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.textAlign = 'center';
    container.style.color = 'white';
    
    const text = document.createElement('div');
    text.className = 'overlay';
    text.style.position = 'absolute';
    text.style.top = '50%';
    text.style.left = '50%';
    text.style.transform = 'translate(-50%, -50%)';
    text.style.fontSize = '34px';
    text.style.fontFamily = 'Google Sans,sans-serif';
    text.style.fontWeight = '700';
    text.style.color = 'white';
    text.style.lineHeight = '1em';
    text.style['-webkit-text-fill-color'] = 'white';
    text.style['-webkit-text-stroke-width'] = '1px';
    text.style['-webkit-text-stroke-color'] = 'black';

    originalParent.insertBefore(container, imgNode);
    container.appendChild(imgNode);
    container.appendChild(text);

    text.textContent = `${className}\n⚠️`;
}

// Function to fetch image from external URL with a CORS proxy
async function fetchImage(url) {
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';  // Use a CORS proxy to avoid CORS issues
    const response = await fetch(proxyUrl + url);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// Function to analyze and censor the image
async function analyzeAndCensor(img) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg");

        // Send the image to the Flask server for classification
        const res = await fetch("http://localhost:5000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ image: base64 })
        });

        const result = await res.json();
        // If the image is classified as 'gore' or 'pornography', censor it
        if (result.class === 'gore' || result.class === 'pornography') {
            censorImage(img, result.class);
        }
    } catch (err) {
        console.error("Failed to analyze image:", err);
    }
}

// Initialize the script and check all images on the page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'init') {
        const imgs = [...document.getElementsByTagName('img')];
        imgs.forEach(img => {
            if (img.width > 244 && img.height > 244) {
                analyzeAndCensor(img);
            }
        });
    }
});
