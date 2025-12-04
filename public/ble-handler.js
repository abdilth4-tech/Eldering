/* ══════════════════════════════════════════════════════════════════
   BLE HANDLER for CARERING - ESP32 to Firebase Bridge
   ══════════════════════════════════════════════════════════════════

   Purpose: Connect to ESP32 CareRing device via BLE, receive sensor
            data, and upload to Firebase Realtime Database

   Author: Claude Code
   Date: 2025-12-04
   ══════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════
//                      BLE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const BLE_CONFIG = {
  SERVICE_UUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  CHARACTERISTIC_UUID_TX: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  DEVICE_NAME_PREFIX: 'CareRing',
  DATA_INTERVAL: 500, // ms - ESP32 sends data every 500ms
  UPLOAD_THROTTLE: 1000 // ms - Upload to Firebase max every 1 second
};

// ═══════════════════════════════════════════════════════════════════
//                      GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════

let bleDevice = null;
let bleServer = null;
let bleCharacteristic = null;
let isConnected = false;
let lastUploadTime = 0;
let uploadQueue = null; // Store latest data to upload

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
 * Data is uploaded max every 1 second to avoid overload
 *
 * @param {Object} data - Sensor data object
 * @returns {Promise<boolean>} True if uploaded successfully
 */
async function uploadToFirebase(data) {
  try {
    // Store in queue for throttled upload
    uploadQueue = data;

    const now = Date.now();
    const timeSinceLastUpload = now - lastUploadTime;

    // Throttle: Only upload if enough time has passed
    if (timeSinceLastUpload < BLE_CONFIG.UPLOAD_THROTTLE) {
      console.log(`⏳ Throttled - waiting ${BLE_CONFIG.UPLOAD_THROTTLE - timeSinceLastUpload}ms`);
      return false;
    }

    // Prepare data for Firebase
    const firebaseData = {
      ...data,
      timestamp: now,
      lastUpdate: new Date().toISOString(),
      uploadedVia: 'BLE-Bridge'
    };

    // Get device ID (remove colons for Firebase key safety)
    const deviceID = data.deviceID.replace(/:/g, '-');

    // Upload to Firebase using existing database instance
    const dataPath = `/realtimeSensorData/${deviceID}`;
    await firebase.database().ref(dataPath).set(firebaseData);

    lastUploadTime = now;
    console.log('✅ Data uploaded to Firebase:', dataPath);
    console.log('   Data:', {
      heartRate: data.heartRate,
      spo2: data.spo2,
      temperature: data.temperature,
      ambient: data.ambient
    });

    return true;
  } catch (error) {
    console.error('❌ Firebase upload failed:', error);
    console.error('   Error details:', error.message);
    return false;
  }
}

/**
 * Start throttled upload loop
 * Uploads queued data every UPLOAD_THROTTLE ms
 */
function startUploadLoop() {
  setInterval(async () => {
    if (uploadQueue && isConnected) {
      await uploadToFirebase(uploadQueue);
      uploadQueue = null; // Clear queue after upload
    }
  }, BLE_CONFIG.UPLOAD_THROTTLE);
}

// ═══════════════════════════════════════════════════════════════════
//                      BLE DATA HANDLER
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle incoming BLE data from ESP32
 * Called when notification is received
 *
 * @param {Event} event - BLE characteristic value changed event
 */
