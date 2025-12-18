# 📘 Konfigurasi BLE untuk ESP32 C3 - CareRing Web App

## 🔧 Spesifikasi BLE Web App

### 1️⃣ **Service UUID**
```
UUID: 6e400001-b5a3-f393-e0a9-e50e24dcca9e
Type: Primary Service
Standard: Nordic UART Service (NUS) Compatible
```

**Kode ESP32 Arduino:**
```cpp
#define SERVICE_UUID "6e400001-b5a3-f393-e0a9-e50e24dcca9e"

// Create service
BLEService *pService = pServer->createService(SERVICE_UUID);
```

---

### 2️⃣ **Characteristic UUID (TX - Transmit)**
```
UUID: 6e400003-b5a3-f393-e0a9-e50e24dcca9e
Type: Characteristic (TX from ESP32 perspective)
Properties: NOTIFY
Function: Kirim data dari ESP32 ke Web App
```

**Kode ESP32 Arduino:**
```cpp
#define CHARACTERISTIC_UUID_TX "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

// Create characteristic with NOTIFY property
BLECharacteristic *pTxCharacteristic = pService->createCharacteristic(
  CHARACTERISTIC_UUID_TX,
  BLECharacteristic::PROPERTY_NOTIFY
);

// Add descriptor for notifications
BLE2902 *p2902Descriptor = new BLE2902();
p2902Descriptor->setNotifications(true);
pTxCharacteristic->addDescriptor(p2902Descriptor);
```

---

### 3️⃣ **Device Name (Advertising Name)**
```
Prefix: "CareRing"
Examples:
  - CareRing
  - CareRing_01
  - CareRing_Device
```

**Kode ESP32 Arduino:**
```cpp
#define DEVICE_NAME "CareRing"

// Set device name for advertising
BLEDevice::init(DEVICE_NAME);
```

---

### 4️⃣ **Format Data: JSON String**

Web app **HANYA menerima format JSON String** dengan struktur berikut:

#### **Struktur JSON yang WAJIB:**
```json
{
  "deviceID": "AA:BB:CC:DD:EE:FF",
  "deviceName": "CareRing",
  "heartRate": 75,
  "spo2": 98,
  "temperature": 36.5,
  "ambient": 25.3
}
```

#### **Field Explanation:**
| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `deviceID` | String | - | MAC address ESP32 (format: XX:XX:XX:XX:XX:XX) |
| `deviceName` | String | - | Nama device (misal: "CareRing") |
| `heartRate` | Number | 0-300 | Detak jantung (BPM) |
| `spo2` | Number | 0-100 | Saturasi oksigen (%) |
| `temperature` | Number | 0-50 | Suhu tubuh (°C) |
| `ambient` | Number | - | Suhu ruangan (°C) |

#### **Validasi Data di Web App:**
- `heartRate`: Harus 0-300, tipe number
- `spo2`: Harus 0-100, tipe number
- `temperature`: Harus 0-50, tipe number
- Semua field wajib ada (tidak boleh kosong)

---

### 5️⃣ **Metode Pengiriman: NOTIFY (Real-time Push)**

✅ **Web app menggunakan NOTIFY** (bukan READ)
- ESP32 **mengirim data otomatis** tanpa diminta
- Interval pengiriman: **500ms** (2x per detik) - Ideal
- Web app throttle upload ke Firebase: **1 detik** (1x per detik)

**Kode ESP32 Arduino:**
```cpp
// Send data via BLE Notify
void sendBLEData() {
  // Create JSON
  StaticJsonDocument<256> doc;
  doc["deviceID"] = getDeviceID();  // Get MAC address
  doc["deviceName"] = "CareRing";
  doc["heartRate"] = heartRate;     // BPM sensor value
  doc["spo2"] = spo2;               // SpO2 sensor value
  doc["temperature"] = temperature; // Body temp sensor value
  doc["ambient"] = ambient;         // Ambient temp sensor value

  // Serialize to string
  String jsonString;
  serializeJson(doc, jsonString);

  // Send via BLE Notify
  pTxCharacteristic->setValue(jsonString.c_str());
  pTxCharacteristic->notify();

  Serial.println("📤 Data sent: " + jsonString);
}

// Call every 500ms
void loop() {
  static unsigned long lastSend = 0;

  if (millis() - lastSend >= 500) {
    sendBLEData();
    lastSend = millis();
  }
}
```

---

## 🎯 Contoh Kode Lengkap ESP32 C3

### **Library yang Dibutuhkan:**
```cpp
#include <BLEDevice.h>
#include <BLEServer.h>\
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>  // Install via Library Manager
```

