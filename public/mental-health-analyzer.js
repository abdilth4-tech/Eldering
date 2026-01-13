/**
 * CARERING - Mental Health Analyzer
 * Modul untuk menganalisis kesehatan mental berdasarkan data sensor medis
 *
 * Metrik yang dianalisis:
 * - HRV (Heart Rate Variability) - Variabilitas detak jantung
 * - Cardiac Stress - Stres kardiovaskular
 * - Depression Risk - Risiko depresi
 * - Stress Resilience - Ketahanan terhadap stres
 */

class MentalHealthAnalyzer {
  constructor() {
    // Storage untuk data R-R intervals dan metrik lainnya
    this.rrIntervals = []; // Array untuk menyimpan R-R intervals (dalam ms)
    this.bpmHistory = []; // Array untuk menyimpan history BPM
    this.spo2History = []; // Array untuk menyimpan history SpO2
    this.timestamps = []; // Array untuk menyimpan timestamp data

    // Konfigurasi analisis
    this.config = {
      minDataPoints: 30, // Minimal 30 data untuk analisis HRV yang akurat
      maxDataPoints: 100, // Maksimal data yang disimpan untuk menghemat memori

      // Threshold RMSSD (Root Mean Square of Successive Differences)
      // RMSSD adalah indikator utama aktivitas parasympathetic nervous system
      rmssd: {
        low: 20,  // < 20ms = Anxiety/High Stress
        high: 50  // > 50ms = Relaxed/Good Resilience
      },

      // Threshold Cardiac Stress
      cardiacStress: {
        highBPM: 90,      // BPM > 90 saat istirahat = potensi stress
        lowRMSSD: 25,     // RMSSD rendah bersamaan dengan BPM tinggi
        stabilityWindow: 5 // Jumlah data untuk mengecek stabilitas
      },

      // Threshold Depression Risk (analisis jangka panjang)
      depression: {
        lowSpO2: 95,           // SpO2 < 95% saat tidur
        hrvDecreasePercent: 20, // Penurunan HRV > 20% dari baseline
        minDaysData: 7          // Minimal 7 hari data untuk analisis
      },

      // Threshold Stress Resilience
      resilience: {
        recoveryTimeGood: 60000,    // < 1 menit = resilience tinggi
        recoveryTimeModerate: 180000, // < 3 menit = resilience sedang
        bpmSpikeThreshold: 20         // Lonjakan BPM > 20 dari baseline
      }
    };

    // Cache untuk hasil analisis
    this.lastAnalysis = null;
    this.baselineBPM = null;
    this.baselineRMSSD = null;
  }

  /**
   * Menambahkan data baru ke analyzer
   * @param {Object} data - Data sensor yang berisi bpm, spO2, rrInterval (optional), timestamp
   */
  addData(data) {
    const { bpm, spO2, rrInterval, timestamp } = data;

    // Jika R-R interval tidak tersedia, estimasi dari BPM
    // R-R interval (ms) = 60000 / BPM
    const rr = rrInterval || (bpm > 0 ? 60000 / bpm : null);

    if (rr && rr > 0) {
      this.rrIntervals.push(rr);
      this.bpmHistory.push(bpm);
      this.spo2History.push(spO2);
      this.timestamps.push(timestamp || Date.now());

      // Batasi jumlah data untuk menghemat memori
      if (this.rrIntervals.length > this.config.maxDataPoints) {
        this.rrIntervals.shift();
        this.bpmHistory.shift();
        this.spo2History.shift();
        this.timestamps.shift();
      }

      // Update baseline jika data cukup
      if (this.rrIntervals.length >= this.config.minDataPoints) {
        this.updateBaseline();
      }
    }
  }

  /**
   * Update baseline BPM dan RMSSD untuk perhitungan resilience
   * Baseline dihitung dari 30 data terakhir saat kondisi stabil
   */
  updateBaseline() {
    // Ambil 30 data terakhir
    const recentBPM = this.bpmHistory.slice(-30);
    const recentRR = this.rrIntervals.slice(-30);

    // Hitung rata-rata BPM (baseline)
    this.baselineBPM = recentBPM.reduce((sum, val) => sum + val, 0) / recentBPM.length;

    // Hitung RMSSD baseline
    this.baselineRMSSD = this.calculateRMSSD(recentRR);
  }

