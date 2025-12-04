# 🧪 CARERING - Complete Testing Guide

## Testing BLE Integration: ESP32C6 ↔️ Web App

Panduan testing lengkap untuk memastikan semua berfungsi dengan baik.

---

## 📋 Prerequisites

Sebelum mulai testing, pastikan:

- ✅ Arduino IDE sudah ter-install
- ✅ ESP32C6 board support sudah ter-install
- ✅ Chrome atau Edge browser (Web Bluetooth support)
- ✅ ESP32C6 terhubung ke komputer via USB
- ✅ Web app sudah running (localhost:8080)
- ✅ Firebase project sudah setup

---

## 🎯 Testing Phase 1: ESP32 Standalone Test

### **Test 1.1: Upload Firmware**

**Goal:** Memastikan firmware bisa di-upload tanpa error

**Steps:**
```
1. Buka Arduino IDE
2. Open file: ESP32_CareRing_Firmware_Example.ino
3. Select Tools > Board > ESP32C6 Dev Module
4. Select Tools > Port > COMx (port ESP32 Anda)
5. Click Upload (➡️ icon)
6. Tunggu proses compile + upload selesai
```

**Expected Output (Arduino IDE Console):**
```
Sketch uses XXXXX bytes (XX%) of program storage space.
Global variables use XXXXX bytes (XX%) of dynamic memory.
esptool.py v4.5.1
...
Writing at 0x00010000... (100%)
Wrote 1234567 bytes (654321 compressed) at 0x00010000
...
Hash of data verified.

Leaving...
Hard resetting via RTS pin...
```

**✅ Success Criteria:**
- No compilation errors
- Upload berhasil 100%
- "Hard resetting" message muncul

**❌ Common Issues:**
| Problem | Solution |
|---------|----------|
| "Port not found" | Check USB cable, install CH340 driver |
| "Compilation error" | Check missing libraries |
| "Upload failed" | Press BOOT button saat uploading |

---

### **Test 1.2: Serial Monitor Boot Check**

**Goal:** Memastikan ESP32 boot dengan benar dan BLE aktif

**Steps:**
```
1. Tools > Serial Monitor
2. Set baud rate: 115200
3. Press ESP32 RESET button
4. Lihat output
```

**Expected Output:**
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
║  ───────────────────────────────────────────────    ║
║  📱 WEB APP COMPATIBILITY:                          ║
║     • Service UUID: 6E400001-B5A3-...              ║
║     • TX Char UUID: 6E400003-B5A3-...              ║
║     • Device Name: CareRing-XXXX                   ║
║     • Data Rate: 2 packets/sec                     ║
╚══════════════════════════════════════════════════════╝

╔════════════════════════════════════╗
║      DEVICE IDENTIFICATION        ║
╚════════════════════════════════════╝
🆔 Device ID:   7C:2C:67:FF:FE:7C
📱 Device Name: CareRing-FE7C
════════════════════════════════════

⚡ LOW POWER MODE: WiFi disabled
📱 Connect HP via BLE to bridge data to Firebase

✅ Button initialized (GPIO18 - External Push Button - ESP32-C6)
   Initial state: HIGH (Released)

⏰ Initializing time...
✅ Time initialized (default: 26 Nov 2025, 14:30:00)

╔═══════════════════════════════════════╗
║   INITIALIZING MAX30102 SENSOR       ║
╚═══════════════════════════════════════╝
🔌 Starting I2C on pins SDA=2, SCL=3...
🔍 Scanning I2C bus for MAX30102...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ I2C device found at 0x57 <- MAX30102!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Found 1 I2C device(s) - MAX30102 detected!

🔌 Attempting to initialize MAX30102...
✅ MAX30102 sensor found at 0x57!
⚙️ Configuring sensor with MAXIMUM power...
✅ MAX30102 configured successfully!

╔═══════════════════════════════════════╗
║   SENSOR READY - Place your finger   ║
╚═══════════════════════════════════════╝

╔═══════════════════════════════════════╗
║   INITIALIZING MLX90614 SENSOR       ║
╚═══════════════════════════════════════╝
🌡️ Starting I2C on pins SDA=4, SCL=5...
🔍 Scanning I2C bus (Wire1)...
   ✅ I2C device found at 0x5A
   ✅ Found 1 I2C device(s)

🌡️ Attempting to initialize MLX90614...
✅ MLX90614 sensor found at 0x5A!
✅ MLX90614 configured successfully!

