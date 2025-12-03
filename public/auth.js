/* ======================================================
   File auth.js (LOGIKA LOGIN/REGISTER)
   File ini HARUS dimuat SETELAH script.js
   ====================================================== */

// Variabel 'auth' dan 'database' sudah ada dari script.js
// Jadi JANGAN DEKLARASIKAN LAGI.

const bodyId = document.body.id;

if (bodyId === 'page-register') {
  // === LOGIKA HALAMAN REGISTRASI ===
  const registerForm = document.getElementById('register-form');

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Simpan nama ke Realtime Database
        database.ref('users/' + user.uid).set({
          nama: name,
          email: email
        })
        .then(() => {
          alert('Pendaftaran berhasil! Silakan login.');
          window.location.href = 'login.html';
        })
        .catch((error) => {
          alert('Gagal menyimpan data nama: ' + error.message);
        });
      })
      .catch((error) => {
        alert('Gagal mendaftar: ' + error.message);
      });
  });

} else if (bodyId === 'page-login') {
  // === LOGIKA HALAMAN LOGIN ===
  const loginForm = document.getElementById('login-form');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    console.log('Mencoba login dengan:', email); // Pesan debug

    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Login berhasil.
        console.log('Login berhasil!', userCredential.user.uid);
        // auth-guard.js akan mengambil alih dan mengarahkan
        // kita ke index.html, tapi kita bisa paksa
        window.location.href = 'index.html';
      })
      .catch((error) => {
        console.error('Gagal login:', error.message);
        alert('Gagal login: ' + error.message);
      });
  });
}