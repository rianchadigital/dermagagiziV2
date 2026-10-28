/**
 * =========================================================================================
 * DERMAGA GIZI - GOOGLE APPS SCRIPT BACKEND & WHATSAPP GATEWAY (Code.gs)
 * Puskesmas Kepulauan Seribu Selatan - Provinsi DKI Jakarta
 * =========================================================================================
 * 
 * CATATAN PENTING:
 * Kode ini 100% BERFOKUS PADA DATA SPREADSHEET (Clean Database, Tanpa Dummy Data Hardcoded).
 * Seluruh data sasaran, pemantauan, posyandu, kelurahan, dan pengguna dibaca langsung
 * dari baris-baris sheet Google Spreadsheet Anda.
 * 
 * FITUR UTAMA:
 * 1. setupDatabase() : Otomatis membuat 13 sheet beserta header baku, format warna Navy,
 *    dan baris beku (freeze row 1). TANPA mengisi data tiruan/dummy.
 * 2. clearAllDataRows() : Membersihkan seluruh baris data di semua tabel sheet sekaligus
 *    dan hanya menyisakan header baris 1 (dapat dijalankan langsung dari menu Spreadsheet).
 * 3. CRUD Real-Time : Membaca dan menyimpan data Sasaran, Laporan Posyandu, Tindak Lanjut,
 *    Kendala, dan Master langsung ke baris Google Spreadsheet.
 * 4. WhatsApp API Gateway : Pengiriman otomatis notifikasi broadcast ke nomor WhatsApp
 *    para pejabat & tim lintas sektor (Lurah, Camat, Puskesmas, TP PKK, Kader) yang tersimpan
 *    pada sheet MASTER_LINTAS_SEKTOR.
 * 5. Menu Bar Google Spreadsheet : Menu "⛵ DERMAGA GIZI" dengan tombol cepat langsung di Sheets.
 * 
 * CARA PEMASANGAN DI GOOGLE SPREADSHEET:
 * 1. Buka Google Spreadsheet di https://sheets.new (atau spreadsheet yang sudah Anda miliki).
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus seluruh isi editor bawaan, lalu SALIN & TEMPEL SELURUH KODE FILE INI.
 * 4. Klik ikon Simpan (Ctrl+S).
 * 5. Pilih fungsi 'setupDatabase' dari dropdown fungsi di atas, lalu klik "Jalankan" (Run).
 *    -> Berikan izin akses Google (Review Permissions > Akun Anda > Advanced > Buka (tidak aman) > Izinkan).
 *    -> Seluruh sheet database akan terbentuk bersih dengan header siap pakai!
 * 6. Jika spreadsheet sebelumnya sudah berisi data sampel/dummy yang ingin dibersihkan:
 *    -> Jalankan fungsi 'clearAllDataRows' atau klik menu "⛵ DERMAGA GIZI" > "🧹 Bersihkan Semua Data".
 * 7. Deploy Web App:
 *    - Klik "Terapkan" (Deploy) > "Penerapan baru" (New deployment).
 *    - Pilih jenis: "Aplikasi web" (Web app).
 *    - Jalankan sebagai (Execute as): "Saya" (Me)
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> WAJIB!
 *    - Klik "Terapkan", salin URL Web App (/exec), lalu masukkan ke menu Pengaturan di web Dermaga Gizi.
 * =========================================================================================
 */

// ==========================================
// KONSTANTA NAMA SHEET DATABASE
// ==========================================
var SHEETS = {
  USERS: 'USERS',
  PULAU: 'PULAU',
  MASTER_KELURAHAN: 'MASTER_KELURAHAN',
  MASTER_POSYANDU: 'MASTER_POSYANDU',
  MASTER_LINTAS_SEKTOR: 'MASTER_LINTAS_SEKTOR',
  SASARAN: 'SASARAN',
  PEMANTAUAN: 'PEMANTAUAN',
  LAPORAN_POSYANDU: 'LAPORAN_POSYANDU',
  TINDAK_LANJUT: 'TINDAK_LANJUT',
  KENDALA: 'KENDALA',
  LINTAS_SEKTOR: 'LINTAS_SEKTOR',
  RIWAYAT_AKTIVITAS: 'RIWAYAT_AKTIVITAS',
  KONFIGURASI: 'KONFIGURASI'
};

