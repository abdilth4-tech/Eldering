# 🪟 Panduan Lengkap untuk Pengguna Windows

Tutorial khusus menjalankan aplikasi CARERING di **Windows 10/11**

---

## 📋 Persiapan Awal

### Cek Python (Biasanya Sudah Terinstall)

1. Tekan `Win + R`
2. Ketik `cmd` dan tekan Enter
3. Ketik: `python --version`

**Jika muncul versi Python (misal: Python 3.11.0):**
✅ Python sudah terinstall, lanjut ke [Cara 1](#cara-1-python-http-server-termudah)

**Jika muncul error "python is not recognized":**
❌ Python belum terinstall, gunakan [Cara 2](#cara-2-vs-code-live-server-paling-populer) atau install Python dulu

---

## 🚀 Cara 1: Python HTTP Server (Termudah)

### Langkah-langkah:

**1. Buka Command Prompt:**
- Tekan `Win + R`
- Ketik `cmd`
- Tekan Enter

**2. Masuk ke Folder Public:**
```cmd
cd D:\cering\CARERING\public
```

**3. Jalankan Server:**
```cmd
python -m http.server 8080
```

**Jika muncul error, coba:**
```cmd
py -m http.server 8080
```

**4. Lihat Output:**
```
Serving HTTP on :: port 8080 (http://[::]:8080/) ...
```

**5. Buka Browser:**
- Chrome atau Edge
- Ketik di address bar: `http://localhost:8080`
- Tekan Enter

**6. Matikan Server:**
- Kembali ke Command Prompt
- Tekan `Ctrl + C`

---

## 💻 Cara 2: VS Code Live Server (Paling Populer)

### Langkah-langkah:

**1. Download & Install VS Code:**
- Buka: https://code.visualstudio.com/
- Download untuk Windows
- Install seperti biasa (Next, Next, Install)

**2. Buka Folder Proyek:**
- Buka VS Code
- Klik `File` > `Open Folder`
- Pilih folder `D:\cering\CARERING`
- Klik `Select Folder`

**3. Install Extension Live Server:**
- Klik icon Extensions (kotak 4 persegi) di sidebar kiri
- Atau tekan `Ctrl + Shift + X`
- Ketik "**Live Server**" di search box
- Cari yang oleh **Ritwick Dey**
- Klik **Install**

**4. Jalankan Live Server:**
- Di Explorer VS Code (sidebar kiri), expand folder `public`
- Klik kanan pada file `index.html`
- Pilih **"Open with Live Server"**

**5. Browser Otomatis Terbuka:**
- URL: `http://localhost:5500`
- Atau klik icon "Go Live" di status bar (pojok kanan bawah)

**6. Matikan Server:**
- Klik "Port: 5500" di status bar VS Code

---

## 🌐 Cara 3: Node.js http-server

### Persiapan (Sekali Saja):

**1. Install Node.js:**
- Download: https://nodejs.org/
- Pilih versi **LTS** (Long Term Support)
- Install seperti biasa
- Restart Command Prompt setelah install

**2. Install http-server:**
```cmd
npm install -g http-server
```

### Menjalankan:

**1. Buka Command Prompt:**
- Tekan `Win + R`, ketik `cmd`, Enter

**2. Masuk ke Folder:**
```cmd
cd D:\cering\CARERING\public
```

**3. Jalankan Server:**
```cmd
http-server -p 8080
```

**4. Akses:**
- Buka browser
- Ketik: `http://localhost:8080`

**5. Matikan:**
- Tekan `Ctrl + C` di Command Prompt

---

## 🔧 Mengaktifkan Bluetooth di Windows

### Windows 11:

1. Tekan `Win + I` (Settings)
2. Klik **Bluetooth & devices**
3. Toggle **Bluetooth** ke **On**
4. Pastikan ESP32 terdeteksi

### Windows 10:

1. Tekan `Win + I` (Settings)
2. Klik **Devices**
3. Klik **Bluetooth & other devices**
4. Toggle **Bluetooth** ke **On**

### Troubleshooting Bluetooth:

**Jika Bluetooth tidak ada:**
- Laptop/PC Anda mungkin tidak punya Bluetooth built-in
- Solusi: Beli **USB Bluetooth Adapter** (Rp 50.000-150.000)

**Jika Bluetooth error:**
1. Buka **Device Manager** (`Win + X` > Device Manager)
2. Expand **Bluetooth**
3. Klik kanan adapter > **Update Driver**
4. Pilih **Search automatically**

**Restart Bluetooth Service:**
1. Tekan `Win + R`
2. Ketik `services.msc`
3. Cari **Bluetooth Support Service**
4. Klik kanan > **Restart**

---

## 🌍 Setting Default Browser

### Set Chrome sebagai Default:

1. Buka **Chrome**
2. Klik titik 3 pojok kanan atas
3. **Settings**
4. Klik **Default browser**
5. Klik **Make default**

### Set Edge sebagai Default:

1. Buka **Edge**
2. Klik titik 3 pojok kanan atas
3. **Settings**
4. Klik **Default browser**
5. Klik **Make default**

---

## 🛡️ Firewall & Antivirus

### Jika Aplikasi Diblokir Firewall:

**Windows Firewall:**
1. Tekan `Win + R`
2. Ketik `firewall.cpl`, Enter
3. Klik **Allow an app or feature through Windows Defender Firewall**
4. Klik **Change settings**
5. Cari **Python** atau **http-server**
6. Centang **Private** dan **Public**
7. Klik **OK**

### Jika Antivirus Blokir:

**Matikan sementara (untuk testing):**
- Buka antivirus Anda (Avast, AVG, Norton, dll)
- Disable protection selama 10 menit
- Jalankan aplikasi
- Jangan lupa aktifkan lagi!

**Whitelist (Recommended):**
- Tambahkan folder `D:\cering\CARERING` ke whitelist/exclusion
- Tambahkan `python.exe` ke whitelist

---

## 🐛 Troubleshooting Windows

### ❌ Error: "Port already in use"

**Cari aplikasi yang pakai port:**
```cmd
netstat -ano | findstr :8080
```

Output contoh:
```
TCP    0.0.0.0:8080    0.0.0.0:0    LISTENING    1234
```

**Matikan proses (ganti 1234 dengan PID dari output):**
```cmd
taskkill /PID 1234 /F
```

---

### ❌ Error: "python is not recognized"

**Solusi 1: Install Python**
- Download: https://www.python.org/downloads/
- **PENTING:** Centang "Add Python to PATH" saat install
- Restart Command Prompt

**Solusi 2: Gunakan `py` instead:**
```cmd
py -m http.server 8080
```

---

### ❌ Error: "Access Denied" saat jalankan CMD

**Solusi: Run as Administrator**
1. Tekan `Win + R`
2. Ketik `cmd`
3. Tekan `Ctrl + Shift + Enter` (Run as Admin)
4. Klik **Yes**

---

### ❌ Bluetooth tidak detect ESP32

**Checklist:**
- ✅ ESP32 menyala
- ✅ ESP32 dalam mode pairing (LED berkedip)
- ✅ Bluetooth Windows aktif
- ✅ Browser: Chrome atau Edge (BUKAN Firefox)
- ✅ URL: `http://localhost:XXXX` (bukan `file://`)

**Reset Bluetooth Windows:**
1. Settings > Bluetooth & devices
2. Klik **More Bluetooth settings**
3. Tab **Hardware**
4. Pilih Bluetooth adapter
5. **Disable** > **Enable**

---

### ❌ ERR_CONNECTION_REFUSED

**Penyebab:**
- Server tidak jalan
- Port salah
- Firewall blokir

**Solusi:**
1. Pastikan server jalan (cek Command Prompt)
2. Cek port yang digunakan (8080? 5500?)
3. Coba port lain: `python -m http.server 8081`
4. Matikan firewall sementara untuk testing

---

## 📱 Tips & Tricks Windows

### Shortcut Berguna:

| Shortcut | Fungsi |
|----------|--------|
| `Win + R` | Run dialog |
| `Win + I` | Settings |
| `Win + X` | Quick menu |
| `Win + E` | File Explorer |
| `Ctrl + Shift + Esc` | Task Manager |
| `F12` | Browser Developer Tools |
| `Ctrl + F5` | Hard reload browser |

---

### Buka Command Prompt Langsung di Folder:

**Cara 1: Address Bar**
1. Buka File Explorer
2. Navigate ke `D:\cering\CARERING\public`
3. Klik di **address bar**
4. Ketik `cmd`
5. Enter

**Cara 2: Shift + Right Click**
1. Buka File Explorer
2. Navigate ke `D:\cering\CARERING\public`
3. Tekan `Shift` + klik kanan di area kosong
4. Pilih **"Open PowerShell window here"** atau **"Open Command Prompt here"**

---

### Check Port yang Digunakan:

```cmd
netstat -ano | findstr LISTENING
```

---

### Clear Browser Cache (Chrome):

1. Tekan `Ctrl + Shift + Delete`
2. Pilih **Cached images and files**
3. Time range: **All time**
4. Klik **Clear data**

---

## 🎯 Rekomendasi Setup Windows

### Browser:
1. **Google Chrome** ⭐⭐⭐⭐⭐ (Terbaik)
2. **Microsoft Edge** ⭐⭐⭐⭐⭐ (Built-in Windows)

### Code Editor:
- **VS Code** ⭐⭐⭐⭐⭐ (Gratis, ringan, powerful)

### Terminal:
- **Windows Terminal** (Download dari Microsoft Store - Modern & Bagus)
- Command Prompt (Built-in)
- PowerShell (Built-in)

---

## ✅ Checklist Sebelum Mulai

- [ ] Browser Chrome/Edge terinstall
- [ ] Python terinstall (atau VS Code + Live Server)
- [ ] Bluetooth aktif (jika pakai ESP32)
- [ ] Koneksi internet aktif
- [ ] Firewall tidak blokir
- [ ] Port 8080/5500 tidak digunakan aplikasi lain

---

## 🎬 Video Tutorial (Jika Ada)

Simak video tutorial di YouTube: [Link akan ditambahkan]

---

## 📞 Bantuan Lebih Lanjut

**Dokumentasi Lengkap:**
- `TUTORIAL_MENJALANKAN_APLIKASI.md` - Tutorial detail semua platform
- `QUICK_START.md` - Quick start guide
- `README.md` - Informasi proyek

**Jika Masih Bermasalah:**
1. Screenshot error
2. Catat versi Windows (Win + R > `winver`)
3. Catat versi browser
4. Laporkan ke developer

---

## 🎉 Selamat!

Aplikasi CARERING siap digunakan di Windows Anda!

**Selamat monitoring kesehatan! 💪**

---

*Khusus untuk Windows 10 & Windows 11*  
*Last Updated: Januari 2026*




