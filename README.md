# 🎬 UKM CINEMA - Sistem Inventaris Alat Peminjaman

## 📦 Aplikasi Frontend (Offline Mode)

Sistem manajemen inventaris dan peminjaman alat untuk UKM Cinema dengan penyimpanan data di browser (localStorage).

---

## 🚀 CARA MENGGUNAKAN

### Langsung Buka di Browser!

1. **Buka file**: `index.html` atau `Dashboard.html`
2. **Aplikasi siap dipakai** - tidak perlu instalasi atau server

### 🔧 Developer Setup (Optional - untuk update QR library)

Jika ingin update atau rebuild QR code library dari npm:

```bash
# Install dependencies
npm install

# Build QR bundle dari node_modules
npm run build:qr
```

**File yang dihasilkan**: `assets/js/qrcode-bundle.js` (78KB)  
**Dokumentasi lengkap**: Lihat [NPM_SETUP.md](NPM_SETUP.md)

**Note**: Setup npm ini **optional** - aplikasi sudah include bundle yang siap pakai!

---

## ✨ FITUR

### 📦 Data Barang
- ✅ Tambah, edit, hapus barang
- ✅ Upload foto barang (drag & drop)
- ✅ **Generate QR code dengan tab khusus di form tambah**
- ✅ Download atau cetak label QR code
- ✅ Filter dan search barang
- ✅ Export data ke CSV

#### 🔲 QR Code Generator (Fitur Baru!)
Saat klik tombol **+ Tambah Barang**, ada 2 tab:

1. **📋 Data Barang** - Form untuk entry nama, kondisi, jenis, tanggal
2. **🔲 QR Generator** - Standalone QR code generator:
   - 🔄 **Generate otomatis** - Klik tombol untuk auto-generate kode unik (ITEM-timestamp)
   - 🖼️ **Preview QR** - Lihat QR code real-time
   - 💾 **Download** - Download QR sebagai gambar PNG
   - 🖨️ **Cetak** - Print langsung ke printer
   - 📋 **Copy Kode** - Copy kode barang ke clipboard

**📦 Library**: Menggunakan `qrcode` npm package (v1.5.4), di-bundle dengan Browserify  
**✅ Offline**: Tidak perlu internet - library di-bundle ke `assets/js/qrcode-bundle.js`

**Workflow**:
1. Buka "Tambah Barang"
2. Pindah ke tab "QR Generator"
3. Klik 🔄 untuk generate kode unik
4. Download/cetak QR jika perlu
5. Kembali ke tab "Data Barang"
6. Isi detail (nama, kondisi, dll) - kode sudah terisi otomatis
7. Simpan barang

### 📋 Peminjaman
- ✅ **🔲 QR Code Scanner** - Scan QR barang dengan webcam (NEW!)
- ✅ Form entry peminjaman
- ✅ Scan/input kode barang (QR)
- ✅ Ambil foto selfie peminjam (camera/upload)
- ✅ Validasi tanggal dan data
- ✅ Simpan otomatis ke riwayat

#### 🔲 QR Scanner (Fitur Baru!)
Halaman **Peminjaman** sekarang dilengkapi scanner QR code real-time:

**Fitur Scanner:**
- 📷 **Webcam Access** - Buka kamera langsung dari browser
- 🎯 **Auto-detection** - QR code otomatis terdeteksi
- 🔄 **Switch Camera** - Ganti kamera depan/belakang (mobile)
- ⚡ **Fast Scan** - Deteksi QR dalam hitungan detik
- 🔊 **Beep Sound** - Bunyi notifikasi saat QR terdeteksi
- 📳 **Vibration** - Getaran feedback (mobile)
- 🎨 **Visual Guide** - Kotak hijau overlay untuk positioning

**Workflow Scanner:**
1. Buka halaman **Peminjaman**
2. Klik tombol **📷 Buka Scanner**
3. Izinkan akses kamera browser
4. Arahkan kamera ke QR code barang
5. Scanner otomatis deteksi → Beep sound
6. Redirect ke form dengan kode barang terisi

**Tech Stack:**
- **jsQR** - JavaScript QR code decoder (node_modules)
- **Canvas API** - Frame processing
- **getUserMedia** - Camera access
- **requestAnimationFrame** - Real-time scanning loop