// ==========================================
// STRUKTUR HEADER KOLOM BAKU (BARIS 1)
// ==========================================
var HEADERS = {
  USERS: [
    'user_id', 'email', 'nama', 'no_wa', 'role', 'unit', 'pulau_id', 'status_aktif', 'created_at', 'updated_at'
  ],
  PULAU: [
    'pulau_id', 'nama_pulau', 'unit_pelayanan', 'latitude', 'longitude', 'status_akses', 'keterangan', 'status_aktif'
  ],
  MASTER_KELURAHAN: [
    'kelurahan_id', 'nama_kelurahan', 'kecamatan', 'daftar_pulau', 'lurah_nama', 'no_wa_lurah', 'jumlah_rw', 'jumlah_rt', 'total_sasaran_balita'
  ],
  MASTER_POSYANDU: [
    'posyandu_id', 'nama_posyandu', 'kelurahan_id', 'kelurahan_nama', 'pulau_id', 'pulau_nama', 'rw', 'rt', 'lokasi_alamat', 'ketua_kader', 'no_wa_kader', 'jumlah_kader', 'jadwal_hari', 'total_sasaran', 'status_aktif'
  ],
  MASTER_LINTAS_SEKTOR: [
    'user_id', 'nama', 'jabatan', 'instansi_sektor', 'kelurahan_id', 'kelurahan_nama', 'no_wa', 'email', 'status_notifikasi_wa', 'status_aktif'
  ],
  SASARAN: [
    'sasaran_id', 'kode_sasaran', 'inisial', 'nik', 'jenis_kelamin', 'tanggal_lahir', 'usia', 'tanggal_ukur', 'cara_ukur', 'bb_terakhir', 'tb_terakhir', 'zscore_bbtb', 'status_gizi_bbtb', 'zscore_tbu', 'status_gizi_tbu', 'zscore_bbu', 'status_gizi_bbu', 'naik_berat_badan', 'keterangan_naik_bb', 'status_outlier_who', 'nama_ortu', 'no_hp', 'wilayah_kecamatan', 'kelurahan_nama', 'puskesmas_pustu', 'posyandu', 'pulau_id', 'unit_pelayanan', 'tanggal_registrasi', 'status_aktif', 'kategori_masalah_terakhir', 'tanggal_pantau_terakhir'
  ],
  PEMANTAUAN: [
    'pemantauan_id', 'sasaran_id', 'tanggal_pemantauan', 'petugas_id', 'indikator_terukur', 'kategori_masalah', 'hasil_pemeriksaan', 'catatan_terbatas', 'periode', 'created_at'
  ],
  LAPORAN_POSYANDU: [
    'laporan_id', 'tanggal_pelaksanaan', 'bulan', 'tahun', 'kelurahan_id', 'kelurahan_nama', 'posyandu_id', 'posyandu_nama', 'petugas_pelapor', 'no_wa_petugas', 'total_sasaran', 'total_ditimbang', 'total_tidak_hadir', 'persentase_d_s', 'keterangan_sweeping', 'jumlah_balita_kurang_gizi', 'status_notifikasi_wa', 'created_at', 'created_by'
  ],
  TINDAK_LANJUT: [
    'tindak_lanjut_id', 'sasaran_id', 'pemantauan_id', 'kategori', 'rencana_intervensi', 'tanggal_rencana', 'tenggat', 'petugas_id', 'status', 'prioritas', 'tanggal_selesai', 'catatan', 'is_from_posyandu', 'posyandu_nama', 'kelurahan_nama', 'tindak_lanjut_lintas_sektor_json', 'created_at', 'updated_at'
  ],
  KENDALA: [
    'kendala_id', 'tanggal_kejadian', 'pulau_id', 'kategori', 'deskripsi', 'dampak', 'rencana_penyelesaian', 'penanggung_jawab', 'tenggat', 'status', 'sasaran_terkait_kode', 'catatan_tindak_lanjut', 'created_at', 'updated_at'
  ],
  LINTAS_SEKTOR: [
    'kegiatan_id', 'tanggal_kesepakatan', 'nama_kegiatan', 'pulau_id', 'mitra', 'penanggung_jawab', 'tenggat', 'indikator', 'target', 'realisasi', 'progres', 'status', 'catatan', 'terakhir_evaluasi', 'updated_at'
  ],
  RIWAYAT_AKTIVITAS: [
    'log_id', 'waktu', 'user_id', 'user_name', 'aksi', 'jenis_data', 'record_id', 'ringkasan_perubahan', 'status'
  ],
  KONFIGURASI: [
    'key', 'value', 'deskripsi', 'updated_at'
  ]
};

// =========================================================================================
// MENU SPREADSHEET (Muncul otomatis saat spreadsheet dibuka)
// =========================================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⛵ DERMAGA GIZI')
    .addItem('🚀 Setup Database & Header (setupDatabase)', 'setupDatabase')
    .addItem('🧹 Bersihkan Semua Data (Hanya Sisakan Header)', 'clearAllDataRows')
    .addSeparator()
    .addItem('📱 Tes Koneksi WhatsApp API', 'menuTestWhatsApp')
    .addItem('👥 Kirim Notifikasi Tes ke Lintas Sektor', 'menuBroadcastTestWhatsApp')
    .addSeparator()
    .addItem('📋 Cek Status Database & Jumlah Data', 'menuCheckStatus')
    .addItem('ℹ️ Panduan Konfigurasi WhatsApp Gateway', 'menuShowGuide')
    .addToUi();
}

/**
 * =========================================================================================
 * 1. SETUP DATABASE BERSIH (setupDatabase / initializeDatabase)
 * =========================================================================================
 * Membuat semua sheet database yang diperlukan jika belum ada.
 * Mengisi baris header warna navy (#0f2b48) dan membekukan baris pertama (frozen row 1).
 * HANYA menginisialisasi sheet KONFIGURASI sistem tanpa memasukkan data dummy/sampel.
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = [];

  for (var key in HEADERS) {
    var sheetName = SHEETS[key];
    var sheet = ss.getSheetByName(sheetName);
    var cols = HEADERS[key];

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(cols);
      formatHeaderRow(sheet, cols.length);
      log.push('✅ Sheet baru dibuat: ' + sheetName);
    } else {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(cols);
        formatHeaderRow(sheet, cols.length);
        log.push('🔹 Header ditambahkan ke: ' + sheetName);
      } else {
        log.push('✔ Sheet sudah aktif: ' + sheetName);
      }
    }
  }

  // Inisialisasi parameter konfigurasi dasar sistem di sheet KONFIGURASI
  initConfigSheet(ss);

  // Rapikan sheet bawaan jika kosong
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() <= 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }

  var msg = 'Inisialisasi Database Bersih Berhasil!\n\n' + log.join('\n');
  Logger.log(msg);

  try {
    ss.toast('Setup database DERMAGA GIZI selesai! Header siap menerima data.', 'Sukses', 5);
  } catch (e) {}

  return {
    success: true,
    message: 'Setup database DERMAGA GIZI berhasil dijalankan. Struktur sheet dan header siap digunakan.',
    data: {
      log: log,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      sheetsCount: ss.getSheets().length,
      timestamp: new Date().toISOString()
    }
  };
}

// Alias untuk kompatibilitas
function initializeDatabase() {
  return setupDatabase();
}

/**
 * Styling header baris 1
 */
function formatHeaderRow(sheet, colCount) {
  var range = sheet.getRange(1, 1, 1, colCount);
  range.setFontWeight('bold');
  range.setBackground('#0f2b48'); // Navy Bahari Dermaga Gizi
  range.setFontColor('#ffffff');
  range.setFontFamily('Arial');
  range.setFontSize(10);
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);

  for (var c = 1; c <= colCount; c++) {
    sheet.setColumnWidth(c, 160);
  }
}

/**
 * Inisialisasi Konfigurasi Sistem (Hanya konfigurasi Gateway & Faskes, bukan data balita/dummy)
 */
