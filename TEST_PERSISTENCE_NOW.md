# 🧪 Test BLE Persistence - Quick Guide

## 🚀 **TESTING SEKARANG (5 Menit)**

### **STEP 1: Clear Cache & Reload** ⏱️ 30 detik

Buka **Developer Console (F12)** → Tab **Console**:

```javascript
(async function() {
  const regs = await navigator.serviceWorker.getRegistrations();
  for(let reg of regs) await reg.unregister();
  const keys = await caches.keys();
  for(let key of keys) await caches.delete(key);
  alert('✅ Done! Tekan CTRL+SHIFT+R');
})();
```

Setelah alert, tekan **Ctrl + Shift + R**

---

### **STEP 2: Connect di Halaman Perangkat** ⏱️ 1 menit

1. Buka: `http://localhost:8080/perangkat.html`
2. Klik **"Tambah Perangkat Baru"**
3. Klik **"Scan & Hubungkan Perangkat"**
4. Pilih **"CareRing"**
5. **TUNGGU** sampai console menunjukkan:

```
🔍 Scanning for CareRing devices...
✅ Device found: CareRing
💾 Device info saved to localStorage  ← PENTING!
🔌 Connecting to GATT Server...
✅ GATT Server connected
⏳ Waiting for connection to stabilize...
🔍 Getting BLE Service...
✅ Service found
✅ Characteristic found
✅ Notifications started
🎉 SUCCESSFULLY CONNECTED TO CARERING!
```

6. **VERIFY:** Data sensor muncul (Heart Rate, SpO2, dll)

---

### **STEP 3: Test Auto-Reconnect** ⏱️ 2 menit

#### **A. Pindah ke Halaman Home:**

1. Klik **Home** di bottom navigation
2. **BUKA CONSOLE (F12)**
3. **TUNGGU 2-3 DETIK**
4. **LIHAT CONSOLE LOG:**

**✅ Jika Berhasil (Auto-Reconnect Working):**
```
📋 Checking for saved device... Object
═══════════════════════════════════════════════════════
   🔄 AUTO-RECONNECT STARTING
═══════════════════════════════════════════════════════
   Device: CareRing
   ID: xxx-xxx
   Last connected: ...
═══════════════════════════════════════════════════════

⏰ Starting auto-reconnect attempt...
🔄 Attempting auto-reconnect to: CareRing
✅ Browser supports getDevices()
🔍 Getting authorized devices...
   Found 1 authorized device(s)
   1. CareRing (xxx-xxx)
✅ Target device found: CareRing
🔌 Reconnecting to GATT Server...
✅ GATT Server reconnected
⏳ Waiting for connection to stabilize...
🔍 Getting BLE Service...
✅ Auto-reconnect successful!
```

**Widget di pojok kanan atas berubah HIJAU!** 🟢

---

**❌ Jika Gagal (Auto-Reconnect NOT Working):**

Akan muncul salah satu error ini:

#### **Error 1: getDevices() Not Supported**
```
⚠️ BROWSER API NOT SUPPORTED
navigator.bluetooth.getDevices() not available
Required: Chrome 109+ or Edge 109+
```

**Solusi:**
- Update browser ke versi terbaru
- Atau gunakan manual reconnect (lanjut ke STEP 4)

#### **Error 2: Device Not Found**
```
❌ Device not found in authorized list
Looking for: CareRing (xxx-xxx)
```

**Solusi:**
- Kembali ke halaman Perangkat
- Scan ulang device

#### **Error 3: Connection Failed**
```
❌ Auto-reconnect failed: ...
```

**Solusi:**
- Gunakan manual reconnect (STEP 4)

---

### **STEP 4: Manual Reconnect** ⏱️ 30 detik

Jika auto-reconnect gagal, lihat **pojok kanan atas**:

**Widget BLE akan muncul dengan:**
```
🔴 CareRing (pulsing/berkedip)
   Terputus
   🔄 (tombol reconnect - juga pulsing)
```

**Klik tombol 🔄 (reconnect button)**

