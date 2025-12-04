# Panduan Implementasi BLE untuk CARERING Web App

## 📋 Overview

Dokumentasi lengkap untuk implementasi BLE (Bluetooth Low Energy) pada CARERING Web App. Sistem ini memungkinkan web app menerima data sensor dari ESP32C6 secara real-time dan upload otomatis ke Firebase Realtime Database.

---

## ✅ Fitur yang Sudah Diimplementasikan

### 1. **BLE Connection Management**
- ✅ Scan dan connect ke ESP32 CareRing device
- ✅ Auto-reconnect handling
- ✅ Disconnect dengan cleanup lengkap
- ✅ Error handling komprehensif

### 2. **Real-time Data Streaming**
- ✅ Menerima data sensor setiap 500ms dari ESP32
- ✅ Parsing JSON data otomatis
- ✅ Validasi data structure
- ✅ Live UI update dengan animasi

### 3. **Firebase Integration**
- ✅ Auto-upload ke Firebase dengan throttling (max 1x/detik)
- ✅ Tambahkan timestamp dan metadata otomatis
- ✅ Error handling untuk upload failures
- ✅ Queue system untuk data buffering

### 4. **User Interface**
- ✅ Live sensor data display (Heart Rate, SpO2, Temperature, Ambient)
- ✅ Connection status indicator
- ✅ BLE data section dengan pulse animation
- ✅ Timestamp last update
- ✅ Error messages yang user-friendly

---

## 📁 File Structure

```
CARERING/
├── public/
│   ├── perangkat.html          # Main page dengan BLE UI (UPDATED)
│   ├── ble-handler.js          # BLE handler module (NEW)
│   ├── script.js               # Existing Firebase & app logic
│   └── auth-guard.js           # Authentication guard
├── ESP32_BLE_Setup_Guide.md    # Guide untuk setup ESP32
└── BLE_Implementation_Guide.md # Guide ini
```

---

## 🔧 Setup Requirements

### Browser Requirements
- ✅ Google Chrome v56+ atau Microsoft Edge v79+
- ❌ Firefox dan Safari tidak support Web Bluetooth API
- ⚠️ Harus menggunakan HTTPS atau localhost

### ESP32 Requirements
- ✅ ESP32C6 dengan BLE Services aktif
- ✅ Service UUID: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- ✅ TX Characteristic UUID: `6e400003-b5a3-f393-e0a9-e50e24dcca9e`
- ✅ Device name: "CareRing" atau "CareRing-XXXX"

### Firebase Requirements
- ✅ Firebase Realtime Database sudah ter-setup
- ✅ Database URL: `https://testing-5db96-default-rtdb.asia-southeast1.firebasedatabase.app`
- ✅ Firebase SDK v8.10.1 sudah ter-include

---

## 🚀 Cara Menggunakan

### Step 1: Persiapan ESP32

1. **Upload firmware BLE ke ESP32C6** (lihat `ESP32_BLE_Setup_Guide.md`)
2. **Pastikan ESP32 advertising** dengan service UUID yang benar
3. **Test dengan Serial Monitor** untuk pastikan data terkirim

### Step 2: Akses Web App

1. Buka `http://localhost:8080/perangkat.html` (atau HTTPS jika di production)
2. Login dengan akun Google
3. Klik tombol **"Tambah Perangkat Baru"** atau **"Cari Perangkat BLE"**

### Step 3: Connect ke ESP32

1. Modal BLE Scanner akan muncul
2. Klik tombol **"Scan & Hubungkan Perangkat"**
3. Browser akan menampilkan dialog untuk memilih device
4. Pilih **"CareRing"** atau **"CareRing-XXXX"**
5. Klik **"Pair"** atau **"Connect"**

### Step 4: Lihat Data Real-time

Setelah berhasil connect:
- ✅ Status berubah menjadi **"Terhubung"** (hijau)
- ✅ Section **"📡 Data BLE Real-time"** muncul
- ✅ Data sensor update setiap 500ms:
  - ❤️ Heart Rate (BPM)
  - 💧 SpO2 (%)
  - 🌡️ Suhu Tubuh (°C)
  - 🏠 Suhu Ruangan (°C)
