/* ======================================================
   File script.js (FINAL VERSION - DASHBOARD SAFE + HISTORY ADDED)
   ====================================================== */

// === 1. Konfigurasi Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyDJBm5uuEvHy2R4PhqJy8-mCIb6q2V5xIE",
  authDomain: "testing-5db96.firebaseapp.com",
  databaseURL: "https://testing-5db96-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "testing-5db96",
  storageBucket: "testing-5db96.firebasestorage.app",
  messagingSenderId: "429058908969",
  appId: "1:429058908969:web:a33ddce4d40e77b7f68d38",
  measurementId: "G-ZY5HQ1NF32"
};

// === 2. Inisialisasi Global ===
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth(); 
const dataRef = database.ref("/realtimeSensorData/ESP32C3-F0E1837D7850");

// ============================================================
// === 3. Global Auth Listener ===
// ============================================================
auth.onAuthStateChanged((user) => {
  const isLoginPage = document.getElementById('google-login-btn'); 
  const greetingText = document.getElementById('user-greeting'); 
  const navPhoto = document.getElementById('nav-user-photo'); 

  if (user) {
    console.log("Status: User Login sebagai", user.displayName);
    
    if (greetingText && user.displayName) {
        greetingText.innerText = `Halo, ${user.displayName}!`;
    }

    if (navPhoto && user.photoURL) {
        navPhoto.src = user.photoURL;
        navPhoto.style.display = 'block'; 
        if(navPhoto.nextElementSibling) navPhoto.nextElementSibling.style.display = 'none';
    }

    if (isLoginPage) {
        window.location.href = "app.html";
    }

  } else {
    console.log("Status: User Belum Login");
    if (greetingText) greetingText.innerText = "Halo, Pengguna!";
  }
});


// ============================================================
// === 4. Logika Per Halaman ===
// ============================================================

// === A. HALAMAN LOGIN (login.html) ===
if (document.getElementById('google-login-btn')) {
    
    console.log("Menjalankan script Halaman Login...");
    const loginBtn = document.getElementById('google-login-btn');

    loginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then((result) => {
                console.log("Login Berhasil!");
            })
            .catch((error) => {
                console.error("Error login:", error);
                alert("Gagal Login: " + error.message);
            });
    });

