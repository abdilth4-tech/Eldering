/**
 * CARERING - Temperature-Based Mental Health Analyzer
 * Analisis kesehatan mental berdasarkan pola suhu tubuh dan lingkungan
 *
 * Metrik yang dianalisis:
 * - Ritme Sirkadian (Circadian Rhythm)
 * - Kualitas Tidur (Nocturnal Temperature Drop)
 * - Respons Stres (Temperature Variance)
 * - Adaptasi Lingkungan (Thermoregulation)
 */

class TemperatureMentalAnalyzer {
  constructor() {
    // Storage untuk data suhu dengan timestamp
    this.temperatureHistory = []; // Array {objTemp, ambTemp, timestamp}

    // Configuration
    this.config = {
      // Data logging setiap 30 menit
      loggingInterval: 30 * 60 * 1000, // 30 menit dalam ms

      // Simpan data 24 jam terakhir
      maxDataAge: 24 * 60 * 60 * 1000, // 24 jam dalam ms

      // Threshold untuk analisis ritme sirkadian
      circadian: {
        eveningHours: { start: 16, end: 18 }, // 16:00 - 18:00
        earlyMorningHours: { start: 3, end: 5 }, // 03:00 - 05:00
        minDifference: 0.5 // Minimal perbedaan 0.5°C untuk ritme normal
      },

      // Threshold untuk kualitas tidur
      sleep: {
        sleepHours: { start: 22, end: 6 }, // 22:00 - 06:00
        daytimeHours: { start: 10, end: 18 }, // 10:00 - 18:00
        minNocturnalDrop: 0.3 // Minimal turun 0.3°C untuk tidur berkualitas
      },

      // Threshold untuk respons stres (variance)
      stress: {
        windowMinutes: 10, // Analisis dalam window 10 menit
        maxVariance: 0.2, // Fluktuasi maksimal 0.2°C untuk kondisi tenang
        restingHours: { start: 20, end: 23 } // Waktu istirahat 20:00 - 23:00
      },

      // Threshold untuk adaptasi lingkungan
      adaptation: {
        normalDifference: { min: -1.0, max: 1.0 }, // Selisih normal tubuh vs ruangan
        maxAmbientChange: 3.0 // Perubahan suhu ruangan > 3°C = drastis
      }
    };

    // Last logging time
    this.lastLogTime = 0;

    // Baseline values
    this.daytimeBaseline = null;
    this.eveningBaseline = null;
    this.earlyMorningBaseline = null;
  }

  /**
   * Tambahkan data suhu baru (dipanggil setiap kali ada data dari BLE)
   *
   * @param {Object} data - {objTemp, ambTemp, timestamp}
   */
  addTemperatureData(data) {
    const { objTemp, ambTemp, timestamp } = data;
    const now = timestamp || Date.now();

    // Data validation
    if (typeof objTemp !== 'number' || typeof ambTemp !== 'number') {
      console.warn('⚠️ Invalid temperature data');
      return;
    }

    if (objTemp < 30 || objTemp > 42 || ambTemp < 0 || ambTemp > 50) {
      console.warn('⚠️ Temperature out of valid range');
      return;
    }

    // Logging mechanism: simpan data setiap 30 menit
    if (now - this.lastLogTime >= this.config.loggingInterval) {
      this.temperatureHistory.push({
        objTemp,
        ambTemp,
        timestamp: now
      });

      this.lastLogTime = now;
      console.log(`📊 Temperature logged: Body ${objTemp}°C, Ambient ${ambTemp}°C`);

      // Cleanup data yang lebih lama dari 24 jam
      this.cleanupOldData();

      // Update baseline values
      this.updateBaselines();
    }
  }

  /**
   * Hapus data yang lebih lama dari 24 jam
   */
  cleanupOldData() {
    const now = Date.now();
    const maxAge = this.config.maxDataAge;

    this.temperatureHistory = this.temperatureHistory.filter(entry => {
      return (now - entry.timestamp) <= maxAge;
    });

    console.log(`🧹 Temperature history cleaned. Remaining entries: ${this.temperatureHistory.length}`);
  }