function initConfigSheet(ss) {
  var configSheet = ss.getSheetByName(SHEETS.KONFIGURASI);
  if (configSheet && configSheet.getLastRow() <= 1) {
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    var defaultConfigs = [
      ['APP_NAME', 'DERMAGA GIZI', 'Nama Sistem Terpadu Monitoring Gizi', nowStr],
      ['INSTANSI', 'Puskesmas Kepulauan Seribu Selatan', 'Faskes Penanggung Jawab', nowStr],
      ['WA_GATEWAY_PROVIDER', 'FONNTE', 'Pilihan gateway: FONNTE, WABLAS, atau WEBHOOK', nowStr],
      ['WA_API_TOKEN', '', 'Token API WhatsApp Gateway (Dapatkan di fonnte.com)', nowStr],
      ['WA_ADMIN_PHONE', '', 'Nomor WhatsApp Admin / Koordinator Gizi (contoh: 6281299887711)', nowStr],
      ['WA_NOTIF_AUTO_SEND', 'TRUE', 'Kirim WA otomatis saat ada input kasus gizi (TRUE/FALSE)', nowStr],
      ['WA_WEBHOOK_URL', '', 'URL Webhook khusus jika menggunakan server sendiri', nowStr],
      ['APP_URL', 'https://dermagagizi.puskesmasseribuselatan.com', 'URL Web Aplikasi Produksi', nowStr],
      ['TIMEZONE', 'Asia/Jakarta', 'Zona Waktu Standar Operasional', nowStr]
    ];
    for (var i = 0; i < defaultConfigs.length; i++) {
      configSheet.appendRow(defaultConfigs[i]);
    }
  }
}

/**
 * =========================================================================================
 * 2. BERSIHKAN SEMUA DATA BARIS (clearAllDataRows)
 * =========================================================================================
 * Menghapus seluruh baris data (baris 2 ke bawah) di SEMUA sheet database.
 * Menyisakan BARIS 1 (Header Kolom) agar struktur tabel tetap utuh dan rapi.
 * Sheet KONFIGURASI dipertahankan agar token WA tidak hilang.
 */
function clearAllDataRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var clearedSheets = [];
  var totalRowsCleared = 0;

  for (var key in SHEETS) {
    var sheetName = SHEETS[key];
    // Pertahankan KONFIGURASI agar token WhatsApp tidak terhapus
    if (sheetName === SHEETS.KONFIGURASI) continue;

    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var numRowsToDelete = lastRow - 1;
        sheet.deleteRows(2, numRowsToDelete);
        totalRowsCleared += numRowsToDelete;
        clearedSheets.push(sheetName + ' (' + numRowsToDelete + ' baris)');
      } else {
        clearedSheets.push(sheetName + ' (sudah kosong)');
      }
    }
  }

  var msg = 'Pembersihan Data Berhasil!\n\n' +
            'Total baris data yang dibersihkan: ' + totalRowsCleared + '\n' +
            'Semua header kolom dipertahankan.\n\n' +
            'Detail Sheet:\n• ' + clearedSheets.join('\n• ');
  Logger.log(msg);

  try {
    SpreadsheetApp.getUi().alert('Pembersihan Data Selesai', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    try {
      ss.toast('Semua data demo telah dibersihkan! Hanya header yang tersisa.', 'Selesai', 5);
    } catch (err) {}
  }

  return {
    success: true,
    message: 'Semua data baris berhasil dibersihkan. Hanya header yang tersisa.',
    totalRowsCleared: totalRowsCleared,
    clearedSheets: clearedSheets
  };
}

// =========================================================================================
// 3. WHATSAPP API & NOTIFIKASI OTOMATIS
// =========================================================================================

/**
 * Normalisasi nomor HP Indonesia ke format standar internasional (628...)
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  var cleaned = String(phone).replace(/\D/g, '');

  if (cleaned.indexOf('08') === 0) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.indexOf('8') === 0) {
    cleaned = '62' + cleaned;
  } else if (cleaned.indexOf('6208') === 0) {
    cleaned = '628' + cleaned.substring(4);
  }
  return cleaned;
}

/**
 * Membaca nilai konfigurasi dari Sheet KONFIGURASI
 */
function getConfigValue(key, defaultValue) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.KONFIGURASI);
    if (!sheet) return defaultValue;

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return defaultValue;

    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).toUpperCase() === String(key).toUpperCase()) {
        return data[i][1] || defaultValue;
      }
    }
  } catch (e) {
    Logger.log('Gagal membaca config ' + key + ': ' + e.message);
  }
  return defaultValue;
}

/**
 * Mengirim pesan WhatsApp ke nomor tujuan
 */
