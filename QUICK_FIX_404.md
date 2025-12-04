# 🔧 Quick Fix: Error 404 saat Klik "Tambah Perangkat Baru"

## 🐛 Masalah

Saat klik tombol "Tambah Perangkat Baru", muncul error 404 atau page tidak berfungsi.

## ✅ Root Cause

Service Worker (sw.js) **tidak include** file `ble-handler.js` yang baru, jadi browser pakai cached version lama.

## ✅ Sudah Diperbaiki

File `sw.js` sudah di-update:
- ✅ Added `ble-handler.js` ke dynamic files
- ✅ Cache version updated: v21 → v22

## 🚀 Cara Fix (3 Langkah Mudah)

### **Method 1: Hard Refresh (RECOMMENDED)**

Ini cara paling mudah dan cepat:

```
1. Buka Chrome/Edge
2. Navigate ke: http://localhost:8080/perangkat.html
3. Tekan: Ctrl + Shift + R (Windows/Linux)
   atau: Cmd + Shift + R (Mac)
4. Halaman akan reload dan clear cache
5. Try klik "Tambah Perangkat Baru" lagi
```

**Expected Result:**
- ✅ Modal BLE Scanner muncul (tidak redirect)
- ✅ No 404 error
- ✅ Button berfungsi normal

---

### **Method 2: Clear Cache via DevTools**

Kalau Method 1 tidak work:

```
1. Buka halaman: http://localhost:8080/perangkat.html
2. Tekan F12 (open DevTools)
3. Tab: Application
4. Sidebar kiri: Click "Storage"
5. Click: "Clear site data"
6. Check all boxes:
   ☑ Local storage
   ☑ Session storage
   ☑ IndexedDB
   ☑ Cache storage
   ☑ Cookies
7. Click: "Clear site data"
8. Close DevTools
9. Refresh page (F5)
10. Try klik "Tambah Perangkat Baru"
```

---

### **Method 3: Unregister Service Worker**

Kalau masih tidak work:

```
1. Buka: http://localhost:8080/perangkat.html
2. F12 → Tab: Application
3. Sidebar: Service Workers
4. Find: http://localhost:8080
5. Click: "Unregister"
6. Close browser completely (all tabs)
7. Open browser lagi
8. Navigate ke: http://localhost:8080/perangkat.html
9. Try klik "Tambah Perangkat Baru"
```

---

### **Method 4: Nuclear Option (Clear Everything)**

Kalau semua method di atas gagal:

```
1. Close semua Chrome/Edge windows
2. Open Chrome/Edge
3. Tekan: Ctrl + Shift + Delete
4. Time range: "All time"
5. Check:
   ☑ Browsing history
   ☑ Cookies and other site data
   ☑ Cached images and files
6. Click: "Clear data"
7. Close browser
8. Open browser lagi
9. Navigate ke: http://localhost:8080/perangkat.html
10. Login ulang
11. Try klik "Tambah Perangkat Baru"
```

---

## 🔍 Cara Verify Fix Berhasil

### **Check 1: Browser Console**

```
1. F12 → Console tab
2. Reload page
3. Cari message: "SW registered"
4. Cari message: "✅ BLE Handler module loaded"
```

**Expected Output:**
```
SW registered: http://localhost:8080/
✅ BLE Handler module loaded
   Available: window.BLEHandler.connect()
   Available: window.BLEHandler.disconnect()
   Available: window.BLEHandler.isConnected()
   Available: window.BLEHandler.getDeviceInfo()
```

### **Check 2: Service Worker Version**

```
1. F12 → Application tab
2. Sidebar: Service Workers
3. Look for: carering-static-v22
```

**Expected:**
- ✅ Version should be v22 (not v21)

### **Check 3: Network Tab**

```
1. F12 → Network tab
2. Reload page
3. Find: ble-handler.js
4. Check Status: 200 (not 404)
```

### **Check 4: Test Button**

```
1. Click: "Tambah Perangkat Baru"
2. Modal BLE Scanner harus muncul
3. No redirect, no 404
```