function handleBLEData(event) {
  try {
    // Step 1: Get ArrayBuffer from event
    const value = event.target.value;

    // Step 2: Decode to string
    const dataString = decodeArrayBuffer(value);
    console.log('📨 Received BLE data:', dataString);

    // Step 3: Parse JSON
    let data;
    try {
      data = JSON.parse(dataString);
    } catch (parseError) {
      console.error('❌ JSON parse failed:', parseError);
      console.error('   Raw data:', dataString);
      return;
    }

    // Step 4: Validate data structure
    if (!validateSensorData(data)) {
      console.error('❌ Invalid data structure');
      return;
    }

    // Step 5: Log received data
    console.log('✅ Valid sensor data received:');
    console.log(`   Device: ${data.deviceName} (${data.deviceID})`);
    console.log(`   Heart Rate: ${data.heartRate} BPM`);
    console.log(`   SpO2: ${data.spo2}%`);
    console.log(`   Temperature: ${data.temperature}°C`);
    console.log(`   Ambient: ${data.ambient}°C`);
    console.log(`   Screen: ${data.screen}`);

    // Step 6: Queue for Firebase upload (throttled)
    uploadQueue = data;

    // Step 7: Trigger custom event for UI update
    const customEvent = new CustomEvent('bleDataReceived', { detail: data });
    window.dispatchEvent(customEvent);

  } catch (error) {
    console.error('❌ Error handling BLE data:', error);
    console.error('   Error details:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════
//                      BLE CONNECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Connect to CareRing ESP32 device via BLE
 *
 * @returns {Promise<boolean>} True if connected successfully
 * @throws {Error} If connection fails
 */
async function connectToCareRing() {
  try {
    // Step 0: Check if BLE is available
    if (!isBLEAvailable()) {
      throw new Error('Web Bluetooth API not available');
    }

    console.log('🔍 Scanning for CareRing devices...');

    // Step 1: Request BLE device with name filter
    const options = {
      filters: [
        { namePrefix: BLE_CONFIG.DEVICE_NAME_PREFIX }
      ],
      optionalServices: [BLE_CONFIG.SERVICE_UUID]
    };

    bleDevice = await navigator.bluetooth.requestDevice(options);
    console.log('✅ Device found:', bleDevice.name);
    console.log('   Device ID:', bleDevice.id);

    // Step 2: Add disconnect listener
    bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

    // Step 3: Connect to GATT Server
    console.log('🔌 Connecting to GATT Server...');
    bleServer = await bleDevice.gatt.connect();
    console.log('✅ GATT Server connected');

    // Step 4: Get BLE Service
    console.log('🔍 Getting BLE Service...');
    const service = await bleServer.getPrimaryService(BLE_CONFIG.SERVICE_UUID);
    console.log('✅ Service found:', BLE_CONFIG.SERVICE_UUID);

    // Step 5: Get TX Characteristic (ESP32 sends data via this)
    console.log('🔍 Getting TX Characteristic...');
    bleCharacteristic = await service.getCharacteristic(BLE_CONFIG.CHARACTERISTIC_UUID_TX);
    console.log('✅ Characteristic found:', BLE_CONFIG.CHARACTERISTIC_UUID_TX);

    // Step 6: Start notifications
    console.log('🔔 Starting notifications...');
    await bleCharacteristic.startNotifications();
    console.log('✅ Notifications started');

    // Step 7: Add event listener for notifications
    bleCharacteristic.addEventListener('characteristicvaluechanged', handleBLEData);
    console.log('✅ Event listener added');

    // Step 8: Start throttled upload loop
    startUploadLoop();

    // Update state
    isConnected = true;

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🎉 SUCCESSFULLY CONNECTED TO CARERING!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Device:', bleDevice.name);
    console.log('   Status: Receiving data every 500ms');
    console.log('   Upload: Throttled to max 1x per second');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Trigger custom event for UI update
    const customEvent = new CustomEvent('bleConnected', {
      detail: {
        deviceName: bleDevice.name,
        deviceId: bleDevice.id
      }
    });
    window.dispatchEvent(customEvent);

    return true;

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('   ❌ BLE CONNECTION FAILED');
    console.error('═══════════════════════════════════════════════════════');

    // Handle specific error types
    if (error.name === 'NotFoundError') {
      console.error('   Error: Device not found');
      console.error('   Solution:');
      console.error('   1. Make sure ESP32 is powered on');
      console.error('   2. Make sure ESP32 is advertising (LED blinking)');
      console.error('   3. Try again');
    } else if (error.name === 'SecurityError') {
      console.error('   Error: Security error');
      console.error('   Solution:');
      console.error('   1. Make sure you are on HTTPS or localhost');
      console.error('   2. Check browser permissions');
    } else if (error.name === 'NetworkError') {
      console.error('   Error: Network error during connection');
      console.error('   Solution:');
      console.error('   1. Device might be too far away');
      console.error('   2. Check if device is already connected to another app');
      console.error('   3. Restart Bluetooth on your computer');
    } else {
      console.error('   Error:', error.name);
      console.error('   Message:', error.message);
    }

    console.error('═══════════════════════════════════════════════════════');
    console.error('');

    // Trigger custom event for UI update
    const customEvent = new CustomEvent('bleConnectionFailed', {
      detail: {
        error: error.name,
        message: error.message
      }
    });
    window.dispatchEvent(customEvent);

    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
//                      BLE DISCONNECT
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle BLE disconnect event
 * Called automatically when device disconnects
 */
function onDisconnected(event) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   ⚠️ BLE DEVICE DISCONNECTED');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   Device:', event.target.name);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  isConnected = false;

  // Trigger custom event for UI update
  const customEvent = new CustomEvent('bleDisconnected');
  window.dispatchEvent(customEvent);
}

/**
 * Manually disconnect from BLE device
 * Clean up listeners and connections
 */
function disconnectBLE() {
  try {
    console.log('🔌 Disconnecting from BLE device...');

    // Step 1: Stop notifications
    if (bleCharacteristic) {
      try {
        bleCharacteristic.removeEventListener('characteristicvaluechanged', handleBLEData);
        bleCharacteristic.stopNotifications();
        console.log('✅ Notifications stopped');
      } catch (error) {
        console.warn('⚠️ Failed to stop notifications:', error.message);
      }
    }

    // Step 2: Disconnect GATT server
    if (bleServer && bleServer.connected) {
      bleServer.disconnect();
      console.log('✅ GATT Server disconnected');
    }

    // Step 3: Remove device event listener
    if (bleDevice) {
      bleDevice.removeEventListener('gattserverdisconnected', onDisconnected);
      console.log('✅ Event listeners removed');
    }

    // Step 4: Clear references
    bleDevice = null;
    bleServer = null;
    bleCharacteristic = null;
    isConnected = false;
    uploadQueue = null;

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   ✅ SUCCESSFULLY DISCONNECTED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Trigger custom event for UI update
    const customEvent = new CustomEvent('bleDisconnected');
    window.dispatchEvent(customEvent);

  } catch (error) {
    console.error('❌ Error during disconnect:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
//                      STATUS GETTERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if currently connected to BLE device
 * @returns {boolean} True if connected
 */
function isDeviceConnected() {
  return isConnected && bleDevice && bleServer && bleServer.connected;
}

/**
 * Get connected device info
 * @returns {Object|null} Device info or null if not connected
 */
function getDeviceInfo() {
  if (!isDeviceConnected()) {
    return null;
  }

  return {
    name: bleDevice.name,
    id: bleDevice.id,
    connected: bleServer.connected
  };
}

// ═══════════════════════════════════════════════════════════════════
//                      EXPORTS (For use in other scripts)
// ═══════════════════════════════════════════════════════════════════

// Make functions available globally
window.BLEHandler = {
  // Core functions
  connect: connectToCareRing,
  disconnect: disconnectBLE,

  // Status functions
  isConnected: isDeviceConnected,
  getDeviceInfo: getDeviceInfo,

  // For manual upload (if needed)
  uploadToFirebase: uploadToFirebase
};

console.log('✅ BLE Handler module loaded');
console.log('   Available: window.BLEHandler.connect()');
console.log('   Available: window.BLEHandler.disconnect()');
console.log('   Available: window.BLEHandler.isConnected()');
console.log('   Available: window.BLEHandler.getDeviceInfo()');