  /**
   * Update baseline values untuk berbagai periode waktu
   */
  updateBaselines() {
    // Daytime baseline (10:00 - 18:00)
    const daytimeData = this.getDataByTimeRange(
      this.config.sleep.daytimeHours.start,
      this.config.sleep.daytimeHours.end
    );

    if (daytimeData.length > 0) {
      this.daytimeBaseline = this.calculateAverage(daytimeData.map(d => d.objTemp));
    }

    // Evening baseline (16:00 - 18:00)
    const eveningData = this.getDataByTimeRange(
      this.config.circadian.eveningHours.start,
      this.config.circadian.eveningHours.end
    );

    if (eveningData.length > 0) {
      this.eveningBaseline = this.calculateAverage(eveningData.map(d => d.objTemp));
    }

    // Early morning baseline (03:00 - 05:00)
    const earlyMorningData = this.getDataByTimeRange(
      this.config.circadian.earlyMorningHours.start,
      this.config.circadian.earlyMorningHours.end
    );

    if (earlyMorningData.length > 0) {
      this.earlyMorningBaseline = this.calculateAverage(earlyMorningData.map(d => d.objTemp));
    }
  }

  /**
   * Ambil data berdasarkan rentang jam
   *
   * @param {number} startHour - Jam mulai (0-23)
   * @param {number} endHour - Jam akhir (0-23)
   * @returns {Array} Data dalam rentang jam tersebut
   */
  getDataByTimeRange(startHour, endHour) {
    return this.temperatureHistory.filter(entry => {
      const date = new Date(entry.timestamp);
      const hour = date.getHours();

      // Handle case where range crosses midnight
      if (startHour > endHour) {
        return hour >= startHour || hour <= endHour;
      } else {
        return hour >= startHour && hour <= endHour;
      }
    });
  }

  /**
   * Hitung rata-rata dari array angka
   *
   * @param {Array<number>} values - Array nilai
   * @returns {number} Rata-rata
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Hitung variance (varians) dari array angka
   *
   * @param {Array<number>} values - Array nilai
   * @returns {number} Variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;

    const mean = this.calculateAverage(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return this.calculateAverage(squaredDiffs);
  }

  /**
   * ANALISIS 1: RITME SIRKADIAN (Circadian Rhythm Analysis)
   *
   * Logika Medis:
   * Suhu tubuh mengikuti ritme sirkadian 24 jam. Normalnya, suhu tubuh
   * mencapai puncak di sore hari (16:00-18:00) dan terendah di dini hari
   * (03:00-05:00). Perbedaan minimal 0.5°C menunjukkan ritme sirkadian yang sehat.
   *
   * Gangguan ritme sirkadian berhubungan dengan:
   * - Mood disorders (depresi, bipolar)
   * - Anxiety disorders
   * - Sleep disorders
   * - Seasonal affective disorder (SAD)
   *
   * @returns {Object} Hasil analisis ritme sirkadian
   */
  analyzeCircadianRhythm() {
    // Cek apakah ada data untuk kedua periode
    if (!this.eveningBaseline || !this.earlyMorningBaseline) {
      return {
        status: 'insufficient_data',
        message: 'Membutuhkan data suhu sore dan dini hari untuk analisis',
        hasEveningData: !!this.eveningBaseline,
        hasEarlyMorningData: !!this.earlyMorningBaseline
      };
    }

    // Hitung perbedaan suhu (Tmax - Tmin)
    const difference = Math.abs(this.eveningBaseline - this.earlyMorningBaseline);

    // Determine status
    let status, level, interpretation, recommendation;

    if (difference < this.config.circadian.minDifference) {
      // Ritme sirkadian terganggu
      status = 'disrupted';
      level = 'Terganggu';
      interpretation = 'Perbedaan suhu tubuh antara sore dan dini hari terlalu kecil. Ini mengindikasikan gangguan ritme sirkadian yang dapat mempengaruhi stabilitas mood dan kualitas tidur.';
      recommendation = 'Jaga konsistensi jadwal tidur-bangun, tingkatkan paparan cahaya pagi, dan kurangi cahaya biru malam hari.';
    } else if (difference >= this.config.circadian.minDifference && difference < 1.0) {
      // Ritme sirkadian normal
      status = 'normal';
      level = 'Normal';
      interpretation = 'Perbedaan suhu tubuh antara sore dan dini hari dalam rentang normal. Ritme sirkadian Anda berfungsi dengan baik.';
      recommendation = 'Pertahankan pola tidur yang konsisten untuk menjaga ritme sirkadian yang sehat.';
    } else {
      // Ritme sirkadian sangat baik
      status = 'excellent';
      level = 'Sangat Baik';
      interpretation = 'Ritme sirkadian Anda sangat kuat dengan perbedaan suhu yang optimal. Ini menunjukkan regulasi circadian yang sehat.';
      recommendation = 'Teruskan pola hidup sehat Anda!';
    }

    return {
      status,
      level,
      interpretation,
      recommendation,
      metrics: {
        eveningTemp: Math.round(this.eveningBaseline * 10) / 10,
        earlyMorningTemp: Math.round(this.earlyMorningBaseline * 10) / 10,
        difference: Math.round(difference * 100) / 100
      }
    };
  }