// === B. HALAMAN DASHBOARD (index.html) ===
} else if (document.getElementById('bpmChart')) {
  
  console.log("Menjalankan script dashboard & grafik (index.html)...");

  // --- Fitur Logout ---
  const logoutBtn = document.getElementById('logout-btn'); 
  if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          auth.signOut().then(() => {
              window.location.href = "login.html";
          });
      });
  }

  // --- Logika Notifikasi ---
  function askNotificationPermission() {
    if (!("Notification" in window)) { console.log("Browser ini tidak mendukung notifikasi desktop"); }
    else if (Notification.permission === "granted") { console.log("Izin notifikasi sudah diberikan."); }
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          console.log("Izin notifikasi berhasil diberikan!");
          showNotification("CARERING Terhubung", "Anda akan menerima notifikasi jika ada data abnormal.");
        }
      });
    }
  }

  function showNotification(title, body) {
    if (Notification.permission === "granted") {
      let iconUrl = '/images/icon-192.png'; 
      new Notification(title, { body: body, icon: iconUrl });
    }
  }
  
  askNotificationPermission();
  
  let lastTempAlertTime = 0;
  let lastBpmAlertTime = 0;
  const alertCooldown = 300000; 

  // --- Logika Modal Rangkuman ---
  const reportModal = document.getElementById('report-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const reportStatusEl = document.getElementById('report-status'); 
  const reportListEl = document.getElementById('report-list'); 
  const reportDetailListEl = document.getElementById('report-detail-list'); 
  
  const summaryStatusEl = document.getElementById('summary-status-text');
  const summaryDetailListEl = document.getElementById('summary-detail-list');

  let lastReportPopupTime = 0;
  const reportCooldown = 60000; 

  function closeModal() {
    if (reportModal) reportModal.style.display = "none";
  }
  
  if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
  window.onclick = function(event) { if (event.target == reportModal) closeModal(); }

  function generateHealthReport(data) {
    let score = 0;
    let recommendations = [];
    let detailReport = [];

    // 1. Cek Suhu Tubuh
    const suhu = data.objTemp;
    if (suhu >= 36.5 && suhu <= 37.2) {
      score += 2; 
      detailReport.push({ sensor: "Suhu Tubuh", value: `${suhu.toFixed(1)}°C`, status: "Ideal", class: "status-bugar" });
    } else if ((suhu >= 36.0 && suhu < 36.5) || (suhu > 37.2 && suhu <= 37.5)) {
      score += 1;
      detailReport.push({ sensor: "Suhu Tubuh", value: `${suhu.toFixed(1)}°C`, status: "Normal", class: "status-sehat" });
    } else {
      score += 0;
      if (suhu > 37.5) {
        detailReport.push({ sensor: "Suhu Tubuh", value: `${suhu.toFixed(1)}°C`, status: "Demam", class: "status-sakit" });
        recommendations.push({ text: "Suhu tubuh Anda terdeteksi DEMAM. Perbanyak minum air putih dan istirahat.", type: "warning" });
      } else if (suhu < 36.0 && suhu > 10) {
        detailReport.push({ sensor: "Suhu Tubuh", value: `${suhu.toFixed(1)}°C`, status: "Hipotermia", class: "status-sakit" });
        recommendations.push({ text: "Suhu tubuh Anda terdeteksi HIPOTERMIA. Segera cari tempat hangat dan gunakan selimut.", type: "warning" });
      } else {
         detailReport.push({ sensor: "Suhu Tubuh", value: `${suhu.toFixed(1)}°C`, status: "Tidak Terbaca", class: "status-kurang-sehat" });
      }
    }

    // 2. Cek Detak Jantung
    const bpm = data.bpm;
    if (bpm >= 60 && bpm <= 90 && bpm > 0) {
      score += 2;
      detailReport.push({ sensor: "Detak Jantung", value: `${bpm} BPM`, status: "Ideal", class: "status-bugar" });
    } else if ((bpm > 90 && bpm <= 100) || (bpm < 60 && bpm >= 55)) {
      score += 1;
      detailReport.push({ sensor: "Detak Jantung", value: `${bpm} BPM`, status: "Normal", class: "status-sehat" });
    } else if (bpm > 0) {
      score += 0;
      if (bpm > 100) {
        detailReport.push({ sensor: "Detak Jantung", value: `${bpm} BPM`, status: "Tinggi", class: "status-sakit" });
        recommendations.push({ text: "Detak jantung Anda TINGGI. Coba tenangkan diri dan ambil napas dalam-dalam.", type: "warning" });
      } else if (bpm < 55) {
        detailReport.push({ sensor: "Detak Jantung", value: `${bpm} BPM`, status: "Rendah", class: "status-sakit" });
        recommendations.push({ text: "Detak jantung Anda RENDAH. Jika merasa pusing, segera duduk.", type: "warning" });
      }
    } else {
       detailReport.push({ sensor: "Detak Jantung", value: "0 BPM", status: "Tidak Terbaca", class: "status-kurang-sehat" });
       recommendations.push({ text: "Sensor detak jantung tidak mendeteksi jari. Letakkan jari Anda di sensor.", type: "warning" });
    }
    
    let overallStatus = "";
    let overallStatusClass = "";
    if (recommendations.length > 0) {
        if (score >= 1) { overallStatus = "KURANG SEHAT"; overallStatusClass = "status-kurang-sehat"; } 
        else { overallStatus = "SAKIT"; overallStatusClass = "status-sakit"; }
    } else {
        if (score >= 4) { overallStatus = "BUGAR"; overallStatusClass = "status-bugar"; recommendations.push({ text: "Semua data vital Anda prima!", type: "check" }); } 
        else { overallStatus = "SEHAT"; overallStatusClass = "status-sehat"; recommendations.push({ text: "Kondisi Anda secara umum baik.", type: "check" }); }
    }

    return { overallStatus, overallStatusClass, recommendations, detailReport };
  }
  
  function showReportModal(report) {
    if (!reportModal || !reportStatusEl || !reportListEl || !reportDetailListEl) return;
    
    reportStatusEl.innerText = report.overallStatus;
    reportStatusEl.className = report.overallStatusClass;
    
    reportDetailListEl.innerHTML = "";
    report.detailReport.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${item.sensor}:</strong> <span>${item.value} (<span class="${item.class}">${item.status}</span>)</span>`;
      reportDetailListEl.appendChild(li);
    });

    reportListEl.innerHTML = "";
    report.recommendations.forEach(item => {
      const li = document.createElement('li');
      if (item.type === 'warning') li.classList.add('warning');
      li.innerText = item.text;
      reportListEl.appendChild(li);
    });
    
    reportModal.style.display = "block";
    lastReportPopupTime = Date.now();
  }
  
  // === Helper Functions ===
  function updateText(id, text, decimals = -1) {
    const element = document.getElementById(id);
    if (element) {
      let value = text;
      if (typeof text === 'number' && decimals >= 0) value = text.toFixed(decimals);
      element.innerText = value;
    }
  }
  function updateStatus(id, text, className) {
    const element = document.getElementById(id);
    if (element) {
      element.innerText = text;
      element.className = 'status-tag';
      element.classList.add(className);
    }
  }

  // === Update Homepage Vitals Cards (BLE Bridge Data) ===
  function updateHomeVitalsCards(data) {
    // Update Heart Rate
    const heartRate = data.heartRate || 0;
    updateText('home-heartrate', heartRate);

    // Add pulse animation
    const hrEl = document.getElementById('home-heartrate');
    if (hrEl && heartRate > 0) {
      hrEl.style.animation = 'none';
      setTimeout(() => {
        hrEl.style.animation = 'pulse 1s ease-in-out infinite';
      }, 10);
    }

    // Update SpO2
    const spo2 = data.spo2 || 0;
    updateText('home-spo2', spo2);

    // Update Body Temperature
    const temperature = data.temperature || 0;
    updateText('home-temperature', temperature, 1);

    // Update Ambient Temperature
    const ambient = data.ambient || 0;
    updateText('home-ambient', ambient, 1);

    // Update Device Info
    const deviceName = data.deviceName || 'Unknown Device';
    const deviceID = data.deviceID || '-';
    updateText('home-device-name', deviceName);
    updateText('home-device-id', deviceID);

    // Update Device Status
    const statusEl = document.getElementById('home-device-status');
    if (statusEl) {
      const now = Date.now();
      const lastUpdate = data.timestamp || 0;
      const timeDiff = (now - lastUpdate) / 1000; // seconds

      if (timeDiff < 5) {
        statusEl.innerText = 'Terhubung';
        statusEl.className = 'status-badge status-online';
      } else if (timeDiff < 60) {
        statusEl.innerText = 'Idle';
        statusEl.className = 'status-badge status-idle';
      } else {
        statusEl.innerText = 'Offline';
        statusEl.className = 'status-badge status-offline';
      }
    }

    // Update Last Update Time
    const vitalsLastUpdate = document.getElementById('vitals-last-update');
    if (vitalsLastUpdate && data.lastUpdate) {
      const updateTime = new Date(data.lastUpdate);
      const timeStr = updateTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      vitalsLastUpdate.innerText = `Update: ${timeStr}`;
    }

    // Also update old "Suhu Tubuh" card for compatibility
    updateText('suhu-tubuh-value', temperature, 1);
    if (temperature > 37.5) {
      updateStatus('suhu-tubuh-status', 'Demam', 'theme-red');
    } else if (temperature < 36.0 && temperature > 10) {
      updateStatus('suhu-tubuh-status', 'Hipotermia', 'theme-red');
    } else if (temperature > 10) {
      updateStatus('suhu-tubuh-status', 'Normal', 'theme-red');
    }
  }

  // === Listen to All BLE Bridge Devices ===
  function setupBLEDataListener() {
    const bleDevicesRef = database.ref("/realtimeSensorData");

    bleDevicesRef.on("value", (snapshot) => {
      const devices = snapshot.val();

      if (devices && Object.keys(devices).length > 0) {
        // Find most recently updated device
        let latestDevice = null;
        let latestTimestamp = 0;

        Object.keys(devices).forEach(deviceKey => {
          const device = devices[deviceKey];
          if (device && device.timestamp) {
            if (device.timestamp > latestTimestamp) {
              latestTimestamp = device.timestamp;
              latestDevice = device;
            }
          }
        });

        // Update homepage vitals with latest device data
        if (latestDevice) {
          console.log('📊 Updating homepage vitals with BLE data:', latestDevice.deviceName);
          updateHomeVitalsCards(latestDevice);
        }
      } else {
        console.log('No BLE devices found in Firebase');
      }
    });
  }

  // Setup BLE data listener for homepage
  setupBLEDataListener();

  // === Ambil Data Realtime ===
  dataRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (data) {
      
      const now = Date.now(); 

      // 1. Update Kartu Suhu Tubuh
      const suhuTubuh = data.objTemp || 0; 
      updateText('suhu-tubuh-value', suhuTubuh, 1);
      if (suhuTubuh > 37.5) {
        updateStatus('suhu-tubuh-status', 'Demam', 'theme-red');
        if (now - lastTempAlertTime > alertCooldown) {
          showNotification("⚠️ Peringatan Suhu Tubuh ⚠️", `Suhu tubuh terdeteksi DEMAM: ${suhuTubuh.toFixed(1)}°C`);
          lastTempAlertTime = now; 
        }
      } else if (suhuTubuh < 36.0 && suhuTubuh > 10) { 
        updateStatus('suhu-tubuh-status', 'Hipotermia', 'theme-red');
        if (now - lastTempAlertTime > alertCooldown) {
          showNotification("⚠️ Peringatan Suhu Tubuh ⚠️", `Suhu tubuh terdeteksi HIPOTERMIA: ${suhuTubuh.toFixed(1)}°C`);
          lastTempAlertTime = now; 
        }
      } else if (suhuTubuh < 10) {
        updateStatus('suhu-tubuh-status', '---', 'theme-red');
      } else {
        updateStatus('suhu-tubuh-status', 'Normal', 'theme-red');
      }

      // 2. Update Kartu Detak Jantung
      const bpm = data.bpm || 0;
      updateText('bpm-value', bpm); 
      if (bpm > 100) {
        updateStatus('bpm-status', 'Tinggi', 'panas');
        if (bpm > 0 && now - lastBpmAlertTime > alertCooldown) {
          showNotification("❤️ Peringatan Detak Jantung ❤️", `Detak jantung terdeteksi TINGGI: ${bpm} BPM`);
          lastBpmAlertTime = now;
        }
      } else if (bpm < 60 && bpm > 0) {
        updateStatus('bpm-status', 'Rendah', 'panas');
        if (now - lastBpmAlertTime > alertCooldown) {
          showNotification("❤️ Peringatan Detak Jantung ❤️", `Detak jantung terdeteksi RENDAH: ${bpm} BPM`);
          lastBpmAlertTime = now;
        }
      } else if (bpm == 0) {
        updateStatus('bpm-status', '---', 'normal');
      } else {
        updateStatus('bpm-status', 'Normal', 'normal');
      }
      
      // Update sisa kartu
      const spO2 = data.spO2 || 0; 
      updateText('spo2-value', spO2, 1);
      updateText('spo2-percent', `${spO2.toFixed(1)}%`);
      
      const suhuRuangan = data.ambTemp || 0;
      updateText('ruangan-value', suhuRuangan, 1);
      updateStatus('ruangan-status', suhuRuangan > 28 ? 'Panas' : 'Sejuk', suhuRuangan > 28 ? 'panas' : 'normal');
      
      const altitude = data.altitude || 0;
      updateText('ketinggian-value', altitude, 1);
      updateStatus('ketinggian-status', altitude > 1000 ? 'Tinggi' : 'Dataran', altitude > 1000 ? 'panas' : 'normal');
      
      const irValue = data.irValue || 0;
      updateText('ir-value', irValue);
      updateStatus('ir-status', irValue > 20000 ? 'Normal' : 'Rendah', irValue > 20000 ? 'normal' : 'panas');
      
      // Data statis
      const langkahCount = 1327;
      const langkahGoal = 10000;
      const langkahPercent = (langkahCount / langkahGoal) * 100;
      updateText('langkah-value', '1,327');
      updateText('langkah-percent', `${langkahPercent.toFixed(0)}%`);
      updateText('tidur-value', '8.2');
      updateText('tekanan-value', '1002.0'); 
      updateStatus('tekanan-status', 'Normal', 'normal');
      updateText('hidrasi-placeholder-value', '1.6');
      updateStatus('hidrasi-status', 'OK', 'normal');
      
      
      // === Cek Laporan Kesehatan ===
      const report = generateHealthReport(data);
      
      // Pop-up logic
      if ((report.overallStatus === "SAKIT" || report.overallStatus === "KURANG SEHAT") && (now - lastReportPopupTime > reportCooldown)) {
        if (data.bpm > 0 || (data.objTemp < 36 && data.objTemp > 10) || data.objTemp > 37.5) { 
          showReportModal(report);
        }
      }
      
      // Kartu Statis Logic
      if (summaryStatusEl && summaryDetailListEl) {
        summaryStatusEl.innerText = report.overallStatus;
        summaryStatusEl.className = report.overallStatusClass;
        summaryDetailListEl.innerHTML = "";
        report.detailReport.forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${item.sensor}:</strong> <span class="status-text ${item.class}">${item.status}</span>`;
          summaryDetailListEl.appendChild(li);
        });
      }

    }
  });

  // === GRAFIK ===
  const historyRef = database.ref("/sensorHistory");
  const ctxBpm = document.getElementById('bpmChart').getContext('2d');
  const bpmChart = new Chart(ctxBpm, { type: 'line', data: { labels: [], datasets: [{ label: 'BPM', data: [], backgroundColor: 'rgba(231, 76, 60, 0.2)', borderColor: 'rgba(231, 76, 60, 1)', borderWidth: 2, tension: 0.3, fill: true }] }, options: { scales: { y: { suggestedMin: 50, suggestedMax: 120 } }, plugins: { legend: { display: false } } } });
  const ctxTemp = document.getElementById('tempChart').getContext('2d');
  const tempChart = new Chart(ctxTemp, { type: 'line', data: { labels: [], datasets: [{ label: 'Suhu Tubuh (°C)', data: [], backgroundColor: 'rgba(243, 156, 18, 0.2)', borderColor: 'rgba(243, 156, 18, 1)', borderWidth: 2, tension: 0.3, fill: true }] }, options: { scales: { y: { suggestedMin: 34, suggestedMax: 39 } }, plugins: { legend: { display: false } } } });
  const ctxAmbient = document.getElementById('ambientChart').getContext('2d');
  const ambientChart = new Chart(ctxAmbient, { type: 'line', data: { labels: [], datasets: [{ label: 'Suhu Ruangan (°C)', data: [], backgroundColor: 'rgba(52, 152, 219, 0.2)', borderColor: 'rgba(52, 152, 219, 1)', borderWidth: 2, tension: 0.3, fill: true }] }, options: { scales: { y: { suggestedMin: 20, suggestedMax: 35 } }, plugins: { legend: { display: false } } } });
  
  historyRef.limitToLast(10).on("value", (snapshot) => { const data = snapshot.val(); const newLabels = [], newBpmData = [], newTempData = [], newAmbientData = []; if (data) { for (const key in data) { const entry = data[key]; let label = 'data'; if (entry.timestamp) { const d = new Date(entry.timestamp); let minutes = d.getMinutes().toString().padStart(2, '0'); let seconds = d.getSeconds().toString().padStart(2, '0'); label = `${d.getHours()}:${minutes}:${seconds}`; } if (entry.bpm > 0) { newLabels.push(label); newBpmData.push(entry.bpm); newTempData.push(entry.objTemp); newAmbientData.push(entry.ambTemp); } } bpmChart.data.labels = newLabels; bpmChart.data.datasets[0].data = newBpmData; bpmChart.update(); tempChart.data.labels = newLabels; tempChart.data.datasets[0].data = newTempData; tempChart.update(); ambientChart.data.labels = newLabels; ambientChart.data.datasets[0].data = newAmbientData; ambientChart.update(); } });

