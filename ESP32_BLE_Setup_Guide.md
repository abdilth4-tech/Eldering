# Panduan Setup BLE Services untuk ESP32C6

## Masalah yang Terjadi

Web App berhasil menemukan dan connect ke ESP32C6 "CareRing", tetapi gagal karena:
```
❌ BLE Error: NotFoundError: No Services found in device.
```

## Penyebab

ESP32C6 Anda **tidak meng-advertise GATT Services** apapun. Web Bluetooth API membutuhkan minimal **1 GATT Service** untuk beroperasi dengan sempurna.

## Solusi

Tambahkan BLE Services di firmware ESP32C6 Anda.

---

## Contoh Kode Arduino untuk ESP32C6

### 1. Install Library

Pastikan Anda sudah install:
- **ESP32 Board Support** di Arduino IDE
- **BLE Library** (sudah include di ESP32 core)

### 2. Kode Dasar BLE dengan Services

```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// UUID untuk Services dan Characteristics
// Anda bisa generate UUID custom di https://www.uuidgenerator.net/
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Client connected!");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Client disconnected!");
    }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE work!");

  // Initialize BLE
  BLEDevice::init("CareRing");

  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  // Create a BLE Descriptor (untuk notify)
  pCharacteristic->addDescriptor(new BLE2902());

  // Set initial value
  pCharacteristic->setValue("Hello from ESP32C6!");

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();

  Serial.println("BLE device is now advertising with services!");
  Serial.println("Waiting for a client connection...");
}

void loop() {
  // Jika ada client terhubung, kirim data
  if (deviceConnected) {
    // Contoh: Kirim data sensor
    String sensorData = "Temp: 36.5°C, BPM: 75";
    pCharacteristic->setValue(sensorData.c_str());
    pCharacteristic->notify(); // Notify client tentang data baru

    Serial.println("Data sent: " + sensorData);
    delay(2000); // Kirim setiap 2 detik
  }

  // Handle reconnection
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Give the bluetooth stack time to get ready
    pServer->startAdvertising(); // Restart advertising
    Serial.println("Start advertising again...");
    oldDeviceConnected = deviceConnected;
  }

  // Handle new connection
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}
```

---

## 3. Untuk Project CareRing (Sensor Kesehatan)

Jika Anda ingin mengirim data sensor kesehatan (BPM, Suhu, SpO2) ke web app:

```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Service UUID untuk Health Monitoring
#define HEALTH_SERVICE_UUID        "0000180d-0000-1000-8000-00805f9b34fb"  // Heart Rate Service (standar)
#define BPM_CHARACTERISTIC_UUID    "00002a37-0000-1000-8000-00805f9b34fb"  // Heart Rate Measurement
#define TEMP_CHARACTERISTIC_UUID   "00002a1c-0000-1000-8000-00805f9b34fb"  // Temperature Measurement

BLEServer* pServer = NULL;
BLECharacteristic* pBpmChar = NULL;
BLECharacteristic* pTempChar = NULL;
bool deviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    };
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
    }
};

void setup() {
  Serial.begin(115200);

  BLEDevice::init("CareRing");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create Health Service
  BLEService *pHealthService = pServer->createService(HEALTH_SERVICE_UUID);

  // BPM Characteristic
  pBpmChar = pHealthService->createCharacteristic(
                BPM_CHARACTERISTIC_UUID,
                BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
              );
  pBpmChar->addDescriptor(new BLE2902());

  // Temperature Characteristic
  pTempChar = pHealthService->createCharacteristic(
                TEMP_CHARACTERISTIC_UUID,
                BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
              );
  pTempChar->addDescriptor(new BLE2902());

  // Start service
  pHealthService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(HEALTH_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("CareRing Health Monitor Ready!");
}

void loop() {
  if (deviceConnected) {
    // Baca sensor (ganti dengan sensor asli Anda)
    int bpm = 75;  // Dari MAX30102
    float temp = 36.5;  // Dari MLX90614

    // Format data (sesuai BLE Heart Rate Profile)
    uint8_t bpmData[2] = {0, (uint8_t)bpm};
    pBpmChar->setValue(bpmData, 2);
    pBpmChar->notify();

    // Format temperature (dalam Celsius * 100)
    uint16_t tempData = (uint16_t)(temp * 100);
    uint8_t tempBytes[2] = {(uint8_t)(tempData & 0xFF), (uint8_t)(tempData >> 8)};
    pTempChar->setValue(tempBytes, 2);
    pTempChar->notify();

    Serial.printf("Sent: BPM=%d, Temp=%.1f°C\n", bpm, temp);
    delay(1000);
  }
}
```

---

## 4. Langkah-Langkah Upload ke ESP32C6

1. Buka Arduino IDE
2. Pilih Board: **ESP32C6 Dev Module**
3. Pilih Port COM yang sesuai
4. Copy-paste salah satu kode di atas
5. Klik **Upload**
6. Tunggu hingga upload selesai
7. Buka Serial Monitor (115200 baud) untuk melihat log
8. Coba connect dari web app lagi

---

## 5. Verifikasi

Setelah upload, coba scan lagi dari web app. Anda akan melihat:

✅ **Console log yang benar:**
```
> Found device: CareRing
  Device ID: FaIaJTK8RwpHLX2h8nrljQ==
  Device Name: CareRing
✅ GATT connected
✅ Getting Services... Found: 1
✅ > Service: 4fafc201-1fb5-459e-8fcc-c5c9c331914b
✅ >> Characteristic: beb5483e-36e1-4688-b7f5-ea07361b26a8 [READ, WRITE, NOTIFY]
✅ Berhasil terhubung ke perangkat!
```

---

## Troubleshooting

### Q: Masih muncul "No Services found" setelah upload kode baru?
**A:**
1. Pastikan `pService->start()` sudah dipanggil
2. Restart ESP32C6 (tekan tombol reset)
3. Hapus pairing device di Windows Bluetooth Settings
4. Scan ulang dari web app

### Q: Device tidak muncul di scan list?
**A:**
1. Pastikan `BLEDevice::startAdvertising()` sudah dipanggil
2. Cek Serial Monitor untuk error message
3. Pastikan Bluetooth tidak dipakai aplikasi lain

### Q: Ingin menggunakan UUID custom?
**A:**
Generate UUID di https://www.uuidgenerator.net/ dan ganti di kode:
```cpp
#define SERVICE_UUID "YOUR-UUID-HERE"
```

---

## Referensi

- [ESP32 BLE Arduino Documentation](https://github.com/nkolban/ESP32_BLE_Arduino)
- [Web Bluetooth API Specification](https://webbluetoothcg.github.io/web-bluetooth/)
- [GATT Services List (Bluetooth SIG)](https://www.bluetooth.com/specifications/gatt/services/)

---


**Dibuat oleh:** Claude Code
**Tanggal:** 2025-12-04
**Untuk:** Project CARERING