  /**
   * ANALISIS 2: KUALITAS TIDUR (Sleep Quality - Nocturnal Drop)
   *
   * Logika Medis:
   * Saat tidur, suhu tubuh inti turun sekitar 0.3-0.5°C dibanding siang hari.
   * Penurunan ini penting untuk:
   * - Inisiasi tidur (sleep onset)
   * - Tidur dalam (deep sleep / slow-wave sleep)
   * - Pemulihan mental dan fisik
   * - Konsolidasi memori
   *
   * Kurangnya penurunan suhu nokturnal mengindikasikan:
   * - Insomnia atau gangguan tidur
   * - Aktivasi sistem saraf simpatis berlebihan
   * - Stres kronis
   * - Pemulihan mental tidak optimal
   *
   * @returns {Object} Hasil analisis kualitas tidur
   */
  analyzeSleepQuality() {
    // Cek apakah ada data daytime dan sleep time
    if (!this.daytimeBaseline) {
      return {
        status: 'insufficient_data',
        message: 'Membutuhkan data suhu siang hari untuk analisis'
      };
    }

    // Ambil data saat jam tidur
    const sleepData = this.getDataByTimeRange(
      this.config.sleep.sleepHours.start,
      this.config.sleep.sleepHours.end
    );

    if (sleepData.length === 0) {
      return {
        status: 'insufficient_data',
        message: 'Membutuhkan data suhu saat jam tidur (22:00 - 06:00) untuk analisis'
      };
    }

    // Hitung rata-rata suhu saat tidur
    const sleepAvgTemp = this.calculateAverage(sleepData.map(d => d.objTemp));

    // Hitung nocturnal drop
    const nocturnalDrop = this.daytimeBaseline - sleepAvgTemp;

    let status, level, interpretation, recommendation;

    if (nocturnalDrop < this.config.sleep.minNocturnalDrop) {
      // Kualitas tidur rendah
      status = 'poor';
      level = 'Rendah';
      interpretation = `Suhu tubuh tidak turun cukup saat tidur (hanya ${Math.round(nocturnalDrop * 100) / 100}°C). Ini mengindikasikan kualitas tidur yang rendah dan pemulihan mental yang tidak optimal.`;
      recommendation = 'Ciptakan lingkungan tidur yang lebih sejuk (18-21°C), hindari kafein sore hari, dan praktikkan teknik relaksasi sebelum tidur.';
    } else if (nocturnalDrop >= this.config.sleep.minNocturnalDrop && nocturnalDrop < 0.6) {
      // Kualitas tidur normal
      status = 'normal';
      level = 'Normal';
      interpretation = `Penurunan suhu nokturnal dalam rentang normal (${Math.round(nocturnalDrop * 100) / 100}°C). Kualitas tidur dan pemulihan mental Anda cukup baik.`;
      recommendation = 'Pertahankan rutinitas tidur yang konsisten untuk kualitas tidur optimal.';
    } else {
      // Kualitas tidur sangat baik
      status = 'excellent';
      level = 'Sangat Baik';
      interpretation = `Penurunan suhu nokturnal sangat baik (${Math.round(nocturnalDrop * 100) / 100}°C). Anda mendapatkan tidur berkualitas tinggi dengan pemulihan mental optimal.`;
      recommendation = 'Teruskan kebiasaan tidur yang sehat!';
    }

    return {
      status,
      level,
      interpretation,
      recommendation,
      metrics: {
        daytimeTemp: Math.round(this.daytimeBaseline * 10) / 10,
        sleepTemp: Math.round(sleepAvgTemp * 10) / 10,
        nocturnalDrop: Math.round(nocturnalDrop * 100) / 100
      }
    };
  }