### **Main Code Structure:**
```cpp
// ═══════════════════════════════════════════════════════════
//                    BLE CONFIGURATION
// ═══════════════════════════════════════════════════════════

#define SERVICE_UUID           "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_TX "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
#define DEVICE_NAME            "CareRing"

// Global Variables
BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic = NULL;
bool deviceConnected = false;

// Sensor data (example values)
int heartRate = 0;
int spo2 = 0;
float temperature = 0.0;
float ambient = 0.0;

// ═══════════════════════════════════════════════════════════
//                    BLE SERVER CALLBACKS
// ═══════════════════════════════════════════════════════════

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("✅ Device connected!");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("❌ Device disconnected!");

    // Restart advertising
    BLEDevice::startAdvertising();
    Serial.println("🔄 Advertising restarted");
  }
};

// ═══════════════════════════════════════════════════════════
//                    HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

String getDeviceID() {
  // Get ESP32 MAC address
  uint8_t baseMac[6];
  esp_read_mac(baseMac, ESP_MAC_WIFI_STA);

  char macStr[18];
  sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X",
          baseMac[0], baseMac[1], baseMac[2],
          baseMac[3], baseMac[4], baseMac[5]);

  return String(macStr);
}

void sendBLEData() {
  if (!deviceConnected) return;

  // Create JSON
  StaticJsonDocument<256> doc;
  doc["deviceID"] = getDeviceID();
  doc["deviceName"] = DEVICE_NAME;
  doc["heartRate"] = heartRate;
  doc["spo2"] = spo2;
  doc["temperature"] = temperature;
  doc["ambient"] = ambient;

  // Serialize to string
  String jsonString;
  serializeJson(doc, jsonString);

  // Send via BLE Notify
  pTxCharacteristic->setValue(jsonString.c_str());
  pTxCharacteristic->notify();

  Serial.println("📤 Sent: " + jsonString);
}

// ═══════════════════════════════════════════════════════════
//                    SETUP FUNCTION
// ═══════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  Serial.println("🚀 CareRing BLE Server Starting...");

  // Initialize BLE
  BLEDevice::init(DEVICE_NAME);

  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create TX Characteristic (ESP32 → Web App)
  pTxCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_TX,
    BLECharacteristic::PROPERTY_NOTIFY
  );

  // Add descriptor for notifications
  pTxCharacteristic->addDescriptor(new BLE2902());

  // Start service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // iPhone connection fix
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("✅ BLE Server ready!");
  Serial.println("📱 Device Name: " + String(DEVICE_NAME));
  Serial.println("🆔 Device ID: " + getDeviceID());
  Serial.println("🔍 Waiting for connection...");
}

// ═══════════════════════════════════════════════════════════
//                    LOOP FUNCTION
// ═══════════════════════════════════════════════════════════

void loop() {
  static unsigned long lastSend = 0;

  if (deviceConnected) {
    // Read sensor data here
    // TODO: Replace with actual sensor readings
    heartRate = random(60, 100);      // Simulate heart rate
    spo2 = random(95, 100);           // Simulate SpO2
    temperature = random(355, 380) / 10.0;  // Simulate body temp (35.5-38.0°C)
    ambient = random(220, 280) / 10.0;      // Simulate ambient temp (22-28°C)

    // Send data every 500ms
    if (millis() - lastSend >= 500) {
      sendBLEData();
      lastSend = millis();
    }
  }

  delay(10);
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│   ESP32 C3      │
│   (Sensor)      │
└────────┬────────┘
         │
         │ 1. Read sensor data (heartRate, spo2, temp)
         │
         ▼
┌─────────────────┐
│ Create JSON     │
│ {               │
│   heartRate: 75,│
│   spo2: 98,     │
│   temp: 36.5    │
│ }               │
└────────┬────────┘
         │
         │ 2. Send via BLE Notify (every 500ms)
         │
         ▼
┌─────────────────┐
│ Web Bluetooth   │
│ API (Browser)   │
└────────┬────────┘
         │
         │ 3. Receive & Parse JSON
         │
         ▼
┌─────────────────┐
│ Validate Data   │
│ (ble-handler.js)│
└────────┬────────┘
         │
         │ 4. Upload to Firebase (throttled to 1s)
         │
         ▼
┌─────────────────┐
│ Firebase        │
│ Realtime DB     │
└─────────────────┘
```

---

## ✅ Checklist Konfigurasi

Pastikan ESP32 C3 Anda sudah:

- [ ] Service UUID: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- [ ] Characteristic UUID TX: `6e400003-b5a3-f393-e0a9-e50e24dcca9e`
- [ ] Device Name prefix: `CareRing`
- [ ] Data format: **JSON String** (bukan binary!)
- [ ] Kirim data via **NOTIFY** (bukan READ)
- [ ] Interval kirim: **500ms** (optimal)
- [ ] Semua field JSON wajib ada: deviceID, deviceName, heartRate, spo2, temperature, ambient
- [ ] Nilai sensor dalam range yang valid

---

## 🐛 Troubleshooting

### ❌ "Device not found"
- Pastikan device name **diawali dengan "CareRing"**
- Cek ESP32 sudah advertising
- Pastikan Bluetooth Windows tidak ter-pair dengan device

### ❌ "GATT Server disconnected"
- Disconnect device dari Windows Bluetooth Settings
- Pastikan service UUID benar
- Cek stabilitas koneksi (jarak, power)

### ❌ "Invalid data structure"
- Pastikan format JSON **persis seperti contoh**
- Cek semua field wajib ada
- Validasi tipe data (number vs string)
- Gunakan `ArduinoJson` library untuk generate JSON

### ❌ Data tidak masuk Firebase
- Cek console log: "✅ Data uploaded to Firebase"
- Pastikan validasi data lolos (range nilai benar)
- Cek throttle (data upload max 1x per detik)

---

## 📚 Resources

- **Web Bluetooth API Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- **ESP32 BLE Arduino**: https://github.com/nkolban/ESP32_BLE_Arduino
- **ArduinoJson Library**: https://arduinojson.org/
- **Nordic UART Service**: https://learn.adafruit.com/introduction-to-bluetooth-low-energy/gatt

---

## 📝 Notes

1. **RX Characteristic tidak digunakan** di web app saat ini (one-way communication)
2. **Web app hanya read-only**, tidak mengirim command ke ESP32
3. **Auto-reconnect enabled**, koneksi persist saat navigasi antar halaman
4. **LocalStorage digunakan** untuk menyimpan device info

---

**Created by**: Claude Code
**Date**: 2025-12-18
**Version**: 1.0