╔═══════════════════════════════════════╗
║   TEMP SENSOR READY                  ║
╚═══════════════════════════════════════╝

🖥️ Initializing display... OK
🎨 Initializing LVGL... OK

📺 SHOWING IDLE SCREEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ Screen loaded
2️⃣ Connection UI updated
3️⃣ Clock labels created
4️⃣ Clock labels shown
5️⃣ Clock forced to foreground
✅ Idle screen setup COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

════════════════════════════════════════
✅ SYSTEM READY!
════════════════════════════════════════
🔘 SHORT PRESS (Click):
   - IDLE: Start BLE
   - MAIN: Next Screen
⏱️ LONG PRESS (Hold 1 sec): Screen ON/OFF
════════════════════════════════════════
```

**✅ Success Criteria:**
- Boot message muncul dengan lengkap
- Device ID & Name ter-generate (misal: CareRing-FE7C)
- Sensors initialized (MAX30102 & MLX90614)
- Display initialized
- Status: "SYSTEM READY!"

**📝 Notes:**
- **Device Name** (CareRing-XXXX) akan unik untuk setiap ESP32
- Catat Device Name ini - Anda akan pilih ini di web app nanti
- Jika sensor tidak ditemukan, akan muncul warning tapi system tetap jalan dengan simulated data

---

### **Test 1.3: BLE Activation Test**

**Goal:** Memastikan BLE bisa aktif dan advertising

**Steps:**
```
1. Dengan Serial Monitor masih terbuka
2. Press tombol GPIO18 sekali (SHORT PRESS)
3. Lihat output
```

**Expected Output:**
```
🔘 Button pressed...
🔘 SHORT PRESS (Click)!
▶️ Starting BLE...

📡 Starting BLE UART Service...
✅ BLE Started Successfully!

╔══════════════════════════════════════════════════════╗
║  📡 BLE ADVERTISING ACTIVE                          ║
╚══════════════════════════════════════════════════════╝
🔍 Device is now discoverable as: CareRing-FE7C
📱 TO CONNECT FROM WEB APP:
   1. Open: http://localhost:8080/perangkat.html
   2. Click: 'Tambah Perangkat Baru'
   3. Click: 'Scan & Hubungkan Perangkat'
   4. Select: 'CareRing-FE7C'
   5. Wait for connection...

⏳ Waiting for web app connection...
════════════════════════════════════════════════════════

🟢 State: BLE_ACTIVE
```

**✅ Success Criteria:**
- Message "BLE ADVERTISING ACTIVE" muncul
- Device Name ditampilkan dengan jelas
- State berubah ke "BLE_ACTIVE"
- No errors

**❌ If BLE fails to start:**
```
Check:
- BLE library ter-install dengan benar
- ESP32C6 support BLE (should be yes)
- Restart ESP32 dan coba lagi
```

---

### **Test 1.4: Sensor Reading Test**

**Goal:** Memastikan sensor bisa baca data

**Steps:**
```
1. Serial Monitor masih terbuka
2. Place your finger FIRMLY on MAX30102 sensor
3. Cover RED and IR LEDs completely
4. Keep finger STILL for 10 seconds
5. Lihat output
```

**Expected Output (if sensor working):**
```
📊 Sensor Data Read:
   ❤️  Heart Rate: 72 BPM
   💧 SpO2: 98%
   🌡️  Temperature: 36.5°C
   🏠 Ambient: 28.0°C
   📱 Screen: 1

🌡️ REAL TEMP => Body: 36.5°C | Ambient: 28.2°C
```

**Expected Output (if using simulated data):**
```
🤖 SIMULATED TEMP => 🌡️ Body: 36.5°C | 🌤️ Ambient: 28.0°C
```

**✅ Success Criteria:**
- Heart rate detected (50-120 BPM range)
- SpO2 detected (90-100% range)
- Temperature readings reasonable

**📝 Notes:**
- Jika sensor tidak terpasang, akan gunakan simulated data (ini OK untuk testing BLE)
- Simulated data akan random dalam range normal

---

## 🎯 Testing Phase 2: Web App Standalone Test

### **Test 2.1: Web App Loading**

**Goal:** Memastikan web app bisa diakses

**Steps:**
```
1. Buka Chrome atau Edge browser
2. Navigate to: http://localhost:8080/perangkat.html
3. Login dengan Google account
```

**Expected Result:**
- ✅ Page loads tanpa error
- ✅ Login berhasil
- ✅ Redirect ke halaman perangkat
- ✅ Tombol "Tambah Perangkat Baru" terlihat

**Check Browser Console (F12):**
```
✅ BLE Handler module loaded
   Available: window.BLEHandler.connect()
   Available: window.BLEHandler.disconnect()
   Available: window.BLEHandler.isConnected()
   Available: window.BLEHandler.getDeviceInfo()