  /**
   * ANALISIS 3: RESPONS STRES (Stress Response - Temperature Variance)
   *
   * Logika Medis:
   * Sistem saraf otonom (ANS) mengatur suhu tubuh. Saat stres, aktivasi
   * sistem saraf simpatis menyebabkan fluktuasi suhu yang cepat dan tidak stabil.
   *
   * Temperature variance yang tinggi saat istirahat mengindikasikan:
   * - Aktivasi fight-or-flight response
   * - Dysregulation sistem saraf otonom
   * - Anxiety atau stress akut
   * - Hypervigilance (kewaspadaan berlebihan)
   *
   * Analisis dilakukan dalam window 10 menit saat kondisi istirahat
   * untuk menghindari false positive dari aktivitas fisik.
   *
   * @returns {Object} Hasil analisis respons stres
   */
  analyzeStressResponse() {
    // Ambil data saat jam istirahat (20:00 - 23:00)
    const restingData = this.getDataByTimeRange(
      this.config.stress.restingHours.start,
      this.config.stress.restingHours.end
    );

    if (restingData.length < 2) {
      return {
        status: 'insufficient_data',
        message: 'Membutuhkan minimal 2 data saat jam istirahat (20:00 - 23:00)'
      };
    }

    // Ambil data dalam window 10 menit terakhir
    const now = Date.now();
    const windowMs = this.config.stress.windowMinutes * 60 * 1000;

    const recentData = restingData.filter(entry => {
      return (now - entry.timestamp) <= windowMs;
    });

    if (recentData.length < 2) {
      // Fallback: gunakan 2 data terakhir
      const lastTwo = restingData.slice(-2);
      const tempValues = lastTwo.map(d => d.objTemp);

      // Hitung range (max - min)
      const tempRange = Math.max(...tempValues) - Math.min(...tempValues);

      return this.evaluateStressLevel(tempRange, tempValues.length);
    }

    // Hitung variance dari data dalam window
    const tempValues = recentData.map(d => d.objTemp);
    const variance = this.calculateVariance(tempValues);

    // Konversi variance ke range estimate (approximation)
    // Untuk distribusi normal, range ≈ 4 * stddev = 4 * sqrt(variance)
    const tempRange = Math.sqrt(variance) * 4;

    return this.evaluateStressLevel(tempRange, tempValues.length);
  }

  /**
   * Evaluasi level stres berdasarkan temperature range
   *
   * @param {number} tempRange - Range suhu (max - min)
   * @param {number} dataPoints - Jumlah data points
   * @returns {Object} Evaluasi stress level
   */
  evaluateStressLevel(tempRange, dataPoints) {
    let status, level, interpretation, recommendation;

    if (tempRange > this.config.stress.maxVariance) {
      // Respons stres terdeteksi
      status = 'detected';
      level = 'Terdeteksi';
      interpretation = `Fluktuasi suhu tubuh tinggi (${Math.round(tempRange * 100) / 100}°C) saat kondisi istirahat. Ini mengindikasikan aktivasi sistem saraf simpatis dan respons stres otonom.`;
      recommendation = 'Praktikkan teknik relaksasi seperti pernapasan dalam, meditasi, atau progressive muscle relaxation untuk menenangkan sistem saraf.';
    } else if (tempRange > this.config.stress.maxVariance * 0.5) {
      // Respons stres ringan
      status = 'mild';
      level = 'Ringan';
      interpretation = `Fluktuasi suhu tubuh sedikit meningkat (${Math.round(tempRange * 100) / 100}°C). Mungkin ada tingkat stres ringan atau kelelahan.`;
      recommendation = 'Pastikan istirahat cukup dan kelola stres dengan aktivitas yang menyenangkan.';
    } else {
      // Tidak ada respons stres
      status = 'normal';
      level = 'Normal';
      interpretation = `Suhu tubuh stabil saat istirahat (fluktuasi ${Math.round(tempRange * 100) / 100}°C). Sistem saraf otonom berfungsi dengan baik.`;
      recommendation = 'Pertahankan gaya hidup sehat untuk menjaga stabilitas sistem saraf.';
    }

    return {
      status,
      level,
      interpretation,
      recommendation,
      metrics: {
        tempRange: Math.round(tempRange * 100) / 100,
        dataPoints
      }
    };
  }

