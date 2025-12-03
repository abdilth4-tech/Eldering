# CARERING Healthcare - Panduan Menjalankan Proyek

Proyek ini adalah aplikasi web kesehatan yang menggunakan Firebase untuk autentikasi dan database real-time.

## 📋 Persyaratan

- Web browser modern (Chrome, Firefox, Edge)
- Koneksi internet (untuk Firebase SDK)
- Python 3.x (opsional, untuk server lokal)

## 🚀 Cara Menjalankan Proyek

### Opsi 1: Menggunakan Live Server (VS Code) - **DISARANKAN**

1. Install ekstensi **Live Server** di VS Code
2. Klik kanan pada file `public/index.html`
3. Pilih **"Open with Live Server"**
4. Browser akan otomatis terbuka di `http://localhost:5500`

### Opsi 2: Menggunakan Python HTTP Server

1. Buka terminal di folder proyek
2. Jalankan perintah:
   ```bash
   cd public
   python -m http.server 8080
   ```
3. Buka browser dan akses: `http://localhost:8080`

### Opsi 3: Menggunakan Node.js http-server

1. Install http-server secara global:
   ```bash
   npm install -g http-server
   ```
2. Jalankan server:
   ```bash
   cd public
   http-server -p 8080
   ```
3. Buka browser dan akses: `http://localhost:8080`

### Opsi 4: Menggunakan Firebase Emulator

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Login ke Firebase:
   ```bash
   firebase login
   ```
3. Jalankan emulator:
   ```bash
   firebase emulators:start --only hosting
   ```
4. Buka browser dan akses: `http://localhost:5000`

## 📁 Struktur Proyek

```
CARERING/
├── public/              # Folder utama aplikasi
│   ├── index.html      # Halaman utama
│   ├── login.html      # Halaman login
│   ├── register.html   # Halaman registrasi
│   ├── script.js       # Logika utama aplikasi
│   ├── auth.js         # Logika autentikasi
│   ├── style.css       # Styling aplikasi
│   └── ...
├── firebase.json       # Konfigurasi Firebase Hosting
└── README.md          # File ini
```

## 🔧 Konfigurasi

Proyek ini sudah dikonfigurasi dengan Firebase:
- **Project ID**: testing-5db96
- **Database**: Realtime Database
- **Authentication**: Email/Password & Google Sign-In

## 📱 Fitur Aplikasi

- Dashboard kesehatan dengan data real-time
- Autentikasi pengguna (Login/Register)
- Monitoring data sensor kesehatan
- Forum diskusi
- AI Chat
- Berita kesehatan
- Riwayat data kesehatan

## ⚠️ Catatan Penting

1. **Service Worker**: Aplikasi menggunakan service worker, jadi harus dijalankan melalui HTTP server (bukan file://)
2. **Firebase**: Pastikan koneksi internet aktif untuk mengakses Firebase SDK
3. **CORS**: Beberapa fitur mungkin tidak berfungsi jika dibuka langsung dari file system

## 🐛 Troubleshooting

### Service Worker tidak terdaftar
- Pastikan aplikasi dijalankan melalui HTTP server, bukan file://
- Clear cache browser dan reload

### Firebase tidak terhubung
- Periksa koneksi internet
- Periksa konfigurasi Firebase di `public/script.js`

### Port sudah digunakan
- Gunakan port lain (misalnya 8081, 3000, dll)
- Atau tutup aplikasi yang menggunakan port tersebut

## 📝 Lisensi

Proyek ini dibuat untuk keperluan edukasi dan pengembangan.

