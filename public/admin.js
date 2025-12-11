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

// ============================================
// 3. LOGIKA KUISIONER
// ============================================

let questionnaireData = {};
const questionnaireTableBody = document.getElementById('questionnaireTableBody');
const questionnaireRef = ref(db, 'questionnaires');

// Load questionnaire data
onValue(questionnaireRef, (snapshot) => {
    questionnaireData = snapshot.val() || {};
    renderQuestionnaireTable();
});

function renderQuestionnaireTable() {
    const searchTerm = document.getElementById('searchQuestionnaire')?.value.toLowerCase() || '';
    const filterDuration = document.getElementById('filterUsageDuration')?.value || '';

    questionnaireTableBody.innerHTML = "";

    const entries = Object.entries(questionnaireData);

    // Update total count
    if (document.getElementById('totalResponses')) {
        document.getElementById('totalResponses').textContent = entries.length;
    }

    if (entries.length === 0) {
        questionnaireTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 40px; color: #adb5bd;">Belum ada data kuisioner.</td></tr>`;
        return;
    }

    // Filter and display
    const filtered = entries.filter(([key, data]) => {
        const matchSearch = !searchTerm ||
            data.name?.toLowerCase().includes(searchTerm) ||
            data.email?.toLowerCase().includes(searchTerm);

        const matchDuration = !filterDuration || data.usageDuration === filterDuration;

        return matchSearch && matchDuration;
    });

    if (filtered.length === 0) {
        questionnaireTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 40px; color: #adb5bd;">Tidak ada hasil yang sesuai filter.</td></tr>`;
        return;
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

    filtered.forEach(([key, data]) => {
        const centerStyle = "text-align: center; font-weight: 600;";

        // NPS color coding
        let npsColor = "#28a745"; // Green for promoters (9-10)
        if (data.nps <= 6) npsColor = "#dc3545"; // Red for detractors (0-6)
        else if (data.nps <= 8) npsColor = "#ffc107"; // Yellow for passives (7-8)

        const row = `
            <tr style="transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background=''">
                <td><strong style="color: #007bff;">${data.name || '-'}</strong></td>
                <td style="font-size: 13px; color: #6c757d;">${data.email || '-'}</td>
                <td style="${centerStyle}">${data.age || '-'}</td>
                <td style="${centerStyle} font-size: 12px;">${data.usageDuration || '-'}</td>
                <td style="${centerStyle} color: #007bff;">${data.appEase || '-'}/5</td>
                <td style="${centerStyle} color: #007bff;">${data.appUI || '-'}/5</td>
                <td style="${centerStyle} color: #17a2b8;">${data.ringComfort || '-'}/5</td>
                <td style="${centerStyle} color: #17a2b8;">${data.ringAccuracy || '-'}/5</td>
                <td style="${centerStyle} color: ${npsColor}; font-size: 16px; font-weight: 700;">${data.nps || '-'}</td>
                <td style="text-align: center;">
                    <button class="btn-edit" onclick="window.viewQuestionnaireDetail('${key}')" style="padding: 8px 16px;">Detail</button>
                </td>
            </tr>
        `;
        questionnaireTableBody.innerHTML += row;
    });
}

// Search and filter handlers
if (document.getElementById('searchQuestionnaire')) {
    document.getElementById('searchQuestionnaire').addEventListener('input', renderQuestionnaireTable);
}

if (document.getElementById('filterUsageDuration')) {
    document.getElementById('filterUsageDuration').addEventListener('change', renderQuestionnaireTable);
}

// View detail modal
window.viewQuestionnaireDetail = (key) => {
    const data = questionnaireData[key];
    if (!data) return;

    const modal = document.getElementById('questionnaireModal');
    const modalContent = document.getElementById('modalContent');

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    modalContent.innerHTML = `
        <div style="display: grid; gap: 25px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 15px;">
                <h3 style="color: #007bff; margin-bottom: 15px;">👤 Informasi Responden</h3>
                <p><strong>Nama:</strong> ${data.name || '-'}</p>
                <p><strong>Email:</strong> ${data.email || '-'}</p>
                <p><strong>Usia:</strong> ${data.age || '-'} tahun</p>
                <p><strong>Durasi Penggunaan:</strong> ${data.usageDuration || '-'}</p>
                <p><strong>Tanggal Pengisian:</strong> ${formatDate(data.timestamp)}</p>
            </div>

            <div style="background: #e7f3ff; padding: 20px; border-radius: 15px;">
                <h3 style="color: #007bff; margin-bottom: 15px;">📱 Pengalaman Aplikasi</h3>
                <p><strong>Kemudahan Penggunaan:</strong> ${data.appEase || '-'}/5</p>
                <p><strong>Kepuasan UI:</strong> ${data.appUI || '-'}/5</p>
                <p><strong>Fitur Favorit:</strong></p>
                <ul style="margin: 10px 0; padding-left: 25px;">
                    ${data.appFeatures && data.appFeatures.length > 0
                        ? data.appFeatures.map(f => `<li>${f}</li>`).join('')
                        : '<li>Tidak ada data</li>'}
                </ul>
            </div>

            <div style="background: #e7f9f5; padding: 20px; border-radius: 15px;">
                <h3 style="color: #17a2b8; margin-bottom: 15px;">💍 Pengalaman Smartring</h3>
                <p><strong>Kenyamanan:</strong> ${data.ringComfort || '-'}/5</p>
                <p><strong>Akurasi Data:</strong> ${data.ringAccuracy || '-'}/5</p>
                <p><strong>Ketahanan Baterai:</strong> ${data.batteryLife || '-'}</p>
                <p><strong>Masalah Bluetooth:</strong> ${data.bleIssue || '-'}</p>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 15px;">
                <h3 style="color: #856404; margin-bottom: 15px;">⭐ Kepuasan Keseluruhan</h3>
                <p><strong>Net Promoter Score (NPS):</strong> ${data.nps || '-'}/10</p>
                <p><strong>Kategori:</strong> ${
                    data.nps >= 9 ? '<span style="color: #28a745; font-weight: 600;">Promoter 🎉</span>' :
                    data.nps >= 7 ? '<span style="color: #ffc107; font-weight: 600;">Passive 😐</span>' :
                    '<span style="color: #dc3545; font-weight: 600;">Detractor 😞</span>'
                }</p>
            </div>

            ${data.feedback ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 15px;">
                <h3 style="color: #343a40; margin-bottom: 15px;">💬 Saran & Kritik</h3>
                <p style="white-space: pre-wrap; line-height: 1.6;">${data.feedback}</p>
            </div>
            ` : ''}
        </div>
    `;

    modal.style.display = 'flex';
};

window.closeQuestionnaireModal = () => {
    document.getElementById('questionnaireModal').style.display = 'none';
};

// Download as CSV
window.downloadQuestionnaireCSV = () => {
    const entries = Object.entries(questionnaireData);

    if (entries.length === 0) {
        alert('Tidak ada data untuk didownload!');
        return;
    }

    // CSV Headers
    const headers = [
        'Timestamp', 'Nama', 'Email', 'Usia', 'Durasi Penggunaan',
        'Kemudahan App', 'UI App', 'Fitur Favorit',
        'Kenyamanan Ring', 'Akurasi Ring', 'Ketahanan Baterai', 'Masalah BLE',
        'NPS', 'Saran/Kritik'
    ];

    // CSV Rows
    const rows = entries.map(([key, data]) => {
        const date = data.timestamp ? new Date(data.timestamp).toLocaleString('id-ID') : '-';
        const features = data.appFeatures ? data.appFeatures.join('; ') : '-';
        const feedback = data.feedback ? `"${data.feedback.replace(/"/g, '""')}"` : '-';

        return [
            date,
            data.name || '-',
            data.email || '-',
            data.age || '-',
            data.usageDuration || '-',
            data.appEase || '-',
            data.appUI || '-',
            features,
            data.ringComfort || '-',
            data.ringAccuracy || '-',
            data.batteryLife || '-',
            data.bleIssue || '-',
            data.nps || '-',
            feedback
        ].join(',');
    });

    // Combine
    const csv = [headers.join(','), ...rows].join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `questionnaire_results_${Date.now()}.csv`;
    link.click();
};

