/* ══════════════════════════════════════════════════════════════════
   FLOATING RECONNECT BUTTON - Easy Manual Reconnect
   ══════════════════════════════════════════════════════════════════

   Large, prominent floating button for easy manual reconnect
   Shows when BLE is disconnected but device is saved

   Author: Claude Code
   Date: 2025-12-04
   ══════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Skip on login/register pages
  const currentPage = window.location.pathname;
  if (currentPage.includes('login') || currentPage.includes('register')) {
    return;
  }

  // Create floating button
  const floatingBtn = document.createElement('div');
  floatingBtn.id = 'ble-floating-reconnect';
  floatingBtn.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 9999;
    background: linear-gradient(135deg, #E74C3C, #C0392B);
    color: white;
    padding: 16px 24px;
    border-radius: 50px;
    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.5);
    cursor: pointer;
    display: none;
    align-items: center;
    gap: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s ease;
    animation: pulseRed 2s infinite;
    user-select: none;
  `;

  // Icon
  const icon = document.createElement('span');
  icon.textContent = '🔄';
  icon.style.cssText = `
    font-size: 24px;
    animation: spin 2s linear infinite;
  `;

  // Text
  const text = document.createElement('span');
  text.textContent = 'RECONNECT BLE';

  floatingBtn.appendChild(icon);
  floatingBtn.appendChild(text);

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulseRed {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 6px 20px rgba(231, 76, 60, 0.5);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(231, 76, 60, 0.8);
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    #ble-floating-reconnect:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 8px 30px rgba(231, 76, 60, 0.8);
    }

    #ble-floating-reconnect:active {
      transform: translateY(-2px) scale(1.03);
    }

    #ble-floating-reconnect.connecting {
      background: linear-gradient(135deg, #FF9800, #F57C00);
      pointer-events: none;
    }

    #ble-floating-reconnect.success {
      background: linear-gradient(135deg, #4CAF50, #388E3C);
      animation: none;
    }
  `;
  document.head.appendChild(style);

  // Add to page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(floatingBtn);
    });
  } else {
    document.body.appendChild(floatingBtn);
  }

  // ═══════════════════════════════════════════════════════════════
  //                      STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  function showButton() {
    floatingBtn.style.display = 'flex';
  }

  function hideButton() {
    floatingBtn.style.display = 'none';
  }

  function setConnecting() {
    floatingBtn.classList.add('connecting');
    text.textContent = 'CONNECTING...';
  }

  function setSuccess() {
    floatingBtn.classList.remove('connecting');
    floatingBtn.classList.add('success');
    text.textContent = 'CONNECTED!';

    setTimeout(() => {
      hideButton();
      floatingBtn.classList.remove('success');
      text.textContent = 'RECONNECT BLE';
    }, 2000);
  }

  function setError() {
    floatingBtn.classList.remove('connecting', 'success');
    text.textContent = 'RECONNECT BLE';
  }

  // ═══════════════════════════════════════════════════════════════
  //                      EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════

  // Click handler
  floatingBtn.addEventListener('click', async () => {
    if (!window.BLEHandler) {
      alert('Error: BLE Handler belum dimuat.\n\nSolusi:\n1. Refresh halaman (Ctrl+Shift+R)\n2. Atau kembali ke halaman Perangkat');
      return;
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🔄 FLOATING BUTTON RECONNECT');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    setConnecting();

    try {
      const success = await window.BLEHandler.reconnect();

      if (success) {
        setSuccess();
        console.log('✅ Reconnect berhasil via floating button!');
      } else {
        setError();
        alert('Reconnect gagal!\n\nSolusi:\n1. Pastikan ESP32 menyala\n2. Bluetooth komputer aktif\n3. Atau scan ulang di halaman Perangkat');
      }
    } catch (error) {
      setError();
      console.error('❌ Reconnect error:', error);

      let errorMsg = 'Reconnect gagal!\n\n';

      if (error.message && error.message.includes('DEVICE SUDAH TERHUBUNG DI WINDOWS')) {
        errorMsg += 'MASALAH: Device sudah terhubung di Windows Settings\n\n';
        errorMsg += 'SOLUSI:\n';
        errorMsg += '1. Buka Windows Settings > Bluetooth\n';
        errorMsg += '2. Remove device "CareRing"\n';
        errorMsg += '3. Coba reconnect lagi';
      } else if (error.message && error.message.includes('getDevices')) {
        errorMsg += 'MASALAH: Browser API tidak tersedia (Mobile Emulation)\n\n';
        errorMsg += 'SOLUSI:\n';
        errorMsg += '1. Tekan Ctrl+Shift+M untuk disable mobile emulation\n';
        errorMsg += '2. Refresh halaman (Ctrl+Shift+R)\n';
        errorMsg += '3. Reconnect akan work otomatis';
      } else {
        errorMsg += 'Error: ' + error.message + '\n\n';
        errorMsg += 'SOLUSI:\n';
        errorMsg += '1. Check ESP32 menyala\n';
        errorMsg += '2. Dekatkan ESP32 ke komputer\n';
        errorMsg += '3. Atau scan ulang di halaman Perangkat';
      }

      alert(errorMsg);
    }
  });

  // Listen to BLE events
  window.addEventListener('bleConnected', () => {
    console.log('🟢 Floating button: BLE connected');
    hideButton();
  });

  window.addEventListener('bleDisconnected', () => {
    console.log('🔴 Floating button: BLE disconnected');

    // Check if device is saved
    const savedDevice = loadDeviceFromStorage();
    if (savedDevice && savedDevice.connected) {
      showButton();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  //                      INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  function loadDeviceFromStorage() {
    try {
      const data = localStorage.getItem('careringBLEDevice');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function init() {
    // Wait for BLEHandler to load
    const checkInterval = setInterval(() => {
      if (window.BLEHandler) {
        clearInterval(checkInterval);

        // Check connection status
        const isConnected = window.BLEHandler.isConnected();
        const savedDevice = loadDeviceFromStorage();

        console.log('🔘 Floating reconnect button initialized');
        console.log('   Connected:', isConnected);
        console.log('   Saved device:', savedDevice ? savedDevice.name : 'None');

        // Show button if disconnected but device saved
        if (!isConnected && savedDevice && savedDevice.connected) {
          console.log('   → Showing floating reconnect button');
          showButton();
        }
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('✅ Floating Reconnect Button module loaded');
})();