function sendWhatsAppMessage(targetNumber, messageText, customToken) {
  var cleanPhone = normalizePhoneNumber(targetNumber);
  if (!cleanPhone || cleanPhone.length < 9) {
    return { success: false, message: 'Nomor telepon tidak valid: ' + targetNumber };
  }

  var provider = String(getConfigValue('WA_GATEWAY_PROVIDER', 'FONNTE')).toUpperCase();
  var token = customToken || getConfigValue('WA_API_TOKEN', '');
  var webhookUrl = getConfigValue('WA_WEBHOOK_URL', '');

  Logger.log('Mengirim WhatsApp ke ' + cleanPhone + ' via provider: ' + provider);

  // Jika token belum diisi di sheet KONFIGURASI
  if (!token || token.trim() === '') {
    var mockMsg = 'Simulasi Log: Token WA API belum diisi di Sheet KONFIGURASI baris WA_API_TOKEN. Pesan dicatat ke sistem.';
    logInternalActivity('SYSTEM', 'WA_SIMULASI', 'WHATSAPP', cleanPhone, 'Tujuan: ' + cleanPhone + ' | Pesan: ' + messageText.substring(0, 80) + '...', 'SUCCESS');
    return {
      success: true,
      simulated: true,
      message: mockMsg,
      phone: cleanPhone
    };
  }

  try {
    var response;
    var resCode = 0;
    var resText = '';

    if (provider === 'FONNTE') {
      var payload = {
        target: cleanPhone,
        message: messageText,
        countryCode: '62'
      };
      var options = {
        method: 'post',
        headers: {
          'Authorization': token
        },
        payload: payload,
        muteHttpExceptions: true
      };
      response = UrlFetchApp.fetch('https://api.fonnte.com/send', options);
      resCode = response.getResponseCode();
      resText = response.getContentText();

    } else if (provider === 'WABLAS') {
      var wablasPayload = {
        phone: cleanPhone,
        message: messageText
      };
      var wablasOptions = {
        method: 'post',
        headers: {
          'Authorization': token
        },
        payload: wablasPayload,
        muteHttpExceptions: true
      };
      response = UrlFetchApp.fetch('https://kudus.wablas.com/api/send-message', wablasOptions);
      resCode = response.getResponseCode();
      resText = response.getContentText();

    } else if (provider === 'WEBHOOK' && webhookUrl) {
      var customPayload = JSON.stringify({
        phone: cleanPhone,
        message: messageText,
        timestamp: new Date().toISOString()
      });
      var customOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: token ? { 'Authorization': 'Bearer ' + token } : {},
        payload: customPayload,
        muteHttpExceptions: true
      };
      response = UrlFetchApp.fetch(webhookUrl, customOptions);
      resCode = response.getResponseCode();
      resText = response.getContentText();
    } else {
      return { success: false, message: 'Provider WhatsApp tidak dikenali: ' + provider };
    }

    var isOk = (resCode >= 200 && resCode < 300);
    logInternalActivity('SYSTEM', 'SEND_WA', 'WHATSAPP', cleanPhone, 'Status HTTP: ' + resCode, isOk ? 'SUCCESS' : 'FAILED');

    return {
      success: isOk,
      statusCode: resCode,
      message: isOk ? 'Pesan WhatsApp berhasil dikirim ke ' + cleanPhone : 'Gagal mengirim WhatsApp (HTTP ' + resCode + ')',
      rawResponse: resText,
      phone: cleanPhone
    };

  } catch (err) {
    Logger.log('Exception pengiriman WhatsApp: ' + err.message);
    logInternalActivity('SYSTEM', 'ERROR_WA', 'WHATSAPP', cleanPhone, err.message, 'FAILED');
    return {
      success: false,
      message: 'Kesalahan jaringan/API WhatsApp: ' + err.message,
      phone: cleanPhone
    };
  }
}

/**
 * Mengirim pesan massal (broadcast) ke beberapa nomor
 */
function sendBroadcastWhatsApp(phoneArray, messageText) {
  if (!phoneArray || phoneArray.length === 0) {
    return { total: 0, successCount: 0, failCount: 0, results: [] };
  }

  var results = [];
  var successCount = 0;
  var failCount = 0;

  for (var i = 0; i < phoneArray.length; i++) {
    var phone = phoneArray[i];
    var res = sendWhatsAppMessage(phone, messageText);
    if (res.success) {
      successCount++;
    } else {
      failCount++;
    }
    results.push({ phone: phone, result: res });
    Utilities.sleep(250); // Mencegah pemblokiran rate limit
  }

  return {
    total: phoneArray.length,
    successCount: successCount,
    failCount: failCount,
    results: results
  };
}

/**
 * Notifikasi Otomatis ke Lintas Sektor saat kader lapor balita gizi kurang
 * Mengambil kontak penerima LANGSUNG dari sheet MASTER_LINTAS_SEKTOR di spreadsheet
 */