```

---

### **Test 2.2: BLE Scanner Modal**

**Goal:** Memastikan modal BLE scanner bisa dibuka

**Steps:**
```
1. Click tombol "Tambah Perangkat Baru"
2. Modal BLE Scanner akan muncul
```

**Expected Result:**
- ✅ Modal muncul dengan smooth animation
- ✅ Tombol "Scan & Hubungkan Perangkat" terlihat
- ✅ Input fields untuk Device ID dan Services UUID terlihat
- ✅ Warning boxes terlihat (ESP32 requirement & Windows Settings)

---

### **Test 2.3: Browser Bluetooth Support Check**

**Steps:**
```
1. Di Browser Console (F12), ketik:
   navigator.bluetooth

2. Press Enter
```

**Expected Result:**
```
Bluetooth {
  getAvailability: ƒ getAvailability()
  getDevices: ƒ getDevices()
  requestDevice: ƒ requestDevice()
  ...
}
```

**❌ If undefined:**
```
Anda menggunakan browser yang tidak support Web Bluetooth!
Solution:
- Gunakan Chrome v56+ atau Edge v79+
- Jangan gunakan Firefox atau Safari
- Pastikan di HTTPS atau localhost
```

---

## 🎯 Testing Phase 3: Integration Test (ESP32 ↔️ Web App)

### **Test 3.1: BLE Discovery & Connection**

**Goal:** Memastikan web app bisa menemukan dan connect ke ESP32

**Prerequisites:**
- ✅ ESP32 dalam state "BLE_ACTIVE" (lihat Serial Monitor)
- ✅ Web app sudah terbuka di browser
- ✅ Modal BLE Scanner terbuka

**Steps:**
```
1. Di web app modal BLE Scanner
2. Click: "Scan & Hubungkan Perangkat"
3. Browser akan show device selection dialog
4. Cari device: "CareRing-FE7C" (sesuai ESP32 Anda)
5. Click device tersebut
6. Click "Pair"
7. Wait...
```

**Expected: Browser Console (F12):**
```
🔍 Scanning for CareRing devices...
✅ Device found: CareRing-FE7C
   Device ID: FaIaJTK8RwpHLX2h8nrljQ==
   Device Name: CareRing-FE7C

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
   Device: CareRing-FE7C
   Status: Receiving data every 500ms
   Upload: Throttled to max 1x per second
═══════════════════════════════════════════════════════
```

**Expected: ESP32 Serial Monitor:**
```
╔══════════════════════════════════════════════════════╗
║  ✅ WEB APP CONNECTED!                              ║
╚══════════════════════════════════════════════════════╝
🌐 Web app is now connected to CareRing-FE7C
📊 Sensor data will be sent every 500ms
🔥 Web app will auto-upload to Firebase (throttled 1x/sec)
════════════════════════════════════════════════════════
```

**Expected: Web App UI:**
- ✅ Modal closes automatically
- ✅ Status badge berubah hijau: "Terhubung"
- ✅ Section "📡 Data BLE Real-time" muncul
- ✅ Tombol "Putuskan Perangkat" enabled

**✅ Success Criteria:**
- Connection berhasil tanpa error
- Console log menunjukkan semua step sukses
- ESP32 mendeteksi web app connected
- UI update dengan benar

**❌ Common Issues:**

| Problem | ESP32 Output | Browser Output | Solution |
|---------|--------------|----------------|----------|
| Device not found | "Waiting for connection..." | "NotFoundError" | • Check BLE active di ESP32<br>• Restart BLE (press button)<br>• Remove pairing di Windows Settings |
| Connection timeout | "Waiting for connection..." | "NetworkError" | • ESP32 mungkin too far<br>• Restart Bluetooth di komputer<br>• Check no other app using BLE |
| No services found | "Connected but..." | "No Services found" | • Firmware problem<br>• Re-upload firmware<br>• Check Service UUID match |

---

### **Test 3.2: Real-time Data Streaming**

**Goal:** Memastikan data mengalir dari ESP32 ke web app

**Steps:**
```
1. Setelah connected (Test 3.1 success)
2. Watch Browser Console (F12)
3. Watch ESP32 Serial Monitor
4. Wait 5 seconds
```

**Expected: Browser Console (every 500ms):**
```
📨 Received BLE data: {"deviceID":"7C:2C:67:FF:FE:7C","deviceName":"CareRing-FE7C","heartRate":72,"spo2":98,"temperature":36.5,"ambient":28.0,"screen":1}