- ✅ Data otomatis ter-upload ke Firebase setiap 1 detik

### Step 5: Monitor di Console

Buka Developer Tools (F12) > Console untuk melihat:
```
✅ BLE Handler module loaded
🔍 Scanning for CareRing devices...
✅ Device found: CareRing-E5F6
✅ GATT Server connected
✅ Service found: 6e400001-b5a3-f393-e0a9-e50e24dcca9e
✅ Characteristic found: 6e400003-b5a3-f393-e0a9-e50e24dcca9e
✅ Notifications started
═══════════════════════════════════════════════════════
   🎉 SUCCESSFULLY CONNECTED TO CARERING!
═══════════════════════════════════════════════════════
   Device: CareRing-E5F6
   Status: Receiving data every 500ms
   Upload: Throttled to max 1x per second
═══════════════════════════════════════════════════════
📨 Received BLE data: {"deviceID":"A1:B2:C3:D4:E5:F6",...}
✅ Valid sensor data received:
   Device: CareRing-E5F6 (A1:B2:C3:D4:E5:F6)
   Heart Rate: 72 BPM
   SpO2: 98%
   Temperature: 36.5°C
   Ambient: 28.0°C
✅ Data uploaded to Firebase: /realtimeSensorData/A1-B2-C3-D4-E5-F6
```

---

## 🔌 API Reference

### Global Functions

Semua fungsi tersedia melalui `window.BLEHandler`:

#### `BLEHandler.connect()`
Connect ke ESP32 CareRing device.

```javascript
// Usage
async function connectToDevice() {
  try {
    const success = await window.BLEHandler.connect();
    if (success) {
      console.log('Connected!');
    }
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

**Returns:** `Promise<boolean>` - True jika berhasil connect
**Throws:** Error jika gagal (NotFoundError, SecurityError, NetworkError, dll)

---

#### `BLEHandler.disconnect()`
Disconnect dari ESP32 dan cleanup resources.

```javascript
// Usage
function disconnectDevice() {
  window.BLEHandler.disconnect();
  console.log('Disconnected');
}
```

**Returns:** `void`

---

#### `BLEHandler.isConnected()`
Check apakah saat ini terhubung ke device.

```javascript
// Usage
if (window.BLEHandler.isConnected()) {
  console.log('Device is connected');
} else {
  console.log('Device is not connected');
}
```

**Returns:** `boolean` - True jika connected

---

#### `BLEHandler.getDeviceInfo()`
Get info device yang sedang terhubung.

```javascript
// Usage
const info = window.BLEHandler.getDeviceInfo();
if (info) {
  console.log('Device Name:', info.name);
  console.log('Device ID:', info.id);
  console.log('Connected:', info.connected);
} else {
  console.log('No device connected');
}
```

**Returns:** `Object | null` - Device info atau null jika tidak connected

---

#### `BLEHandler.uploadToFirebase(data)`
Manual upload data ke Firebase (opsional - biasanya auto-upload).

```javascript
// Usage
const sensorData = {
  deviceID: "A1:B2:C3:D4:E5:F6",
  deviceName: "CareRing-E5F6",
  heartRate: 72,
  spo2: 98,
  temperature: 36.5,
  ambient: 28.0,
  screen: 1
};

