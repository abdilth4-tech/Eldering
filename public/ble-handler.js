/* ══════════════════════════════════════════════════════════════════
   BLE HANDLER for CARERING - ESP32 to Firebase Bridge (PERSISTENT)
   ══════════════════════════════════════════════════════════════════

   Purpose: Connect to ESP32 CareRing device via BLE, receive sensor
            data, and upload to Firebase Realtime Database

   Features:
   - Persistent connection across page navigation
   - Auto-reconnect on page load
   - LocalStorage state management
   - Broadcast Channel for cross-tab communication

   Author: Claude Code
   Date: 2025-12-04
   Updated: Added persistent connection support
   ══════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════
//                      BLE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const BLE_CONFIG = {
  SERVICE_UUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  CHARACTERISTIC_UUID_TX: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  DEVICE_NAME_PREFIX: 'CareRing',
  DATA_INTERVAL: 500, // ms - ESP32 sends data every 500ms
  UPLOAD_THROTTLE: 1000, // ms - Upload to Firebase max every 1 second
  AUTO_RECONNECT: true, // Enable auto-reconnect on page load
  STORAGE_KEY: 'careringBLEDevice' // LocalStorage key
};

// ═══════════════════════════════════════════════════════════════════
//                      GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════

let bleDevice = null;
let bleServer = null;
let bleCharacteristic = null;
let isConnected = false;
let lastUploadTime = 0;
let uploadQueue = null;
let uploadLoopInterval = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// FALLBACK: Store device object in window for cross-page access
// This works even when getDevices() is not available (mobile emulation)
window._careringBLEDevice = window._careringBLEDevice || null;

// ═══════════════════════════════════════════════════════════════════
//                      LOCALSTORAGE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════

/**
 * Save device info to localStorage
 * @param {Object} deviceInfo - Device information
 */
function saveDeviceToStorage(deviceInfo) {
  try {
    const data = {
      id: deviceInfo.id,
      name: deviceInfo.name,
      timestamp: Date.now(),
      connected: true
    };
    localStorage.setItem(BLE_CONFIG.STORAGE_KEY, JSON.stringify(data));
    console.log('💾 Device info saved to localStorage:', data);
  } catch (error) {
    console.warn('⚠️ Failed to save to localStorage:', error);
  }
}

/**
 * Load device info from localStorage
 * @returns {Object|null} Device info or null
 */
