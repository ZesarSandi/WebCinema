// QR Generator Module untuk modal Tambah Barang
(function(){
  'use strict';

  function initQRGenerator(){
    // Get all elements
    const tabButtons = document.querySelectorAll('.modal-tab');
    const codeInput = document.querySelector('#qr-code-input');
    const generateBtn = document.querySelector('#qr-generate-btn');
    const resultDiv = document.querySelector('#qr-result');
    const loadingDiv = document.querySelector('#qr-loading');
    const qrImage = document.querySelector('#qr-image');
    const qrDisplay = document.querySelector('#qr-code-display');
    const downloadBtn = document.querySelector('#qr-download-btn');
    const printBtn = document.querySelector('#qr-print-btn');
    const copyCodeBtn = document.querySelector('#qr-copy-code-btn');
    const formPanel = document.querySelector('#tab-form');
    const qrPanel = document.querySelector('#tab-qr');

    if(!tabButtons.length) return; // no tabs on this page

    // Helper: Generate QR using qrcode.js library
    function generateQRForCode(code, callback){
      try{
        const base = (location.origin && location.origin!=='null') ? (location.origin + location.pathname.replace(/\/[^\/]*$/,'')) : (location.href.replace(/[^\/]*$/,''));
        const url = base + 'peminjaman.html?code=' + encodeURIComponent(code);
        
        // Check if qrcode library is available
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
              // Error from QRCode.js, use fallback
              console.warn('QRCode.js error, using fallback:', err);
              const fallbackUrl = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encodeURIComponent(url);
              if(callback) callback(fallbackUrl);
            } else {
              // Success
              if(callback) callback(dataUrl);
            }
          });
        } else {
          // Library not loaded, use fallback immediately
          console.warn('QRCode.js not loaded, using Google Charts API fallback');
          const fallbackUrl = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encodeURIComponent(url);
          if(callback) callback(fallbackUrl);
        }
      }catch(e){ 
        console.error('Generate QR error:', e);
        // Last resort fallback
        const fallbackUrl = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encodeURIComponent(code);
        if(callback) callback(fallbackUrl);
      }
    }

    // Helper: Escape HTML
    function escapeHtml(text){
      if(!text) return '';
      const map = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#039;"};
      return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    // Tab switching
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabButtons.forEach(b => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        
        if(tab === 'form') {
          if(formPanel) formPanel.style.display = 'block';
          if(qrPanel) qrPanel.style.display = 'none';
        } else if(tab === 'qr') {
          if(formPanel) formPanel.style.display = 'none';
          if(qrPanel) qrPanel.style.display = 'block';
          
          // Auto-generate QR saat tab dibuka
          setTimeout(() => {
            if(!codeInput.value) {
              generateNewCode();
            } else {
              updateQRDisplay(codeInput.value);
            }
          }, 100);
        }
      });
    });

    // Generate new code
    function generateNewCode() {
      const code = 'ITEM-' + Math.floor(Date.now() / 1000);
      if(codeInput) codeInput.value = code;
      updateQRDisplay(code);
      console.log('New code generated:', code);
    }

    // Update QR display
    function updateQRDisplay(code) {
      if(!code) {
        if(resultDiv) resultDiv.style.display = 'none';
        if(loadingDiv) loadingDiv.style.display = 'none';
        return;
      }
      
      // Show loading state
      if(loadingDiv) loadingDiv.style.display = 'block';
      if(resultDiv) resultDiv.style.display = 'none';
      if(qrImage) {
        qrImage.style.opacity = '0.5';
        qrImage.alt = 'Generating QR...';
      }
      
      console.log('Generating QR for code:', code);
      console.log('QRCode library available:', typeof QRCode !== 'undefined');
      
      generateQRForCode(code, function(qrUrl){
        console.log('QR generated:', qrUrl ? 'Success' : 'Failed');
        console.log('QR URL length:', qrUrl ? qrUrl.length : 0);
        
        // Hide loading, show result
        if(loadingDiv) loadingDiv.style.display = 'none';
        
        if(qrImage && qrUrl) {
          qrImage.src = qrUrl;
          qrImage.style.opacity = '1';
          qrImage.alt = 'QR Code';
          qrImage.onerror = function() {
            console.error('Failed to load QR image');
            qrImage.alt = '❌ Failed to load QR';
            alert('⚠️ Gagal load QR image. Coba refresh halaman.');
          };
          qrImage.onload = function() {
            console.log('QR image loaded successfully');
          };
        }
        if(qrDisplay) qrDisplay.textContent = code;
        if(resultDiv && qrUrl) resultDiv.style.display = 'block';
        
        // Store current QR data for download
        window._currentQRData = qrUrl;
        
        // Show success message
        if(qrUrl && typeof window.toast === 'function') {
          window.toast('✅ QR Code berhasil di-generate!');
        }
      });
      
      // Copy to form input if it exists
      const formCodeInput = document.querySelector('form input[name="kode"]') || document.querySelector('form input[data-field="code"]');
      if(formCodeInput) formCodeInput.value = code;
    }

    // Download QR
    function downloadQR() {
      const code = codeInput.value || '';
      if(!code) { alert('Silakan generate kode dulu'); return; }
      
      // Use stored QR data or current image src
      const qrData = window._currentQRData || qrImage.src;
      
      const link = document.createElement('a');
      link.href = qrData;
      link.download = `QR-${code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Print QR
    function printQR() {
      const code = codeInput.value || '';
      if(!code) { alert('Silakan generate kode dulu'); return; }
      
      // Use stored QR data
      const qrData = window._currentQRData || qrImage.src;
      
      const w = window.open('', '_blank');
      w.document.write(`
        <html>
          <head>
            <title>Label QR - ${code}</title>
            <style>
              body { font-family: Arial; padding: 20px; text-align: center; }
              img { max-width: 300px; margin: 20px 0; border: 2px solid #1a237e; border-radius: 8px; }
              h3 { font-size: 24px; color: #1a237e; font-weight: 600; }
              .code { font-family: monospace; font-size: 16px; color: #666; margin: 10px 0; }
              .footer { font-size: 12px; color: #999; margin-top: 30px; }
            </style>
          </head>
          <body>
            <h3>UKM CINEMA</h3>
            <div class="code">${escapeHtml(code)}</div>
            <img src="${escapeHtml(qrData)}" alt="QR Code">
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Scan untuk membuka form peminjaman</p>
            <div class="footer">Generated: ${new Date().toLocaleDateString('id-ID')}</div>
          </body>
        </html>
      `);
      w.document.close();
      w.focus();
      w.print();
      setTimeout(() => w.close(), 500);
    }

    // Copy code
    function copyCode() {
      const code = codeInput.value || '';
      if(!code) { alert('Silakan generate kode dulu'); return; }
      
      navigator.clipboard.writeText(code).then(() => {
        const btn = copyCodeBtn;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => { btn.textContent = originalText; }, 1500);
      }).catch(() => {
        alert('Gagal copy: ' + code);
      });
    }

    // Event listeners
    if(generateBtn) {
      generateBtn.addEventListener('click', () => {
        console.log('🔄 Generate button clicked!');
        generateNewCode();
      });
    }
    
    if(codeInput) {
      codeInput.addEventListener('input', (e) => {
        const code = e.target.value.trim();
        if(code) updateQRDisplay(code);
      });
      // Auto-generate on first focus
      codeInput.addEventListener('focus', () => {
        if(!codeInput.value) {
          console.log('📝 Input focused, auto-generating...');
          generateNewCode();
        }
      }, { once: true });
    }
    if(downloadBtn) downloadBtn.addEventListener('click', downloadQR);
    if(printBtn) printBtn.addEventListener('click', printQR);
    if(copyCodeBtn) copyCodeBtn.addEventListener('click', copyCode);
  }

  // Initialize when DOM ready
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQRGenerator);
  } else {
    initQRGenerator();
  }
  
  console.log('✅ QR Generator module loaded');
})();