### 📜 Riwayat
- ✅ List semua peminjaman
- ✅ Search dan filter
- ✅ Mark sebagai dikembalikan
- ✅ Delete record
- ✅ View foto peminjam
- ✅ Export ke CSV

### 📊 Laporan
- ✅ Chart peminjaman per bulan (Chart.js)
- ✅ Filter by item dan tahun
- ✅ Detail breakdown per bulan
- ✅ Export CSV dan PDF
- ✅ Data contoh untuk testing

### 🏠 Dashboard
- ✅ Statistik real-time
- ✅ Total barang & peminjaman
- ✅ Status aktif/selesai
- ✅ **🌐 Google Integration** - Koneksi internet & cloud backup (NEW!)

#### 🌐 Internet & Google Integration (Fitur Baru!)

**Online Status Monitor:**
- 🟢 **Real-time Indicator** - Status online/offline di pojok kanan atas
- 🔍 **Connection Test** - Test latency ke Google servers
- 📡 **Auto-detection** - Notifikasi saat koneksi berubah
- ⚡ **Periodic Check** - Update status setiap 30 detik

**Google Drive Backup:**
```
Dashboard → 💾 Backup to Drive
    ↓
Export all data (items, loans, history)
    ↓
Download JSON file
    ↓
Manual upload ke drive.google.com
    ↓
Data aman di cloud ☁️
```

**Google Sheets Export:**
```
Dashboard → 📊 Export to Sheets
    ↓
Convert data to CSV format
    ↓
Download CSV file
    ↓
Import ke sheets.google.com
    ↓
Data bisa diedit & share online
```

**Google Maps Integration:**
```
Dashboard → 📍 Open Maps
    ↓
Buka Google Maps di tab baru
    ↓
Cari lokasi UKM Cinema
```

**Google Search untuk Barang:**
```javascript
// Di console atau custom button:
searchGoogleForItem("Camera Sony A7")
    ↓
Opens: google.com/search?q=Camera+Sony+A7+specifications
```

**Available Functions:**
- `googleDriveBackup()` - Export & backup to Drive
- `exportToGoogleSheets()` - CSV export for Sheets
- `testInternetConnection()` - Check connection speed
- `searchGoogleForItem(name)` - Google search barang
- `openGoogleMaps()` - Open Maps

**Requirements:**
- ✅ Internet connection (CDN libraries already use online)
- ✅ Modern browser (Chrome, Firefox, Edge, Safari)
- ⚠️ Google OAuth not implemented (manual upload untuk sekarang)

**Future Enhancements:**
- 🔜 Direct Google Drive API integration
- 🔜 Auto-sync ke Google Sheets
- 🔜 Google Sign-In authentication
- 🔜 Real-time collaboration
- ✅ Recent activity
- ✅ Animated counters

---

## 💾 PENYIMPANAN DATA

**Mode: Offline (localStorage)**

- Semua data tersimpan di browser Anda
- Data tidak hilang saat refresh
- Data per browser/device
- Tidak perlu database atau server
- Privacy terjamin (data lokal)

**Important**: Jangan clear browser data atau cookies jika ingin keep data!

---

## 📁 STRUKTUR FILE

```
d:\WEB Cinema\
├── index.html              # Landing page
├── Dashboard.html          # Halaman utama
├── data-barang.html        # Manajemen barang
├── Peminjaman.html         # Form peminjaman
├── riwayat.html            # History peminjaman
├── laporan.html            # Reports & charts
├── assets/
│   ├── js/
│   │   ├── app.js          # Aplikasi logic
│   │   └── config.js       # Configuration
│   └── css/
│       └── style.css       # Styling
├── css/
│   └── style_dashboard.css # Dashboard styling
└── img/                    # Images & assets
```

---

## 🎯 PANDUAN PENGGUNAAN

### 1. Mulai Dari Dashboard
```
Buka: Dashboard.html
```
- Lihat overview statistik
- Akses semua menu dari sidebar

### 2. Tambah Barang
```
Menu: Data Barang → Tombol "Tambah Barang"
```
- Isi form (nama, kondisi, jenis, tanggal)
- Upload foto (drag & drop atau klik)
- QR code auto-generate
- Klik "Simpan"