// === C. HALAMAN BOT CHAT (ai-chat.html) ===
} else if (document.getElementById('chat-form')) {
  
  console.log("Menjalankan script Bot Chat (ai-chat.html)...");

  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatWindow = document.getElementById('chat-window');
  const suggestedButtons = document.querySelectorAll('.suggest-btn');
  const sendButton = document.getElementById('send-btn');
  
  function saveChatHistory() {
    if (chatWindow) sessionStorage.setItem('careringChatHistory', chatWindow.innerHTML);
  }

  function loadChatHistory() {
    const savedChat = sessionStorage.getItem('careringChatHistory');
    if (savedChat && chatWindow) {
      chatWindow.innerHTML = savedChat;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }

  loadChatHistory();

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
      sendMessageToBot(message);
      chatInput.value = '';
    }
  });

  suggestedButtons.forEach(button => {
    button.addEventListener('click', () => {
      sendMessageToBot(button.innerText);
    });
  });

  function addMessageToWindow(message, sender, isLoading = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    if (isLoading) {
      messageElement.classList.add('loading');
      messageElement.innerHTML = `<p>${message}</p>`;
    } else {
      messageElement.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
    }
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageElement;
  }
  
  function setChatLoading(isLoading) {
    chatInput.disabled = isLoading;
    sendButton.disabled = isLoading;
  }

  async function sendMessageToBot(userMessage) {
    addMessageToWindow(userMessage, 'user');
    saveChatHistory(); 
    setChatLoading(true); 

    const loadingMessage = addMessageToWindow("Bot sedang mengetik...", 'ai', true);
    const botResponse = await getBotResponse(userMessage);

    setTimeout(() => { 
      loadingMessage.remove();
      addMessageToWindow(botResponse, 'ai');
      saveChatHistory(); 
      setChatLoading(false); 
    }, 1000); 
  }

  // === OTAK BOT ===
  async function getBotResponse(userMessage) {
    const msg = userMessage.toLowerCase();
    if (msg.includes("suhu tubuh normal")) {
        return "Suhu tubuh normal untuk orang dewasa biasanya berkisar antara 36.1°C hingga 37.2°C.";
    } else if (msg.includes("detak jantung normal")) {
        return "Detak jantung istirahat yang normal untuk orang dewasa berkisar antara 60 hingga 100 denyut per menit (BPM).";
    } else if (msg.includes("hipotermia")) {
        return "Hipotermia adalah kondisi darurat medis yang terjadi ketika tubuh Anda kehilangan panas lebih cepat daripada kemampuannya menghasilkan panas, menyebabkan suhu tubuh turun drastis di bawah 35°C.";
    } else if (msg.includes("demam")) {
        return "Demam umumnya didefinisikan sebagai suhu tubuh di atas 37.5°C. Ini adalah respons alami tubuh terhadap infeksi.";
    } else if (msg.includes("suhu tubuh")) { 
      try {
        const snapshot = await dataRef.once('value');
        const data = snapshot.val();
        const suhu = data.objTemp.toFixed(1);
        let status = "Normal";
        if (suhu > 37.5) status = "Demam";
        if (suhu < 36.0 && suhu > 10) status = "Hipotermia";
        return `Suhu tubuh Anda saat ini ${suhu}°C, yang terdeteksi ${status}.`;
      } catch (error) { return "Maaf, saya gagal mengambil data suhu. Coba lagi."; }
    } else if (msg.includes("detak jantung")) { 
      try {
        const snapshot = await dataRef.once('value');
        const data = snapshot.val();
        const bpm = data.bpm;
        let status = "Normal";
        if (bpm > 100) status = "Tinggi";
        if (bpm < 60 && bpm > 0) status = "Rendah";
        if (bpm == 0) return "Sensor detak jantung tidak mendeteksi jari Anda. Silakan letakkan jari Anda di sensor.";
        return `Detak jantung Anda saat ini ${bpm} BPM (denyut per menit), yang terdeteksi ${status}.`;
      } catch (error) { return "Maaf, saya gagal mengambil data detak jantung."; }
    } else if (msg.includes("saturasi") || msg.includes("oksigen")) {
      return "Maaf, data Saturasi Oksigen (SpO2) saat ini masih 0. Sensor mungkin sedang dikalibrasi atau fitur ini belum diaktifkan sepenuhnya.";
    } else if (msg.includes("suhu ruangan")) {
      try {
        const snapshot = await dataRef.once('value');
        const data = snapshot.val();
        const suhu = data.ambTemp.toFixed(1);
        return `Suhu ruangan di sekitar perangkat saat ini ${suhu}°C.`;
      } catch (error) { return "Maaf, saya gagal mengambil data suhu ruangan."; }
    } else if (msg.includes("halo") || msg.includes("hai")) {
      return "Halo! Ada yang bisa saya bantu terkait data kesehatan Anda?";
    } else {
      return "Maaf, saya tidak mengerti pertanyaan itu. Anda bisa bertanya tentang: \n- Suhu Tubuh Normal\n- Detak Jantung Saya";
    }
  }

