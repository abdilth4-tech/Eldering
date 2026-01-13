# ⚡ Quick Start Guide - CARERING

Panduan cepat untuk menjalankan aplikasi CARERING di localhost dalam **5 menit**!

---

## 🚀 Cara Tercepat (Live Server)

### 1️⃣ Install Live Server di VS Code
- Buka VS Code
- Tekan `Ctrl + Shift + X`
- Cari "**Live Server**"
- Klik **Install**

### 2️⃣ Jalankan Aplikasi
- Buka folder `CARERING` di VS Code
- Masuk ke folder `public/`
- Klik kanan `index.html`
- Pilih **"Open with Live Server"**

### 3️⃣ Akses Aplikasi
```
http://localhost:5500
```

**SELESAI!** ✅

---

## 🐍 Alternatif: Python (Tanpa Install Apapun)

Jika sudah punya Python:

```bash
cd D:\cering\CARERING\public
python -m http.server 8080
```

Akses: `http://localhost:8080`

---

## 📱 Langkah Selanjutnya

### 1. Login/Register
- Gunakan email & password
- Atau login dengan Google

### 2. Hubungkan ESP32 (Opsional)
- Klik menu **Perangkat**
- Klik **"Hubungkan Perangkat"**
- Pilih **ESP32-C3**
- Browser harus **Chrome** atau **Edge**

### 3. Lihat Dashboard
- Data real-time akan muncul
- Grafik kesehatan otomatis update

---

## ⚠️ Troubleshooting Cepat

| Masalah | Solusi |
|---------|--------|
| Port sudah digunakan | Ganti port: `python -m http.server 8081` |
| Bluetooth tidak muncul | Gunakan Chrome/Edge, bukan Firefox |
| Service Worker error | Jangan buka dengan double-click, harus via HTTP server |
| Firebase error | Cek koneksi internet |
| Data tidak muncul | Refresh page (`F5`) dan cek koneksi ESP32 |

---

## 📖 Dokumentasi Lengkap

Untuk tutorial detail, lihat:
- **`TUTORIAL_MENJALANKAN_APLIKASI.md`** - Tutorial lengkap step-by-step
- **`README.md`** - Informasi proyek
- **`ESP32_BLE_Setup_Guide.md`** - Setup ESP32

---

## 🎯 Sistem Requirement

✅ Browser: Chrome 90+ atau Edge 90+  
✅ Internet: Untuk Firebase  
✅ Bluetooth: Untuk koneksi ESP32 (opsional)

---

## 🔗 URL Penting

- **Localhost**: `http://localhost:5500` atau `http://localhost:8080`
- **Firebase Console**: https://console.firebase.google.com
- **Project ID**: testing-5db96

---

**Selamat mencoba! 🎉**

*Butuh bantuan lebih? Buka `TUTORIAL_MENJALANKAN_APLIKASI.md`*



