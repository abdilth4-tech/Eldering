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

  // Create indicator container - COMPACT & MINIMAL
  const indicator = document.createElement('div');
  indicator.id = 'ble-status-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 72px;
    right: 12px;
    z-index: 999;
    background: rgba(255, 255, 255, 0.95);
    padding: 6px 10px;
    border-radius: 20px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    display: none;
    align-items: center;
    gap: 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(0,0,0,0.06);
    backdrop-filter: blur(8px);
  `;

  // Status dot
  const statusDot = document.createElement('div');
  statusDot.id = 'ble-status-dot';
  statusDot.style.cssText = `
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ccc;
    animation: pulse 2s infinite;
    flex-shrink: 0;
  `;

  // Device name - HIDDEN untuk save space
  const deviceName = document.createElement('span');
  deviceName.id = 'ble-device-name';
  deviceName.textContent = 'BLE';
  deviceName.style.cssText = `
    font-weight: 600;
    color: #555;
    font-size: 10px;
  `;

  // Status text
  const statusText = document.createElement('span');
  statusText.id = 'ble-status-text';
  statusText.textContent = 'Off';
  statusText.style.cssText = `
    font-size: 10px;
    color: #999;
    display: none;
  `;

  // Reconnect button (hidden by default)
  const reconnectBtn = document.createElement('button');
  reconnectBtn.id = 'ble-reconnect-btn';
  reconnectBtn.textContent = '🔄';
  reconnectBtn.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
    margin: 0;
    display: none;
    line-height: 1;
  `;
  reconnectBtn.title = 'Reconnect';

  // Assemble indicator
  indicator.appendChild(statusDot);
  indicator.appendChild(deviceName);
  indicator.appendChild(statusText);
  indicator.appendChild(reconnectBtn);

  // Add CSS animations - SUBTLE & MINIMAL
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    #ble-status-indicator:hover {
      box-shadow: 0 3px 8px rgba(0,0,0,0.12);
    }

    #ble-status-indicator.connected {
      background: rgba(76, 175, 80, 0.08);
      border-color: rgba(76, 175, 80, 0.2);
    }

    #ble-status-indicator.disconnected {
      background: rgba(244, 67, 54, 0.06);
      border-color: rgba(244, 67, 54, 0.15);
    }

    #ble-status-indicator.connecting {
      background: rgba(255, 152, 0, 0.06);
      border-color: rgba(255, 152, 0, 0.15);
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
        deviceName.textContent = 'BLE';
        reconnectBtn.style.display = 'none';
        indicator.title = 'Bluetooth Connected';
        break;

      case 'connecting':
        indicator.style.display = 'flex';
        statusDot.style.background = '#FF9800';
        statusDot.style.animation = 'pulse 1s infinite';
        deviceName.textContent = 'BLE';
        reconnectBtn.style.display = 'none';
        indicator.title = 'Connecting to device...';
        break;

      case 'disconnected':
        // Check if there's a saved device
        const savedDevice = loadDeviceFromStorage();

        if (savedDevice) {
          indicator.style.display = 'flex';
          statusDot.style.background = '#f44336';
          statusDot.style.animation = 'pulse 1.5s infinite';
          deviceName.textContent = 'BLE';
          reconnectBtn.style.display = 'inline-block';
          indicator.title = 'Disconnected - Click 🔄 to reconnect';
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

    if (device) {
      updateIndicator('disconnected');
      // Show indicator with reconnect button
      indicator.style.display = 'flex';
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
