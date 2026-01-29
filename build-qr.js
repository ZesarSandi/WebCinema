// Build script to create browser-compatible QR code library
const fs = require('fs');
const path = require('path');

// Create a simple wrapper that exposes QRCode to the browser
const wrapperCode = `
// Browser wrapper for qrcode npm package
(function(window) {
  const QRCode = require('qrcode');
  window.QRCode = QRCode;
})(window);
`;

// Write the wrapper file
const wrapperPath = path.join(__dirname, 'qr-wrapper.js');
fs.writeFileSync(wrapperPath, wrapperCode);

console.log('✅ QR wrapper created at:', wrapperPath);
console.log('📦 Now run: npx browserify qr-wrapper.js -o assets/js/qrcode-bundle.js');