  /**
   * ANALISIS 4: ADAPTASI LINGKUNGAN (Environmental Adaptation / Thermoregulation)
   *
   * Logika Medis:
   * Thermoregulation adalah kemampuan tubuh mempertahankan suhu inti yang stabil
   * meskipun suhu lingkungan berubah. Proses ini diatur oleh hypothalamus dan
   * sistem saraf otonom.
   *
   * Thermoregulation yang buruk mengindikasikan:
   * - Disfungsi autonomic nervous system (ANS)
   * - Chronic fatigue
   * - Adaptasi stres yang buruk
   * - Seasonal Affective Disorder (SAD) susceptibility
   *
   * Analisis:
   * - Selisih normal: Body temp - Ambient temp dalam range -1.0 hingga +1.0°C
   * - Jika ambient berubah drastis (>3°C) tapi body temp gagal kompensasi = disfungsi
   *
   * @returns {Object} Hasil analisis adaptasi lingkungan
   */
  analyzeEnvironmentalAdaptation() {
    if (this.temperatureHistory.length < 4) {
      return {
        status: 'insufficient_data',
        message: 'Membutuhkan minimal 4 data point (2 jam) untuk analisis'
      };
    }

    // Ambil 4 data terakhir (2 jam terakhir dengan interval 30 menit)
    const recentData = this.temperatureHistory.slice(-4);

    // Hitung rata-rata selisih body temp - ambient temp
    const differences = recentData.map(d => d.objTemp - d.ambTemp);
    const avgDifference = this.calculateAverage(differences);

    // Hitung perubahan ambient temperature
    const ambientTemps = recentData.map(d => d.ambTemp);
    const ambientChange = Math.max(...ambientTemps) - Math.min(...ambientTemps);

    // Hitung stabilitas body temperature saat ambient berubah
    const bodyTemps = recentData.map(d => d.objTemp);
    const bodyVariance = this.calculateVariance(bodyTemps);

    let status, level, interpretation, recommendation;

    // Check 1: Selisih body-ambient di luar rentang normal
    const isAbnormalDifference =
      avgDifference < this.config.adaptation.normalDifference.min ||
      avgDifference > this.config.adaptation.normalDifference.max;

    // Check 2: Ambient berubah drastis
    const isDrasticAmbientChange = ambientChange > this.config.adaptation.maxAmbientChange;

    // Check 3: Body temp tidak stabil (variance tinggi)
    const isBodyUnstable = bodyVariance > 0.1; // Threshold 0.1 untuk variance

    if (isDrasticAmbientChange && isBodyUnstable) {
      // Fungsi otonom lemah - gagal thermoregulation
      status = 'impaired';
      level = 'Lemah';
      interpretation = `Suhu ruangan berubah drastis (${Math.round(ambientChange * 10) / 10}°C), dan tubuh gagal mempertahankan suhu stabil. Ini mengindikasikan fungsi thermoregulasi otonom yang lemah.`;
      recommendation = 'Konsultasi dengan dokter jika gejala berlanjut. Pastikan hidrasi cukup dan hindari perubahan suhu ekstrem.';
    } else if (isAbnormalDifference) {
      // Adaptasi suboptimal
      status = 'suboptimal';
      level = 'Suboptimal';
      interpretation = `Selisih suhu tubuh dan ruangan (${Math.round(avgDifference * 10) / 10}°C) di luar rentang normal. Tubuh mungkin kesulitan beradaptasi dengan lingkungan.`;
      recommendation = 'Atur suhu ruangan ke rentang nyaman (20-24°C) dan pastikan pakaian sesuai dengan suhu lingkungan.';
    } else if (isDrasticAmbientChange && !isBodyUnstable) {
      // Adaptasi sangat baik - thermoregulation kuat
      status = 'excellent';
      level = 'Sangat Baik';
      interpretation = `Meskipun suhu ruangan berubah drastis (${Math.round(ambientChange * 10) / 10}°C), tubuh berhasil mempertahankan suhu stabil. Fungsi thermoregulasi otonom Anda sangat baik.`;
      recommendation = 'Pertahankan kesehatan sistem saraf otonom dengan olahraga teratur dan manajemen stres.';
    } else {
      // Adaptasi normal
      status = 'normal';
      level = 'Normal';
      interpretation = 'Fungsi thermoregulasi otonom dalam kondisi normal. Tubuh mampu beradaptasi dengan perubahan suhu lingkungan.';
      recommendation = 'Pertahankan gaya hidup sehat untuk menjaga fungsi otonom optimal.';
    }

    return {
      status,
      level,
      interpretation,
      recommendation,
      metrics: {
        avgBodyTemp: Math.round(this.calculateAverage(bodyTemps) * 10) / 10,
        avgAmbientTemp: Math.round(this.calculateAverage(ambientTemps) * 10) / 10,
        avgDifference: Math.round(avgDifference * 10) / 10,
        ambientChange: Math.round(ambientChange * 10) / 10,
        bodyVariance: Math.round(bodyVariance * 1000) / 1000
      }
    };
  }