// === D. HALAMAN PERANGKAT (perangkat.html) ===
} else if (document.getElementById('perangkat-card')) { 
  
  console.log("Menjalankan script Perangkat (perangkat.html)...");
  
  const elDeviceName = document.getElementById('device-name'); 
  const elDeviceStatus = document.getElementById('device-status'); 
  const elDeviceID = document.getElementById('device-id'); 
  const elBattStatus = document.getElementById('batt-status'); 
  const elPerangkatCard = document.getElementById('perangkat-card'); 
  const elNoPerangkat = document.getElementById('no-perangkat'); 
  const elLastSeen = document.getElementById('device-last-seen');
  
  function formatTimeAgo(seconds) { 
    if (seconds < 60) { 
      return "kurang dari semenit lalu"; 
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
  
  // Variabel untuk menyimpan device ID yang ditemukan
  let foundDeviceId = null;
  let deviceSearchAttempts = 0;
  const maxSearchAttempts = 3;
  
  // Fungsi untuk mencari semua perangkat di Firebase
  function searchAllDevices() {
    deviceSearchAttempts++;
    console.log(`Mencari perangkat di Firebase... (Percobaan ${deviceSearchAttempts}/${maxSearchAttempts})`);
    
    // Update status
    elDeviceName.innerText = "Mencari perangkat...";
    elDeviceID.innerText = "Memindai...";
    
    // Cari di path /realtimeSensorData/
    const devicesRef = database.ref("/realtimeSensorData");
    
    devicesRef.once("value", (snapshot) => {
      const devices = snapshot.val();
      
      if (devices && Object.keys(devices).length > 0) {
        // Ambil device pertama yang ditemukan (atau yang paling aktif)
        const deviceKeys = Object.keys(devices);
        
        // Cari device yang paling baru update (jika ada timestamp)
        let selectedDevice = deviceKeys[0];
        let latestTimestamp = 0;
        
        deviceKeys.forEach(key => {
          const device = devices[key];
          if (device && device.timestamp) {
            if (device.timestamp > latestTimestamp) {
              latestTimestamp = device.timestamp;
              selectedDevice = key;
            }
          }
        });
        
        foundDeviceId = selectedDevice;
        
        console.log("✅ Perangkat ditemukan! ID:", foundDeviceId);
        console.log(`   Total perangkat ditemukan: ${deviceKeys.length}`);
        
        // Load data perangkat yang ditemukan
        loadDeviceData(foundDeviceId);
      } else {
        console.log("❌ Tidak ada perangkat ditemukan di Firebase");
        elPerangkatCard.style.display = 'none';
        elNoPerangkat.style.display = 'block';
        elDeviceName.innerText = "Tidak ada perangkat";
        elDeviceID.innerText = "-";
      }
    }).catch((error) => {
      console.error("❌ Error mencari perangkat:", error);
      elPerangkatCard.style.display = 'none';
      elNoPerangkat.style.display = 'block';
      
      // Retry jika belum mencapai max attempts
      if (deviceSearchAttempts < maxSearchAttempts) {
        console.log(`Mencoba lagi dalam 3 detik...`);
        setTimeout(() => {
          searchAllDevices();
        }, 3000);
      } else {
        console.error("Gagal menemukan perangkat setelah beberapa percobaan");
        elDeviceName.innerText = "Gagal memuat perangkat";
        elDeviceID.innerText = "Error: " + error.message;
      }
    });
  }
  
  // Fungsi untuk memuat data perangkat berdasarkan ID
  function loadDeviceData(deviceId) {
    if (!deviceId) {
      console.error("Device ID tidak valid");
      return;
    }
    
    console.log("Memuat data untuk device:", deviceId);
    
    // Load data sensor
    const deviceDataRef = database.ref("/realtimeSensorData/" + deviceId);
    deviceDataRef.on("value", (snapshot) => { 
      const data = snapshot.val(); 
      if (data) { 
        elPerangkatCard.style.display = 'block'; 
        elNoPerangkat.style.display = 'none'; 
        elDeviceName.innerText = data.deviceName || "Nama Tidak Ditemukan"; 
        elDeviceID.innerText = data.deviceID || deviceId; 
        elBattStatus.innerText = (data.battery !== undefined) ? data.battery + "%" : "--%"; 
      } else { 
        elPerangkatCard.style.display = 'none'; 
        elNoPerangkat.style.display = 'block'; 
      } 
    });
    
    // Load heartbeat status
    const heartbeatRef = database.ref("/deviceHeartbeat/" + deviceId + "/lastSeen");
    heartbeatRef.on("value", (snapshot) => { 
      const lastSeen = snapshot.val(); 
      if (lastSeen) { 
        const now = Date.now(); 
        const diffInSeconds = (now - lastSeen) / 1000; 
        if (diffInSeconds < 30) { 
          elDeviceStatus.innerText = "Online"; 
          elDeviceStatus.className = "status-badge status-online";
          elLastSeen.innerText = ""; 
        } else { 
          elDeviceStatus.innerText = "Offline"; 
          elDeviceStatus.className = "status-badge status-offline";
          elLastSeen.innerText = `— ${formatTimeAgo(diffInSeconds)}`; 
        } 
      } else { 
        elDeviceStatus.innerText = "Offline"; 
        elDeviceStatus.className = "status-badge status-offline";
        elLastSeen.innerText = "— tidak diketahui"; 
      } 
    });
  }
  
  // Mulai pencarian perangkat
  searchAllDevices();
  
  // Refresh pencarian setiap 10 detik (opsional)
  setInterval(() => {
    if (!foundDeviceId) {
      searchAllDevices();
    }
  }, 10000);

// === E. HALAMAN PROFIL (profil.html) ===
} else if (document.getElementById('profile-container')) {
    
    console.log("Menjalankan script Profil...");

    // Tombol Logout di Profil
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = "login.html";
            });
        });
    }
    
    // Tampilkan Data User
    auth.onAuthStateChanged((user) => {
        if (user) {
            const elNama = document.getElementById('profil-nama');
            const elEmail = document.getElementById('profil-email');
            const elImg = document.getElementById('profil-img');

            if (elNama) elNama.innerText = user.displayName;
            if (elEmail) elEmail.innerText = user.email;
            if (elImg) elImg.src = user.photoURL;
        }
    });