function broadcastGiziAlertToLintasSektor(laporanData, balitaKurangGiziList) {
  if (!balitaKurangGiziList || balitaKurangGiziList.length === 0) {
    return { success: true, count: 0, message: 'Tidak ada kasus gizi yang dilaporkan.' };
  }

  var autoNotif = String(getConfigValue('WA_NOTIF_AUTO_SEND', 'TRUE')).toUpperCase();
  if (autoNotif !== 'TRUE') {
    return { success: false, message: 'Fitur WA_NOTIF_AUTO_SEND dinonaktifkan di sheet KONFIGURASI.' };
  }

  // Ambil penerima langsung dari sheet MASTER_LINTAS_SEKTOR yang ada di Spreadsheet
  var lsList = getTableData(SHEETS.MASTER_LINTAS_SEKTOR);
  var targetKelurahanId = laporanData.kelurahan_id || 'ALL';

  var recipients = lsList.filter(function(u) {
    var isWaActive = (u.status_notifikasi_wa === true || String(u.status_notifikasi_wa).toUpperCase() === 'TRUE');
    var isWilayahMatch = (!u.kelurahan_id || u.kelurahan_id === 'ALL' || u.kelurahan_id === targetKelurahanId);
    return isWaActive && isWilayahMatch && u.no_wa;
  });

  var phones = recipients.map(function(r) { return r.no_wa; });
  var adminPhone = getConfigValue('WA_ADMIN_PHONE', '');
  if (adminPhone && phones.indexOf(adminPhone) === -1) {
    phones.push(adminPhone);
  }

  if (phones.length === 0) {
    return { success: true, count: 0, message: 'Belum ada kontak lintas sektor aktif yang terdaftar di sheet MASTER_LINTAS_SEKTOR.' };
  }

  var balitaText = '';
  for (var i = 0; i < balitaKurangGiziList.length; i++) {
    var b = balitaKurangGiziList[i];
    balitaText += (i + 1) + '. *' + (b.nama_balita || b.inisial || 'Balita') + '* (' + (b.jenis_kelamin || '-') + ', ' + (b.usia_bulan || '-') + ' bln)\n' +
                  '   • BB: ' + (b.berat_badan || '-') + ' kg | TB: ' + (b.tinggi_badan || '-') + ' cm\n' +
                  '   • Status: *' + (b.status_gizi || b.kategori_masalah || 'Gizi Kurang') + '*\n' +
                  '   • Rencana Tindak Lanjut: ' + (b.rencana_tindak_lanjut || 'PMT Pemulihan & Kunjungan Rumah') + '\n\n';
  }

  var pesan = '🚨 *NOTIFIKASI DERMAGA GIZI - PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n' +
              'Pemberitahuan Temuan Balita Bermasalah Gizi:\n\n' +
              '📍 *Posyandu*: ' + (laporanData.posyandu_nama || '-') + '\n' +
              '🏛️ *Kelurahan*: ' + (laporanData.kelurahan_nama || '-') + '\n' +
              '📅 *Tanggal*: ' + (laporanData.tanggal_pelaksanaan || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy')) + '\n' +
              '📊 *Cakupan Timbang*: ' + (laporanData.total_ditimbang || 0) + ' hadir dari ' + (laporanData.total_sasaran || 0) + ' sasaran\n\n' +
              '⚠️ *DAFTAR BALITA MEMERLUKAN INTERVENSI LINTAS SEKTOR*:\n\n' +
              balitaText +
              'Diharapkan sinergi dari Lurah, Satpol PP, TP-PKK, TPK Stunting, dan Puskesmas untuk segera berkoordinasi dan melakukan tindak lanjut terpadu.\n\n' +
              '🔗 *Buka Aplikasi:* ' + getConfigValue('APP_URL', 'https://dermagagizi.puskesmasseribuselatan.com') + '\n\n' +
              '_Aplikasi DERMAGA GIZI - Puskesmas Kepulauan Seribu Selatan_';

  var broadcastResult = sendBroadcastWhatsApp(phones, pesan);
  return {
    success: true,
    recipientsCount: phones.length,
    broadcastResult: broadcastResult
  };
}

// =========================================================================================
// 4. HANDLER HTTP GET & POST (Web App API Endpoint)
// =========================================================================================

function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || 'ping';

    // Ping status koneksi
    if (action === 'ping') {
      return jsonResponse(true, 'Koneksi ke Google Apps Script aktif dan responsif.', {
        app: 'DERMAGA GIZI',
        instansi: 'Puskesmas Kepulauan Seribu Selatan',
        version: '2.1.0 (Clean Database Mode)',
        timestamp: new Date().toISOString()
      });
    }

    // Setup sheet database bersih
    if (action === 'init' || action === 'setup' || action === 'setupDatabase') {
      var setupResult = setupDatabase();
      return jsonResponse(setupResult.success, setupResult.message, setupResult.data);
    }

    // Pembersihan semua data baris (hanya sisakan header)
    if (action === 'clearAllData' || action === 'clearData') {
      var clearResult = clearAllDataRows();
      return jsonResponse(clearResult.success, clearResult.message, clearResult);
    }

    // Tes pengiriman WhatsApp
    if (action === 'testWA') {
      var testPhone = params.phone || getConfigValue('WA_ADMIN_PHONE', '');
      var testMsg = '🔔 *TES KONEKSI WHATSAPP API - DERMAGA GIZI*\n' +
                    'Puskesmas Kepulauan Seribu Selatan\n\n' +
                    'Halo, koneksi WhatsApp Gateway aktif pada ' + 
                    Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss') + ' WIB.';
      var waResult = sendWhatsAppMessage(testPhone, testMsg);
      return jsonResponse(waResult.success, waResult.message, waResult);
    }

    // Ambil seluruh data langsung dari spreadsheet (Fokus Database Sheet Murni)
    if (action === 'getAllData') {
      var allData = {
        pulau: getTableData(SHEETS.PULAU),
        kelurahan: getTableData(SHEETS.MASTER_KELURAHAN),
        posyandu: getTableData(SHEETS.MASTER_POSYANDU),
        lintas_sektor_users: getTableData(SHEETS.MASTER_LINTAS_SEKTOR),
        users: getTableData(SHEETS.USERS),
        sasaran: getTableData(SHEETS.SASARAN),
        pemantauan: getTableData(SHEETS.PEMANTAUAN),
        laporan_posyandu: getTableData(SHEETS.LAPORAN_POSYANDU),
        tindak_lanjut: getTableData(SHEETS.TINDAK_LANJUT),
        kendala: getTableData(SHEETS.KENDALA),
        lintas_sektor: getTableData(SHEETS.LINTAS_SEKTOR),
        konfigurasi: getTableData(SHEETS.KONFIGURASI),
        timestamp: new Date().toISOString()
      };
      return jsonResponse(true, 'Data dari Google Spreadsheet berhasil dimuat.', allData);
    }

    // Endpoint individual per tabel
    if (action === 'getPulau') return jsonResponse(true, 'Data pulau', getTableData(SHEETS.PULAU));
    if (action === 'getKelurahan') return jsonResponse(true, 'Data kelurahan', getTableData(SHEETS.MASTER_KELURAHAN));
    if (action === 'getPosyandu') return jsonResponse(true, 'Data posyandu', getTableData(SHEETS.MASTER_POSYANDU));
    if (action === 'getUsers') return jsonResponse(true, 'Data pengguna', getTableData(SHEETS.USERS));
    if (action === 'getLintasSektorUsers') return jsonResponse(true, 'Data user lintas sektor', getTableData(SHEETS.MASTER_LINTAS_SEKTOR));
    if (action === 'getSasaran') return jsonResponse(true, 'Data sasaran balita', getTableData(SHEETS.SASARAN));
    if (action === 'getLaporanPosyandu') return jsonResponse(true, 'Data laporan posyandu', getTableData(SHEETS.LAPORAN_POSYANDU));
    if (action === 'getTindakLanjut') return jsonResponse(true, 'Data tindak lanjut', getTableData(SHEETS.TINDAK_LANJUT));
    if (action === 'getKendala') return jsonResponse(true, 'Data kendala', getTableData(SHEETS.KENDALA));
    if (action === 'getLintasSektor') return jsonResponse(true, 'Data lintas sektor', getTableData(SHEETS.LINTAS_SEKTOR));
    if (action === 'getLogs') return jsonResponse(true, 'Data riwayat aktivitas', getTableData(SHEETS.RIWAYAT_AKTIVITAS));
    if (action === 'getConfig') return jsonResponse(true, 'Data konfigurasi', getTableData(SHEETS.KONFIGURASI));

    return jsonResponse(false, 'Aksi GET tidak dikenali: ' + action, null);
  } catch (err) {
    return jsonResponse(false, 'Terjadi kesalahan sistem GET: ' + err.message, null);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (pErr) {
        return jsonResponse(false, 'Format JSON request tidak valid', null);
      }
    }

    var action = postData.action || (e && e.parameter ? e.parameter.action : '');
    var data = postData.data || {};
    var currentUser = postData.user || { user_id: 'SYSTEM', nama: 'Petugas Sistem' };

    // Setup Database
    if (action === 'setupDatabase' || action === 'init') {
      var setupRes = setupDatabase();
      return jsonResponse(setupRes.success, setupRes.message, setupRes.data);
    }

    // Bersihkan Semua Data Demo
    if (action === 'clearAllData' || action === 'clearData') {
      var clearRes = clearAllDataRows();
      return jsonResponse(clearRes.success, clearRes.message, clearRes);
    }

    // Kirim WhatsApp
    if (action === 'sendWhatsApp') {
      var target = data.target || data.phone || data.no_wa;
      var message = data.message || data.pesan;
      var waRes = sendWhatsAppMessage(target, message);
      return jsonResponse(waRes.success, waRes.message, waRes);
    }

    // Simpan Laporan Posyandu & Otomatis Notifikasi Lintas Sektor
    if (action === 'createLaporanPosyandu' || action === 'saveLaporanPosyandu') {
      var createdLaporan = handleCreateRecord(SHEETS.LAPORAN_POSYANDU, HEADERS.LAPORAN_POSYANDU, data, 'LAPORAN_POSYANDU', currentUser);
      var balitaList = data.daftar_balita_kurang_gizi || [];
      var notifReport = null;
      if (balitaList.length > 0) {
        notifReport = broadcastGiziAlertToLintasSektor(data, balitaList);
      }
      return jsonResponse(true, 'Laporan Posyandu berhasil disimpan ke spreadsheet.', {
        laporan: data,
        whatsapp_broadcast: notifReport
      });
    }

    // CRUD Sasaran Balita (Create / Update / Import)
    if (action === 'createSasaran' || action === 'saveSasaran' || action === 'updateSasaran') {
      return handleCreateOrUpdateRecord(SHEETS.SASARAN, HEADERS.SASARAN, 'sasaran_id', data.sasaran_id, data, 'SASARAN', currentUser);
    }
    if (action === 'deleteSasaran') return handleDeleteRecord(SHEETS.SASARAN, 'sasaran_id', data.sasaran_id, 'SASARAN', currentUser);

    // CRUD Tindak Lanjut
    if (action === 'createTindakLanjut' || action === 'saveTindakLanjut' || action === 'updateTindakLanjut') {
      return handleCreateOrUpdateRecord(SHEETS.TINDAK_LANJUT, HEADERS.TINDAK_LANJUT, 'tindak_lanjut_id', data.tindak_lanjut_id, data, 'TINDAK_LANJUT', currentUser);
    }
    if (action === 'deleteTindakLanjut') return handleDeleteRecord(SHEETS.TINDAK_LANJUT, 'tindak_lanjut_id', data.tindak_lanjut_id, 'TINDAK_LANJUT', currentUser);

    // CRUD Master Posyandu
    if (action === 'createPosyandu' || action === 'updatePosyandu') return handleCreateOrUpdateRecord(SHEETS.MASTER_POSYANDU, HEADERS.MASTER_POSYANDU, 'posyandu_id', data.posyandu_id, data, 'POSYANDU', currentUser);
    if (action === 'deletePosyandu') return handleDeleteRecord(SHEETS.MASTER_POSYANDU, 'posyandu_id', data.posyandu_id, 'POSYANDU', currentUser);

    // CRUD Master Kelurahan
    if (action === 'createKelurahan' || action === 'updateKelurahan') return handleCreateOrUpdateRecord(SHEETS.MASTER_KELURAHAN, HEADERS.MASTER_KELURAHAN, 'kelurahan_id', data.kelurahan_id, data, 'KELURAHAN', currentUser);

    // CRUD Master User Lintas Sektor
    if (action === 'createUserLintasSektor' || action === 'updateUserLintasSektor') return handleCreateOrUpdateRecord(SHEETS.MASTER_LINTAS_SEKTOR, HEADERS.MASTER_LINTAS_SEKTOR, 'user_id', data.user_id, data, 'USER_LINTAS_SEKTOR', currentUser);
    if (action === 'deleteUserLintasSektor') return handleDeleteRecord(SHEETS.MASTER_LINTAS_SEKTOR, 'user_id', data.user_id, 'USER_LINTAS_SEKTOR', currentUser);

    // CRUD User Sistem
    if (action === 'createUser' || action === 'updateUser') return handleCreateOrUpdateRecord(SHEETS.USERS, HEADERS.USERS, 'user_id', data.user_id, data, 'USER', currentUser);

    // CRUD Kendala
    if (action === 'createKendala' || action === 'updateKendala') return handleCreateOrUpdateRecord(SHEETS.KENDALA, HEADERS.KENDALA, 'kendala_id', data.kendala_id, data, 'KENDALA', currentUser);
    if (action === 'deleteKendala') return handleDeleteRecord(SHEETS.KENDALA, 'kendala_id', data.kendala_id, 'KENDALA', currentUser);

    // CRUD Lintas Sektor
    if (action === 'createLintasSektor' || action === 'updateLintasSektor') return handleCreateOrUpdateRecord(SHEETS.LINTAS_SEKTOR, HEADERS.LINTAS_SEKTOR, 'kegiatan_id', data.kegiatan_id, data, 'LINTAS_SEKTOR', currentUser);
    if (action === 'deleteLintasSektor') return handleDeleteRecord(SHEETS.LINTAS_SEKTOR, 'kegiatan_id', data.kegiatan_id, 'LINTAS_SEKTOR', currentUser);

    // Batch Import Sasaran Balita
    if (action === 'importSasaranBatch') {
      var items = Array.isArray(data) ? data : (data.items || []);
      var count = 0;
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        handleCreateOrUpdateRecord(SHEETS.SASARAN, HEADERS.SASARAN, 'sasaran_id', item.sasaran_id, item, 'SASARAN', currentUser);
        count++;
      }
      SpreadsheetApp.flush();
      return jsonResponse(true, count + ' data sasaran berhasil disimpan ke Google Spreadsheet.', { count: count });
    }

    // Simpan Konfigurasi
    if (action === 'saveConfig') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var configSheet = ss.getSheetByName(SHEETS.KONFIGURASI);
      if (configSheet) {
        var key = data.key;
        var val = data.value;
        var desc = data.deskripsi || '';
        var lastRow = configSheet.getLastRow();
        var found = false;
        if (lastRow > 1) {
          var cfgValues = configSheet.getRange(2, 1, lastRow - 1, 4).getValues();
          for (var c = 0; c < cfgValues.length; c++) {
            if (cfgValues[c][0] === key) {
              configSheet.getRange(c + 2, 2).setValue(val);
              configSheet.getRange(c + 2, 4).setValue(Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss'));
              found = true;
              break;
            }
          }
        }
        if (!found) {
          configSheet.appendRow([key, val, desc, Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss')]);
        }
        return jsonResponse(true, 'Konfigurasi ' + key + ' berhasil disimpan.', { key: key, value: val });
      }
    }

    return jsonResponse(false, 'Aksi POST tidak dikenali: ' + action, null);
  } catch (err) {
    return jsonResponse(false, 'Gagal memproses transaksi POST: ' + err.message, null);
  } finally {
    lock.releaseLock();
  }
}