// Download as JSON
window.downloadQuestionnaireJSON = () => {
    if (Object.keys(questionnaireData).length === 0) {
        alert('Tidak ada data untuk didownload!');
        return;
    }

    const json = JSON.stringify(questionnaireData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `questionnaire_results_${Date.now()}.json`;
    link.click();
};

// Download as Excel (XLSX)
window.downloadQuestionnaireExcel = () => {
    const entries = Object.entries(questionnaireData);

    if (entries.length === 0) {
        alert('Tidak ada data untuk didownload!');
        return;
    }

    // Prepare data for Excel
    const excelData = entries.map(([key, data]) => {
        const date = data.timestamp ? new Date(data.timestamp).toLocaleString('id-ID') : '-';
        const features = data.appFeatures ? data.appFeatures.join(', ') : '-';

        // Determine NPS Category
        let npsCategory = '';
        if (data.nps >= 9) npsCategory = 'Promoter';
        else if (data.nps >= 7) npsCategory = 'Passive';
        else npsCategory = 'Detractor';

        return {
            'Tanggal Pengisian': date,
            'Nama': data.name || '-',
            'Email': data.email || '-',
            'Usia': data.age || '-',
            'Durasi Penggunaan': data.usageDuration || '-',

            // Pengalaman Aplikasi
            'Kemudahan Aplikasi (1-5)': data.appEase || '-',
            'Kepuasan UI (1-5)': data.appUI || '-',
            'Fitur Favorit': features,

            // Pengalaman Smartring
            'Kenyamanan Ring (1-5)': data.ringComfort || '-',
            'Akurasi Ring (1-5)': data.ringAccuracy || '-',
            'Ketahanan Baterai': data.batteryLife || '-',
            'Masalah Bluetooth': data.bleIssue || '-',

            // Kepuasan Keseluruhan
            'NPS Score (0-10)': data.nps || '-',
            'Kategori NPS': npsCategory,
            'Saran/Kritik': data.feedback || '-'
        };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
        { wch: 20 },  // Tanggal
        { wch: 25 },  // Nama
        { wch: 30 },  // Email
        { wch: 8 },   // Usia
        { wch: 18 },  // Durasi
        { wch: 20 },  // Kemudahan App
        { wch: 18 },  // Kepuasan UI
        { wch: 40 },  // Fitur Favorit
        { wch: 20 },  // Kenyamanan Ring
        { wch: 18 },  // Akurasi Ring
        { wch: 18 },  // Ketahanan Baterai
        { wch: 20 },  // Masalah BLE
        { wch: 15 },  // NPS Score
        { wch: 15 },  // Kategori NPS
        { wch: 50 }   // Saran/Kritik
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Kuisioner');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `CareRing_Questionnaire_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);
};