✅ Valid sensor data received:
   Device: CareRing-FE7C (7C:2C:67:FF:FE:7C)
   Heart Rate: 72 BPM
   SpO2: 98%
   Temperature: 36.5°C
   Ambient: 28.0°C
   Screen: 1

✅ Data uploaded to Firebase: /realtimeSensorData/7C-2C-67-FF-FE-7C
   Data: {heartRate: 72, spo2: 98, temperature: 36.5, ambient: 28}

📊 UI Updated with BLE data: {hr: 72, spo2: 98, temp: 36.5, amb: 28}
```

**Expected: ESP32 Serial Monitor (every 5 seconds):**
```
╔════════════════════════════════════════╗
║   BLE DATA SENT TO WEB APP            ║
╚════════════════════════════════════════╝
📤 JSON: {"deviceID":"7C:2C:67:FF:FE:7C","deviceName":"CareRing-FE7C","heartRate":72,"spo2":98,"temperature":36.5,"ambient":28.0,"screen":1}
📊 Stats:
   • Packets sent: 10
   • Rate: 2 packets/sec (500ms interval)
   • Connection: ACTIVE ✓
════════════════════════════════════════
```

**Expected: Web App UI (updating live):**
```
┌─────────────────────────────────────────┐
│ 📡 Data BLE Real-time                   │
├─────────────────────────────────────────┤
│ ❤️ Heart Rate:    72 BPM  💓 (pulse!)  │
│ 💧 SpO2:          98%                    │
│ 🌡️ Suhu Tubuh:    36.5°C                │
│ 🏠 Suhu Ruangan:  28.0°C                 │
│                                          │
│ Terakhir update: 14:30:15                │
└─────────────────────────────────────────┘
```

**✅ Success Criteria:**
- Data diterima setiap 500ms di browser console
- ESP32 log data sent every 5 seconds
- UI update real-time (heart rate ada pulse animation)
- Timestamp "Terakhir update" berubah setiap detik
- No errors di console

**📝 Performance Check:**
| Metric | Expected | How to Verify |
|--------|----------|---------------|
| Data Rate | 2 packets/sec | Browser console: count logs |
| UI Latency | <100ms | Visual: heart rate pulse smooth |
| Connection | Stable | No disconnect messages |
| Memory | Stable | Browser Task Manager: no leak |

---

### **Test 3.3: Firebase Upload Verification**

**Goal:** Memastikan data ter-upload ke Firebase

**Steps:**
```
1. Buka Firebase Console: https://console.firebase.google.com/
2. Select project: testing-5db96
3. Navigate to: Realtime Database
4. Look for: realtimeSensorData/{deviceID}/
   (Example: realtimeSensorData/7C-2C-67-FF-FE-7C/)