  /**
   * Menghitung RMSSD (Root Mean Square of Successive Differences)
   *
   * RMSSD adalah metrik HRV yang paling umum digunakan untuk menilai
   * aktivitas sistem saraf parasympathetic (sistem yang menenangkan tubuh).
   *
   * Rumus: RMSSD = sqrt(mean(differences^2))
   *
   * Interpretasi medis:
   * - RMSSD tinggi = Aktivitas parasympathetic tinggi = Relaksasi
   * - RMSSD rendah = Aktivitas parasympathetic rendah = Stres/Anxiety
   *
   * @param {Array<number>} rrIntervals - Array R-R intervals dalam ms
   * @returns {number} RMSSD dalam ms
   */
  calculateRMSSD(rrIntervals = this.rrIntervals) {
    if (rrIntervals.length < 2) return 0;

    // Hitung successive differences (selisih antar interval berurutan)
    const differences = [];
    for (let i = 1; i < rrIntervals.length; i++) {
      const diff = rrIntervals[i] - rrIntervals[i - 1];
      differences.push(diff);
    }

    // Kuadratkan setiap selisih
    const squaredDiffs = differences.map(d => d * d);

    // Hitung rata-rata dari kuadrat selisih
    const meanSquared = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;

    // Akar kuadrat dari rata-rata = RMSSD
    return Math.sqrt(meanSquared);
  }

  /**
   * Menghitung SDNN (Standard Deviation of NN intervals)
   *
   * SDNN adalah deviasi standar dari semua R-R intervals.
   * Mengukur variabilitas total detak jantung.
   *
   * Interpretasi medis:
   * - SDNN tinggi = HRV baik = Kesehatan jantung baik
   * - SDNN rendah = HRV buruk = Potensi masalah kardiovaskular
   *
   * @param {Array<number>} rrIntervals - Array R-R intervals dalam ms
   * @returns {number} SDNN dalam ms
   */
  calculateSDNN(rrIntervals = this.rrIntervals) {
    if (rrIntervals.length < 2) return 0;

    // Hitung rata-rata R-R interval
    const mean = rrIntervals.reduce((sum, val) => sum + val, 0) / rrIntervals.length;

    // Hitung variance (varians)
    const variance = rrIntervals.reduce((sum, val) => {
      const diff = val - mean;
      return sum + (diff * diff);
    }, 0) / rrIntervals.length;

    // Standard deviation = akar dari variance
    return Math.sqrt(variance);
  }

  /**
   * Analisis HRV (Heart Rate Variability)
   *
   * Mengevaluasi variabilitas detak jantung untuk mendeteksi:
   * - Tingkat stres/anxiety
   * - Kapasitas relaksasi
   * - Keseimbangan sistem saraf otonom
   *
   * @returns {Object} Hasil analisis HRV
   */
  analyzeHRV() {
    if (this.rrIntervals.length < this.config.minDataPoints) {
      return {
        status: 'insufficient_data',
        message: `Membutuhkan minimal ${this.config.minDataPoints} data untuk analisis HRV`,
        dataPoints: this.rrIntervals.length
      };
    }

    // Hitung RMSSD dari 30 data terakhir
    const recentRR = this.rrIntervals.slice(-30);
    const rmssd = this.calculateRMSSD(recentRR);
    const sdnn = this.calculateSDNN(recentRR);

    // Tentukan status berdasarkan RMSSD
    let status, level, interpretation;

    if (rmssd < this.config.rmssd.low) {
      status = 'anxiety_high_stress';
      level = 'Tinggi';
      interpretation = 'Terdeteksi tanda-tanda kecemasan atau stres tinggi. Aktivitas sistem saraf parasympathetic rendah.';
    } else if (rmssd > this.config.rmssd.high) {
      status = 'relaxed_good_resilience';
      level = 'Sangat Baik';
      interpretation = 'Kondisi relaksasi baik dengan resilience tinggi. Sistem saraf otonom seimbang.';
    } else {
      status = 'moderate';
      level = 'Normal';
      interpretation = 'Variabilitas detak jantung dalam rentang normal. Tidak ada indikasi stres berlebihan.';
    }

    return {
      status,
      level,
      interpretation,
      metrics: {
        rmssd: Math.round(rmssd * 10) / 10,
        sdnn: Math.round(sdnn * 10) / 10,
        rrCount: recentRR.length
      }
    };
  }