// ======================================================
// === [TAMBAHAN BARU] F. HALAMAN HISTORY (history.html) ===
// ======================================================
// ======================================================
// === F. HALAMAN HISTORY (DATA ONLY - SUPER RINGAN) ===
// ======================================================
} else if (document.getElementById('page-history')) {
  
  console.log("Menjalankan script History (Mode Data Tabel)...");
  
  // Variabel penampung data
  let allHistoryData = [];
  const historyRef = firebase.database().ref("/sensorHistory");

  // Ambil data (Bisa agak banyak karena cuma teks, laptop kuat)
  historyRef.orderByChild("timestamp").limitToLast(200).on("value", (snapshot) => {
      const data = snapshot.val();
      allHistoryData = []; 
      
      if (data) {
          Object.keys(data).forEach(key => { allHistoryData.push(data[key]); });
          allHistoryData.sort((a, b) => b.timestamp - a.timestamp); // Urutkan Terbaru -> Terlama
          
          // Render pertama kali (Hari Ini)
          filterAndRender('day'); 
      } else {
          document.getElementById('table-body').innerHTML = "<tr><td colspan='4' style='text-align:center'>Belum ada data</td></tr>";
      }
  });

  // Fungsi Ganti Filter
  window.switchFilter = function(period) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      filterAndRender(period);
  }

  // Fungsi Utama Filter & Render
  function filterAndRender(period) {
      const now = Date.now();
      let startTime = 0;
      let title = "Data";

      if (period === 'day') {
          const t = new Date(); t.setHours(0,0,0,0); startTime = t.getTime(); title = "Hari Ini";
      } else if (period === 'week') {
          startTime = now - (7 * 86400000); title = "7 Hari Terakhir";
      } else if (period === 'month') {
          startTime = now - (30 * 86400000); title = "30 Hari Terakhir";
      }

      // Update Judul
      document.getElementById('table-title').innerText = "Data Masuk (" + title + ")";
      
      // Filter Data
      const filtered = allHistoryData.filter(d => d.timestamp >= startTime);
      
      // Update Tabel & Rata-rata
      updateTable(filtered);
      updateAvg(filtered);
  }

  // Fungsi Render Tabel HTML
  function updateTable(data) {
      const tbody = document.getElementById('table-body');
      
      if(!data.length) { 
          tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px; color:#888;'>Tidak ada data pada periode ini.</td></tr>"; 
          return; 
      }
      
      // Buat string HTML (Lebih cepat daripada createElement satu2)
      let htmlRows = "";
      
      data.forEach(d => {
          const dt = new Date(d.timestamp);
          // Format: Tgl/Bln Jam:Menit
          const dateStr = `${dt.getDate()}/${dt.getMonth()+1} <br> <span style="font-size:12px; color:#888;">${dt.getHours()}:${dt.getMinutes().toString().padStart(2,'0')}</span>`;
          
          const temp = d.objTemp || d.bmpTemp || 0;
          const bpm = d.bpm || 0;
          const amb = d.ambTemp || 0;

          htmlRows += `
            <tr>
                <td>${dateStr}</td>
                <td class="val-bpm">${bpm}</td>
                <td class="val-temp">${temp.toFixed(1)}°C</td>
                <td>${amb.toFixed(1)}°C</td>
            </tr>
          `;
      });

      tbody.innerHTML = htmlRows;
  }

  // Fungsi Hitung Rata-rata
  function updateAvg(data) {
      if(!data.length) { 
          document.getElementById('avg-bpm').innerText = "--"; 
          document.getElementById('avg-temp').innerText = "--"; 
          return; 
      }
      
      const bpms = data.map(d => d.bpm || 0).filter(v => v > 0);
      const temps = data.map(d => d.objTemp || d.bmpTemp || 0).filter(v => v > 10);
      
      const avgBpm = bpms.length ? (bpms.reduce((a,b)=>a+b,0)/bpms.length).toFixed(0) : 0;
      const avgTemp = temps.length ? (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1) : 0;
      
      document.getElementById('avg-bpm').innerText = avgBpm;
      document.getElementById('avg-temp').innerText = avgTemp;
  }

} else {
  console.log("Menjalankan script (halaman statis lainnya)...");
}