**Expected UI:**
```
┌─────────────────────────────────────────┐
│ Cari Perangkat Bluetooth            ✕  │
├─────────────────────────────────────────┤
│ Device ID / MAC Address (Opsional)     │
│ [Input field]                           │
│                                         │
│ Bluetooth Services UUID (Opsional)     │
│ [Input field]                           │
│                                         │
│ [Scan & Hubungkan Perangkat] Button    │
└─────────────────────────────────────────┘
```

---

## 🐛 If Still Not Working

### **Checklist:**

- [ ] Hard refresh sudah dilakukan (Ctrl+Shift+R)
- [ ] Cache cleared via DevTools
- [ ] Service worker unregistered
- [ ] Browser closed dan reopened
- [ ] Page reloaded setelah clear cache

### **Additional Debugging:**

**Check Browser Console for Errors:**

```javascript
1. F12 → Console
2. Look for RED errors
3. Common errors:
   - "Uncaught ReferenceError: openBLEScanner is not defined"
     → ble-handler.js not loaded
   - "Failed to load resource: net::ERR_FILE_NOT_FOUND"
     → File path wrong
   - "TypeError: Cannot read property of undefined"
     → Script loading order issue
```

**Check Network Tab:**

```
1. F12 → Network
2. Reload page
3. Check ALL these files load (Status 200):
   ✅ perangkat.html
   ✅ script.js
   ✅ auth-guard.js
   ✅ ble-handler.js ← IMPORTANT!
   ✅ style.css
```

**Manual Check ble-handler.js:**

```
1. Open new tab
2. Navigate to: http://localhost:8080/ble-handler.js
3. Should show JavaScript code (not 404)
```

---

## 💡 Prevention (For Future)

Agar masalah ini tidak terjadi lagi:

### **1. Always Update Cache Version**

Setiap kali ada perubahan file JavaScript:

```javascript
// sw.js
const STATIC_CACHE_NAME = 'carering-static-v23';  // ← INCREMENT!
const DYNAMIC_CACHE_NAME = 'carering-dynamic-v23'; // ← INCREMENT!
```

### **2. Add New Files to dynamicFiles**

Setiap kali buat file .js atau .css baru:

```javascript
// sw.js
const dynamicFiles = [
  'style.css',
  'script.js',
  'auth.js',
  'auth-guard.js',
  'ble-handler.js',
  'your-new-file.js'  // ← ADD HERE!
];
```

### **3. Test with Hard Refresh**

Setelah update code:
```
1. Save files
2. Go to browser
3. Ctrl + Shift + R (hard refresh)
4. Test functionality
```

### **4. Use Incognito Mode for Testing**

Untuk testing tanpa cache:
```
1. Ctrl + Shift + N (open incognito)
2. Navigate to site
3. Test features
4. Close incognito (auto-clear cache)
```

---

## 📞 Still Having Issues?

Jika setelah semua method di atas masih error:

### **Collect Debug Info:**

```
1. Browser Console (F12):
   - Screenshot all RED errors

2. Network Tab:
   - Screenshot file requests
   - Note which files return 404

3. Application Tab → Service Workers:
   - Screenshot active service worker
   - Note version number

4. Try in different browser:
   - Test di Chrome
   - Test di Edge
   - Compare results
```

### **Quick Test: Disable Service Worker**

```
1. F12 → Application → Service Workers
2. Check: "Bypass for network"
3. Reload page
4. Try button
5. If works → Service worker issue
6. If not → JavaScript error
```

---

## ✅ Success Indicators

Anda berhasil fix masalah jika:

- ✅ Click "Tambah Perangkat Baru" → Modal muncul
- ✅ Console shows: "✅ BLE Handler module loaded"
- ✅ Network tab shows: ble-handler.js Status 200
- ✅ Service Worker version: v22
- ✅ No errors in console
- ✅ No 404 redirects

---

## 🎯 TL;DR (Too Long; Didn't Read)

**Problem:** Button "Tambah Perangkat Baru" → 404 error

**Cause:** Service Worker cache old version, missing ble-handler.js

**Fix:**
```
1. Ctrl + Shift + R (hard refresh)
2. If not work: F12 → Application → Clear site data
3. Try button again
```

**Verify:**
```
- Modal muncul (not redirect)
- Console: "BLE Handler module loaded"
- No errors
```

---

**Fixed:** 2025-12-04
**File Updated:** sw.js (v21 → v22)
**Added:** ble-handler.js to dynamic files