  /**
   * Analisis Cardiac Stress
   *
   * Mendeteksi stres kardiovaskular dengan mengkorelasikan:
   * - BPM yang tinggi (> 90) saat kondisi istirahat
   * - RMSSD yang rendah bersamaan dengan BPM tinggi
   * - Stabilitas data (untuk memastikan bukan karena aktivitas fisik)
   *
   * Logika medis:
   * BPM tinggi + HRV rendah saat istirahat = Cardiac Stress
   * Ini mengindikasikan aktivitas sympathetic nervous system berlebih.
   *
   * @returns {Object} Hasil analisis cardiac stress
   */
  analyzeCardiacStress() {
    if (this.bpmHistory.length < this.config.minDataPoints) {
      return {
        status: 'insufficient_data',
        message: 'Data tidak cukup untuk analisis cardiac stress'
      };
    }

    // Ambil data terbaru untuk analisis stabilitas
    const recentBPM = this.bpmHistory.slice(-this.config.cardiacStress.stabilityWindow);
    const recentRR = this.rrIntervals.slice(-this.config.cardiacStress.stabilityWindow);

    // Hitung rata-rata BPM terbaru
    const avgBPM = recentBPM.reduce((sum, val) => sum + val, 0) / recentBPM.length;

    // Hitung RMSSD terbaru
    const currentRMSSD = this.calculateRMSSD(recentRR);

    // Cek stabilitas data (standard deviation rendah = kondisi stabil/istirahat)
    const bpmVariance = recentBPM.reduce((sum, val) => {
      const diff = val - avgBPM;
      return sum + (diff * diff);
    }, 0) / recentBPM.length;
    const bpmStdDev = Math.sqrt(bpmVariance);

    // Kondisi dianggap stabil jika std dev < 5 (tidak banyak fluktuasi)
    const isStable = bpmStdDev < 5;

    // Deteksi cardiac stress: BPM tinggi + RMSSD rendah + kondisi stabil
    const hasCardiacStress =
      avgBPM > this.config.cardiacStress.highBPM &&
      currentRMSSD < this.config.cardiacStress.lowRMSSD &&
      isStable;

    return {
      status: hasCardiacStress ? 'detected' : 'normal',
      level: hasCardiacStress ? 'Terdeteksi' : 'Normal',
      interpretation: hasCardiacStress
        ? 'Terdeteksi cardiac stress: BPM tinggi dengan HRV rendah saat kondisi istirahat. Ini mengindikasikan aktivitas sistem saraf sympathetic yang berlebihan.'
        : 'Tidak terdeteksi tanda-tanda cardiac stress. Detak jantung dan variabilitas dalam rentang normal.',
      metrics: {
        avgBPM: Math.round(avgBPM),
        rmssd: Math.round(currentRMSSD * 10) / 10,
        isStable,
        bpmStability: Math.round(bpmStdDev * 10) / 10
      }
    };
  }

