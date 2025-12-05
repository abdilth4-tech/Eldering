/* ======================================================
   File auth-guard.js (PENJAGA HALAMAN)
   File ini HARUS dimuat SETELAH script.js
   ====================================================== */

// Variabel 'auth' dan 'database' sudah ada dari script.js
// Jadi JANGAN DEKLARASIKAN LAGI.

// Fungsi helper untuk format waktu
function formatTimeAgo(seconds) {
  if (seconds < 60) {
    return "Baru saja";
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} menit lalu`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} jam lalu`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} hari lalu`;
  }
}

auth.onAuthStateChanged((user) => {
  
  const currentPage = window.location.pathname.split("/").pop();

  if (user) {
    // === PENGGUNA SEDANG LOGIN ===
    console.log('Auth Guard: User sedang login:', user.uid);

    // --- LOGIKA 1: Ambil Data User (Nama & Email) ---
    database.ref('users/' + user.uid).once('value')
      .then((snapshot) => {
        let namaPengguna = "Pengguna"; // Default
        let emailPengguna = user.email; // Default dari Auth

        if (snapshot.exists()) {
          const userData = snapshot.val();
          namaPengguna = userData.nama;
          emailPengguna = userData.email;
        } else {
          console.warn('Auth Guard: Data nama user tidak ditemukan di database.');
        }

        // 1. Cek dan Update Halaman PROFIL
        const profileNameEl = document.getElementById('profile-name');
        const profileEmailEl = document.getElementById('profile-email');
        if (profileNameEl && profileEmailEl) {
          profileNameEl.textContent = namaPengguna;
          profileEmailEl.textContent = emailPengguna;
        }

        // 2. Cek dan Update Halaman HOME (Sapaan)
        const greetingElement = document.getElementById('user-greeting');
        if (greetingElement) {
          greetingElement.textContent = 'Halo, ' + namaPengguna + '!';
        }
      })
      .catch((error) => {
        console.error('Auth Guard: Gagal mengambil data user:', error);
        // Fallback jika gagal
        const greetingElement = document.getElementById('user-greeting');
        if (greetingElement) {
          greetingElement.textContent = 'Halo, Pengguna!';
        }
        const profileNameEl = document.getElementById('profile-name');
        const profileEmailEl = document.getElementById('profile-email');
        if (profileNameEl && profileEmailEl) {
          profileNameEl.textContent = "Pengguna CareRing";
          profileEmailEl.textContent = user.email;
        }
      });

    // --- LOGIKA 2: Ambil Status Perangkat (Hanya di Halaman Profil) ---
    const elLastSeen = document.getElementById('profile-device-lastseen');
    
    if (elLastSeen) {
      // Ambil ID perangkat (hardcode sesuai setup Anda)
      const deviceId = "ESP32C3-F0E1837D7850";
      const heartbeatRef = database.ref("/deviceHeartbeat/" + deviceId + "/lastSeen");
      
      heartbeatRef.on("value", (snapshot) => {
        const lastSeen = snapshot.val();
        if (lastSeen) {
          const now = Date.now();
          const diffInSeconds = (now - lastSeen) / 1000;
          
          // Langsung tampilkan waktunya
          elLastSeen.innerText = formatTimeAgo(diffInSeconds);
          elLastSeen.className = ""; // Hapus kelas "status-loading"
        
        } else {
          // Tidak pernah terhubung
          elLastSeen.innerText = "Tidak pernah terhubung";
          elLastSeen.className = "status-loading"; // Biarkan abu-abu
        }
      });
    }

    // --- LOGIKA 3: Fungsikan Tombol Logout ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
          console.log('Auth Guard: User berhasil logout.');
        });
      });
    }
    
    // --- LOGIKA 4: Penjaga Halaman Login/Register ---
    if (currentPage === 'login.html' || currentPage === 'register.html') {
      window.location.href = 'app.html';
    }

  } else {
    // === PENGGUNA TIDAK LOGIN ===
    console.log('Auth Guard: User tidak login.');
    if (currentPage !== 'login.html' && currentPage !== 'register.html') {
      window.location.href = 'login.html';
    }
  }
});