5. Watch data update setiap 1 detik
```

**Expected: Firebase Database Structure:**
```json
{
  "realtimeSensorData": {
    "7C-2C-67-FF-FE-7C": {
      "deviceID": "7C:2C:67:FF:FE:7C",
      "deviceName": "CareRing-FE7C",
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

**✅ Success Criteria:**
- Path `realtimeSensorData/{deviceID}` exists
- Data update setiap 1 detik (timestamp berubah)
- All fields present dan valid
- `uploadedVia` = "BLE-Bridge"

**❌ If Firebase upload fails:**

Check Browser Console for error:
```
❌ Firebase upload failed: ...
```

Common causes:
- No internet connection
- Firebase rules restrictive
- Firebase quota exceeded
- Wrong Firebase config

---

### **Test 3.4: Disconnect & Reconnect**

**Goal:** Memastikan disconnect/reconnect handling works

**Test 3.4a: Manual Disconnect from Web App**

**Steps:**
```
1. Di web app, click: "Putuskan Perangkat"
2. Confirm dialog
3. Wait...
```

**Expected: Browser Console:**
```
🔌 Disconnecting from BLE device...
✅ Notifications stopped
✅ GATT Server disconnected
✅ Event listeners removed

═══════════════════════════════════════════════════════
   ✅ SUCCESSFULLY DISCONNECTED
═══════════════════════════════════════════════════════
```

**Expected: ESP32 Serial Monitor:**
```
╔══════════════════════════════════════════════════════╗
║  ❌ WEB APP DISCONNECTED!                           ║
╚══════════════════════════════════════════════════════╝
⚠️  Connection lost with web app
🔄 Restarting BLE advertising...
✅ Advertising restarted - Device discoverable again
⏳ Waiting for web app to reconnect...
════════════════════════════════════════════════════════
```

**Expected: Web App UI:**
- ✅ Status badge merah: "Terputus"
- ✅ Section "📡 Data BLE Real-time" hidden
- ✅ Tombol "Putuskan Perangkat" disabled
- ✅ Data display reset ke "--"

**Test 3.4b: Reconnect**

**Steps:**
```
1. Click "Cari Perangkat BLE" lagi
2. Scan & select CareRing-FE7C
3. Wait...
```

**Expected:**
- ✅ Connection berhasil seperti Test 3.1
- ✅ Data streaming kembali normal
- ✅ Firebase upload resume

**Test 3.4c: ESP32 Disconnect (Physical)**

**Steps:**
```
1. With web app connected
2. Press ESP32 RESET button OR unplug USB
3. Watch browser console
```

**Expected: Browser Console:**
```
⚠️ BLE disconnected
```

**Expected: Web App UI:**
- ✅ Auto-detect disconnect
- ✅ Status badge update to "Terputus"
- ✅ Section "📡 Data BLE Real-time" hidden

**Test 3.4d: ESP32 Reconnect (Physical)**

**Steps:**
```
1. Replug USB atau wait ESP32 boot
2. Press button to activate BLE
3. Reconnect from web app
```

**Expected:**
- ✅ Web app bisa scan & find device lagi
- ✅ Connection berhasil
- ✅ Data streaming kembali normal

---

## 🎯 Testing Phase 4: Stress Test

### **Test 4.1: Long Duration Test**

**Goal:** Memastikan system stabil dalam jangka waktu lama

**Steps:**
```
1. Connect ESP32 ke web app
2. Leave it running for 30 minutes
3. Monitor periodically
```

**What to Check:**

| Time | Check | Expected |
|------|-------|----------|
| Every 5 min | Browser console | No errors, data still streaming |
| Every 5 min | ESP32 Serial | Connection still ACTIVE |
| Every 5 min | Firebase | Data still updating |
| Every 5 min | UI | No lag, smooth animation |
| After 30 min | Memory usage | No significant increase |

**✅ Success Criteria:**
- Connection stable selama 30 menit
- No memory leaks (check Browser Task Manager)
- Data rate consistent (2 packets/sec ESP32, 1 upload/sec Firebase)
- No disconnects
- No errors

---

### **Test 4.2: Multiple Disconnect/Reconnect Cycles**

**Goal:** Memastikan reconnect mechanism robust

**Steps:**
```
For i = 1 to 5:
  1. Connect ESP32 ke web app
  2. Wait 30 seconds
  3. Disconnect from web app
  4. Wait 10 seconds
  5. Repeat
```

**✅ Success Criteria:**
- All 5 cycles berhasil connect & disconnect tanpa error
- Data streaming normal setiap cycle
- Firebase upload works setiap cycle
- No crashes or freezes

---

## 📊 Testing Summary Checklist

Gunakan checklist ini untuk verify semua test passed:

### **Phase 1: ESP32 Standalone** ✅
- [ ] Firmware upload berhasil tanpa error
- [ ] Boot sequence lengkap di Serial Monitor
- [ ] Device ID & Name ter-generate dengan benar
- [ ] Sensors initialized (atau simulated data)
- [ ] BLE activation berhasil (after button press)
- [ ] "BLE ADVERTISING ACTIVE" message muncul
- [ ] Sensor readings reasonable (atau simulated)

### **Phase 2: Web App Standalone** ✅
- [ ] Web app loads tanpa error
- [ ] Login berhasil
- [ ] BLE Handler module loaded
- [ ] Modal BLE Scanner bisa dibuka
- [ ] Browser support Web Bluetooth (`navigator.bluetooth` defined)

### **Phase 3: Integration** ✅
- [ ] Web app bisa scan & menemukan ESP32
- [ ] Connection berhasil tanpa error
- [ ] ESP32 detect web app connected
- [ ] Data streaming 2 packets/sec (ESP32 → Web)
- [ ] UI update real-time dengan pulse animation
- [ ] Firebase upload 1x/sec (Web → Firebase)
- [ ] Firebase data structure correct
- [ ] Manual disconnect works (web app)
- [ ] Auto-reconnect works (ESP32)
- [ ] Physical disconnect detected (ESP32 reset)
- [ ] Physical reconnect works

### **Phase 4: Stress Test** ✅
- [ ] 30-minute stability test passed
- [ ] No memory leaks
- [ ] 5 disconnect/reconnect cycles passed
- [ ] Performance consistent throughout

---

## 🐛 Troubleshooting Decision Tree

```
┌─ Problem: Device not found in scan
│
├─ ESP32 Serial shows "BLE_ACTIVE"?
│  ├─ NO → Press button to activate BLE
│  └─ YES → Continue
│
├─ Device already paired in Windows Settings?
│  ├─ YES → Remove pairing, scan again
│  └─ NO → Continue
│
├─ Restart Bluetooth on computer?
│  ├─ Try this
│  └─ Scan again
│
└─ Still not working?
   └─ Re-upload firmware, restart everything


┌─ Problem: Connection fails
│
├─ Browser Console shows "No Services"?
│  ├─ YES → Firmware issue, re-upload
│  └─ NO → Continue
│
├─ Browser Console shows "NetworkError"?
│  ├─ YES → Device too far, move closer
│  └─ NO → Continue
│
├─ ESP32 crashes after connect?
│  └─ Check RAM usage, might be out of memory


┌─ Problem: Data not streaming
│
├─ Browser Console shows "Received BLE data"?
│  ├─ NO → Connection lost, check ESP32 Serial
│  └─ YES → Continue
│
├─ UI not updating but console OK?
│  ├─ YES → UI bug, refresh page
│  └─ NO → Continue
│
├─ Firebase upload fails?
│  └─ Check internet, Firebase rules, quota


┌─ Problem: Firebase upload not working
│
├─ Browser Console shows "Firebase upload failed"?
│  ├─ YES → Check error details
│  └─ NO → Data not reaching upload function
│
├─ Check internet connection
│  └─ Try open firebase.google.com
│
├─ Check Firebase rules
│  └─ Should allow .write = true for testing
│
└─ Check Firebase quota
   └─ Free tier: 1GB storage, 10GB bandwidth/month
```

---

## 📞 Getting Help

Jika masih ada masalah setelah testing:

1. **Capture Screenshots:**
   - ESP32 Serial Monitor (full boot + error)
   - Browser Console (F12) - all errors
   - Firebase Console (data structure)
   - Web App UI (connection status)

2. **Collect Information:**
   - ESP32 model & firmware version
   - Browser version (Chrome/Edge)
   - OS version (Windows/Mac/Linux)
   - Firebase project ID
   - Device Name from ESP32

3. **Check Documentation:**
   - `INTEGRATION_GUIDE.md` - Setup guide
   - `BLE_Implementation_Guide.md` - Web app details
   - `ESP32_BLE_Setup_Guide.md` - ESP32 firmware details

---

## 🎉 Success Example Output

Jika semua test PASSED, Anda akan lihat:

**ESP32 Serial Monitor:**
```
✅ SYSTEM READY!
🟢 State: MAIN
📊 Stats:
   • Packets sent: 1234
   • Rate: 2 packets/sec
   • Connection: ACTIVE ✓
   • Uptime: 30 minutes
```

**Browser Console:**
```
✅ Data uploaded to Firebase: /realtimeSensorData/7C-2C-67-FF-FE-7C
📊 UI Updated with BLE data: {hr: 72, spo2: 98, temp: 36.5, amb: 28}
[No errors in console]
```

**Web App UI:**
```
Status: Terhubung ✓ (GREEN)
📡 Data BLE Real-time
❤️ Heart Rate: 72 BPM 💓
💧 SpO2: 98%
🌡️ Suhu Tubuh: 36.5°C
🏠 Suhu Ruangan: 28.0°C
Terakhir update: 14:30:15
```

**Firebase Console:**
```
realtimeSensorData/
  └── 7C-2C-67-FF-FE-7C/
      ├── heartRate: 72
      ├── timestamp: 1701234567890 (updating every second)
      └── uploadedVia: "BLE-Bridge"
```

**🎉 CONGRATULATIONS! System is working perfectly!**

---

**Last Updated:** 2025-12-04
**Version:** 1.0.0
**Author:** Claude Code for CARERING Project
