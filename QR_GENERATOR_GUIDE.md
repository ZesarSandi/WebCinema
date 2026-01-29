# 🔲 QR Generator - Quick Fix Guide

## ✅ CARA GENERATE QR CODE

### Langkah-langkah:
1. **Buka halaman** → `data-barang.html`
2. **Klik tombol** → `+ Tambah Barang` (tombol biru di kanan atas)
3. **Pilih tab** → `🔲 QR Generator` (tab kedua di modal)
4. **Klik tombol** → `🔄 Generate QR` (tombol biru besar)
5. **Tunggu 1-2 detik** → QR code akan muncul!

---

## 🎯 VISUAL YANG HARUS TERLIHAT

### Saat Generate:
```
⏳ (animasi berputar)
Generating QR Code...
Mohon tunggu sebentar
```

### Setelah Berhasil:
```
┌─────────────────────┐
│                     │
│   [QR CODE IMAGE]   │  ← Kotak hitam-putih
│                     │
└─────────────────────┘
     ITEM-1738058400     ← Kode barang
✅ QR berhasil di-generate!

[💾 Download QR] [🖨️ Cetak] [📋 Copy Kode]
```

---

## 🔍 TROUBLESHOOTING

### Masalah: QR Tidak Muncul

#### Solusi 1: Cek Console
```
1. Tekan F12
2. Klik tab "Console"
3. Lihat pesan error berwarna merah
4. Screenshot dan kirim ke saya
```

#### Solusi 2: Test Library
```
1. Buka: TEST_QR.html
2. Klik: "Check Library Status"
3. Harus muncul: ✅ qrcode.js loaded successfully
4. Jika ❌, masalah di CDN/internet
```

#### Solusi 3: Force Reload
```
1. Tutup browser
2. Buka lagi data-barang.html
3. Tekan Ctrl+Shift+R (hard reload)
4. Coba lagi
```

#### Solusi 4: Cek Internet
```
1. Buka: Dashboard.html
2. Lihat pojok kanan atas
3. Harus ada: 🌐 Online (hijau)
4. Jika 📡 Offline (merah), nyalakan internet
```

---

## 🐛 PESAN ERROR UMUM

### Error: "QRCode is not defined"
**Penyebab:** Library qrcode.js tidak load  
**Solusi:** 
- Cek internet connection
- Hard reload (Ctrl+Shift+R)
- Buka TEST_QR.html untuk test library

### Error: "Failed to load QR image"
**Penyebab:** URL QR tidak valid  
**Solusi:**
- Aplikasi akan otomatis fallback ke Google Charts API
- Refresh halaman dan coba lagi

### QR Muncul tapi Blur/Pecah
**Penyebab:** Resolusi rendah  
**Solusi:**
- Normal, QR tetap bisa di-scan
- Download dulu baru print untuk kualitas terbaik

---

## 💡 TIPS & TRIK

### Generate QR Lebih Cepat:
- Saat buka tab "QR Generator", QR otomatis generate
- Tidak perlu klik "Generate QR" lagi

### Custom Kode:
- Ketik kode manual di input field
- QR akan update otomatis saat ketik

### Download vs Print:
- **Download** → Kualitas terbaik, bisa edit
- **Print** → Langsung cetak, praktis

### Multiple QR:
- Klik "Generate QR" berulang → Kode baru setiap kali
- Timestamp berbeda → ITEM-1738058400, ITEM-1738058401, dst

---

## 📞 NEED HELP?

Jika masih tidak bisa:
1. Screenshot seluruh halaman
2. Screenshot Console (F12)
3. Kirim ke developer
4. Include: Browser + OS info

**Browser Info:**
- Chrome: Settings → About Chrome
- Firefox: Help → About Firefox
- Edge: Settings → About Microsoft Edge

---

## ✅ CHECKLIST SEBELUM REPORT BUG

- [ ] Sudah coba reload (Ctrl+R)?
- [ ] Sudah coba hard reload (Ctrl+Shift+R)?
- [ ] Internet connection ON?
- [ ] TEST_QR.html berfungsi?
- [ ] Console ada error merah?
- [ ] Screenshot ready?

---

**Last Updated:** 2026-01-28  
**Version:** 1.0.0  
**Module:** qr-generator.js
