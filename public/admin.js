// Import tambahkan 'getAuth', 'onAuthStateChanged', 'signOut' untuk fitur Login
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDJBm5uuEvHy2R4PhqJy8-mCIb6q2V5xIE", 
    authDomain: "testing-5db96.firebaseapp.com",
    databaseURL: "https://testing-5db96-default-rtdb.asia-southeast1.firebasedatabase.app/", 
    projectId: "testing-5db96",
    storageBucket: "testing-5db96.appspot.com",
    messagingSenderId: "...", 
    appId: "..." 
};

// Inisialisasi Firebase & Auth
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app); // Inisialisasi Auth Service

console.log("Admin Dashboard: Terhubung ke Database testing-5db96");

// ============================================
// 🔒 PROTEKSI HALAMAN (AUTH GUARD)
// ============================================
// Kode ini akan mengecek status login setiap kali halaman dibuka.
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User sedang login
        console.log("Admin terdeteksi: " + user.email);
    } else {
        // User TIDAK login -> Tendang ke halaman login
        alert("Anda harus login sebagai Admin!");
        window.location.href = "/login-admin.html";
    }
});

// Fungsi Logout Global (agar bisa dipanggil dari HTML)
window.logoutAdmin = () => {
    if(confirm("Keluar dari dashboard admin?")) {
        signOut(auth).then(() => {
            alert("Berhasil logout!");
            window.location.href = '/login-admin.html';
        }).catch((error) => {
            alert("Error saat logout: " + error.message);
        });
    }
}

// ============================================
// 1. LOGIKA MANAJEMEN BERITA (NEWS)
// ============================================

const newsForm = document.getElementById('newsForm');
let editModeID = null; 
let newsCache = {}; 

if (newsForm) {
    newsForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const btn = document.getElementById('btnPublish');
        const originalText = btn.innerText;
        btn.innerText = "Sedang Memproses...";
        btn.disabled = true;

        const title = document.getElementById('newsTitle').value;
        const category = document.getElementById('newsCategory').value;
        const image = document.getElementById('newsImage').value;
        const content = document.getElementById('newsContent').value; 

        // Data yang akan disimpan
        const newsData = {
            title: title,
            category: category,
            image: image,
            content: content,
            timestamp: Date.now() 
        };

        if (editModeID) {
            // --- MODE EDIT ---
            update(ref(db, 'news/' + editModeID), newsData)
                .then(() => {
                    alert("✅ Berita berhasil di-update!");
                    cancelEditMode(); 
                })
                .catch((error) => alert("❌ Gagal Update: " + error.message))
                .finally(() => {
                    btn.innerText = "Update Berita"; 
                    btn.disabled = false;
                });

        } else {
            // --- MODE BARU ---
            push(ref(db, 'news'), newsData)
                .then(() => {
                    alert("✅ Berita berhasil dipublish!");
                    newsForm.reset(); 
                })
                .catch((error) => alert("❌ Gagal Publish: " + error.message))
                .finally(() => {
                    btn.innerText = "Publish Berita";
                    btn.disabled = false;
                });
        }
    });
}

// Menampilkan Daftar Berita
const newsListContainer = document.getElementById('newsListContainer');

