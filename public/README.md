# CARERING Healthcare - Struktur Folder

## 📁 Struktur Direktori

```
public/
├── 📄 index.html                    # ✅ SPA UTAMA - Halaman utama Single Page Application
├── 📄 app.html                      # ✅ SPA ALTERNATIF - Versi SPA alternatif
├── 📄 login.html                    # ✅ AKTIF - Halaman login
├── 📄 register.html                 # ✅ AKTIF - Halaman registrasi
├── 📄 404.html                      # ✅ AKTIF - Halaman error 404
│
├── 📂 old-multipage/                # ⚠️ DEPRECATED - File multipage lama (JANGAN DIPAKAI)
│   ├── index-old-multipage.html     # Halaman utama versi multipage lama
│   ├── history.html                 # Halaman riwayat (deprecated)
│   │
│   ├── 📂 redirects/                # File redirect ke SPA
│   │   ├── ai-chat.html             # Redirect ke app.html#ai-chat
│   │   ├── forum.html               # Redirect ke app.html#forum
│   │   ├── news.html                # Redirect ke app.html#news
│   │   ├── perangkat.html           # Redirect ke app.html#perangkat
│   │   ├── profil.html              # Redirect ke app.html#profil
│   │   └── redirect.html            # Template redirect
│   │
│   └── 📂 admin/                    # Admin panel lama
│       ├── admin.html               # Dashboard admin (deprecated)
│       └── login-admin.html         # Login admin (deprecated)
│
├── 📂 tests/                        # 🧪 File testing & development
│   └── test-ble.html                # Testing koneksi BLE
│
├── 📂 backup-multipage/             # 💾 Backup file multipage asli
│
├── 📂 images/                       # 🖼️ Asset gambar
│
├── 📂 cari_perangkat/               # 📡 File terkait pencarian perangkat
│
├── 📄 script.js                     # ✅ AKTIF - Main JavaScript
├── 📄 auth-guard.js                 # ✅ AKTIF - Authentication guard
├── 📄 ble-handler.js                # ✅ AKTIF - Bluetooth Low Energy handler
├── 📄 ble-indicator.js              # ✅ AKTIF - BLE connection indicator
├── 📄 style.css                     # ✅ AKTIF - Main stylesheet
├── 📄 manifest.json                 # ✅ AKTIF - PWA manifest
├── 📄 sw.js.bak                     # ⚠️ Service Worker (disabled untuk debugging)
└── 📄 README.md                     # 📖 Dokumentasi ini
```

---

## 🚀 File yang AKTIF Digunakan (SPA)

### **Halaman Utama:**
- ✅ `index.html` - **Single Page Application UTAMA**
- ✅ `app.html` - **SPA Alternatif** (sama seperti index.html)
- ✅ `login.html` - Halaman login
- ✅ `register.html` - Halaman registrasi

### **JavaScript:**
- ✅ `script.js` - Main logic & Firebase integration
- ✅ `auth-guard.js` - Authentication & route protection
- ✅ `ble-handler.js` - Bluetooth connection handler
- ✅ `ble-indicator.js` - BLE status indicator widget

### **CSS:**
- ✅ `style.css` - Main stylesheet untuk semua halaman

### **PWA:**
- ✅ `manifest.json` - Progressive Web App manifest
- ⚠️ `sw.js.bak` - Service Worker (currently disabled)

---

## ⚠️ File yang TIDAK DIGUNAKAN (Deprecated)

### **Folder `old-multipage/`:**
File-file multipage lama yang sudah **TIDAK DIGUNAKAN**. Semua halaman sudah digabung menjadi SPA di `index.html` dan `app.html`.

**JANGAN edit file di folder ini!** Hanya untuk referensi/backup.

### **Folder `old-multipage/redirects/`:**
File redirect dari URL multipage lama ke SPA. File-file ini hanya redirect user ke versi SPA.

Contoh:
- `perangkat.html` → redirect ke `app.html#perangkat`
- `forum.html` → redirect ke `app.html#forum`

---

## 📖 Cara Menggunakan

### **Untuk Development:**

1. **Jalankan local server:**
   ```bash
   # Menggunakan Python
   python -m http.server 8080

   # Atau menggunakan Live Server di VS Code
   # Klik kanan index.html → Open with Live Server
   ```

2. **Akses aplikasi:**
   ```
   http://localhost:8080/index.html
   ```

3. **Navigasi SPA:**
   - Home: `http://localhost:8080/index.html#home`
   - Perangkat: `http://localhost:8080/index.html#perangkat`
   - AI Chat: `http://localhost:8080/index.html#ai-chat`
   - Forum: `http://localhost:8080/index.html#forum`
   - News: `http://localhost:8080/index.html#news`
   - Profil: `http://localhost:8080/index.html#profil`

### **Untuk Production:**

Upload semua file **KECUALI** folder:
- ❌ `old-multipage/`
- ❌ `tests/`
- ❌ `backup-multipage/`

---

## 🔧 Troubleshooting

### **Service Worker Error:**
Jika terjadi error Service Worker (sw.js):

1. **Disable Service Worker:**
   File `sw.js` sudah di-rename menjadi `sw.js.bak` untuk disable.

2. **Clear Browser Cache:**
   - Buka DevTools (F12)
   - Tab Application → Storage
   - Klik "Clear site data"
   - Refresh halaman

3. **Gunakan Incognito Mode:**
   - Chrome: `Ctrl + Shift + N`
   - Edge: `Ctrl + Shift + P`

### **File JavaScript Gagal Load:**
Pastikan path file benar:
```html
<script src="/script.js"></script>
<script src="/auth-guard.js"></script>
<script src="/ble-handler.js"></script>
<script src="/ble-indicator.js"></script>
```

---

## 📝 Catatan untuk Tim

1. **Edit hanya file SPA:**
   - `index.html` atau `app.html` untuk struktur halaman
   - `script.js` untuk logic utama
   - `style.css` untuk styling

2. **JANGAN edit file di `old-multipage/`:**
   Folder ini hanya untuk backup dan referensi.

3. **Testing:**
   File testing ada di folder `tests/`

4. **BLE (Bluetooth):**
   - Handler: `ble-handler.js`
   - Indicator widget: `ble-indicator.js`
   - Persistent connection support sudah aktif

---

## 📌 Version

- **Current Version:** SPA v2.0
- **Last Updated:** 2025-12-05
- **Architecture:** Single Page Application (SPA)
- **Framework:** Vanilla JS (No framework)

---

## 👥 Untuk Teman-Teman Developer

**Jika bingung mau edit apa:**

1. **Edit halaman/UI:** → `index.html` atau `app.html`
2. **Edit logic/fungsi:** → `script.js`
3. **Edit tampilan:** → `style.css`
4. **Edit BLE connection:** → `ble-handler.js`

**JANGAN sentuh folder `old-multipage/` kecuali mau lihat backup!**

---

Dibuat dengan ❤️ oleh Tim CARERING Healthcare