  /**
   * Analisis Depression Risk (Risiko Depresi)
   *
   * Menganalisis data jangka panjang untuk mendeteksi pola yang berkaitan
   * dengan risiko depresi:
   * - Penurunan rata-rata HRV harian
   * - SpO2 yang sering turun < 95% saat jam tidur (22:00 - 06:00)
   *
   * Logika medis:
   * Penelitian menunjukkan bahwa penurunan HRV dan hipoksia nokturnal
   * (kekurangan oksigen saat tidur) berkorelasi dengan depresi.
   *
   * @returns {Object} Hasil analisis depression risk
   */
  analyzeDepressionRisk() {
    if (this.timestamps.length < this.config.minDataPoints) {
      return {
        status: 'insufficient_data',
        message: 'Data tidak cukup untuk analisis risiko depresi (perlu data minimal 7 hari)'
      };
    }

    // Hitung HRV harian untuk deteksi tren
    const dailyHRV = this.calculateDailyAverages();

    // Jika data kurang dari 3 hari, belum bisa analisis tren
    if (dailyHRV.length < 3) {
      return {
        status: 'insufficient_data',
        message: 'Membutuhkan data minimal 3 hari untuk analisis tren HRV'
      };
    }

    // Deteksi tren penurunan HRV
    const hrvTrend = this.calculateTrend(dailyHRV.map(d => d.avgRMSSD));
    const hrvDecreasePercent = Math.abs(hrvTrend.changePercent);

    // Analisis SpO2 saat jam tidur (22:00 - 06:00)
    const nighttimeSpO2Issues = this.analyzeNighttimeSpO2();

    // Risiko depresi jika:
    // 1. HRV menurun > 20% dari baseline DAN
    // 2. SpO2 sering turun < 95% saat tidur
    const hasDepressionRisk =
      hrvTrend.direction === 'decreasing' &&
      hrvDecreasePercent > this.config.depression.hrvDecreasePercent &&
      nighttimeSpO2Issues.lowSpO2Frequency > 30; // > 30% waktu tidur SpO2 rendah

    return {
      status: hasDepressionRisk ? 'detected' : 'normal',
      level: hasDepressionRisk ? 'Terdeteksi' : 'Normal',
      interpretation: hasDepressionRisk
        ? 'Terdeteksi pola yang berkaitan dengan risiko depresi: penurunan HRV dan masalah saturasi oksigen saat tidur. Konsultasi dengan profesional kesehatan mental disarankan.'
        : 'Tidak terdeteksi pola yang berkaitan dengan risiko depresi. HRV dan saturasi oksigen dalam kondisi baik.',
      metrics: {
        hrvTrend: hrvTrend.direction,
        hrvChangePercent: Math.round(hrvDecreasePercent),
        nighttimeSpO2Issues: nighttimeSpO2Issues.lowSpO2Frequency,
        daysAnalyzed: dailyHRV.length
      }
    };
  }

  /**
   * Analisis Stress Resilience (Ketahanan Stres)
   *
   * Mengukur seberapa cepat sistem kardiovaskular pulih ke kondisi normal
   * setelah mengalami stres (ditandai dengan lonjakan BPM).
   *
   * Logika medis:
   * Resilience tinggi = recovery cepat = sistem saraf otonom yang sehat
   * Resilience rendah = recovery lambat = potensi masalah regulasi stres
   *
   * @returns {Object} Hasil analisis stress resilience
   */
  analyzeStressResilience() {
    if (this.bpmHistory.length < this.config.minDataPoints || !this.baselineBPM) {
      return {
        status: 'insufficient_data',
        message: 'Data tidak cukup untuk analisis stress resilience'
      };
    }

    // Cari event lonjakan BPM (spike)
    const spikeEvents = this.detectBPMSpikes();

    if (spikeEvents.length === 0) {
      return {
        status: 'no_stress_events',
        level: 'Tidak Ada Data',
        interpretation: 'Tidak terdeteksi lonjakan BPM yang signifikan dalam periode analisis.',
        metrics: {
          spikesDetected: 0,
          avgRecoveryTime: 0
        }
      };
    }

    // Hitung waktu recovery untuk setiap spike
    const recoveryTimes = spikeEvents.map(event => event.recoveryTime);
    const avgRecoveryTime = recoveryTimes.reduce((sum, val) => sum + val, 0) / recoveryTimes.length;

    // Tentukan level resilience
    let level, interpretation;
    if (avgRecoveryTime < this.config.resilience.recoveryTimeGood) {
      level = 'Tinggi';
      interpretation = 'Ketahanan stres sangat baik. Sistem kardiovaskular pulih dengan cepat setelah stres.';
    } else if (avgRecoveryTime < this.config.resilience.recoveryTimeModerate) {
      level = 'Sedang';
      interpretation = 'Ketahanan stres dalam rentang normal. Recovery cukup baik setelah stres.';
    } else {
      level = 'Rendah';
      interpretation = 'Ketahanan stres rendah. Recovery lambat setelah stres, disarankan untuk praktek manajemen stres.';
    }

    return {
      status: 'analyzed',
      level,
      interpretation,
      metrics: {
        spikesDetected: spikeEvents.length,
        avgRecoveryTime: Math.round(avgRecoveryTime / 1000), // dalam detik
        fastestRecovery: Math.round(Math.min(...recoveryTimes) / 1000),
        slowestRecovery: Math.round(Math.max(...recoveryTimes) / 1000)
      }
    };
  }