### 3. Entry Peminjaman
```
Menu: Peminjaman
```
- Pilih/scan kode barang
- Isi nama peminjam & divisi
- Set tanggal pinjam & kembali
- Ambil foto selfie
- Tambah keterangan
- Klik "Simpan"

### 4. Lihat Riwayat
```
Menu: Riwayat
```
- List semua peminjaman
- Search by nama/item
- Mark returned saat barang kembali
- Delete jika perlu

### 5. Lihat Laporan
```
Menu: Laporan
```
- Pilih tahun
- Filter by item (optional)
- Lihat chart bulanan
- Export CSV atau PDF

---

## 🔧 KONFIGURASI

### Mode: Offline (Default)

File: `assets/js/config.js`
```javascript
window.API_BASE = ''; // Empty = offline mode
```

Dengan setting ini:
- ✅ Data tersimpan di localStorage
- ✅ Tidak perlu server atau database
- ✅ Aplikasi langsung jalan
- ✅ Privacy terjamin

---

## 💡 TIPS & TRICKS

### Backup Data
1. Buka Browser Console (F12)
2. Tab "Application" → "Local Storage"
3. Copy isi `dataBarang` dan `peminjaman`
4. Paste ke text file untuk backup

### Import Data
1. Siapkan data JSON format
2. Console: `localStorage.setItem('dataBarang', '[...]')`
3. Refresh halaman

### Testing dengan Data Contoh
1. Buka Laporan
2. Klik "Isi data contoh"
3. Data sample auto-generate

### Clear Data
Console:
```javascript
localStorage.clear(); // Hapus semua data
```

---

## 📱 RESPONSIVE DESIGN

Aplikasi otomatis menyesuaikan:
- 💻 **Desktop** - Full features
- 📱 **Tablet** - Optimized layout
- 📲 **Mobile** - Touch-friendly

Breakpoints:
- < 900px: Tablet layout
- < 640px: Mobile layout

---

## 🔍 TROUBLESHOOTING

### Q: Data hilang setelah refresh?
**A**: Check localStorage tidak terblock. Jangan clear browser data.

### Q: Camera tidak bisa diakses?
**A**: 
- Grant camera permission di browser
- Atau upload foto dari file

### Q: QR code tidak muncul?
**A**: 
- Check internet connection (butuh Google Charts API)
- Atau print tanpa QR

### Q: Chart tidak render?
**A**:
- Check internet connection (butuh Chart.js CDN)
- Atau export CSV saja

### Q: PDF export error?
**A**:
- Check internet connection (butuh jsPDF & html2canvas CDN)
- Atau gunakan browser print

---

## 📊 TEKNOLOGI

- **HTML5** - Structure
- **CSS3** - Styling & animations
- **JavaScript (Vanilla)** - Logic & functionality
- **localStorage** - Data persistence
- **Chart.js** - Data visualization
- **jsPDF + html2canvas** - PDF export
- **Google Charts API** - QR code generation

---

## ✅ FITUR LENGKAP

### Data Management
- [x] CRUD operations
- [x] Image upload & preview
- [x] QR code generation
- [x] Search & filter
- [x] Sort & pagination
- [x] Export CSV

### Form Handling
- [x] Validation
- [x] Error messages
- [x] Date pickers
- [x] Required fields
- [x] Camera capture

### User Experience
- [x] Responsive design
- [x] Toast notifications
- [x] Confirm modals
- [x] Loading states
- [x] Smooth animations

### Reporting
- [x] Chart visualization
- [x] Monthly breakdown
- [x] PDF export
- [x] CSV export
- [x] Filter & search

---

## 📞 SUPPORT

Untuk pertanyaan atau issue:
1. Check console browser (F12) untuk error details
2. Verify localStorage tidak terblock
3. Check internet untuk CDN libraries (Chart.js, jsPDF)

---

## 🎉 READY TO USE!

1. Buka `Dashboard.html`
2. Mulai tambah barang
3. Entry peminjaman
4. Lihat laporan

**Aplikasi 100% siap pakai tanpa setup!**

---

**UKM CINEMA** | Sistem Inventaris Alat Peminjaman  
Frontend-Only | Offline Mode | localStorage
