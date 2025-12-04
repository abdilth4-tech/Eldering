/* ══════════════════════════════════════════════════════════════════
   BLE STATUS INDICATOR - Global BLE Connection Status Widget
   ══════════════════════════════════════════════════════════════════

   Displays persistent BLE connection status across all pages
   Shows at top-right corner with device name and status

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

  // ═══════════════════════════════════════════════════════════════
  //                      CREATE UI ELEMENTS
  // ═══════════════════════════════════════════════════════════════

  // Create indicator container
  const indicator = document.createElement('div');
  indicator.id = 'ble-status-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 70px;
    right: 16px;
    z-index: 999;
    background: white;
    padding: 10px 16px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: none;
    align-items: center;
    gap: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid #e0e0e0;
  `;

  // Status dot
  const statusDot = document.createElement('div');
  statusDot.id = 'ble-status-dot';
  statusDot.style.cssText = `
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ccc;
    animation: pulse 2s infinite;
  `;

  // Device name
  const deviceName = document.createElement('span');
  deviceName.id = 'ble-device-name';
  deviceName.textContent = 'CareRing';
  deviceName.style.cssText = `
    font-weight: 600;
    color: #333;
  `;

  // Status text
  const statusText = document.createElement('span');
  statusText.id = 'ble-status-text';
  statusText.textContent = 'Terputus';
  statusText.style.cssText = `
    font-size: 11px;
    color: #999;
  `;

  // Reconnect button (hidden by default)
  const reconnectBtn = document.createElement('button');
  reconnectBtn.id = 'ble-reconnect-btn';
  reconnectBtn.textContent = '🔄';
  reconnectBtn.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    margin-left: 4px;
    display: none;
  `;
  reconnectBtn.title = 'Reconnect';

  // Assemble indicator
  indicator.appendChild(statusDot);
  indicator.appendChild(deviceName);
  indicator.appendChild(statusText);
  indicator.appendChild(reconnectBtn);

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    #ble-status-indicator:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }

    #ble-status-indicator.connected {
      border-color: #4CAF50;
    }

    #ble-status-indicator.disconnected {
      border-color: #f44336;
    }

    #ble-status-indicator.connecting {
      border-color: #FF9800;
    }
  `;
  document.head.appendChild(style);

  // Add to page after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(indicator);
    });
  } else {
    document.body.appendChild(indicator);
  }

  // ═══════════════════════════════════════════════════════════════
  //                      STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  let currentState = 'disconnected'; // disconnected, connecting, connected

  /**
   * Update indicator UI based on state
   */
  function updateIndicator(state, deviceInfo = null) {
    currentState = state;

    // Remove all state classes
    indicator.classList.remove('connected', 'disconnected', 'connecting');
    indicator.classList.add(state);

    switch(state) {
      case 'connected':
        indicator.style.display = 'flex';
        statusDot.style.background = '#4CAF50';
        statusDot.style.animation = 'none';
        statusText.textContent = 'Terhubung';
        statusText.style.color = '#4CAF50';
        reconnectBtn.style.display = 'none';

        if (deviceInfo && deviceInfo.name) {
          deviceName.textContent = deviceInfo.name;
        }
        break;

      case 'connecting':
        indicator.style.display = 'flex';
        statusDot.style.background = '#FF9800';
        statusDot.style.animation = 'pulse 1s infinite';
        statusText.textContent = 'Menghubungkan...';
        statusText.style.color = '#FF9800';
        reconnectBtn.style.display = 'none';
        break;

      case 'disconnected':
        // Check if there's a saved device
        const savedDevice = loadDeviceFromStorage();

        if (savedDevice) {
          indicator.style.display = 'flex';
          statusDot.style.background = '#f44336';
          statusDot.style.animation = 'pulse 1s infinite';  // Pulse to show it's waiting
          statusText.textContent = 'Terputus';
          statusText.style.color = '#f44336';
          reconnectBtn.style.display = 'inline-block';
          reconnectBtn.style.animation = 'pulse 1.5s infinite';  // Make button pulse too
          deviceName.textContent = savedDevice.name;

          // Add helpful title
          indicator.title = 'Klik untuk ke halaman Perangkat, atau klik 🔄 untuk reconnect';
        } else {
          // No saved device, hide indicator
          indicator.style.display = 'none';
        }
        break;
    }
  }

  /**
   * Load device info from localStorage (mirror from ble-handler.js)
   */
  function loadDeviceFromStorage() {
    try {
      const data = localStorage.getItem('careringBLEDevice');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //                      EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════

  // Listen to BLE events
  window.addEventListener('bleConnected', (event) => {
    console.log('🟢 BLE Indicator: Device connected');
    updateIndicator('connected', event.detail);
  });

  window.addEventListener('bleDisconnected', () => {
    console.log('🔴 BLE Indicator: Device disconnected');
    updateIndicator('disconnected');
  });

  window.addEventListener('bleConnecting', () => {
    console.log('🟡 BLE Indicator: Connecting...');
    updateIndicator('connecting');
  });

  // Click to go to perangkat page
  indicator.addEventListener('click', (e) => {
    if (e.target === reconnectBtn) {
      // Reconnect button clicked
      return;
    }

    if (currentPage !== '/perangkat.html') {
      window.location.href = '/perangkat.html';
    }
  });

  // Reconnect button handler
  reconnectBtn.addEventListener('click', async (e) => {
    e.stopPropagation();

    if (!window.BLEHandler) {
      console.error('❌ BLEHandler not available');
      alert('Error: BLE Handler belum dimuat. Refresh halaman dan coba lagi.');
      return;
    }

    try {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('   🔄 MANUAL RECONNECT TRIGGERED');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');

      updateIndicator('connecting');

      const success = await window.BLEHandler.reconnect();

      if (!success) {
        console.error('❌ Reconnect returned false');
        alert('Reconnect gagal!\n\nSolusi:\n1. Buka halaman Perangkat\n2. Scan ulang device\n\nAtau check console untuk detail error.');
        updateIndicator('disconnected');
      }
    } catch (error) {
      console.error('❌ Reconnect error:', error);
      alert('Reconnect gagal: ' + error.message + '\n\nCheck console untuk detail.');
      updateIndicator('disconnected');
    }
  });

  // ═══════════════════════════════════════════════════════════════
  //                      INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize indicator on page load
   */
  function initIndicator() {
    // Wait for BLEHandler to load
    const checkBLEHandler = setInterval(() => {
      if (window.BLEHandler) {
        clearInterval(checkBLEHandler);

        // Check current connection status
        const deviceInfo = window.BLEHandler.getDeviceInfo();

        if (deviceInfo) {
          if (window.BLEHandler.isConnected()) {
            updateIndicator('connected', deviceInfo);
          } else {
            updateIndicator('disconnected');
          }
        } else {
          updateIndicator('disconnected');
        }
      }
    }, 100);

    // Timeout after 3 seconds
    setTimeout(() => {
      clearInterval(checkBLEHandler);
    }, 3000);
  }

  // Listen for reconnect needed event
  window.addEventListener('bleNeedsReconnect', (e) => {
    console.log('📢 BLE needs reconnect event received');
    const device = e.detail?.device;
    const autoRequest = e.detail?.autoRequest;
    const message = e.detail?.message;
    
    if (device) {
      updateIndicator('disconnected');
      // Show indicator with reconnect button
      indicator.style.display = 'flex';
      
      if (autoRequest) {
        console.log('💡 Auto-request enabled: User can click/scroll to reconnect');
        console.log('   Message:', message || 'Klik atau scroll untuk reconnect otomatis');
        
        // Update indicator text to show auto-request is available
        if (deviceNameEl) {
          deviceNameEl.textContent = message || 'Klik/scroll untuk reconnect';
        }
      } else {
        console.log('💡 Reconnect button is available in the indicator');
      }
    }
  });

  // Listen for BLE connection events
  window.addEventListener('bleConnected', () => {
    console.log('📢 BLE connected event received');
    if (window.BLEHandler) {
      const deviceInfo = window.BLEHandler.getDeviceInfo();
      if (deviceInfo) {
        updateIndicator('connected', deviceInfo);
      }
    }
  });

  window.addEventListener('bleDisconnected', () => {
    console.log('📢 BLE disconnected event received');
    updateIndicator('disconnected');
  });

  // Initialize after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndicator);
  } else {
    initIndicator();
  }

  console.log('✅ BLE Status Indicator loaded');
})();
