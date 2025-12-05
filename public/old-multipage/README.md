# ⚠️ DEPRECATED - OLD MULTIPAGE FILES

## 🚫 JANGAN GUNAKAN FILE DI FOLDER INI!

Folder ini berisi file-file **MULTIPAGE LAMA** yang sudah **TIDAK DIGUNAKAN**.

Semua halaman sudah digabung menjadi **Single Page Application (SPA)** di:
- `../index.html`
- `../app.html`

---

## 📁 Isi Folder Ini:

### **File Utama:**
- `index-old-multipage.html` - Halaman utama versi multipage lama
- `history.html` - Halaman riwayat (deprecated)

### **Folder `redirects/`:**
File redirect dari URL lama ke SPA baru:
- `perangkat.html` → redirect ke `app.html#perangkat`
- `forum.html` → redirect ke `app.html#forum`
- `news.html` → redirect ke `app.html#news`
- `ai-chat.html` → redirect ke `app.html#ai-chat`
- `profil.html` → redirect ke `app.html#profil`

### **Folder `admin/`:**
- `admin.html` - Dashboard admin (deprecated)
- `login-admin.html` - Login admin (deprecated)

---

## ✅ Yang Harus Digunakan:

Gunakan file SPA di folder `public/`:
```
../index.html        ← SPA UTAMA
../app.html          ← SPA Alternatif
../script.js         ← Main JavaScript
../style.css         ← Main Stylesheet
```

---

## 🤔 Kenapa Folder Ini Masih Ada?

1. **Backup** - Jaga-jaga kalau butuh referensi kode lama
2. **Redirect** - File di `redirects/` masih dipakai untuk redirect URL lama

---

## ⚠️ PERINGATAN

**JANGAN EDIT FILE DI SINI!**

Kalau mau edit aplikasi, edit file SPA di folder parent (`../`):
- `../index.html` untuk struktur halaman
- `../script.js` untuk logic
- `../style.css` untuk styling

---

Folder ini akan dihapus di versi production.
Hanya untuk development/backup.