onValue(ref(db, 'news'), (snapshot) => {
    newsListContainer.innerHTML = ""; 
    const data = snapshot.val();
    newsCache = data || {}; 

    if (data) {
        const keys = Object.keys(data).reverse();
        keys.forEach((key) => {
            const news = data[key];
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <div>
                    <strong style="font-size:16px; color:#343a40;">${news.title}</strong><br>
                    <span style="font-size:12px; color:#007bff; background:#eef7ff; padding:4px 10px; border-radius:6px; font-weight:600;">${news.category}</span>
                </div>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="window.startEdit('${key}')">Edit</button>
                    <button class="btn-delete" onclick="window.hapusBerita('${key}')">Hapus</button>
                </div>
            `;
            newsListContainer.appendChild(div);
        });
    } else {
        newsListContainer.innerHTML = "<p style='text-align:center; color:#adb5bd;'>Belum ada berita yang dipublish.</p>";
    }
});

// --- FUNGSI EDIT BERITA ---
window.startEdit = (id) => {
    const data = newsCache[id];
    if (!data) return;

    document.getElementById('newsTitle').value = data.title;
    document.getElementById('newsCategory').value = data.category;
    document.getElementById('newsImage').value = data.image;
    document.getElementById('newsContent').value = data.content || "";

    editModeID = id; 
    document.getElementById('formTitle').innerText = "Edit Berita";
    document.getElementById('btnPublish').innerText = "Update Berita";
    document.getElementById('btnPublish').style.background = "linear-gradient(135deg, #ffc107, #e0a800)"; 
    document.getElementById('btnCancelEdit').style.display = "block"; 
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- FUNGSI BATAL EDIT ---
window.cancelEditMode = () => {
    editModeID = null;
    document.getElementById('newsForm').reset();
    
    document.getElementById('formTitle').innerText = "Tambah Berita Baru";
    document.getElementById('btnPublish').innerText = "Publish Berita";
    document.getElementById('btnPublish').style.background = "linear-gradient(135deg, #007bff, #0056b3)"; 
    document.getElementById('btnCancelEdit').style.display = "none";
};

// --- FUNGSI HAPUS ---
window.hapusBerita = (id) => {
    if(confirm("Yakin ingin menghapus berita ini?")) {
        if(editModeID === id) cancelEditMode();
        
        remove(ref(db, `news/${id}`))
            .catch(err => alert("Gagal hapus: " + err.message));
    }
};

// ============================================
// 2. LOGIKA MONITORING DEVICE
// ============================================

const deviceTableBody = document.getElementById('deviceTableBody');
const sensorRef = ref(db, 'realtimeSensorData');

onValue(sensorRef, (snapshot) => {
    deviceTableBody.innerHTML = ""; 
    const data = snapshot.val();

    if (data) {
        Object.keys(data).forEach((key) => {
            const device = data[key];

            const devName = device.deviceName || "Tanpa Nama";
            const devId = device.deviceID || key;
            const bpm = device.bpm !== undefined ? device.bpm : "-";
            const ambTemp = device.ambTemp !== undefined ? device.ambTemp : "-"; 
            const batt = device.battery !== undefined ? device.battery : "-";
            const bmpTemp = device.bmpTemp !== undefined ? device.bmpTemp : "-";
            const altitude = device.altitude !== undefined ? device.altitude : "-";
            const irValue = device.irValue !== undefined ? device.irValue : "-";

            let battColor = "#28a745"; 
            if (batt < 20) battColor = "#dc3545"; 
            else if (batt < 50) battColor = "#ffc107"; 

            const centerStyle = "text-align: center; font-weight: 600;";

            const row = `
                <tr style="transition: background 0.2s; hover: background-color: #f8f9fa;">
                    <td><strong style="color: #007bff;">${devName}</strong></td>
                    <td style="font-family: monospace; color: #6c757d; font-size: 13px;">${devId}</td>
                    <td style="${centerStyle} color:${battColor};">${batt}%</td>
                    <td style="${centerStyle}"><span style="font-size:18px; color:#343a40;">${bpm}</span> <small style="color:#adb5bd; font-weight:400;">bpm</small></td>
                    <td style="${centerStyle} color: #495057;">${ambTemp}°C</td>
                    <td style="${centerStyle} color: #17a2b8;">${bmpTemp}°C</td>
                    <td style="${centerStyle} color: #6610f2;">${altitude} m</td>
                    <td style="${centerStyle} color: #6c757d;">${irValue}</td>
                </tr>
            `;
            deviceTableBody.innerHTML += row;
        });
    } else {
        deviceTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color: #adb5bd;">Tidak ada data.</td></tr>`;
    }
});