  /**
   * Analisis Lengkap - Jalankan semua analisis
   *
   * @returns {Object} Hasil semua analisis temperature-based mental health
   */
  getFullTemperatureAnalysis() {
    // Jalankan semua analisis
    const circadian = this.analyzeCircadianRhythm();
    const sleep = this.analyzeSleepQuality();
    const stress = this.analyzeStressResponse();
    const adaptation = this.analyzeEnvironmentalAdaptation();

    // Hitung overall mental health score (0-100)
    let score = 100;
    let issues = [];

    if (circadian.status === 'disrupted') {
      score -= 25;
      issues.push('Gangguan ritme sirkadian');
    }

    if (sleep.status === 'poor') {
      score -= 25;
      issues.push('Kualitas tidur rendah');
    }

    if (stress.status === 'detected') {
      score -= 20;
      issues.push('Respons stres terdeteksi');
    } else if (stress.status === 'mild') {
      score -= 10;
    }

    if (adaptation.status === 'impaired') {
      score -= 20;
      issues.push('Fungsi otonom lemah');
    } else if (adaptation.status === 'suboptimal') {
      score -= 10;
    }

    // Overall assessment
    let overallLevel;
    if (score >= 80) {
      overallLevel = 'Excellent';
    } else if (score >= 60) {
      overallLevel = 'Good';
    } else if (score >= 40) {
      overallLevel = 'Fair';
    } else {
      overallLevel = 'Poor';
    }

    return {
      timestamp: Date.now(),
      overallScore: score,
      overallLevel,
      issues,
      dataQuality: {
        totalDataPoints: this.temperatureHistory.length,
        dataSpan: this.getDataSpanHours(),
        sufficient: this.temperatureHistory.length >= 8 // minimal 4 jam data
      },
      analyses: {
        circadian,
        sleep,
        stress,
        adaptation
      }
    };
  }

  /**
   * Hitung span data dalam jam
   *
   * @returns {number} Span data dalam jam
   */
  getDataSpanHours() {
    if (this.temperatureHistory.length === 0) return 0;

    const oldest = this.temperatureHistory[0].timestamp;
    const newest = this.temperatureHistory[this.temperatureHistory.length - 1].timestamp;

    return Math.round((newest - oldest) / (1000 * 60 * 60) * 10) / 10;
  }

  /**
   * Export data untuk backup
   *
   * @returns {Object} Data untuk disimpan
   */
  exportData() {
    return {
      temperatureHistory: this.temperatureHistory,
      lastLogTime: this.lastLogTime,
      daytimeBaseline: this.daytimeBaseline,
      eveningBaseline: this.eveningBaseline,
      earlyMorningBaseline: this.earlyMorningBaseline
    };
  }

  /**
   * Import data dari backup
   *
   * @param {Object} data - Data yang di-export sebelumnya
   */
  importData(data) {
    this.temperatureHistory = data.temperatureHistory || [];
    this.lastLogTime = data.lastLogTime || 0;
    this.daytimeBaseline = data.daytimeBaseline || null;
    this.eveningBaseline = data.eveningBaseline || null;
    this.earlyMorningBaseline = data.earlyMorningBaseline || null;
  }

  /**
   * Reset semua data
   */
  reset() {
    this.temperatureHistory = [];
    this.lastLogTime = 0;
    this.daytimeBaseline = null;
    this.eveningBaseline = null;
    this.earlyMorningBaseline = null;
  }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemperatureMentalAnalyzer;
}

// Inisialisasi global instance
window.temperatureMentalAnalyzer = window.temperatureMentalAnalyzer || new TemperatureMentalAnalyzer();