// =========================================================================================
// 5. FUNGSI PEMBACAAN & PENULISAN DATABASE SPREADSHEET
// =========================================================================================

/**
 * Membaca data murni dari baris Google Spreadsheet
 */
function getTableData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var cellVal = values[i][j];
      if (cellVal instanceof Date) {
        rowObj[key] = Utilities.formatDate(cellVal, 'Asia/Jakarta', 'dd/MM/yyyy');
      } else {
        rowObj[key] = cellVal;
      }
    }
    rows.push(rowObj);
  }
  return rows;
}

function handleCreateRecord(sheetName, headerCols, dataObj, jenisData, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }

  var row = [];
  for (var i = 0; i < headerCols.length; i++) {
    var col = headerCols[i];
    var val = dataObj[col] !== undefined ? dataObj[col] : '';
    if (typeof val === 'object' && val !== null) {
      try {
        val = JSON.stringify(val);
      } catch (e) {}
    }
    if (col === 'created_at' || col === 'updated_at') {
      val = val || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    }
    row.push(val);
  }

  sheet.appendRow(row);
  var recordId = dataObj[headerCols[0]] || 'NEW_RECORD';
  logInternalActivity(user ? user.user_id : 'SYSTEM', 'CREATE', jenisData, recordId, 'Tambah data baru pada ' + sheetName, 'SUCCESS');

  return jsonResponse(true, 'Data berhasil disimpan ke sheet ' + sheetName, dataObj);
}

