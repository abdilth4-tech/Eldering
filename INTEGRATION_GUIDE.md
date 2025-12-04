# 🚀 CARERING - Quick Integration Guide

## ESP32 ↔️ Web App Integration

Panduan cepat untuk menghubungkan ESP32C6 CareRing dengan Web App.

---

## ✅ Yang Sudah Siap

### 1. **ESP32 Firmware** ✓
- ✅ File: `ESP32_CareRing_Firmware_Example.ino`
- ✅ BLE UUID sudah match dengan web app
- ✅ JSON format sudah sesuai
- ✅ Send interval 500ms
- ✅ Auto-reconnect handling

### 2. **Web App** ✓
- ✅ File: `public/ble-handler.js` + `public/perangkat.html`
- ✅ BLE connection manager
- ✅ Real-time data display
- ✅ Auto-upload ke Firebase (throttled 1x/sec)
- ✅ UI feedback lengkap

---

## 🔧 Setup Cepat (5 Menit)

### **Step 1: Upload Firmware ke ESP32C6**

```
1. Buka Arduino IDE
2. Open: ESP32_CareRing_Firmware_Example.ino
3. Select Board: ESP32C6 Dev Module
4. Select Port: COM yang sesuai
5. Click Upload
6. Tunggu sampai selesai
7. Buka Serial Monitor (115200 baud)
```

**Expected Output di Serial Monitor:**
```
════════════════════════════════════════════════════════
  🚀 CARERING SYSTEM STARTING... 🚀
════════════════════════════════════════════════════════

╔══════════════════════════════════════════════════════╗
║  CareRing BLE Bridge v5.1 - WEB APP READY          ║
║  Health Monitoring Device                           ║
║  ───────────────────────────────────────────────    ║
║  ✓ BLE → Web App → Firebase (Auto Upload)          ║
║  ✓ LOW POWER MODE (WiFi Disabled)                  ║
║  ✓ Device ID & Name Generation                     ║
║  ✓ JSON Data Format (500ms interval)               ║
╚══════════════════════════════════════════════════════╝

╔════════════════════════════════════╗
║      DEVICE IDENTIFICATION        ║
╚════════════════════════════════════╝
🆔 Device ID:   A1:B2:C3:D4:E5:F6
📱 Device Name: CareRing-E5F6
════════════════════════════════════

╔══════════════════════════════════════════════════════╗
║  📡 BLE ADVERTISING ACTIVE                          ║
╚══════════════════════════════════════════════════════╝
🔍 Device is now discoverable as: CareRing-E5F6
⏳ Waiting for web app connection...
```

---

### **Step 2: Buka Web App**

```
1. Buka browser Chrome atau Edge
2. Navigasi ke: http://localhost:8080/perangkat.html
3. Login dengan Google
```

---

### **Step 3: Connect ke ESP32**

**Di Web App:**
1. Klik tombol **"Tambah Perangkat Baru"** atau **"Cari Perangkat BLE"**
2. Modal BLE Scanner akan muncul
3. Klik **"Scan & Hubungkan Perangkat"**
4. Browser akan show device selection dialog
5. Pilih **"CareRing-E5F6"** (nama sesuai ESP32 Anda)
6. Klik **"Pair"**

**Expected Output di Browser Console (F12):**
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
   Screen: 1
✅ Data uploaded to Firebase: /realtimeSensorData/A1-B2-C3-D4-E5-F6
```

**Expected Output di ESP32 Serial Monitor:**
```
╔══════════════════════════════════════════════════════╗
║  ✅ WEB APP CONNECTED!                              ║
╚══════════════════════════════════════════════════════╝
🌐 Web app is now connected to CareRing-E5F6
📊 Sensor data will be sent every 500ms
🔥 Web app will auto-upload to Firebase (throttled 1x/sec)
════════════════════════════════════════════════════════

╔════════════════════════════════════════╗
║   BLE DATA SENT TO WEB APP            ║
╚════════════════════════════════════════╝
📤 JSON: {"deviceID":"A1:B2:C3:D4:E5:F6","deviceName":"CareRing-E5F6",...}
📊 Stats:
   • Packets sent: 10
   • Rate: 2 packets/sec (500ms interval)
   • Connection: ACTIVE ✓
