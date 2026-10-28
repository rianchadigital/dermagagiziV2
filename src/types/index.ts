/**
 * DERMAGA GIZI - Type Definitions
 * Puskesmas Kepulauan Seribu Selatan
 */

export type Role = 
  | 'ADMIN' 
  | 'KEPALA_PUSKESMAS' 
  | 'TENAGA_GIZI' 
  | 'DOKTER_BIDAN_PERAWAT' 
  | 'PETUGAS_PUSTU' 
  | 'KADER' 
  | 'LINTAS_SEKTOR' 
  | 'VIEWER';

export interface User {
  user_id: string;
  email: string;
  nama: string;
  no_wa?: string; // Nomor WhatsApp aktif (format: 628...)
  role: Role;
  unit: string;
  pulau_id: string;
  status_aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppNotification {
  notif_id: string;
  waktu: string;
  penerima_nama: string;
  penerima_role: Role | string;
  penerima_wa: string;
  kategori: 'SASARAN_BARU' | 'TINDAK_LANJUT_BARU' | 'TINDAK_LANJUT_UPDATE' | 'PERINGATAN_OVERDUE' | 'LAPORAN_GIZI_POSYANDU';
  judul: string;
  pesan: string;
  status: 'TERKIRIM' | 'MENUNGGU';
  link_wa: string;
}

export interface RolePerformanceSummary {
  role: Role;
  role_label: string;
  total_petugas: number;
  total_tindak_lanjut: number;
  selesai: number;
  dalam_proses: number;
  tertunda: number;
  overdue: number;
  persen_selesai: number;
  petugas_list: {
    user_id: string;
    nama: string;
    no_wa?: string;
    unit: string;
    total: number;
    selesai: number;
    tertunda: number;
    overdue: number;
    persen: number;
  }[];
}

export type StatusAkses = 'Mudah' | 'Sedang' | 'Tergantung Cuaca/Gelombang' | 'Terisolasi';

export interface Pulau {
  pulau_id: string;
  nama_pulau: string;
  unit_pelayanan: string;
  latitude: number;
  longitude: number;
  status_akses: StatusAkses;
  keterangan: string;
  status_aktif: boolean;
}

export type KategoriMasalahGizi = 
  | 'Stunting (Pendek)'
  | 'Wasting (Kurus/Gizi Kurang)'
  | 'Gizi Kurang (Wasting)'
  | 'Gizi Kurang'
  | 'Underweight (BB Kurang)'
  | 'Gizi Buruk'
  | 'Overweight'
  | 'Obesitas'
  | 'Risiko Gizi Lebih / Obesitas'
  | 'Gizi Baik (Normal)';

export interface SasaranBalita {
  sasaran_id: string;
  kode_sasaran: string; // Anonymous code e.g. "BLT-TDG-042"
  inisial: string; // e.g. "An. AR"
  nik?: string;
  tanggal_lahir: string; // DD/MM/YYYY
  jenis_kelamin: 'L' | 'P';
  usia?: string; // e.g. "24 bln"
  tanggal_ukur?: string; // DD/MM/YYYY
  cara_ukur?: 'Berdiri' | 'Terlentang' | string;
  bb_terakhir?: number; // Berat Badan (kg)
  tb_terakhir?: number; // Tinggi Badan (cm)
  zscore_bbtb?: string | number; // Z-Score BB/TB
  status_gizi_bbtb?: string; // Status Gizi BB/TB (Wasting)
  zscore_tbu?: string | number; // Z-Score PB/U (TB/U)
  status_gizi_tbu?: string; // Status Gizi PB/U (Stunting)
  zscore_bbu?: string | number; // Z-Score BB/U
  status_gizi_bbu?: string; // Status Gizi BB/U (Underweight)
  naik_berat_badan?: 'N' | 'T' | string; // Naik Berat Badan
  keterangan_naik_bb?: string; // Keterangan Naik Berat Badan
  status_outlier_who?: 'Normal' | 'Outlier' | string; // Status Outlier WHO
  nama_ortu?: string;
  no_wa_ortu?: string;
  no_hp?: string;
  alamat?: string;
  rt_rw?: string;
  wilayah_kecamatan?: string;
  kelurahan_id?: string;
  kelurahan_nama?: string;
  puskesmas_pustu?: string;
  posyandu?: string;
  pulau_id: string;
  unit_pelayanan: string;
  tanggal_registrasi: string;
  status_aktif: boolean;
  kategori_masalah_terakhir?: KategoriMasalahGizi;
  tanggal_pantau_terakhir?: string;
  bulan_pengukuran?: string; // e.g. "Oktober 2026"
  lila?: number; // cm
}

export interface Pemantauan {
  pemantauan_id: string;
  sasaran_id: string;
  tanggal_pemantauan: string; // DD/MM/YYYY
  petugas_id: string;
  indikator_terukur: string; // e.g., "BB: 8.4kg, TB: 78cm, LiLA: 12.0cm"
  kategori_masalah: KategoriMasalahGizi;
  hasil_pemeriksaan: string;
  catatan_terbatas: string;
  periode: string; // e.g. "2026-10"
  created_at: string;
}

export type StatusTindakLanjut = 
  | 'Belum ditindaklanjuti'
  | 'Dalam proses'
  | 'Menunggu koordinasi'
  | 'Selesai'
  | 'Perlu evaluasi ulang'
  | 'Dibatalkan';

export type Prioritas = 'Tinggi' | 'Sedang' | 'Rendah';

export interface TindakLanjutLintasSektor {
  id: string;
  unit_sektor: string; // 'Kader' | 'Kecamatan' | 'Petugas' | 'Kelurahan' | 'PKK' | 'Puskesmas' | etc.
  nama_unit: string;
  nama_petugas: string;
  jabatan?: string;
  no_wa?: string;
  aksi_intervensi: string;
  tanggal_pelaksanaan: string;
  status_hasil: 'Selesai' | 'Dalam proses' | 'Perlu evaluasi ulang';
  catatan_evaluasi: string;
  foto_dokumen?: string; // Base64 data URI atau URL foto bukti intervensi
  foto_nama?: string;
  notifikasi_terkirim?: boolean;
  created_at: string;
}

export interface TindakLanjut {
  tindak_lanjut_id: string;
  sasaran_id: string;
  pemantauan_id?: string;
  kategori: string; // e.g. "Pemberian PMT Pemulihan", "Konseling Diet", "Rujukan Spesialis Anak"
  rencana_intervensi: string;
  tanggal_rencana: string;
  tenggat: string; // DD/MM/YYYY
  petugas_id: string;
  status: StatusTindakLanjut;
  prioritas: Prioritas;
  tanggal_selesai?: string;
  catatan: string;
  bukti_dukung?: string;
  foto_dokumen?: string; // Base64 data URI foto bukti dokumen
  foto_nama?: string;
  alasan_pembatalan?: string;
  is_from_posyandu?: boolean;
  posyandu_nama?: string;
  kelurahan_nama?: string;
  tindak_lanjut_lintas_sektor?: TindakLanjutLintasSektor[];
  kendala_kategori?: KategoriKendala | string;
  kendala_detail?: string;
  kendala_status?: 'Ada Kendala' | 'Dalam Penanganan' | 'Terselesaikan';
  created_at: string;
  updated_at: string;
}

export type KategoriKendala = 
  | 'Ekonomi'
  | 'Transportasi'
  | 'Penolakan'
  | 'Kurang Pengetahuan'
  | 'Lainnya'
  | string;

export type StatusKendala = 
  | 'Baru'
  | 'Dalam proses'
  | 'Menunggu koordinasi'
  | 'Selesai'
  | 'Belum terselesaikan'
  | 'Ada Kendala'
  | 'Dalam Penanganan'
  | 'Terselesaikan'
  | string;

export interface Kendala {
  kendala_id: string;
  tanggal_kejadian: string;
  pulau_id: string;
  kategori: KategoriKendala;
  deskripsi: string;
  kendala_detail?: string; // Teks deskripsi rincian masalah
  dampak: string;
  rencana_penyelesaian: string;
  penanggung_jawab: string;
  tenggat: string;
  status: StatusKendala;
  sasaran_terkait_kode?: string;
  sasaran_id?: string;
  tindak_lanjut_id?: string;
  pelapor_nama?: string;
  pelapor_sektor?: string;
  catatan_tindak_lanjut?: string;
  created_at: string;
  updated_at?: string;
}

export type StatusLintasSektor = 
  | 'Dalam Perencanaan' 
  | 'Berjalan' 
  | 'Menunggu Evaluasi' 
  | 'Selesai' 
  | 'Tertunda'
  | 'Perlu koordinasi';

export interface KegiatanLintasSektor {
  kegiatan_id: string;
  tanggal_kesepakatan: string;
  nama_kegiatan: string;
  pulau_id: string;
  mitra: string; // e.g. "Kelurahan Pulau Tidung", "TP PKK", "Kecamatan", "Sekolah PAUD"
  penanggung_jawab: string;
  tenggat: string;
  indikator: string;
  target: number;
  realisasi: number;
  progres: number; // 0-100%
  status: StatusLintasSektor;
  catatan: string;
  terakhir_evaluasi: string;
  updated_at: string;
}

export interface RiwayatAktivitas {
  log_id: string;
  waktu: string;
  user_id: string;
  user_name: string;
  aksi: 'CREATE' | 'UPDATE' | 'CANCEL' | 'EXPORT' | 'INIT';
  jenis_data: 'SASARAN' | 'PEMANTAUAN' | 'TINDAK_LANJUT' | 'KENDALA' | 'LINTAS_SEKTOR' | 'SYSTEM';
  record_id: string;
  ringkasan_perubahan: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface EvaluasiIndikator {
  evaluasi_id: string;
  periode_awal: string;
  periode_akhir: string;
  pulau_id: string;
  indikator: string;
  hasil: string;
  analisis: string;
  rekomendasi: string;
  petugas_id: string;
  created_at: string;
}

export interface GlobalFilter {
  pulau_id: string; // 'ALL' or specific pulau_id
  tahun: string; // '2026'
  bulan: string; // 'ALL' or '01' - '12'
  kategori_masalah?: string;
  status_tindak_lanjut?: string;
  search_query?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  error?: string;
}

// --- MASTER DATA POSYANDU & KELURAHAN ---
export interface Kelurahan {
  kelurahan_id: string; // 'KEL-01'
  nama_kelurahan: string; // 'Kelurahan Pulau Tidung'
  kecamatan: string; // 'Kepulauan Seribu Selatan'
  daftar_pulau: string[];
  lurah_nama: string;
  no_wa_lurah: string;
  jumlah_rw: number;
  jumlah_rt: number;
  total_sasaran_balita: number;
}

export interface Posyandu {
  posyandu_id: string; // 'POS-01'
  nama_posyandu: string; // 'Posyandu Melati 1'
  kelurahan_id: string; // 'KEL-01'
  kelurahan_nama: string;
  pulau_id: string;
  pulau_nama: string;
  rw: string; // 'RW 01'
  rt: string; // 'RT 01-04'
  lokasi_alamat: string;
  ketua_kader: string;
  no_wa_kader: string;
  jumlah_kader: number;
  jadwal_hari: string; // e.g. "Minggu ke-2 setiap bulan"
  total_sasaran: number;
  status_aktif: boolean;
}

// --- MASTER USER LINTAS SEKTOR ---
export interface UserLintasSektor {
  user_id: string;
  nama: string;
  jabatan: string; // e.g. "Lurah", "Camat", "Ketua TP PKK", "Kasi Kesra", "TPK Stunting", "Bidan Desa", "Babinsa"
  instansi_sektor: string; // "Puskesmas", "Kelurahan", "Kecamatan", "TP PKK", "KUA", "Satpol PP/Dinsos", "Kader Posyandu"
  kelurahan_id: string; // 'ALL' | 'KEL-01' | 'KEL-02' | 'KEL-03'
  kelurahan_nama: string;
  no_wa: string; // '628...'
  email?: string;
  status_notifikasi_wa: boolean; // Menerima notifikasi otomatis saat ada temuan gizi
  status_aktif: boolean;
}

// --- INPUT LAPORAN POSYANDU & TEMUAN GIZI ---
export interface BalitaKurangGiziInput {
  id: string;
  nama_balita: string;
  nik: string;
  nama_ortu: string;
  no_wa_ortu?: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string; // YYYY-MM-DD
  usia_bulan: number;
  berat_badan: number; // kg
  tinggi_badan: number; // cm
  lila?: number; // cm
  status_gizi: KategoriMasalahGizi;
  catatan_kondisi: string;
  rencana_tindak_lanjut: string;
}

export interface LaporanPosyandu {
  laporan_id: string;
  tanggal_pelaksanaan: string; // YYYY-MM-DD
  bulan: string; // '01' - '12'
  tahun: string; // '2026'
  kelurahan_id: string;
  kelurahan_nama: string;
  posyandu_id: string;
  posyandu_nama: string;
  petugas_pelapor: string;
  no_wa_petugas?: string;
  total_sasaran: number; // (S)
  total_ditimbang: number; // (D)
  total_tidak_hadir: number; // (T = S - D)
  persentase_d_s: number; // (D / S) * 100
  keterangan_sweeping?: string;
  daftar_balita_kurang_gizi: BalitaKurangGiziInput[];
  status_notifikasi_wa: 'TERKIRIM' | 'MENUNGGU';
  created_at: string;
  created_by: string;
}

// --- EVALUASI REKAPITULASI ---
export interface EvaluasiKelurahanItem {
  kelurahan_id: string;
  nama_kelurahan: string;
  total_posyandu: number;
  total_sasaran: number;
  total_ditimbang: number;
  total_tidak_hadir: number;
  persentase_d_s: number;
  gizi_baik: number;
  gizi_kurang: number;
  gizi_buruk: number;
  stunting: number;
  underweight: number;
  total_masalah_gizi: number;
  tindak_lanjut_selesai: number;
  tindak_lanjut_proses: number;
  tindak_lanjut_belum: number;
  persentase_tl_selesai: number;
}

export interface EvaluasiPosyanduItem {
  posyandu_id: string;
  nama_posyandu: string;
  kelurahan_id: string;
  kelurahan_nama: string;
  pulau_nama: string;
  total_sasaran: number;
  total_ditimbang: number;
  total_tidak_hadir: number;
  persentase_d_s: number;
  gizi_baik: number;
  gizi_kurang: number;
  gizi_buruk: number;
  stunting: number;
  underweight: number;
  total_masalah_gizi: number;
  tindak_lanjut_selesai: number;
  tindak_lanjut_proses: number;
  tindak_lanjut_belum: number;
  ketua_kader: string;
  no_wa_kader: string;
  status_pelaksanaan: 'Sudah Lapor' | 'Belum Lapor';
}