function handleUpdateRecord(sheetName, idColName, idValue, dataObj, jenisData, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse(false, 'Sheet tidak ditemukan: ' + sheetName, null);

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return jsonResponse(false, 'Data kosong di sheet ' + sheetName, null);

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var idIndex = headers.indexOf(idColName);
  if (idIndex === -1) return jsonResponse(false, 'Kolom ID tidak ditemukan: ' + idColName, null);

  var targetRow = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(idValue)) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return jsonResponse(false, 'Data dengan ' + idColName + ' = ' + idValue + ' tidak ditemukan di ' + sheetName, null);
  }

  dataObj.updated_at = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  for (var j = 0; j < headers.length; j++) {
    var colName = headers[j];
    if (dataObj[colName] !== undefined) {
      var cellVal = dataObj[colName];
      if (typeof cellVal === 'object' && cellVal !== null) {
        try {
          cellVal = JSON.stringify(cellVal);
        } catch (e) {}
      }
      sheet.getRange(targetRow, j + 1).setValue(cellVal);
    }
  }

  logInternalActivity(user ? user.user_id : 'SYSTEM', 'UPDATE', jenisData, idValue, 'Update data pada ' + sheetName, 'SUCCESS');
  SpreadsheetApp.flush();
  return jsonResponse(true, 'Data berhasil diperbarui di ' + sheetName, dataObj);
}

function handleCreateOrUpdateRecord(sheetName, headerCols, idColName, idValue, dataObj, jenisData, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  if (!sheet) return jsonResponse(false, 'Sheet tidak ditemukan: ' + sheetName, null);

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var targetRow = -1;

  if (lastRow > 1 && lastCol > 0) {
    var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = values[0];
    var idIndex = headers.indexOf(idColName);
    var nikIndex = headers.indexOf('nik');

    if (idIndex !== -1 && idValue) {
      for (var i = 1; i < values.length; i++) {
        var rowId = String(values[i][idIndex]);
        var rowNik = (nikIndex !== -1 && dataObj && dataObj.nik) ? String(values[i][nikIndex]) : '';
        if (rowId === String(idValue) || (rowNik && rowNik === String(dataObj.nik))) {
          targetRow = i + 1;
          break;
        }
      }
    }
  }

  // Jika record sudah ada di sheet -> Lakukan UPDATE
  if (targetRow > 1) {
    dataObj.updated_at = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (var j = 0; j < currentHeaders.length; j++) {
      var colName = currentHeaders[j];
      if (dataObj[colName] !== undefined) {
        var cellVal = dataObj[colName];
        if (typeof cellVal === 'object' && cellVal !== null) {
          try { cellVal = JSON.stringify(cellVal); } catch (e) {}
        }
        sheet.getRange(targetRow, j + 1).setValue(cellVal);
      }
    }
    SpreadsheetApp.flush();
    logInternalActivity(user ? user.user_id : 'SYSTEM', 'UPDATE', jenisData, idValue, 'Update data pada ' + sheetName, 'SUCCESS');
    return jsonResponse(true, 'Data berhasil diperbarui di ' + sheetName, dataObj);
  }

  // Jika record belum ada -> INSERT / APPEND BARU
  return handleCreateRecord(sheetName, headerCols, dataObj, jenisData, user);
}