function loadDeviceFromStorage() {
  try {
    const data = localStorage.getItem(BLE_CONFIG.STORAGE_KEY);
    if (!data) return null;

    const deviceInfo = JSON.parse(data);
    console.log('📂 Device info loaded from localStorage:', deviceInfo);
    return deviceInfo;
  } catch (error) {
    console.warn('⚠️ Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Clear device info from localStorage
 */
function clearDeviceFromStorage() {
  try {
    localStorage.removeItem(BLE_CONFIG.STORAGE_KEY);
    console.log('🗑️ Device info cleared from localStorage');
  } catch (error) {
    console.warn('⚠️ Failed to clear localStorage:', error);
  }
}

/**
 * Update connection status in localStorage
 * @param {boolean} connected - Connection status
 */
function updateConnectionStatus(connected) {
  try {
    const data = loadDeviceFromStorage();
    if (data) {
      data.connected = connected;
      data.timestamp = Date.now();
      localStorage.setItem(BLE_CONFIG.STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.warn('⚠️ Failed to update connection status:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
//                      UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if Web Bluetooth API is available
 * @returns {boolean} True if available
 */
function isBLEAvailable() {
  if (!navigator.bluetooth) {
    console.error('❌ Web Bluetooth API not available in this browser');
    console.error('   Please use Chrome or Edge browser');
    return false;
  }
  return true;
}

/**
 * Decode ArrayBuffer to string
 * @param {ArrayBuffer} buffer - Data from BLE characteristic
 * @returns {string} Decoded string
 */
function decodeArrayBuffer(buffer) {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buffer);
}

/**
 * Validate sensor data structure
 * @param {Object} data - Parsed JSON data
 * @returns {boolean} True if valid
 */
function validateSensorData(data) {
  const requiredFields = ['deviceID', 'deviceName', 'heartRate', 'spo2', 'temperature', 'ambient'];

  for (const field of requiredFields) {
    if (!(field in data)) {
      console.warn(`⚠️ Missing required field: ${field}`);
      return false;
    }
  }

  // Type validation
  if (typeof data.heartRate !== 'number' || data.heartRate < 0 || data.heartRate > 300) {
    console.warn('⚠️ Invalid heartRate value:', data.heartRate);
    return false;
  }

  if (typeof data.spo2 !== 'number' || data.spo2 < 0 || data.spo2 > 100) {
    console.warn('⚠️ Invalid spo2 value:', data.spo2);
    return false;
  }

  if (typeof data.temperature !== 'number' || data.temperature < 0 || data.temperature > 50) {
    console.warn('⚠️ Invalid temperature value:', data.temperature);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════
//                      FIREBASE UPLOAD (THROTTLED)
// ═══════════════════════════════════════════════════════════════════

/**
 * Upload sensor data to Firebase with throttling
 * @param {Object} data - Sensor data object
 * @returns {Promise<boolean>} True if uploaded successfully
 */
async function uploadToFirebase(data) {
  try {
    uploadQueue = data;

    const now = Date.now();
    const timeSinceLastUpload = now - lastUploadTime;

    if (timeSinceLastUpload < BLE_CONFIG.UPLOAD_THROTTLE) {
      return false;
    }

    const firebaseData = {
      ...data,
      timestamp: now,
      lastUpdate: new Date().toISOString(),
      uploadedVia: 'BLE-Bridge'
    };

    const deviceID = data.deviceID.replace(/:/g, '-');
    const dataPath = `/realtimeSensorData/${deviceID}`;

    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.database) {
      console.warn('⚠️ Firebase not available, skipping upload');
      return false;
    }

    await firebase.database().ref(dataPath).set(firebaseData);

    lastUploadTime = now;
    console.log('✅ Data uploaded to Firebase:', dataPath);

    return true;
  } catch (error) {
    console.error('❌ Firebase upload failed:', error);
    return false;
  }
}

/**
 * Start throttled upload loop
 */
function startUploadLoop() {
  if (uploadLoopInterval) {
    clearInterval(uploadLoopInterval);
  }

  uploadLoopInterval = setInterval(async () => {
    if (uploadQueue && isConnected) {
      await uploadToFirebase(uploadQueue);
      uploadQueue = null;
    }
  }, BLE_CONFIG.UPLOAD_THROTTLE);

  console.log('🔄 Upload loop started');
}

/**
 * Stop upload loop
 */
function stopUploadLoop() {
  if (uploadLoopInterval) {
    clearInterval(uploadLoopInterval);
    uploadLoopInterval = null;
    console.log('⏹️ Upload loop stopped');
  }
}

// ═══════════════════════════════════════════════════════════════════
//                      BLE DATA HANDLER
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle incoming BLE data from ESP32
 * @param {Event} event - BLE characteristic value changed event
 */
function handleBLEData(event) {
  try {
    const value = event.target.value;
    const dataString = decodeArrayBuffer(value);

    let data;
    try {
      data = JSON.parse(dataString);
    } catch (parseError) {
      console.error('❌ JSON parse failed:', parseError);
      return;
    }

    if (!validateSensorData(data)) {
      console.error('❌ Invalid data structure');
      return;
    }

    console.log('✅ Sensor data:', {
      hr: data.heartRate,
      spo2: data.spo2,
      temp: data.temperature,
      amb: data.ambient
    });

    uploadQueue = data;

    // Trigger event for UI update
    const customEvent = new CustomEvent('bleDataReceived', { detail: data });
    window.dispatchEvent(customEvent);

  } catch (error) {
    console.error('❌ Error handling BLE data:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
//                      BLE CONNECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Connect to CareRing ESP32 device via BLE
 * @param {boolean} isReconnect - True if this is a reconnection attempt
 * @returns {Promise<boolean>} True if connected successfully
 */
async function connectToCareRing(isReconnect = false) {
  try {
    if (!isBLEAvailable()) {
      throw new Error('Web Bluetooth API not available');
    }

    console.log('🔍 Scanning for CareRing devices...');

    const options = {
      filters: [{ namePrefix: BLE_CONFIG.DEVICE_NAME_PREFIX }],
      optionalServices: [BLE_CONFIG.SERVICE_UUID]
    };

    bleDevice = await navigator.bluetooth.requestDevice(options);
    console.log('✅ Device found:', bleDevice.name);

    // FALLBACK: Store device reference in window (works without getDevices API)
    window._careringBLEDevice = bleDevice;
    console.log('💾 Device reference stored in window._careringBLEDevice');

    // Save to localStorage
    saveDeviceToStorage({
      id: bleDevice.id,
      name: bleDevice.name
    });

    bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

    console.log('🔌 Connecting to GATT Server...');
    
    // Check if device is already connected (might be connected via OS)
    try {
      // Try to connect with timeout
      const connectPromise = bleDevice.gatt.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      bleServer = await Promise.race([connectPromise, timeoutPromise]);
      console.log('✅ GATT Server connected');
    } catch (error) {
      if (error.message.includes('timeout') || error.message.includes('disconnected')) {
        console.warn('⚠️ Connection failed - device might be connected to Windows Bluetooth');
        console.warn('💡 SOLUTION:');
        console.warn('   1. Open Windows Settings → Bluetooth & devices');
        console.warn('   2. Find "CareRing" device');
        console.warn('   3. Click "Remove device" or "Disconnect"');
        console.warn('   4. Try connecting again from web app');
        throw new Error('Device is connected to Windows Bluetooth. Please disconnect it first from Windows Settings.');
      }
      throw error;
    }

    // IMPORTANT: Add longer delay to let connection fully stabilize
    // This prevents "GATT Server is disconnected" error
    console.log('⏳ Waiting for connection to stabilize (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify still connected after delay
    if (!bleServer || !bleServer.connected) {
      console.error('❌ Device disconnected during initialization');
      console.error('💡 This usually happens when:');
      console.error('   1. Device is already connected to Windows Bluetooth');
      console.error('   2. Device is out of range');
      console.error('   3. Device was turned off');
      console.error('');
      console.error('💡 SOLUTION:');
      console.error('   1. Disconnect device from Windows Bluetooth Settings');
      console.error('   2. Make sure device is powered on and in range');
      console.error('   3. Try connecting again');
      throw new Error('Device disconnected during initialization. Please disconnect from Windows Bluetooth Settings first.');
    }

    console.log('🔍 Getting BLE Service...');
    const service = await bleServer.getPrimaryService(BLE_CONFIG.SERVICE_UUID);
    console.log('✅ Service found');

    bleCharacteristic = await service.getCharacteristic(BLE_CONFIG.CHARACTERISTIC_UUID_TX);
    console.log('✅ Characteristic found');

    await bleCharacteristic.startNotifications();
    bleCharacteristic.addEventListener('characteristicvaluechanged', handleBLEData);
    console.log('✅ Notifications started');

    startUploadLoop();

    isConnected = true;
    reconnectAttempts = 0;
    updateConnectionStatus(true);

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🎉 SUCCESSFULLY CONNECTED TO CARERING!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Device:', bleDevice.name);
    console.log('   Persistent: ✅ Connection saved');
    console.log('   Auto-reconnect: ✅ Enabled');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Trigger event
    window.dispatchEvent(new CustomEvent('bleConnected', {
      detail: {
        deviceName: bleDevice.name,
        deviceId: bleDevice.id
      }
    }));

    return true;

  } catch (error) {
    console.error('❌ BLE CONNECTION FAILED:', error.message);

    // Enhanced error messages
    let userMessage = error.message;

    if (error.message.includes('GATT Server is disconnected')) {
      userMessage = '⚠️ DEVICE SUDAH TERHUBUNG DI WINDOWS!\n\n' +
        'Solusi:\n' +
        '1. Buka Windows Settings > Bluetooth & devices\n' +
        '2. Cari device "CareRing"\n' +
        '3. Klik [...] > Remove device\n' +
        '4. Refresh halaman dan scan ulang\n\n' +
        'Web Bluetooth tidak bisa akses device yang sudah paired di Windows.';

      console.error('');
      console.error('═══════════════════════════════════════════════════════');
      console.error('   ⚠️ DEVICE ALREADY PAIRED IN WINDOWS');
      console.error('═══════════════════════════════════════════════════════');
      console.error('   Solution:');
      console.error('   1. Open Windows Settings > Bluetooth & devices');
      console.error('   2. Find "CareRing" device');
      console.error('   3. Click [...] > Remove device');
      console.error('   4. Refresh page and scan again');
      console.error('═══════════════════════════════════════════════════════');
      console.error('');
    }

    if (!isReconnect) {
      window.dispatchEvent(new CustomEvent('bleConnectionFailed', {
        detail: {
          error: error.name,
          message: error.message,
          userMessage: userMessage
        }
      }));
    }

    throw new Error(userMessage);
  }
}

/**
 * Auto-reconnect to previously connected device
 * Uses navigator.bluetooth.getDevices() API
 * @returns {Promise<boolean>} True if reconnected successfully
 */
async function autoReconnect() {
  try {
    const savedDevice = loadDeviceFromStorage();
    if (!savedDevice || !savedDevice.connected) {
      console.log('ℹ️ No previous connection found');
      return false;
    }

    if (!isBLEAvailable()) {
      return false;
    }

    console.log('🔄 Attempting auto-reconnect to:', savedDevice.name);

    // Check if browser supports getDevices()
    if (!navigator.bluetooth.getDevices) {
      console.warn('');
      console.warn('═══════════════════════════════════════════════════════');
      console.warn('   ⚠️ BROWSER API NOT SUPPORTED');
      console.warn('═══════════════════════════════════════════════════════');
      console.warn('   navigator.bluetooth.getDevices() not available');
      console.warn('');

      // Check if mobile emulation mode
      if (navigator.userAgent.includes('Nexus') || navigator.userAgent.includes('Mobile')) {
        console.warn('   🔍 DETECTED: Chrome Mobile Emulation Mode');
        console.warn('');
        console.warn('   ⚠️ PENTING:');
        console.warn('   Web Bluetooth getDevices() TIDAK WORK di Mobile Emulation!');
        console.warn('');
        console.warn('   💡 SOLUSI CEPAT:');
        console.warn('   1. Disable Mobile Emulation:');
        console.warn('      - Tekan Ctrl + Shift + M');
        console.warn('      - Atau klik icon 📱 di DevTools toolbar');
        console.warn('   2. Refresh halaman (Ctrl + Shift + R)');
        console.warn('   3. Auto-reconnect will work!');
        console.warn('');
        console.warn('   ATAU gunakan Manual Reconnect:');
        console.warn('   - Klik tombol 🔄 di widget pojok kanan atas');
      } else {
        console.warn('   Your browser version may be outdated');
        console.warn('   Required: Chrome 109+ or Edge 109+');
        console.warn('   Your browser:', navigator.userAgent);
        console.warn('');
        console.warn('   💡 SOLUTION:');
        console.warn('   1. Update your browser to latest version');
        console.warn('   2. OR use manual reconnect button (🔄)');
        console.warn('   3. OR go back to Perangkat page and scan again');
      }

      console.warn('═══════════════════════════════════════════════════════');
      console.warn('');

      // IMPORTANT: Don't return false - try fallback method or setup auto-request
      console.log('🔄 Trying window fallback method...');

      // FALLBACK: Check window reference
      if (window._careringBLEDevice) {
        // Compare IDs (both might be encoded, so compare as strings)
        const windowId = String(window._careringBLEDevice.id);
        const savedId = String(savedDevice.id);
        
        if (windowId === savedId) {
          console.log('✅ Found device in window fallback!');
          bleDevice = window._careringBLEDevice;
          // Continue with connection below
        } else {
          console.log('⚠️ Window device ID mismatch');
          console.log('   Window ID:', windowId);
          console.log('   Saved ID:', savedId);
          console.log('   Setting up auto-request on interaction...');
          setupAutoRequestOnInteraction(savedDevice);
          return false;
        }
      } else {
        console.log('⚠️ Window fallback not available');
        console.log('   Setting up auto-request on interaction...');
        setupAutoRequestOnInteraction(savedDevice);
        return false;
      }
    } else {
      console.log('✅ Browser supports getDevices()');

      // Get previously authorized devices
      console.log('🔍 Getting authorized devices...');
      const devices = await navigator.bluetooth.getDevices();
      console.log(`   Found ${devices.length} authorized device(s)`);

      if (devices.length > 0) {
        devices.forEach((d, i) => {
          console.log(`   ${i + 1}. ${d.name || 'Unknown'} (${d.id})`);
        });
      }

      // Compare IDs (handle both encoded and MAC address formats)
      const targetDevice = devices.find(d => {
        const deviceId = String(d.id);
        const savedId = String(savedDevice.id);
        return deviceId === savedId;
      });

      if (!targetDevice) {
        console.log('');
        console.log('❌ Device not found in authorized list (via getDevices)');
        console.log('   This is normal when navigating to a new page.');
        console.log('   Trying fallback methods...');

        // FALLBACK 1: Check if device is stored in window
        if (window._careringBLEDevice) {
          const windowId = String(window._careringBLEDevice.id);
          const savedId = String(savedDevice.id);
          
          if (windowId === savedId) {
            console.log('✅ Found device in window fallback!');
            bleDevice = window._careringBLEDevice;
            // Continue with connection below
          } else {
            console.log('⚠️ Window device ID mismatch');
            console.log('   Window ID:', windowId);
            console.log('   Saved ID:', savedId);
            console.log('   Setting up auto-request on interaction...');
            setupAutoRequestOnInteraction(savedDevice);
            return false;
          }
        } else {
          // FALLBACK 2: Device not found in getDevices()
          // This happens when navigating to a new page
          // We'll set up auto-request on first user interaction
          console.log('');
          console.log('⚠️ Device not found in getDevices()');
          console.log('   This is normal when navigating to a new page.');
          console.log('   Setting up auto-request on first user interaction...');
          console.log('');
          
          // Set up auto-request on first user interaction
          setupAutoRequestOnInteraction(savedDevice);
          
          return false;
        }
      } else {
        console.log('✅ Target device found:', targetDevice.name);
        bleDevice = targetDevice;

        // Update window reference
        window._careringBLEDevice = bleDevice;
      }
    }

    // Add disconnect listener
    if (bleDevice) {
      bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
    } else {
      console.error('❌ No device available for connection!');
      return false;
    }

    console.log('🔌 Reconnecting to GATT Server...');
    bleServer = await bleDevice.gatt.connect();
    console.log('✅ GATT Server reconnected');

    // Add delay for connection stability
    console.log('⏳ Waiting for connection to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify still connected
    if (!bleServer.connected) {
      throw new Error('Device disconnected during reconnection');
    }

    console.log('🔍 Getting BLE Service...');
    const service = await bleServer.getPrimaryService(BLE_CONFIG.SERVICE_UUID);
    bleCharacteristic = await service.getCharacteristic(BLE_CONFIG.CHARACTERISTIC_UUID_TX);

    await bleCharacteristic.startNotifications();
    bleCharacteristic.addEventListener('characteristicvaluechanged', handleBLEData);

    startUploadLoop();

    isConnected = true;
    reconnectAttempts = 0;
    updateConnectionStatus(true);

      console.log('✅ Auto-reconnect successful!');

      // Remove auto-request listeners if they exist
      removeAutoRequestListeners();

      window.dispatchEvent(new CustomEvent('bleConnected', {
        detail: {
          deviceName: bleDevice.name,
          deviceId: bleDevice.id,
          autoReconnect: true
        }
      }));

      return true;

  } catch (error) {
    console.warn('⚠️ Auto-reconnect failed:', error.message);
    console.log('   Error details:', error);

    reconnectAttempts++;

    // If error is user cancellation, don't retry
    if (error.name === 'NotFoundError' && error.message.includes('User cancelled')) {
      console.log('ℹ️ User cancelled device selection');
      updateConnectionStatus(false);
      return false;
    }

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      console.log(`🔄 Retry ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return autoReconnect();
    }

    console.error('❌ Max reconnect attempts reached');
    console.log('');
    console.log('💡 MANUAL RECONNECT OPTIONS:');
    console.log('   1. Click the reconnect button (🔄) in the indicator widget');
    console.log('   2. Go to Perangkat page and click "Tambah Perangkat"');
    console.log('   3. The connection will be restored automatically');
    console.log('');
    updateConnectionStatus(false);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
//                      BLE DISCONNECT
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle BLE disconnect event
 */
function onDisconnected(event) {
  console.log('⚠️ BLE DEVICE DISCONNECTED:', event.target.name);

  isConnected = false;
  stopUploadLoop();
  updateConnectionStatus(false);

  window.dispatchEvent(new CustomEvent('bleDisconnected'));

  // Attempt auto-reconnect after 3 seconds
  if (BLE_CONFIG.AUTO_RECONNECT && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    console.log('🔄 Auto-reconnect in 3 seconds...');
    setTimeout(() => autoReconnect(), 3000);
  }
}

/**
 * Manually disconnect from BLE device
 */
function disconnectBLE() {
  try {
    console.log('🔌 Disconnecting from BLE device...');

    if (bleCharacteristic) {
      try {
        bleCharacteristic.removeEventListener('characteristicvaluechanged', handleBLEData);
        bleCharacteristic.stopNotifications();
      } catch (error) {
        console.warn('⚠️ Failed to stop notifications:', error.message);
      }
    }

    if (bleServer && bleServer.connected) {
      bleServer.disconnect();
    }

    if (bleDevice) {
      bleDevice.removeEventListener('gattserverdisconnected', onDisconnected);
    }

    stopUploadLoop();

    bleDevice = null;
    bleServer = null;
    bleCharacteristic = null;
    isConnected = false;
    uploadQueue = null;
    reconnectAttempts = 0;

    clearDeviceFromStorage();

    console.log('✅ SUCCESSFULLY DISCONNECTED');

    window.dispatchEvent(new CustomEvent('bleDisconnected'));

  } catch (error) {
    console.error('❌ Error during disconnect:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
//                      STATUS GETTERS
// ═══════════════════════════════════════════════════════════════════

function isDeviceConnected() {
  return isConnected && bleDevice && bleServer && bleServer.connected;
}

function getDeviceInfo() {
  if (!isDeviceConnected()) {
    const saved = loadDeviceFromStorage();
    return saved ? { ...saved, connected: false } : null;
  }

  return {
    name: bleDevice.name,
    id: bleDevice.id,
    connected: bleServer.connected
  };
}

// ═══════════════════════════════════════════════════════════════════
//                      AUTO-REQUEST ON USER INTERACTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Setup auto-request device permission on first user interaction
 * This allows automatic requestDevice() when user clicks/scrolls for the first time
 */
function setupAutoRequestOnInteraction(savedDevice) {
  if (!savedDevice || !savedDevice.connected) {
    return;
  }

  // Flag to track if we've already requested
  let hasRequested = false;

  // Function to request device (will be called on user interaction)
  async function requestDeviceOnInteraction() {
    if (hasRequested) {
      return; // Already requested, don't request again
    }

    // Check if already connected
    if (isDeviceConnected()) {
      console.log('✅ Device already connected, skipping auto-request');
      return;
    }

    hasRequested = true;
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🔄 AUTO-REQUEST DEVICE PERMISSION');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   User interaction detected!');
    console.log('   Requesting device permission...');
    console.log('   Device:', savedDevice.name);
    console.log('   ID:', savedDevice.id);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    try {
      // Request device with filters
      const reconnectOptions = {
        filters: [{ namePrefix: BLE_CONFIG.DEVICE_NAME_PREFIX }],
        optionalServices: [BLE_CONFIG.SERVICE_UUID]
      };

      console.log('📱 Showing device selection popup...');
      bleDevice = await navigator.bluetooth.requestDevice(reconnectOptions);

      // Verify it's the same device (optional, but good to check)
      if (bleDevice.id !== savedDevice.id) {
        console.warn('⚠️ Different device selected. Expected:', savedDevice.id, 'Got:', bleDevice.id);
        console.log('   Continuing with selected device...');
      }

      console.log('✅ Device selected:', bleDevice.name);
      
      // Update window reference
      window._careringBLEDevice = bleDevice;
      
      // Save to localStorage
      saveDeviceToStorage({
        id: bleDevice.id,
        name: bleDevice.name
      });

      // Continue with connection
      bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
      
      console.log('🔌 Connecting to GATT Server...');
      bleServer = await bleDevice.gatt.connect();
      console.log('✅ GATT Server connected');

      // Add delay for connection stability
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify still connected
      if (!bleServer.connected) {
        throw new Error('Device disconnected during connection');
      }

      console.log('🔍 Getting BLE Service...');
      const service = await bleServer.getPrimaryService(BLE_CONFIG.SERVICE_UUID);
      bleCharacteristic = await service.getCharacteristic(BLE_CONFIG.CHARACTERISTIC_UUID_TX);

      await bleCharacteristic.startNotifications();
      bleCharacteristic.addEventListener('characteristicvaluechanged', handleBLEData);

      startUploadLoop();

      isConnected = true;
      reconnectAttempts = 0;
      updateConnectionStatus(true);

      console.log('✅ Auto-request and connection successful!');
      console.log('   Device is now connected and data is being received.');

      window.dispatchEvent(new CustomEvent('bleConnected', {
        detail: {
          deviceName: bleDevice.name,
          deviceId: bleDevice.id,
          autoRequest: true
        }
      }));

      // Remove event listeners since we're connected
      removeAutoRequestListeners();

    } catch (error) {
      hasRequested = false; // Reset flag so user can try again
      console.error('❌ Auto-request failed:', error.message);
      
      if (error.name === 'NotFoundError') {
        console.log('💡 Device not found. Make sure device is in discoverable mode.');
      } else if (error.name === 'SecurityError') {
        console.log('💡 Permission denied. Please allow Bluetooth access.');
      } else {
        console.log('💡 Error:', error.message);
      }

      // Dispatch event so indicator can show reconnect button
      window.dispatchEvent(new CustomEvent('bleNeedsReconnect', {
        detail: { device: savedDevice, error: error.message }
      }));
    }
  }

  // Store function reference so we can remove listeners later
  window._careringAutoRequestFn = requestDeviceOnInteraction;

  // Listen for various user interactions
  const interactionEvents = ['click', 'touchstart', 'scroll', 'keydown'];
  
  interactionEvents.forEach(eventType => {
    document.addEventListener(eventType, requestDeviceOnInteraction, { 
      once: true, // Only trigger once
      passive: true // Better performance
    });
  });

  console.log('✅ Auto-request listeners set up');
  console.log('   Will request device permission on first user interaction');
  console.log('   (click, scroll, touch, or keypress)');

  // Also dispatch event for indicator
  window.dispatchEvent(new CustomEvent('bleNeedsReconnect', {
    detail: { 
      device: savedDevice,
      autoRequest: true,
      message: 'Klik atau scroll di halaman ini untuk reconnect otomatis'
    }
  }));
}

/**
 * Remove auto-request listeners (called after successful connection)
 */
function removeAutoRequestListeners() {
  if (window._careringAutoRequestFn) {
    // Remove all event listeners
    const interactionEvents = ['click', 'touchstart', 'scroll', 'keydown'];
    interactionEvents.forEach(eventType => {
      document.removeEventListener(eventType, window._careringAutoRequestFn);
    });
    window._careringAutoRequestFn = null;
    console.log('✅ Auto-request listeners removed');
  }
}

// ═══════════════════════════════════════════════════════════════════
//                      AUTO-INIT ON PAGE LOAD
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize auto-reconnect
 * Works even if DOM is already loaded
 */
function initAutoReconnect() {
  if (!BLE_CONFIG.AUTO_RECONNECT) {
    console.log('ℹ️ Auto-reconnect disabled');
    return;
  }

  const savedDevice = loadDeviceFromStorage();
  console.log('📋 Checking for saved device...', savedDevice);

  if (savedDevice && savedDevice.connected) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🔄 AUTO-RECONNECT STARTING');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Device:', savedDevice.name);
    console.log('   ID:', savedDevice.id);
    console.log('   Last connected:', new Date(savedDevice.timestamp).toLocaleString());
    console.log('   Current page:', window.location.pathname);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Check if already connected
    if (isDeviceConnected()) {
      console.log('✅ Device already connected!');
      return;
    }

    // Delay to let page fully load
    setTimeout(() => {
      console.log('⏰ Starting auto-reconnect attempt...');
      autoReconnect().catch(err => {
        console.error('❌ Auto-reconnect failed:', err.message);
        console.log('');
        console.log('💡 TIP: If auto-reconnect fails, you can:');
        console.log('   1. Use manual reconnect button (🔄) in the indicator');
        console.log('   2. Go to Perangkat page and reconnect');
        console.log('   3. Wait a few seconds and auto-reconnect will retry');
        console.log('');
        
        // Retry after 3 seconds (more aggressive)
        setTimeout(() => {
          console.log('🔄 Retrying auto-reconnect (attempt 2)...');
          autoReconnect().catch(err => {
            console.error('❌ Retry attempt 2 failed:', err.message);
            
            // Final retry after 5 seconds
            setTimeout(() => {
              console.log('🔄 Final retry (attempt 3)...');
              autoReconnect().catch(err => {
                console.error('❌ All auto-reconnect attempts failed');
                console.log('');
                console.log('💡 Please use manual reconnect button (🔄) in the indicator');
              });
            }, 5000);
          });
        }, 3000);
      });
    }, 1000); // Reduced delay to 1 second for faster reconnect
  } else {
    console.log('ℹ️ No previous connection found or device was disconnected');
    console.log('   Saved device:', savedDevice ? 'YES' : 'NO');
    console.log('   Was connected:', savedDevice ? savedDevice.connected : 'N/A');
  }
}

// Try to auto-reconnect when page loads
// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAutoReconnect);
} else {
  // DOM already loaded, run immediately
  initAutoReconnect();
}

// ═══════════════════════════════════════════════════════════════════
//                      EXPORTS
// ═══════════════════════════════════════════════════════════════════

window.BLEHandler = {
  connect: connectToCareRing,
  disconnect: disconnectBLE,
  reconnect: autoReconnect,
  isConnected: isDeviceConnected,
  getDeviceInfo: getDeviceInfo,
  uploadToFirebase: uploadToFirebase
};

console.log('✅ BLE Handler module loaded (PERSISTENT MODE)');
console.log('   Auto-reconnect:', BLE_CONFIG.AUTO_RECONNECT ? '✅ Enabled' : '❌ Disabled');
