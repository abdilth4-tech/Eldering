# 🧪 TESTS - Testing Files

## 📋 Folder Testing & Development

Folder ini berisi file-file untuk **testing** dan **development**.

---

## 📁 File yang Ada:

### **`test-ble.html`**
- Testing koneksi Bluetooth Low Energy (BLE)
- Untuk testing ESP32 connection
- Debugging BLE handler

---

## 🚀 Cara Menggunakan:

1. **Jalankan local server:**
   ```bash
   python -m http.server 8080
   ```

2. **Akses file test:**
   ```
   http://localhost:8080/tests/test-ble.html
   ```

3. **Testing BLE:**
   - Pastikan ESP32 dalam mode pairing
   - Buka browser dengan support Web Bluetooth (Chrome/Edge)
   - Klik tombol connect dan pilih device

---

## ⚠️ Catatan:

- File di folder ini **TIDAK** diupload ke production
- Hanya untuk development & debugging
- Bisa ditambah file test lain sesuai kebutuhan

---

## 📝 Menambah File Test Baru:

Buat file test baru di folder ini:
```
tests/
├── test-ble.html          ← Existing
├── test-firebase.html     ← Contoh test Firebase
├── test-auth.html         ← Contoh test Authentication
└── test-sensors.html      ← Contoh test Sensor data
```

---

**Happy Testing! 🎉**
