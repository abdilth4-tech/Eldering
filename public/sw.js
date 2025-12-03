/* ======================================================
   File sw.js (Versi Perbaikan - Network First)
   ====================================================== */

// [PENTING] Ganti v21 menjadi v22, v23, dst. setiap kali Anda deploy update!
const STATIC_CACHE_NAME = 'carering-static-v21'; 
const DYNAMIC_CACHE_NAME = 'carering-dynamic-v21';

// File "App Shell" yang jarang berubah (font, icon, manifest)
const urlsToCache = [
  '/',
  '/index.html',
  '/news.html',
  '/perangkat.html',
  '/ai-chat.html',
  '/forum.html',
  '/profil.html',
  '/login.html',
  '/register.html',
  '/manifest.json',
  '/images/icon-192.png',
  '/images/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

// File yang SERING berubah (kode Anda)
const dynamicFiles = [
  'style.css',
  'script.js',
  'auth.js',
  'auth-guard.js'
];

// --- 1. Event Install ---
// Simpan App Shell & paksa aktivasi
self.addEventListener('install', event => {
  console.log('SW: Install event');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // [PERBAIKAN PENTING 1]
        // Paksa Service Worker baru untuk aktif segera
        console.log('SW: skipWaiting() dipanggil');
        return self.skipWaiting();
      })
  );
});

// --- 2. Event Activate ---
// Hapus cache lama & ambil alih kontrol
self.addEventListener('activate', event => {
  console.log('SW: Activate event');
  
  // Hapus cache lama
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Hapus semua cache yang BUKAN static atau dynamic yang sekarang
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('SW: Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // [PERBAIKAN PENTING 2]
      // Paksa Service Worker untuk mengambil alih kontrol halaman
      console.log('SW: clients.claim() dipanggil');
      return self.clients.claim();
    })
  );
});

// --- 3. Event Fetch (STRATEGI BARU) ---
self.addEventListener('fetch', event => {
  
  const requestUrl = new URL(event.request.url);

  // Cek apakah ini file dinamis (script.js, style.css, dll)
  const isDynamicFile = dynamicFiles.some(file => requestUrl.pathname.endsWith(file));

  if (isDynamicFile) {
    // --- Network First Strategy (untuk script.js, dll) ---
    // Selalu coba ambil dari network (file baru)
    event.respondWith(
      fetch(event.request)
        .then(fetchResponse => {
          // Jika berhasil, simpan di cache dinamis & kembalikan
          return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request.url, fetchResponse.clone());
            return fetchResponse;
          });
        })
        .catch(() => {
          // Jika network gagal (offline), baru ambil dari cache
          return caches.match(event.request);
        })
    );
  } else {
    // --- Cache First Strategy (untuk app shell, font, dll) ---
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Kembalikan dari cache jika ada
          if (response) {
            return response;
          }
          // Jika tidak ada di cache, ambil dari network
          return fetch(event.request).then(fetchResponse => {
            // Simpan ke cache dinamis untuk nanti
            return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(event.request.url, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
    );
  }
});