  /**
   * Deteksi lonjakan BPM dan hitung waktu recovery
   *
   * @returns {Array<Object>} Array of spike events dengan recovery time
   */
  detectBPMSpikes() {
    if (!this.baselineBPM) return [];

    const spikeEvents = [];
    let inSpike = false;
    let spikeStartIndex = -1;

    for (let i = 0; i < this.bpmHistory.length; i++) {
      const currentBPM = this.bpmHistory[i];
      const isElevated = currentBPM > this.baselineBPM + this.config.resilience.bpmSpikeThreshold;

      // Deteksi awal spike
      if (isElevated && !inSpike) {
        inSpike = true;
        spikeStartIndex = i;
      }

      // Deteksi akhir spike (recovery)
      if (!isElevated && inSpike) {
        inSpike = false;
        const recoveryIndex = i;
        const recoveryTime = this.timestamps[recoveryIndex] - this.timestamps[spikeStartIndex];

        spikeEvents.push({
          startIndex: spikeStartIndex,
          endIndex: recoveryIndex,
          peakBPM: Math.max(...this.bpmHistory.slice(spikeStartIndex, recoveryIndex)),
          recoveryTime
        });
      }
    }

    return spikeEvents;
  }

  /**
   * Menghitung rata-rata HRV harian
   *
   * @returns {Array<Object>} Array berisi avgRMSSD per hari
   */
  calculateDailyAverages() {
    const dailyData = {};

    for (let i = 0; i < this.timestamps.length; i++) {
      const date = new Date(this.timestamps[i]);
      const dateKey = date.toDateString();

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          rrIntervals: [],
          spo2Values: []
        };
      }