function handleDeleteRecord(sheetName, idColName, idValue, jenisData, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse(false, 'Sheet tidak ditemukan: ' + sheetName, null);

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return jsonResponse(false, 'Data kosong di sheet ' + sheetName, null);

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var idIndex = headers.indexOf(idColName);
  if (idIndex === -1) return jsonResponse(false, 'Kolom ID tidak ditemukan: ' + idColName, null);

  var targetRow = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(idValue)) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return jsonResponse(false, 'Data dengan ' + idColName + ' = ' + idValue + ' tidak ditemukan di ' + sheetName, null);
  }

  sheet.deleteRow(targetRow);
  logInternalActivity(user ? user.user_id : 'SYSTEM', 'DELETE', jenisData, idValue, 'Hapus data pada ' + sheetName, 'SUCCESS');
  return jsonResponse(true, 'Data berhasil dihapus dari ' + sheetName, { id: idValue });
}

function logInternalActivity(userId, aksi, jenisData, recordId, ringkasan, status) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.RIWAYAT_AKTIVITAS);
    if (!sheet) return;

    var logId = 'LOG-' + new Date().getTime();
    var waktu = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([logId, waktu, userId || 'SYSTEM', 'Sistem', aksi, jenisData, recordId, ringkasan, status]);
  } catch (e) {}
}

function jsonResponse(success, message, data) {
  var output = {
    success: success,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================================
// 6. POPUP MENU SPREADSHEET
// =========================================================================================

function menuTestWhatsApp() {
  var ui = SpreadsheetApp.getUi();
  var defaultPhone = getConfigValue('WA_ADMIN_PHONE', '');
  var response = ui.prompt(
    'Tes WhatsApp Gateway',
    'Masukkan nomor WhatsApp penerima (contoh: 62812... atau 08...):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    var phone = response.getResponseText().trim() || defaultPhone;
    if (!phone) {
      ui.alert('Peringatan', 'Silakan masukkan nomor telepon penerima.', ui.ButtonSet.OK);
      return;
    }
    var testMsg = '🔔 *TES WHATSAPP GATEWAY - DERMAGA GIZI*\n' +
                  'Puskesmas Kepulauan Seribu Selatan\n\n' +
                  'Koneksi API WhatsApp berhasil aktif pada ' +
                  Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss') + ' WIB.\n\n' +
                  'Sistem siap mengirimkan notifikasi penanganan gizi balita ke lintas sektor.';
    var res = sendWhatsAppMessage(phone, testMsg);
    ui.alert(res.success ? 'Berhasil Terkirim!' : 'Gagal Mengirim', res.message, ui.ButtonSet.OK);
  }
}

function menuBroadcastTestWhatsApp() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Konfirmasi Broadcast WhatsApp',
    'Apakah Anda ingin mengirim pesan uji coba ke seluruh kontak lintas sektor yang terdaftar di sheet MASTER_LINTAS_SEKTOR?',
    ui.ButtonSet.YES_NO
  );

  if (confirm === ui.Button.YES) {
    var dummyLaporan = {
      posyandu_nama: 'Posyandu (Uji Coba Sistem)',
      kelurahan_nama: 'Wilayah Kerja Kepulauan Seribu Selatan',
      kelurahan_id: 'ALL',
      total_ditimbang: 0,
      total_sasaran: 0,
      tanggal_pelaksanaan: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy')
    };
    var dummyBalita = [
      {
        nama_balita: 'Uji Coba Sistem WhatsApp',
        jenis_kelamin: 'L',
        usia_bulan: 12,
        berat_badan: 8.0,
        tinggi_badan: 74,
        status_gizi: 'Pemeriksaan Sistem',
        rencana_tindak_lanjut: 'Uji coba jalur komunikasi otomatis lintas sektor'
      }
    ];
    var res = broadcastGiziAlertToLintasSektor(dummyLaporan, dummyBalita);
    ui.alert('Hasil Broadcast', 'Pesan notifikasi diproses untuk ' + (res.recipientsCount || 0) + ' kontak.', ui.ButtonSet.OK);
  }
}

function menuCheckStatus() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var summary = [];
  var totalRows = 0;

  for (var key in SHEETS) {
    var name = SHEETS[key];
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      var rows = Math.max(0, sheet.getLastRow() - 1);
      totalRows += rows;
      summary.push('• ' + name + ': ' + rows + ' baris data');
    } else {
      summary.push('• ' + name + ': ❌ Belum dibuat');
    }
  }

  ui.alert(
    'Status Database DERMAGA GIZI',
    'Total Sheet: ' + ss.getSheets().length + '\n' +
    'Total Baris Data Aktif: ' + totalRows + '\n\n' +
    summary.join('\n'),
    ui.ButtonSet.OK
  );
}

function menuShowGuide() {
  var ui = SpreadsheetApp.getUi();
  var token = getConfigValue('WA_API_TOKEN', 'Belum diisi');
  var provider = getConfigValue('WA_GATEWAY_PROVIDER', 'FONNTE');
  var adminPhone = getConfigValue('WA_ADMIN_PHONE', 'Belum diisi');

  var msg = 'PANDUAN WHATSAPP GATEWAY DERMAGA GIZI:\n\n' +
            '1. Provider Terpilih: ' + provider + '\n' +
            '2. Status Token: ' + (token ? 'Sudah Diisi' : 'Belum Diisi (Kosong)') + '\n' +
            '3. Nomor Admin: ' + adminPhone + '\n\n' +
            'CARA MENGAKTIFKAN WHATSAPP (FONNTE / WABLAS):\n' +
            '1. Buka https://fonnte.com dan buat akun gratis.\n' +
            '2. Hubungkan WhatsApp perangkat Anda via Scan QR.\n' +
            '3. Salin API Token Fonnte Anda.\n' +
            '4. Di spreadsheet ini, buka sheet "KONFIGURASI", tempel token pada baris WA_API_TOKEN.\n' +
            '5. Sistem siap mengirim broadcast otomatis ke seluruh nomor lintas sektor!';

  ui.alert('Panduan WhatsApp Gateway', msg, ui.ButtonSet.OK);
}
