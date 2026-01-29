# 📦 Setup Node.js & npm untuk QR Code Generator

## ✅ Installed Packages

```json
{
  "dependencies": {
    "qrcode": "^1.5.4",  // QR Code Generator
    "jsqr": "^1.4.0"      // QR Code Scanner (future use)
  },
  "devDependencies": {
    "browserify": "^17.0.1"  // Bundle Node modules for browser
  }
}
```

## 🔧 Build Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Build QR Code Bundle
```bash
npm run build:qr
```

**Proses yang terjadi:**
1. `build-qr.js` membuat wrapper file (`qr-wrapper.js`)
2. Browserify bundle `qr-wrapper.js` ke `assets/js/qrcode-bundle.js`
3. File bundle siap digunakan di browser (78KB)

### 3. Struktur File

```
WEB Cinema/
├── package.json              # npm configuration
├── build-qr.js              # Build script untuk wrapper
├── qr-wrapper.js            # Wrapper yang expose QRCode ke window
├── node_modules/            # npm packages
│   ├── qrcode/             # QR generator library
│   ├── jsqr/               # QR scanner library
│   └── browserify/         # Bundler tool
└── assets/
    └── js/
        ├── qrcode-bundle.js  # ⭐ Bundle untuk browser (output)
        ├── qr-generator.js   # UI logic
        └── qr-scanner.js     # Scanner logic
```

## 🚀 Usage

### Di HTML (sudah diupdate):
```html
<!-- Gunakan bundle lokal instead of CDN -->
<script src="assets/js/qrcode-bundle.js"></script>
<script src="assets/js/qr-generator.js"></script>
```

### Di JavaScript:
```javascript
// QRCode tersedia sebagai global variable
if (typeof QRCode !== 'undefined') {
  QRCode.toDataURL('https://example.com', function(err, url) {
    if (err) console.error(err);
    console.log(url); // base64 data URL
  });
}
```

## 📝 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run build:qr` | Generate QR code bundle dari node_modules |
| `npm run build` | Alias untuk build:qr |
| `npm install` | Install semua dependencies |

## 🔄 Update QR Library

Jika ingin update qrcode ke versi terbaru:

```bash
npm update qrcode
npm run build:qr
```

## ⚙️ Technical Details

### Browserify Process
```javascript
// qr-wrapper.js (generated)
(function(window) {
  const QRCode = require('qrcode');  // Node.js require
  window.QRCode = QRCode;             // Expose to browser
})(window);
```

**Browserify mengubah:**
- `require('qrcode')` → bundled code
- Node.js modules → browser-compatible JavaScript
- CommonJS → IIFE (Immediately Invoked Function Expression)

## 🎯 Keuntungan Menggunakan npm

### ✅ Sebelumnya (CDN):
```html
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"></script>
```
❌ Perlu internet connection  
❌ Tergantung CDN availability  
❌ Version control kurang jelas  

### ✅ Sekarang (npm + local bundle):
```html
<script src="assets/js/qrcode-bundle.js"></script>
```
✅ **Offline-first** - tidak butuh internet  
✅ **Version locked** - di package.json  
✅ **Faster load** - no external request  
✅ **Custom build** - bisa modify wrapper  
✅ **Professional workflow** - standard npm ecosystem  

## 🐛 Troubleshooting

### Bundle tidak terbuat?
```bash
# Check dependencies
npm list qrcode browserify

# Rebuild
npm run build:qr

# Check output
dir assets\js\qrcode-bundle.js
```

### QRCode not defined di browser?
1. Pastikan bundle di-load sebelum qr-generator.js
2. Check Network tab (F12) - pastikan bundle loaded
3. Check Console - lihat error messages

### Update tidak keliatan?
```bash
# Hard refresh browser
Ctrl + Shift + R

# Rebuild bundle
npm run build:qr
```

## 📚 Resources

- [qrcode npm package](https://www.npmjs.com/package/qrcode)
- [Browserify documentation](https://browserify.org/)
- [jsQR package](https://www.npmjs.com/package/jsqr)

## 🎉 Success Checklist

- [x] npm initialized (`package.json`)
- [x] Dependencies installed (`node_modules/`)
- [x] Build script created (`build-qr.js`)
- [x] Bundle generated (`qrcode-bundle.js` - 78KB)
- [x] HTML updated (local bundle instead of CDN)
- [x] Offline functionality works
- [x] Professional npm workflow setup

---

**🎯 Sekarang aplikasi menggunakan QR code library dari npm local bundle!**
