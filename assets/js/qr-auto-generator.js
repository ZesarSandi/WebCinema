// Auto QR Code Generator - integrates with form in modal
(function(){
  'use strict';

  function initAutoQRGenerator(){
    // Get form and QR elements
    const form = document.getElementById('form-tambah');
    const namaInput = form ? form.querySelector('[name="nama"]') : null;
    const codeInput = document.getElementById('qr-code-input');
    const qrLoading = document.getElementById('qr-loading');
    const qrResult = document.getElementById('qr-result');
    const qrEmpty = document.getElementById('qr-empty');
    const qrActions = document.getElementById('qr-actions');
    const qrImage = document.getElementById('qr-image');
    const qrDisplay = document.getElementById('qr-code-display');
    const downloadBtn = document.getElementById('qr-download-btn');
    const printBtn = document.getElementById('qr-print-btn');
    const copyCodeBtn = document.getElementById('qr-copy-code-btn');

    if(!form || !namaInput) return;

    let currentQRUrl = null;
    let currentQRCode = null;
    let qrLocked = false; // Prevent auto-generate during edit
    let originalQRCode = null; // Store original QR code for edit mode

    // Expose functions globally for data-barang.js
    window.qrGenerator = {
      setQRLocked: function(locked) { qrLocked = locked; },
      setOriginalCode: function(code) { originalQRCode = code; },
      displayQRCode: function(code) { updateQRDisplay(code); }
    };

    // Helper: Generate QR using qrcode.js
    function generateQRForCode(code, callback){
      try{
        const base = (location.origin && location.origin!=='null') ? (location.origin + location.pathname.replace(/\/[^\/]*$/,'')) : (location.href.replace(/[^\/]*$/,''));
        const url = base + 'peminjaman.html?code=' + encodeURIComponent(code);
        
        if(typeof QRCode !== 'undefined' && QRCode.toDataURL) {
          QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            color: {
              dark: '#1a237e',
              light: '#ffffff'
            }
          }, function(err, dataUrl) {
            if(err) {
              console.warn('QRCode.js error, using fallback:', err);
              const fallbackUrl = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encodeURIComponent(url);
              if(callback) callback(fallbackUrl);
            } else {
              if(callback) callback(dataUrl);
            }
          });
        } else {
          console.warn('QRCode.js not loaded, using Google Charts fallback');
          const fallbackUrl = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encodeURIComponent(url);
          if(callback) callback(fallbackUrl);
        }
      }catch(e){ 
        console.error('Generate QR error:', e);
        const fallbackUrl = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encodeURIComponent(code);
        if(callback) callback(fallbackUrl);
      }
    }

    // Update QR display
    function updateQRDisplay(code) {
      if(!code || !code.trim()) {
        // Hide QR, show empty state
        if(qrEmpty) qrEmpty.style.display = 'block';
        if(qrResult) qrResult.style.display = 'none';
        if(qrActions) qrActions.style.display = 'none';
        if(qrLoading) qrLoading.style.display = 'none';
        currentQRCode = null;
        currentQRUrl = null;
        if(codeInput) codeInput.value = '';
        return;
      }

      // Show loading
      if(qrLoading) qrLoading.style.display = 'block';
      if(qrResult) qrResult.style.display = 'none';
      if(qrEmpty) qrEmpty.style.display = 'none';
      if(qrActions) qrActions.style.display = 'none';

      console.log('🔄 Generating QR for code:', code);

      generateQRForCode(code, function(qrUrl){
        if(!qrUrl) {
          console.error('Failed to generate QR');
          if(qrLoading) qrLoading.style.display = 'none';
          return;
        }

        currentQRCode = code;
        currentQRUrl = qrUrl;

        // Update hidden input
        if(codeInput) codeInput.value = code;

        // Hide loading, show result
        if(qrLoading) qrLoading.style.display = 'none';
        if(qrResult) qrResult.style.display = 'block';
        if(qrEmpty) qrEmpty.style.display = 'none';
        if(qrActions) qrActions.style.display = 'flex';

        // Set image
        if(qrImage) {
          qrImage.src = qrUrl;
          qrImage.onload = () => console.log('✅ QR image loaded');
          qrImage.onerror = () => console.error('❌ Failed to load QR image');
        }

        // Set code display
        if(qrDisplay) qrDisplay.textContent = code;

        console.log('✅ QR synchronized:', code);
      });
    }

    // Generate unique code
    function generateNewCode() {
      const code = 'ITEM-' + Math.floor(Date.now() / 1000);
      return code;
    }

    // Listen to nama input change - auto-generate QR with unique code (unless locked during edit)
    if(namaInput) {
      namaInput.addEventListener('input', function(){
        if(qrLocked) {
          console.log('🔒 QR locked during edit - not changing QR code');
          return;
        }
        const nama = this.value.trim();
        if(nama) {
          // Generate new unique code
          const newCode = generateNewCode();
          updateQRDisplay(newCode);
          console.log('📝 Form input detected, auto-generated code:', newCode);
        } else {
          // Clear QR if nama is empty
          updateQRDisplay('');
        }
      });
    }

    // Download QR
    if(downloadBtn) {
      downloadBtn.addEventListener('click', function(e){
        e.preventDefault();
        if(!currentQRUrl || !currentQRCode) {
          alert('Belum ada QR code');
          return;
        }
        const link = document.createElement('a');
        link.href = currentQRUrl;
        link.download = 'QR-' + currentQRCode + '.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('💾 Downloaded QR:', currentQRCode);
      });
    }

    // Print QR
    if(printBtn) {
      printBtn.addEventListener('click', function(e){
        e.preventDefault();
        if(!currentQRUrl) {
          alert('Belum ada QR code');
          return;
        }
        const printWindow = window.open('', '', 'width=300,height=350');
        printWindow.document.write('<html><head><title>Print QR</title></head><body>');
        printWindow.document.write('<div style="text-align:center;padding:20px">');
        printWindow.document.write('<img src="' + currentQRUrl + '" style="max-width:280px;border:2px solid #333">');
        if(currentQRCode) {
          printWindow.document.write('<p style="margin-top:20px;font-family:monospace;font-weight:bold">' + currentQRCode + '</p>');
        }
        printWindow.document.write('</div></body></html>');
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
        console.log('🖨️ Opened print dialog for QR:', currentQRCode);
      });
    }

    // Copy code
    if(copyCodeBtn) {
      copyCodeBtn.addEventListener('click', function(e){
        e.preventDefault();
        if(!currentQRCode) {
          alert('Belum ada QR code');
          return;
        }
        navigator.clipboard.writeText(currentQRCode).then(function(){
          alert('✅ Kode disalin: ' + currentQRCode);
          console.log('📋 Copied code:', currentQRCode);
        }).catch(function(){
          alert('Error saat copy kode');
        });
      });
    }

    console.log('✅ Auto QR Generator initialized - QR code sync active');
    console.log('🔗 Global interface:', window.qrGenerator);
  }

  // Init when DOM ready
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoQRGenerator);
  } else {
    initAutoQRGenerator();
  }
})();