      dailyData[dateKey].rrIntervals.push(this.rrIntervals[i]);
      dailyData[dateKey].spo2Values.push(this.spo2History[i]);
    }

    // Hitung rata-rata per hari
    return Object.keys(dailyData).map(dateKey => {
      const dayData = dailyData[dateKey];
      return {
        date: dateKey,
        avgRMSSD: this.calculateRMSSD(dayData.rrIntervals),
        avgSpO2: dayData.spo2Values.reduce((sum, val) => sum + val, 0) / dayData.spo2Values.length
      };
    });
  }

  /**
   * Menghitung tren dari array data (increasing/decreasing/stable)
   *
   * @param {Array<number>} data - Array data numerik
   * @returns {Object} Tren dan persentase perubahan
   */
  calculateTrend(data) {
    if (data.length < 2) {
      return { direction: 'unknown', changePercent: 0 };
    }

    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const change = lastValue - firstValue;
    const changePercent = (change / firstValue) * 100;

    let direction;
    if (Math.abs(changePercent) < 5) {
      direction = 'stable';
    } else if (changePercent > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    return { direction, changePercent };
  }

  /**
   * Analisis SpO2 saat jam tidur (22:00 - 06:00)
   *
   * @returns {Object} Frekuensi SpO2 rendah saat tidur
   */
  analyzeNighttimeSpO2() {
    let nighttimeCount = 0;
    let lowSpO2Count = 0;

    for (let i = 0; i < this.timestamps.length; i++) {
      const date = new Date(this.timestamps[i]);
      const hour = date.getHours();

      // Jam tidur: 22:00 - 06:00
      const isNighttime = hour >= 22 || hour < 6;

      if (isNighttime) {
        nighttimeCount++;
        if (this.spo2History[i] < this.config.depression.lowSpO2) {
          lowSpO2Count++;
        }
      }
    }

    const lowSpO2Frequency = nighttimeCount > 0
      ? (lowSpO2Count / nighttimeCount) * 100
      : 0;

    return {
      lowSpO2Frequency: Math.round(lowSpO2Frequency),
      nighttimeDataPoints: nighttimeCount
    };
  }

  /**
   * Analisis Mental Health Lengkap
   *
   * Menjalankan semua analisis dan menggabungkan hasilnya
   *
   * @returns {Object} Hasil analisis lengkap kesehatan mental
   */
  getFullMentalHealthAnalysis() {
    // Jalankan semua analisis
    const hrvAnalysis = this.analyzeHRV();
    const cardiacStress = this.analyzeCardiacStress();
    const depressionRisk = this.analyzeDepressionRisk();
    const stressResilience = this.analyzeStressResilience();

    // Tentukan mood stability berdasarkan HRV dan cardiac stress
    let moodStability;
    if (hrvAnalysis.status === 'anxiety_high_stress' || cardiacStress.status === 'detected') {
      moodStability = 'Tidak Stabil';
    } else if (hrvAnalysis.status === 'relaxed_good_resilience') {
      moodStability = 'Sangat Stabil';
    } else {
      moodStability = 'Stabil';
    }

    // Hitung anxiety level
    let anxietyLevel;
    if (hrvAnalysis.status === 'anxiety_high_stress') {
      anxietyLevel = 'Tinggi';
    } else if (cardiacStress.status === 'detected') {
      anxietyLevel = 'Sedang';
    } else {
      anxietyLevel = 'Rendah';
    }

    // Summary rekomendasi
    const recommendations = [];

    if (hrvAnalysis.status === 'anxiety_high_stress') {
      recommendations.push({
        type: 'warning',
        text: 'Latihan pernapasan dalam untuk meningkatkan HRV'
      });
    }

    if (cardiacStress.status === 'detected') {
      recommendations.push({
        type: 'warning',
        text: 'Kurangi aktivitas yang memicu stres, istirahat cukup'
      });
    }

    if (depressionRisk.status === 'detected') {
      recommendations.push({
        type: 'danger',
        text: 'Konsultasi dengan profesional kesehatan mental'
      });
    }

    if (stressResilience.level === 'Rendah') {
      recommendations.push({
        type: 'info',
        text: 'Praktikkan mindfulness dan meditasi untuk meningkatkan resilience'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        text: 'Kesehatan mental Anda dalam kondisi baik. Pertahankan!'
      });
    }

    // Simpan hasil ke cache
    this.lastAnalysis = {
      timestamp: Date.now(),
      moodStability,
      anxietyLevel,
      stressResilience: stressResilience.level,
      hrv: hrvAnalysis,
      cardiacStress,
      depressionRisk,
      resilience: stressResilience,
      recommendations,
      dataQuality: {
        totalDataPoints: this.rrIntervals.length,
        sufficient: this.rrIntervals.length >= this.config.minDataPoints
      }
    };

    return this.lastAnalysis;
  }

  /**
   * Reset semua data (untuk testing atau reset user)
   */
  reset() {
    this.rrIntervals = [];
    this.bpmHistory = [];
    this.spo2History = [];
    this.timestamps = [];
    this.lastAnalysis = null;
    this.baselineBPM = null;
    this.baselineRMSSD = null;
  }

  /**
   * Export data untuk backup atau analisis eksternal
   *
   * @returns {Object} Data yang bisa disimpan ke localStorage atau Firebase
   */
  exportData() {
    return {
      rrIntervals: this.rrIntervals,
      bpmHistory: this.bpmHistory,
      spo2History: this.spo2History,
      timestamps: this.timestamps,
      baselineBPM: this.baselineBPM,
      baselineRMSSD: this.baselineRMSSD,
      lastAnalysis: this.lastAnalysis
    };
  }

  /**
   * Import data dari backup
   *
   * @param {Object} data - Data yang di-export sebelumnya
   */
  importData(data) {
    this.rrIntervals = data.rrIntervals || [];
    this.bpmHistory = data.bpmHistory || [];
    this.spo2History = data.spo2History || [];
    this.timestamps = data.timestamps || [];
    this.baselineBPM = data.baselineBPM || null;
    this.baselineRMSSD = data.baselineRMSSD || null;
    this.lastAnalysis = data.lastAnalysis || null;
  }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MentalHealthAnalyzer;
}

// Inisialisasi global instance
window.mentalHealthAnalyzer = window.mentalHealthAnalyzer || new MentalHealthAnalyzer();