════════════════════════════════════════
```

---

### **Step 4: Lihat Data Real-time**

Di web app, akan muncul section baru:

```
┌─────────────────────────────────────────┐
│ 📡 Data BLE Real-time                   │
├─────────────────────────────────────────┤
│ ❤️ Heart Rate:    72 BPM  (pulse anim)  │
│ 💧 SpO2:          98%                    │
│ 🌡️ Suhu Tubuh:    36.5°C                │
│ 🏠 Suhu Ruangan:  28.0°C                 │
│                                          │
│ Terakhir update: 14:30:15                │
└─────────────────────────────────────────┘
```

---

### **Step 5: Verify di Firebase**

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project: **testing-5db96**
3. Buka **Realtime Database**
4. Navigate ke: `realtimeSensorData/A1-B2-C3-D4-E5-F6/`
5. Lihat data ter-update setiap 1 detik

**Expected Data Structure:**
```json
{
  "realtimeSensorData": {
    "A1-B2-C3-D4-E5-F6": {
      "deviceID": "A1:B2:C3:D4:E5:F6",
      "deviceName": "CareRing-E5F6",
      "heartRate": 72,
      "spo2": 98,
      "temperature": 36.5,
      "ambient": 28.0,
      "screen": 1,
      "timestamp": 1701234567890,
      "lastUpdate": "2025-12-04T14:30:15+07:00",
      "uploadedVia": "BLE-Bridge"
    }
  }
}
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐    BLE      ┌──────────────┐   Firebase   ┌──────────────┐
│   ESP32C6    │ ─────────>  │   Web App    │ ──────────>  │   Firebase   │
│  (CareRing)  │   500ms     │  (Browser)   │    1000ms    │   Database   │
│              │             │              │  (throttled) │              │
│ • MAX30102   │  JSON data  │ • BLE Handler│   HTTP POST  │ • Realtime   │
│ • MLX90614   │             │ • UI Update  │              │ • Storage    │
│ • Display    │             │ • Validation │              │ • Analytics  │
└──────────────┘             └──────────────┘              └──────────────┘
```

---

## 🔍 Troubleshooting

### Problem 1: ESP32 tidak muncul di scan list

**Solusi:**
1. Check Serial Monitor - pastikan ada log "BLE ADVERTISING ACTIVE"
2. Pastikan ESP32 tidak ter-connect ke aplikasi lain
3. Restart ESP32 (press reset button)
4. Restart Bluetooth di komputer

### Problem 2: Connection failed

**Cek di Serial Monitor ESP32:**
```
❌ BLE Client Disconnected!
```

**Solusi:**
1. Pastikan menggunakan Chrome/Edge (bukan Firefox/Safari)
2. Check browser console untuk error message
3. Refresh halaman web app
4. Disconnect device di Windows Bluetooth Settings jika sudah paired

### Problem 3: Data tidak muncul di UI

**Cek di Browser Console:**
```
📨 Received BLE data: {...}
```

**Jika tidak ada log di atas:**
1. ESP32 mungkin belum kirim data (check Serial Monitor)
2. Koneksi terputus (status badge harus hijau "Terhubung")
3. Refresh halaman dan reconnect

### Problem 4: Firebase upload gagal

**Cek di Browser Console:**
```
❌ Firebase upload failed: ...
```

**Solusi:**
1. Check internet connection
2. Check Firebase database rules
3. Check Firebase quota/limits
4. Verify Firebase config di script.js

---

## 📝 Configuration Reference

### **BLE Configuration (Match antara ESP32 & Web App)**

| Parameter | Value | Location |
|-----------|-------|----------|
| Service UUID | `6e400001-b5a3-f393-e0a9-e50e24dcca9e` | ESP32: line 46<br>Web: ble-handler.js:28 |
| TX Characteristic | `6e400003-b5a3-f393-e0a9-e50e24dcca9e` | ESP32: line 48<br>Web: ble-handler.js:29 |
| Device Name | `CareRing` or `CareRing-XXXX` | ESP32: line 51<br>Web: ble-handler.js:30 |
| Data Interval | 500ms | ESP32: line 1609<br>Web: receives automatically |
| Upload Throttle | 1000ms | Web: ble-handler.js:31 |

### **JSON Data Format**

```json
{
  "deviceID": "A1:B2:C3:D4:E5:F6",      // MAC Address (string)
  "deviceName": "CareRing-E5F6",        // Device name (string)
  "heartRate": 72,                      // BPM (integer, 0-200)
  "spo2": 98,                           // Percent (integer, 0-100)
  "temperature": 36.5,                  // Celsius (float)
  "ambient": 28.0,                      // Celsius (float)
  "screen": 1                           // Screen ID (integer, 1-5)
}
```

---

## 🎯 Performance Metrics

### **Expected Performance:**

| Metric | Value | Description |
|--------|-------|-------------|
| BLE Data Rate | 2 packets/sec | ESP32 sends every 500ms |
| Firebase Upload Rate | 1 upload/sec | Throttled by web app |
| Connection Latency | <100ms | BLE connection time |
| Data Processing | <50ms | Parse + validate + upload |
| UI Update Latency | <100ms | From receive to display |

### **Resource Usage:**

| Component | Usage | Notes |
|-----------|-------|-------|
| ESP32 RAM | ~40KB | BLE + sensors + display |
| ESP32 CPU | ~30% | Normal operation |
| Browser RAM | ~50MB | BLE handler + UI |
| Battery Life | ~8-12 hours | With display on |
| Firebase Quota | ~2.6K writes/hour | 1 write/sec throttled |

---

## ✅ Integration Checklist

Sebelum deploy, pastikan:

- [ ] ESP32 firmware ter-upload dengan benar
- [ ] BLE UUID match antara ESP32 & web app
- [ ] Serial Monitor menampilkan "BLE ADVERTISING ACTIVE"
- [ ] Web app bisa scan dan menemukan device
- [ ] Connection berhasil (status badge hijau)
- [ ] Data real-time muncul di UI (heart rate pulse animation)
- [ ] Browser console tidak ada error
- [ ] Data ter-upload ke Firebase setiap 1 detik
- [ ] Firebase database structure sesuai
- [ ] Disconnect berfungsi dengan baik
- [ ] Reconnect berfungsi setelah disconnect
- [ ] Sensor readings accurate (test dengan finger real)

---

## 🆘 Support

Jika masih ada masalah:

1. **Check Serial Monitor** ESP32 untuk error messages
2. **Check Browser Console** (F12) untuk JavaScript errors
3. **Read Documentation:**
   - `BLE_Implementation_Guide.md` - Web app documentation
   - `ESP32_BLE_Setup_Guide.md` - ESP32 setup guide
4. **Test dengan dummy data** dulu (TESTING_MODE=true)
5. **Verify wiring** jika sensor tidak terbaca

---

## 📚 Additional Resources

- [Web Bluetooth API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [ESP32 BLE Arduino Library](https://github.com/nkolban/ESP32_BLE_Arduino)
- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [LVGL Documentation](https://docs.lvgl.io/)

---

**Last Updated:** 2025-12-04
**Version:** 1.0.0
**Status:** Production Ready ✅
