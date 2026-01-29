// QR Code Scanner Module
(function(){
  'use strict';

  // Elements
  const btnToggle = document.querySelector('#btn-toggle-scanner');
  const btnClose = document.querySelector('#btn-close-scanner');
  const btnSwitch = document.querySelector('#btn-switch-camera');
  const scannerContainer = document.querySelector('#qr-scanner-container');
  const video = document.querySelector('#qr-video');
  const canvas = document.querySelector('#qr-canvas');
  const statusText = document.querySelector('#status-text');
  const scanResult = document.querySelector('#scan-result');
  const scannedCode = document.querySelector('#scanned-code');

  if(!btnToggle || !video || !canvas) return; // Not on peminjaman page

  let stream = null;
  let scanning = false;
  let animationId = null;
  let currentFacingMode = 'environment'; // 'user' or 'environment'

  // Get canvas context
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Toggle Scanner
  btnToggle.addEventListener('click', async () => {
    if(scanning) {
      stopScanner();
    } else {
      await startScanner();
    }
  });

  // Close Scanner
  if(btnClose) {
    btnClose.addEventListener('click', () => {
      stopScanner();
    });
  }

  // Switch Camera (front/back)
  if(btnSwitch) {
    btnSwitch.addEventListener('click', async () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      stopScanner();
      await startScanner();
    });
  }

  // Start Scanner
  async function startScanner() {
    try {
      updateStatus('Memulai kamera...', 'info');
      
      // Request camera access
      const constraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      video.setAttribute('playsinline', true); // iOS compatibility
      
      // Wait for video to be ready
      await video.play();

      scanning = true;
      btnToggle.textContent = '⏸️ Pause Scanner';
      scannerContainer.style.display = 'block';
      
      // Show switch camera button if multiple cameras available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      if(videoDevices.length > 1 && btnSwitch) {
        btnSwitch.style.display = 'inline-block';
      }

      updateStatus('Scanner aktif. Arahkan ke QR code...', 'success');

      // Start scanning loop
      requestAnimationFrame(scanFrame);

    } catch(error) {
      console.error('Camera error:', error);
      updateStatus('❌ Gagal akses kamera: ' + error.message, 'error');
      alert('Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan.');
    }
  }

  // Stop Scanner
  function stopScanner() {
    scanning = false;
    
    if(animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    if(stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    video.srcObject = null;
    btnToggle.textContent = '📷 Buka Scanner';
    scannerContainer.style.display = 'none';
    
    // Hide result
    if(scanResult) scanResult.style.display = 'none';
    
    updateStatus('Scanner ditutup', 'info');
  }

  // Scan Frame
  function scanFrame() {
    if(!scanning) return;

    // Check if video is ready
    if(video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Scan for QR code using jsQR
      if(typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if(code && code.data) {
          handleQRDetected(code.data);
          return; // Stop scanning after detection
        }
      } else {
        updateStatus('⚠️ jsQR library tidak ditemukan', 'error');
      }
    }

    // Continue scanning
    animationId = requestAnimationFrame(scanFrame);
  }

  // Handle QR Detection
  function handleQRDetected(qrData) {
    console.log('QR detected:', qrData);
    
    // Vibrate if supported
    if(navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Show result
    updateStatus('✅ QR Code berhasil di-scan!', 'success');
    if(scanResult) scanResult.style.display = 'block';
    if(scannedCode) scannedCode.textContent = qrData;

    // Play success sound (optional)
    playBeep();

    // Extract code from URL if it's a peminjaman URL
    let itemCode = qrData;
    try {
      const url = new URL(qrData);
      const params = new URLSearchParams(url.search);
      if(params.has('code')) {
        itemCode = params.get('code');
      }
    } catch(e) {
      // Not a URL, treat as direct code
    }

    // Trigger form load with code
    setTimeout(() => {
      stopScanner();
      
      // Redirect to peminjaman with code
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('code', itemCode);
      window.location.href = newUrl.toString();
    }, 1500);
  }

  // Update Status Display
  function updateStatus(message, type = 'info') {
    if(!statusText) return;
    
    statusText.textContent = message;
    
    const statusDiv = document.querySelector('#scanner-status');
    if(statusDiv) {
      statusDiv.style.borderLeftColor = 
        type === 'success' ? '#4ade80' : 
        type === 'error' ? '#ef4444' : 
        '#1a237e';
    }
  }

  // Play Beep Sound
  function playBeep() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch(e) {
      // Silent fail
    }
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopScanner();
  });

  // Auto-hide result after 5 seconds
  if(scanResult) {
    const observer = new MutationObserver(() => {
      if(scanResult.style.display !== 'none') {
        setTimeout(() => {
          scanResult.style.display = 'none';
        }, 5000);
      }
    });
    
    observer.observe(scanResult, { attributes: true, attributeFilter: ['style'] });
  }

})();