const success = await window.BLEHandler.uploadToFirebase(sensorData);
if (success) {
  console.log('Uploaded!');
}
```

**Parameters:**
- `data` (Object) - Sensor data object

**Returns:** `Promise<boolean>` - True jika berhasil upload

---

### Custom Events

BLE Handler mengirim custom events yang bisa di-listen:

#### Event: `bleConnected`
Triggered ketika berhasil connect ke device.

```javascript
// Usage
window.addEventListener('bleConnected', function(event) {
  const { deviceName, deviceId } = event.detail;
  console.log('Connected to:', deviceName);
  // Update your UI here
});
```

**Event Detail:**
```javascript
{
  deviceName: "CareRing-E5F6",  // string
  deviceId: "FaIaJTK8RwpHLX2h8nrljQ=="  // string
}
```

---

#### Event: `bleDisconnected`
Triggered ketika device disconnect.

```javascript
// Usage
window.addEventListener('bleDisconnected', function(event) {
  console.log('Device disconnected');
  // Update your UI here
});
```

**Event Detail:** None

---

#### Event: `bleDataReceived`
Triggered setiap kali data sensor diterima (every 500ms).

```javascript
// Usage
window.addEventListener('bleDataReceived', function(event) {
  const data = event.detail;
  console.log('Heart Rate:', data.heartRate);
  console.log('SpO2:', data.spo2);
  // Update your UI here
});
```

**Event Detail:**
```javascript
{
  deviceID: "A1:B2:C3:D4:E5:F6",      // string
  deviceName: "CareRing-E5F6",        // string
  heartRate: 72,                      // number (BPM)
  spo2: 98,                           // number (%)
  temperature: 36.5,                  // number (°C)
  ambient: 28.0,                      // number (°C)
  screen: 1                           // number (1-5)
}
```

---

## 🔥 Firebase Data Structure

Data yang di-upload ke Firebase memiliki struktur:

```
realtimeSensorData/
  └── A1-B2-C3-D4-E5-F6/           // Device ID (colons replaced with dashes)
      ├── deviceID: "A1:B2:C3:D4:E5:F6"
      ├── deviceName: "CareRing-E5F6"
      ├── heartRate: 72
      ├── spo2: 98
      ├── temperature: 36.5
      ├── ambient: 28.0
      ├── screen: 1
      ├── timestamp: 1701234567890      // Auto-added
      ├── lastUpdate: "2025-12-04T14:30:15+07:00"  // Auto-added
      └── uploadedVia: "BLE-Bridge"     // Auto-added
```

---

## ⚡ Performance & Optimization

### Data Throttling
- ESP32 mengirim data setiap **500ms** (2x per detik)
- Upload ke Firebase di-throttle menjadi **1000ms** (1x per detik)
- Ini mencegah overload Firebase dan menghemat bandwidth

### Memory Management
- Event listeners di-cleanup saat disconnect
- No memory leaks karena proper cleanup
- ArrayBuffer decoded efisien

### Error Recovery
- Auto-reconnect notification jika device disconnect unexpected
- Retry mechanism untuk Firebase upload failures
- Graceful degradation jika BLE not available

---

## 🐛 Troubleshooting

### Problem 1: "Web Bluetooth API not available"
**Solusi:**
- Gunakan Chrome atau Edge browser
- Pastikan menggunakan HTTPS atau localhost
- Update browser ke versi terbaru

### Problem 2: "Device not found"
**Solusi:**
- Pastikan ESP32 sudah menyala dan advertising
- Check Serial Monitor ESP32 untuk error messages
- Pastikan ESP32 tidak ter-connect ke aplikasi lain
- Restart Bluetooth di komputer
- Remove pairing di Windows Settings jika perlu

### Problem 3: "No Services found in device"
**Solusi:**
- ESP32 belum configure BLE Services dengan benar
- Lihat panduan di `ESP32_BLE_Setup_Guide.md`
- Upload ulang firmware dengan service UUID yang benar

### Problem 4: "Firebase upload failed"
**Solusi:**
- Check internet connection
- Check Firebase database rules
- Check Firebase quota/limits
- Check console untuk error details

### Problem 5: Data tidak update di UI
**Solusi:**
- Check browser console untuk errors
- Pastikan event listeners ter-register
- Refresh halaman dan reconnect
- Check elemen HTML dengan ID yang benar exist

---

## 🧪 Testing Checklist

Sebelum deploy ke production, test:

- [ ] BLE scan dan connect berhasil
- [ ] Data diterima di console log
- [ ] UI update dengan data real-time
- [ ] Firebase upload berhasil (check di Firebase Console)
- [ ] Disconnect berfungsi dengan baik
- [ ] Reconnect setelah disconnect berfungsi
- [ ] Error handling tampilkan pesan yang jelas
- [ ] UI responsive di mobile dan desktop
- [ ] Performance baik (no lag, no memory leaks)
- [ ] Battery usage reasonable (jika di mobile)

---

## 📊 Expected Console Output (Success)

Ketika semua berjalan dengan baik, console akan tampil seperti ini:

```
✅ BLE Handler module loaded
   Available: window.BLEHandler.connect()
   Available: window.BLEHandler.disconnect()
   Available: window.BLEHandler.isConnected()
   Available: window.BLEHandler.getDeviceInfo()