Console akan menunjukkan:
```
═══════════════════════════════════════════════════════
   🔄 MANUAL RECONNECT TRIGGERED
═══════════════════════════════════════════════════════

... (proses reconnect) ...

✅ Auto-reconnect successful!
```

**Widget berubah HIJAU!** 🟢

---

## 📊 **EXPECTED RESULTS**

### **✅ SUCCESS - Auto-Reconnect Working:**

1. **Console Log:**
   - Semua step dari "AUTO-RECONNECT STARTING" sampai "successful"
   - Tidak ada error merah

2. **UI:**
   - Widget BLE **HIJAU** di pojok kanan atas
   - Device name: "CareRing"
   - Status: "Terhubung"

3. **Behavior:**
   - Pindah ke halaman manapun → Widget tetap HIJAU
   - Data terus masuk ke Firebase
   - Tidak perlu scan ulang

### **❌ FAIL - Manual Reconnect Needed:**

1. **Console Log:**
   - Error "getDevices() not supported" ATAU
   - Error "Device not found" ATAU
   - Tidak ada log "AUTO-RECONNECT STARTING"

2. **UI:**
   - Widget BLE **MERAH** dengan tombol 🔄 (pulsing)
   - Status: "Terputus"

3. **Action Required:**
   - Klik tombol 🔄 untuk manual reconnect
   - Atau kembali ke halaman Perangkat dan scan ulang

---

## 🐛 **TROUBLESHOOTING**

### **Widget Tidak Muncul:**

**Check Console:**
```javascript
// Check BLE Handler loaded:
console.log(window.BLEHandler);

// Check localStorage:
console.log(localStorage.getItem('careringBLEDevice'));
```

**Jika hasilnya `undefined` atau `null`:**
- Refresh halaman (Ctrl + Shift + R)
- Pastikan `ble-handler.js` dan `ble-indicator.js` dimuat (check Network tab)

### **Auto-Reconnect Tidak Jalan:**

**Check Browser Version:**
```javascript
console.log(navigator.userAgent);
console.log('getDevices support:', !!navigator.bluetooth.getDevices);
```

**Jika `getDevices support: false`:**
- Update browser ke Chrome 109+ atau Edge 109+
- Gunakan manual reconnect button

### **Manual Reconnect Juga Gagal:**

**Kemungkinan:**
- ESP32 mati atau baterai habis
- ESP32 terlalu jauh dari komputer
- ESP32 tidak dalam mode advertising

**Solusi:**
1. Check ESP32 menyala (LED berkedip)
2. Dekatkan ESP32 ke komputer
3. Restart ESP32 (cabut-colok USB)
4. Kembali ke halaman Perangkat dan scan ulang

---

## 📸 **WHAT TO SCREENSHOT**

Jika berhasil, screenshot:
1. **Console log** lengkap (dari "AUTO-RECONNECT STARTING" sampai "successful")
2. **Widget BLE HIJAU** di pojok kanan atas
3. **Status badge "Terhubung"** di halaman Perangkat

Jika gagal, screenshot:
1. **Console log** dengan error merah
2. **Widget BLE MERAH** dengan tombol 🔄
3. Browser version (`navigator.userAgent`)

---

## ⏱️ **QUICK CHECKLIST**

Sebelum test:
- [ ] Cache sudah di-clear
- [ ] Hard refresh (Ctrl + Shift + R)
- [ ] ESP32 menyala dan advertising
- [ ] Device **TIDAK** terhubung di Windows Bluetooth Settings

Setelah connect di halaman Perangkat:
- [ ] Console log menunjukkan "💾 Device info saved to localStorage"
- [ ] Data sensor muncul
- [ ] Status badge "Terhubung" (hijau)

Setelah pindah halaman:
- [ ] Console dibuka (F12)
- [ ] Tunggu 2-3 detik
- [ ] Check console log untuk "AUTO-RECONNECT STARTING"
- [ ] Check widget di pojok kanan atas

---

**READY? START TESTING NOW! ⏱️**

Expected time: **5 minutes total**

Kabari saya dengan:
1. ✅ Berhasil - Screenshot widget hijau + console log
2. ❌ Gagal - Screenshot error + browser version

Good luck! 🚀
