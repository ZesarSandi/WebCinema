// Google Integration & Online Status Module
(function(){
  'use strict';

  // ============================================
  // ONLINE/OFFLINE STATUS MONITOR
  // ============================================
  
  function initOnlineStatus() {
    const statusIndicator = createStatusIndicator();
    document.body.appendChild(statusIndicator);
    
    updateOnlineStatus();
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }
  
  function createStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'online-status';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: all 0.3s;
    `;
    return indicator;
  }
  
  function updateOnlineStatus() {
    const indicator = document.querySelector('#online-status');
    if(!indicator) return;
    
    const isOnline = navigator.onLine;
    
    if(isOnline) {
      indicator.style.background = '#dcfce7';
      indicator.style.color = '#166534';
      indicator.style.border = '1px solid #4ade80';
      indicator.innerHTML = '🌐 <span>Online</span>';
    } else {
      indicator.style.background = '#fee2e2';
      indicator.style.color = '#991b1b';
      indicator.style.border = '1px solid #ef4444';
      indicator.innerHTML = '📡 <span>Offline</span>';
    }
    
    // Show toast on status change
    if(window._lastOnlineStatus !== undefined && window._lastOnlineStatus !== isOnline) {
      showToast(isOnline ? '✅ Koneksi internet tersambung' : '⚠️ Koneksi internet terputus');
    }
    window._lastOnlineStatus = isOnline;
  }
  
  // ============================================
  // GOOGLE DRIVE BACKUP
  // ============================================
  
  window.googleDriveBackup = async function() {
    if(!navigator.onLine) {
      alert('⚠️ Tidak ada koneksi internet. Backup ke Google Drive memerlukan koneksi online.');
      return;
    }
    
    const confirmed = confirm(
      '📤 Backup ke Google Drive\n\n' +
      'Fitur ini akan:\n' +
      '• Export semua data (barang, peminjaman, riwayat)\n' +
      '• Upload ke Google Drive sebagai file JSON\n' +
      '• Memerlukan Google Sign-In\n\n' +
      'Lanjutkan?'
    );
    
    if(!confirmed) return;
    
    try {
      // Collect all data
      const backupData = {
        timestamp: new Date().toISOString(),
        app: 'UKM CINEMA Inventory',
        version: '1.0.0',
        data: {
          dataBarang: JSON.parse(localStorage.getItem('dataBarang') || '[]'),
          peminjaman: JSON.parse(localStorage.getItem('peminjaman') || '[]'),
          riwayat: JSON.parse(localStorage.getItem('riwayat') || '[]')
        }
      };
      
      // Create JSON blob
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const filename = `ukm-cinema-backup-${Date.now()}.json`;
      
      // Download locally (Google Drive API requires complex OAuth setup)
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      showToast('💾 Backup berhasil! Upload file ke Google Drive secara manual.');
      
      // Show instructions
      setTimeout(() => {
        alert(
          '📤 Upload ke Google Drive:\n\n' +
          '1. File sudah di-download: ' + filename + '\n' +
          '2. Buka drive.google.com\n' +
          '3. Klik "New" → "File upload"\n' +
          '4. Pilih file backup\n' +
          '5. Selesai! Data aman di cloud ☁️'
        );
      }, 500);
      
    } catch(error) {
      console.error('Backup error:', error);
      alert('❌ Gagal membuat backup: ' + error.message);
    }
  };
  
  // ============================================
  // GOOGLE SHEETS EXPORT
  // ============================================
  
  window.exportToGoogleSheets = async function() {
    if(!navigator.onLine) {
      alert('⚠️ Tidak ada koneksi internet. Export ke Google Sheets memerlukan koneksi online.');
      return;
    }
    
    const confirmed = confirm(
      '📊 Export ke Google Sheets\n\n' +
      'Fitur ini akan:\n' +
      '• Export data barang ke format CSV\n' +
      '• Bisa di-import ke Google Sheets\n' +
      '• Download file CSV\n\n' +
      'Lanjutkan?'
    );
    
    if(!confirmed) return;
    
    try {
      const data = JSON.parse(localStorage.getItem('dataBarang') || '[]');
      
      if(data.length === 0) {
        alert('⚠️ Tidak ada data barang untuk di-export.');
        return;
      }
      
      // Create CSV content
      const headers = ['No', 'Kode', 'Nama', 'Kondisi', 'Jenis', 'Tanggal Regis', 'Foto URL'];
      const rows = data.map((item, index) => [
        index + 1,
        item.code || '',
        item.nama || '',
        item.kondisi || '',
        item.jenis || '',
        item.tanggal || '',
        item.foto || ''
      ]);
      
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      // Download CSV
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `ukm-cinema-data-barang-${Date.now()}.csv`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      showToast('📊 Export berhasil! Import ke Google Sheets.');
      
      // Show instructions
      setTimeout(() => {
        alert(
          '📊 Import ke Google Sheets:\n\n' +
          '1. Buka sheets.google.com\n' +
          '2. Create new spreadsheet\n' +
          '3. File → Import → Upload\n' +
          '4. Pilih file: ' + filename + '\n' +
          '5. Separator: Comma\n' +
          '6. Selesai! Data di cloud ☁️'
        );
      }, 500);
      
    } catch(error) {
      console.error('Export error:', error);
      alert('❌ Gagal export data: ' + error.message);
    }
  };
  
  // ============================================
  // INTERNET CONNECTION TEST
  // ============================================
  
  window.testInternetConnection = async function() {
    const startTime = Date.now();
    
    showToast('🔍 Testing koneksi internet...');
    
    try {
      // Test with Google's public DNS
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      
      const latency = Date.now() - startTime;
      
      showToast(`✅ Internet tersambung! Latency: ${latency}ms`);
      
      alert(
        '✅ Test Koneksi Internet\n\n' +
        'Status: Connected\n' +
        'Provider: Google\n' +
        'Latency: ' + latency + 'ms\n' +
        'Speed: ' + (latency < 100 ? 'Fast' : latency < 300 ? 'Normal' : 'Slow')
      );
      
      return true;
      
    } catch(error) {
      showToast('❌ Tidak ada koneksi internet');
      
      alert(
        '❌ Test Koneksi Internet\n\n' +
        'Status: Disconnected\n' +
        'Error: ' + error.message + '\n\n' +
        'Pastikan:\n' +
        '• WiFi/data seluler aktif\n' +
        '• Tidak ada firewall blocking\n' +
        '• DNS berfungsi normal'
      );
      
      return false;
    }
  };
  
  // ============================================
  // GOOGLE SEARCH INTEGRATION
  // ============================================
  
  window.searchGoogleForItem = function(itemName) {
    if(!navigator.onLine) {
      alert('⚠️ Tidak ada koneksi internet untuk search Google.');
      return;
    }
    
    const query = encodeURIComponent(itemName + ' specifications manual');
    const url = `https://www.google.com/search?q=${query}`;
    window.open(url, '_blank');
  };
  
  // ============================================
  // GOOGLE MAPS INTEGRATION (for location)
  // ============================================
  
  window.openGoogleMaps = function() {
    if(!navigator.onLine) {
      alert('⚠️ Tidak ada koneksi internet untuk membuka Google Maps.');
      return;
    }
    
    // Default location (UKM Cinema location)
    const location = 'UKM+Cinema';
    const url = `https://www.google.com/maps/search/${location}`;
    window.open(url, '_blank');
  };
  
  // ============================================
  // HELPER: Show Toast
  // ============================================
  
  function showToast(message) {
    // Use existing toast if available
    if(typeof window.toast === 'function') {
      window.toast(message);
      return;
    }
    
    // Create simple toast
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1a237e;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  // Init online status indicator
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnlineStatus);
  } else {
    initOnlineStatus();
  }
  
  // Periodic connection check (every 30 seconds)
  setInterval(() => {
    updateOnlineStatus();
  }, 30000);
  
  console.log('✅ Google Integration Module loaded');
  console.log('Available functions:');
  console.log('  - googleDriveBackup()');
  console.log('  - exportToGoogleSheets()');
  console.log('  - testInternetConnection()');
  console.log('  - searchGoogleForItem(name)');
  console.log('  - openGoogleMaps()');
  
})();