🔍 Scanning for CareRing devices...
✅ Device found: CareRing-E5F6
   Device ID: FaIaJTK8RwpHLX2h8nrljQ==

🔌 Connecting to GATT Server...
✅ GATT Server connected

🔍 Getting BLE Service...
✅ Service found: 6e400001-b5a3-f393-e0a9-e50e24dcca9e

🔍 Getting TX Characteristic...
✅ Characteristic found: 6e400003-b5a3-f393-e0a9-e50e24dcca9e

🔔 Starting notifications...
✅ Notifications started
✅ Event listener added

═══════════════════════════════════════════════════════
   🎉 SUCCESSFULLY CONNECTED TO CARERING!
═══════════════════════════════════════════════════════
   Device: CareRing-E5F6
   Status: Receiving data every 500ms
   Upload: Throttled to max 1x per second
═══════════════════════════════════════════════════════

📨 Received BLE data: {"deviceID":"A1:B2:C3:D4:E5:F6","deviceName":"CareRing-E5F6","heartRate":72,"spo2":98,"temperature":36.5,"ambient":28.0,"screen":1}

✅ Valid sensor data received:
   Device: CareRing-E5F6 (A1:B2:C3:D4:E5:F6)
   Heart Rate: 72 BPM
   SpO2: 98%
   Temperature: 36.5°C
   Ambient: 28.0°C
   Screen: 1

✅ Data uploaded to Firebase: /realtimeSensorData/A1-B2-C3-D4-E5-F6
   Data: {heartRate: 72, spo2: 98, temperature: 36.5, ambient: 28}

📊 UI Updated with BLE data: {hr: 72, spo2: 98, temp: 36.5, amb: 28}

🎉 BLE Connected Event received: {deviceName: 'CareRing-E5F6', deviceId: 'FaIaJTK8RwpHLX2h8nrljQ=='}

[Data terus diterima setiap 500ms...]
```

---

## 📞 Support & Questions

Jika ada pertanyaan atau masalah:

1. **Check console log** untuk error details
2. **Read troubleshooting section** di atas
3. **Check ESP32 firmware** apakah sudah benar
4. **Test di browser berbeda** (Chrome vs Edge)
5. **Check Firebase Console** untuk data yang terupload

---

## 📝 Changelog

### v1.0.0 (2025-12-04)
- ✅ Initial implementation
- ✅ BLE connection management
- ✅ Real-time data streaming
- ✅ Firebase auto-upload dengan throttling
- ✅ UI live update dengan animasi
- ✅ Comprehensive error handling
- ✅ Event-driven architecture
- ✅ Full documentation

---

## 🎯 Next Steps / Future Improvements

Ide untuk improvement di masa depan:

1. **Historical Data Chart**: Tampilkan grafik data sensor over time
2. **Push Notifications**: Notif ke user jika ada data abnormal
3. **Multi-device Support**: Connect ke multiple ESP32 sekaligus
4. **Data Export**: Export data ke CSV/PDF
5. **Offline Mode**: Cache data saat offline, sync ketika online
6. **Analytics Dashboard**: Analytics lengkap dari sensor data
7. **Remote Control**: Kirim command dari web app ke ESP32

---

**Dibuat oleh:** Claude Code
**Tanggal:** 2025-12-04
**Untuk:** Project CARERING
**Version:** 1.0.0
