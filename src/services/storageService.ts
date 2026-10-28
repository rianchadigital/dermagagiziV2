import { 
  Pulau, 
  SasaranBalita, 
  Pemantauan, 
  TindakLanjut, 
  Kendala, 
  KegiatanLintasSektor, 
  User, 
  RiwayatAktivitas,
  GlobalFilter,
  Kelurahan,
  Posyandu,
  UserLintasSektor,
  LaporanPosyandu,
  BalitaKurangGiziInput,
  EvaluasiKelurahanItem,
  EvaluasiPosyanduItem,
  WhatsAppNotification,
  TindakLanjutLintasSektor,
  KategoriKendala,
  StatusKendala
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_PULAU, 
  INITIAL_SASARAN, 
  INITIAL_TINDAK_LANJUT, 
  INITIAL_KENDALA, 
  INITIAL_LINTAS_SEKTOR, 
  INITIAL_LOGS,
  INITIAL_KELURAHAN,
  INITIAL_POSYANDU,
  INITIAL_USER_LINTAS_SEKTOR,
  INITIAL_LAPORAN_POSYANDU
} from '../data/seedData';

const STORAGE_KEYS = {
  USERS: 'dermaga_users',
  PULAU: 'dermaga_pulau',
  SASARAN: 'dermaga_sasaran',
  PEMANTAUAN: 'dermaga_pemantauan',
  TINDAK_LANJUT: 'dermaga_tindak_lanjut',
  KENDALA: 'dermaga_kendala',
  LINTAS_SEKTOR: 'dermaga_lintas_sektor',
  LOGS: 'dermaga_logs',
  WA_NOTIFS: 'dermaga_wa_notifs',
  CURRENT_USER_ID: 'dermaga_current_user_id',
  GAS_URL: 'dermaga_gas_web_app_url',
  THEME_MODE: 'dermaga_theme_mode',
  AUTO_REFRESH: 'dermaga_auto_refresh_enabled',
  KELURAHAN: 'dermaga_kelurahan',
  POSYANDU: 'dermaga_posyandu',
  USER_LINTAS_SEKTOR: 'dermaga_user_lintas_sektor',
  LAPORAN_POSYANDU: 'dermaga_laporan_posyandu'
};

class StorageService {
  constructor() {
    this.cleanDummyData();
    this.initIfEmpty();
    this.cleanUpOldBokor();
  }

  /**
   * Penyimpanan aman localStorage yang menangani QuotaExceededError
   * Secara otomatis membebaskan ruang dan membersihkan foto lama jika kuota browser penuh.
   */
  public safeSetItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err: any) {
      console.warn(`[StorageService] QuotaExceeded saat setItem key "${key}". Melakukan pembersihan darurat...`, err);
      // 1. Bersihkan log audit dan riwayat notifikasi berlebih
      try {
        localStorage.removeItem(STORAGE_KEYS.LOGS);
        const rawWa = localStorage.getItem(STORAGE_KEYS.WA_NOTIFS);
        if (rawWa) {
          const wa = JSON.parse(rawWa);
          if (Array.isArray(wa) && wa.length > 5) {
            localStorage.setItem(STORAGE_KEYS.WA_NOTIFS, JSON.stringify(wa.slice(0, 5)));
          }
        }
      } catch (cleanErr) {
        // ignore
      }

      // 2. Coba simpan kembali
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (err2) {
        // 3. Jika masih gagal pada TINDAK_LANJUT, pangkas foto-foto lama yang memakan kuota
        if (key === STORAGE_KEYS.TINDAK_LANJUT) {
          try {
            const list: TindakLanjut[] = JSON.parse(value);
            // Simpan foto hanya dari 2 data terbaru, hapus foto lama yang berat (>80KB)
            let keptPhotos = 0;
            const pruned = list.map(item => {
              const copy = { ...item };
              if (copy.foto_dokumen) {
                keptPhotos++;
                if (keptPhotos > 2 || copy.foto_dokumen.length > 80000) {
                  copy.foto_dokumen = undefined;
                }
              }
              if (copy.tindak_lanjut_lintas_sektor) {
                copy.tindak_lanjut_lintas_sektor = copy.tindak_lanjut_lintas_sektor.map(a => {
                  if (a.foto_dokumen && (keptPhotos > 2 || a.foto_dokumen.length > 80000)) {
                    return { ...a, foto_dokumen: undefined };
                  }
                  return a;
                });
              }
              return copy;
            });
            localStorage.setItem(key, JSON.stringify(pruned));
            return true;
          } catch (err3) {
            // 4. Upaya terakhir: buang foto agar catatan data intervensi balita & status tetap tersimpan aman
            try {
              const list: TindakLanjut[] = JSON.parse(value);
              const withoutPhotos = list.map(item => ({
                ...item,
                foto_dokumen: undefined,
                tindak_lanjut_lintas_sektor: item.tindak_lanjut_lintas_sektor?.map(a => ({
                  ...a,
                  foto_dokumen: undefined
                }))
              }));
              localStorage.setItem(key, JSON.stringify(withoutPhotos));
              return true;
            } catch (errFinal) {
              console.error('[StorageService] Gagal total menyimpan ke localStorage', errFinal);
              return false;
            }
          }
        }
        return false;
      }
    }
  }

  private cleanUpOldBokor() {
    try {
      const rawP = localStorage.getItem(STORAGE_KEYS.PULAU);
      if (rawP) {
        const list: Pulau[] = JSON.parse(rawP);
        const filtered = list.filter(p => p.pulau_id !== 'PULAU-06' && !p.nama_pulau.toLowerCase().includes('bokor'));
        if (filtered.length !== list.length) {
          localStorage.setItem(STORAGE_KEYS.PULAU, JSON.stringify(filtered));
        }
      }
      const rawS = localStorage.getItem(STORAGE_KEYS.SASARAN);
      if (rawS) {
        const sList: SasaranBalita[] = JSON.parse(rawS);
        const sFiltered = sList.filter(s => s.pulau_id !== 'PULAU-06');
        if (sFiltered.length !== sList.length) {
          localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(sFiltered));
        }
      }
      const rawTL = localStorage.getItem(STORAGE_KEYS.TINDAK_LANJUT);
      if (rawTL) {
        const tlList: TindakLanjut[] = JSON.parse(rawTL);
        const tlFiltered = tlList.filter(tl => tl.sasaran_id !== 'SAS-010');
        if (tlFiltered.length !== tlList.length) {
          localStorage.setItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(tlFiltered));
        }
      }
      const rawU = localStorage.getItem(STORAGE_KEYS.USERS);
      if (rawU) {
        const uList: User[] = JSON.parse(rawU);
        let updated = false;
        const merged = uList.map(u => {
          const match = INITIAL_USERS.find(iu => iu.user_id === u.user_id);
          const newWa = u.no_wa || match?.no_wa || '6281234567890';
          const newUnit = (u.unit || match?.unit || '').replace('Puskesmas Kec. ', 'Puskesmas ');
          if (newWa !== u.no_wa || newUnit !== u.unit) {
            updated = true;
            return { ...u, no_wa: newWa, unit: newUnit };
          }
          return u;
        });

        // Pastikan seluruh akun baru (Dishub, TP PKK, Satpol PP, Dinsos) masuk
        INITIAL_USERS.forEach(iu => {
          if (!merged.some(u => u.user_id === iu.user_id)) {
            merged.push(iu);
            updated = true;
          }
        });

        if (updated) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
        }
      }
    } catch (e) {
      // ignore
    }
  }

  public getSafeArray<T>(key: string, fallback: T[]): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined || raw === 'null' || raw === 'undefined') {
        const isOperational = [
          STORAGE_KEYS.SASARAN, 
          STORAGE_KEYS.TINDAK_LANJUT, 
          STORAGE_KEYS.KENDALA, 
          STORAGE_KEYS.LINTAS_SEKTOR, 
          STORAGE_KEYS.LAPORAN_POSYANDU
        ].includes(key);

        if (isOperational) {
          localStorage.setItem(key, JSON.stringify([]));
          return [];
        }
        localStorage.setItem(key, JSON.stringify(fallback));
        return [...fallback];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  public cleanDummyData(force: boolean = false) {
    try {
      const rawS = localStorage.getItem(STORAGE_KEYS.SASARAN);
      const isCleaned = localStorage.getItem('dermaga_dummy_cleaned_v2') === 'true';
      const containsDummy = rawS && (
        rawS.includes('An. AR') || 
        rawS.includes('SAS-001') || 
        rawS.includes('BLT-TDG-042')
      );

      if (!isCleaned || containsDummy || force) {
        localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.KENDALA, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.LINTAS_SEKTOR, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.LAPORAN_POSYANDU, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.GAS_URL, 'https://script.google.com/macros/s/AKfycbws8A6yMS1C7rCCs5afT0skv53UzH3qBpxrWwUvHmoyRQK0MDu9MmbJDpkEMHEmeQKt/exec');
        localStorage.setItem('dermaga_dummy_cleaned_v2', 'true');
        this.addLog('INIT', 'SYSTEM', 'GAS-INIT', 'Pembersihan data dummy berhasil. Aplikasi fokus ke database Google Spreadsheet (GAS).', 'SUCCESS');
      }
    } catch (e) {
      console.warn('Gagal membersihkan data dummy:', e);
    }
  }

  private initIfEmpty() {
    const checkAndInit = (key: string, data: any) => {
      try {
        const val = localStorage.getItem(key);
        if (val === null || val === undefined || val === 'null' || val === 'undefined') {
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch (e) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    };

    // Master data dasar
    checkAndInit(STORAGE_KEYS.PULAU, INITIAL_PULAU);
    checkAndInit(STORAGE_KEYS.USERS, INITIAL_USERS);
    checkAndInit(STORAGE_KEYS.KELURAHAN, INITIAL_KELURAHAN);
    checkAndInit(STORAGE_KEYS.POSYANDU, INITIAL_POSYANDU);
    checkAndInit(STORAGE_KEYS.USER_LINTAS_SEKTOR, INITIAL_USER_LINTAS_SEKTOR);

    // Data operasional (bersih dari dummy / kosong menunggu sinkronisasi GAS)
    checkAndInit(STORAGE_KEYS.SASARAN, []);
    checkAndInit(STORAGE_KEYS.TINDAK_LANJUT, []);
    checkAndInit(STORAGE_KEYS.KENDALA, []);
    checkAndInit(STORAGE_KEYS.LINTAS_SEKTOR, []);
    checkAndInit(STORAGE_KEYS.LAPORAN_POSYANDU, []);
    checkAndInit(STORAGE_KEYS.LOGS, []);
    
    if (!localStorage.getItem(STORAGE_KEYS.WA_NOTIFS)) {
      localStorage.setItem(STORAGE_KEYS.WA_NOTIFS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'USR-001'); // Default Admin
    }
    if (!localStorage.getItem(STORAGE_KEYS.GAS_URL)) {
      localStorage.setItem(STORAGE_KEYS.GAS_URL, 'https://script.google.com/macros/s/AKfycbws8A6yMS1C7rCCs5afT0skv53UzH3qBpxrWwUvHmoyRQK0MDu9MmbJDpkEMHEmeQKt/exec');
    }
  }

  public resetToDefault() {
    this.cleanDummyData(true);
    localStorage.setItem(STORAGE_KEYS.PULAU, JSON.stringify(INITIAL_PULAU));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.KELURAHAN, JSON.stringify(INITIAL_KELURAHAN));
    localStorage.setItem(STORAGE_KEYS.POSYANDU, JSON.stringify(INITIAL_POSYANDU));
    localStorage.setItem(STORAGE_KEYS.USER_LINTAS_SEKTOR, JSON.stringify(INITIAL_USER_LINTAS_SEKTOR));
    this.addLog('RESET', 'SYSTEM', 'SYS-001', 'Data operasional dibersihkan dan siap sinkron ke GAS', 'SUCCESS');
  }

  // --- GAS URL Config ---
  public getGasUrl(): string {
    const custom = localStorage.getItem(STORAGE_KEYS.GAS_URL);
    if (custom && custom.trim().startsWith('https://script.google.com/')) {
      return custom.trim();
    }
    return 'https://script.google.com/macros/s/AKfycbws8A6yMS1C7rCCs5afT0skv53UzH3qBpxrWwUvHmoyRQK0MDu9MmbJDpkEMHEmeQKt/exec';
  }

  public setGasUrl(url: string) {
    localStorage.setItem(STORAGE_KEYS.GAS_URL, url.trim());
  }

  // --- Users & RBAC ---
  public getUsers(): User[] {
    return this.getSafeArray<User>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public getCurrentUser(): User {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'USR-001';
    const users = this.getUsers();
    return users.find(u => u && u.user_id === currentId) || users[0] || INITIAL_USERS[0];
  }

  public setCurrentUser(userId: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  public saveUser(user: User) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.user_id === user.user_id);
    if (idx >= 0) {
      users[idx] = { ...user, updated_at: this.getTodayFormatted() };
    } else {
      users.push({ ...user, created_at: this.getTodayFormatted(), updated_at: this.getTodayFormatted() });
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // --- Pulau ---
  public getPulauList(): Pulau[] {
    const list: Pulau[] = this.getSafeArray<Pulau>(STORAGE_KEYS.PULAU, INITIAL_PULAU);
    return list.filter(p => p && p.pulau_id !== 'PULAU-06' && !p.nama_pulau.toLowerCase().includes('bokor'));
  }

  public getPulauById(id: string): Pulau | undefined {
    return this.getPulauList().find(p => p.pulau_id === id);
  }

  public savePulau(pulau: Pulau) {
    const list = this.getPulauList();
    const idx = list.findIndex(p => p.pulau_id === pulau.pulau_id);
    if (idx >= 0) {
      list[idx] = pulau;
    } else {
      list.push(pulau);
    }
    localStorage.setItem(STORAGE_KEYS.PULAU, JSON.stringify(list));
    this.addLog('UPDATE', 'SYSTEM', pulau.pulau_id, `Data pulau ${pulau.nama_pulau} diperbarui`, 'SUCCESS');
  }

  // --- Sasaran Balita ---
  public getSasaranList(filter?: GlobalFilter): SasaranBalita[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SASARAN);
    let list: SasaranBalita[] = raw ? JSON.parse(raw) : INITIAL_SASARAN;
    list = list.filter(s => s.pulau_id !== 'PULAU-06');

    if (filter) {
      if (filter.pulau_id && filter.pulau_id !== 'ALL') {
        list = list.filter(s => s.pulau_id === filter.pulau_id);
      }
      if (filter.kategori_masalah && filter.kategori_masalah !== 'ALL') {
        list = list.filter(s => s.kategori_masalah_terakhir === filter.kategori_masalah);
      }
      if (filter.search_query) {
        const q = filter.search_query.toLowerCase();
        list = list.filter(s => 
          s.kode_sasaran.toLowerCase().includes(q) ||
          s.inisial.toLowerCase().includes(q)
        );
      }
    }
    return list;
  }

  public getSasaranById(id: string): SasaranBalita | undefined {
    return this.getSasaranList().find(s => s.sasaran_id === id || s.kode_sasaran === id);
  }

  public saveSasaran(sasaran: SasaranBalita): SasaranBalita {
    const list = this.getSasaranList();
    const idx = list.findIndex(s => s.sasaran_id === sasaran.sasaran_id);
    let saved: SasaranBalita;

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...sasaran };
      saved = list[idx];
      this.addLog('UPDATE', 'SASARAN', sasaran.sasaran_id, `Pembaruan data sasaran ${sasaran.kode_sasaran}`, 'SUCCESS');
    } else {
      saved = {
        ...sasaran,
        sasaran_id: sasaran.sasaran_id || `SAS-${Date.now().toString().slice(-4)}`,
        tanggal_registrasi: sasaran.tanggal_registrasi || this.getTodayFormatted(),
        status_aktif: true
      };
      list.unshift(saved);
      this.addLog('CREATE', 'SASARAN', saved.sasaran_id, `Registrasi sasaran baru ${saved.kode_sasaran}`, 'SUCCESS');
    }

    localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(list));
    return saved;
  }

  public deleteSasaran(id: string): boolean {
    const list = this.getSasaranList();
    const target = list.find(s => s.sasaran_id === id);
    if (!target) return false;
    const filtered = list.filter(s => s.sasaran_id !== id);
    localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(filtered));
    this.addLog('CANCEL', 'SASARAN', id, `Menghapus data sasaran balita ${target.kode_sasaran} (${target.inisial})`, 'SUCCESS');
    return true;
  }

  public importSasaranBatch(items: Partial<SasaranBalita>[]): { count: number; imported: SasaranBalita[] } {
    const currentList = this.getSasaranList();
    const imported: SasaranBalita[] = [];

    items.forEach((item, index) => {
      const pid = item.pulau_id || 'PULAU-01';
      const pulau = this.getPulauById(pid);
      const pulauCode = pulau ? pulau.nama_pulau.substring(6, 9).toUpperCase() : 'TDG';
      const uniqueCode = item.kode_sasaran || `BLT-${pulauCode}-${Math.floor(100 + Math.random() * 899)}`;

      const newSasaran: SasaranBalita = {
        sasaran_id: item.sasaran_id || `SAS-IMP-${Date.now().toString().slice(-4)}-${index + 1}`,
        kode_sasaran: uniqueCode,
        inisial: item.inisial || 'An. Balita',
        tanggal_lahir: item.tanggal_lahir || '01/01/2024',
        jenis_kelamin: (item.jenis_kelamin === 'P' || String(item.jenis_kelamin).toUpperCase().startsWith('P')) ? 'P' : 'L',
        pulau_id: pid,
        unit_pelayanan: item.unit_pelayanan || pulau?.unit_pelayanan || 'Puskesmas Kepulauan Seribu Selatan',
        tanggal_registrasi: item.tanggal_registrasi || this.getTodayFormatted(),
        status_aktif: true,
        kategori_masalah_terakhir: item.kategori_masalah_terakhir || 'Gizi Baik (Normal)',
        bb_terakhir: typeof item.bb_terakhir === 'number' ? item.bb_terakhir : parseFloat(String(item.bb_terakhir || 10)),
        tb_terakhir: typeof item.tb_terakhir === 'number' ? item.tb_terakhir : parseFloat(String(item.tb_terakhir || 80)),
        tanggal_pantau_terakhir: item.tanggal_pantau_terakhir || this.getTodayFormatted(),
        bulan_pengukuran: item.bulan_pengukuran || 'Oktober 2026',
        posyandu: item.posyandu || 'Posyandu Mawar I',
        kelurahan_id: item.kelurahan_id,
        kelurahan_nama: item.kelurahan_nama || 'Kelurahan Pulau Tidung',
        nik: item.nik || '',
        usia: item.usia || '24 Bulan',
        tanggal_ukur: item.tanggal_ukur || item.tanggal_pantau_terakhir || this.getTodayFormatted(),
        cara_ukur: item.cara_ukur || 'Berdiri',
        zscore_bbtb: item.zscore_bbtb || '-1.50 SD',
        status_gizi_bbtb: item.status_gizi_bbtb || item.kategori_masalah_terakhir || 'Gizi Baik (Normal)',
        zscore_tbu: item.zscore_tbu || '-1.00 SD',
        status_gizi_tbu: item.status_gizi_tbu || 'Normal',
        zscore_bbu: item.zscore_bbu || '-1.20 SD',
        status_gizi_bbu: item.status_gizi_bbu || 'Normal',
        naik_berat_badan: item.naik_berat_badan || 'T',
        keterangan_naik_bb: item.keterangan_naik_bb || 'T (Tidak Naik)',
        status_outlier_who: item.status_outlier_who || 'Normal',
        nama_ortu: item.nama_ortu || '',
        no_wa_ortu: item.no_wa_ortu || item.no_hp || '',
        no_hp: item.no_hp || item.no_wa_ortu || '',
        alamat: item.alamat || '',
        rt_rw: item.rt_rw || '',
        wilayah_kecamatan: item.wilayah_kecamatan || 'Kepulauan Seribu Selatan',
        puskesmas_pustu: item.puskesmas_pustu || pulau?.unit_pelayanan || 'Puskesmas Kepulauan Seribu Selatan',
        lila: item.lila
      };

      currentList.unshift(newSasaran);
      imported.push(newSasaran);

      // Sesuai permintaan: Balita bermasalah gizi yang diimpor otomatis masuk ke Daftar Tindak Lanjut lintas sektor
      const isBermasalah = newSasaran.kategori_masalah_terakhir && 
        !newSasaran.kategori_masalah_terakhir.includes('Normal') && 
        !newSasaran.kategori_masalah_terakhir.includes('Baik');

      if (isBermasalah) {
        const tenggatDate = new Date();
        tenggatDate.setDate(tenggatDate.getDate() + 14);
        const tenggatStr = `${String(tenggatDate.getDate()).padStart(2, '0')}/${String(tenggatDate.getMonth() + 1).padStart(2, '0')}/${tenggatDate.getFullYear()}`;

        const newTL: TindakLanjut = {
          tindak_lanjut_id: `TL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          sasaran_id: newSasaran.sasaran_id,
          kategori: `Penanganan ${newSasaran.kategori_masalah_terakhir} - ${newSasaran.posyandu || 'Posyandu'}`,
          rencana_intervensi: `Pendampingan intensif lintas sektor, monitoring antropometri berkala, edukasi gizi seimbang keluarga, dan intervensi pemulihan.`,
          tanggal_rencana: this.getTodayFormatted(),
          tenggat: tenggatStr,
          petugas_id: 'USR-003', // Tenaga Gizi PJ
          status: 'Belum ditindaklanjuti',
          prioritas: 'Tinggi',
          is_from_posyandu: true,
          posyandu_nama: newSasaran.posyandu,
          kelurahan_nama: newSasaran.kelurahan_nama || pulau?.nama_pulau,
          tindak_lanjut_lintas_sektor: [],
          catatan: `Import data balita bermasalah gizi (${newSasaran.kategori_masalah_terakhir}). BB: ${newSasaran.bb_terakhir}kg, TB: ${newSasaran.tb_terakhir}cm, LiLA: ${newSasaran.lila || '-'}cm. Posyandu: ${newSasaran.posyandu || '-'}. Ortu: ${newSasaran.nama_ortu || '-'} (${newSasaran.no_wa_ortu || '-'}).`,
          created_at: this.getTodayFormatted(),
          updated_at: this.getTodayFormatted()
        };
        this.saveTindakLanjut(newTL);
      }
    });

    localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(currentList));
    this.addLog('CREATE', 'SASARAN', `IMP-${imported.length}`, `Berhasil mengimpor ${imported.length} data sasaran balita dari Excel`, 'SUCCESS');
    return { count: imported.length, imported };
  }

  // --- Tindak Lanjut ---
  public getTindakLanjutList(filter?: GlobalFilter): TindakLanjut[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TINDAK_LANJUT);
    let list: TindakLanjut[] = raw ? JSON.parse(raw) : INITIAL_TINDAK_LANJUT;
    list = list.filter(t => t.sasaran_id !== 'SAS-010');
    const sasaranMap = new Map(this.getSasaranList().map(s => [s.sasaran_id, s]));

    if (filter) {
      if (filter.pulau_id && filter.pulau_id !== 'ALL') {
        list = list.filter(t => {
          const s = sasaranMap.get(t.sasaran_id);
          return s && s.pulau_id === filter.pulau_id;
        });
      }
      if (filter.status_tindak_lanjut && filter.status_tindak_lanjut !== 'ALL') {
        list = list.filter(t => t.status === filter.status_tindak_lanjut);
      }
      if (filter.search_query) {
        const q = filter.search_query.toLowerCase();
        list = list.filter(t => {
          const s = sasaranMap.get(t.sasaran_id);
          return t.tindak_lanjut_id.toLowerCase().includes(q) ||
            t.rencana_intervensi.toLowerCase().includes(q) ||
            (s && (s.kode_sasaran.toLowerCase().includes(q) || s.inisial.toLowerCase().includes(q)));
        });
      }
    }
    return list;
  }

  public saveTindakLanjut(tl: TindakLanjut): TindakLanjut {
    const list = this.getTindakLanjutList();
    const idx = list.findIndex(t => t.tindak_lanjut_id === tl.tindak_lanjut_id);
    let saved: TindakLanjut;

    if (idx >= 0) {
      list[idx] = { 
        ...list[idx], 
        ...tl, 
        updated_at: this.getTodayFormatted() 
      };
      saved = list[idx];
      this.addLog('UPDATE', 'TINDAK_LANJUT', tl.tindak_lanjut_id, `Update intervensi status: ${tl.status}`, 'SUCCESS');
    } else {
      saved = {
        ...tl,
        tindak_lanjut_id: tl.tindak_lanjut_id || `TL-2026-${Date.now().toString().slice(-4)}`,
        created_at: this.getTodayFormatted(),
        updated_at: this.getTodayFormatted()
      };
      list.unshift(saved);
      this.addLog('CREATE', 'TINDAK_LANJUT', saved.tindak_lanjut_id, `Rencana tindak lanjut dibuat untuk sasaran ${saved.sasaran_id}`, 'SUCCESS');
    }

    this.safeSetItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(list));
    return saved;
  }

  public deleteTindakLanjut(id: string): boolean {
    const list = this.getTindakLanjutList();
    const filtered = list.filter(t => t.tindak_lanjut_id !== id);
    this.safeSetItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(filtered));
    this.addLog('CANCEL', 'TINDAK_LANJUT', id, `Menghapus data tindak lanjut ${id}`, 'SUCCESS');
    return true;
  }

  // --- Kendala ---
  public getKendalaList(pulauId?: string): Kendala[] {
    const raw = localStorage.getItem(STORAGE_KEYS.KENDALA);
    let list: Kendala[] = raw ? JSON.parse(raw) : INITIAL_KENDALA;
    if (pulauId && pulauId !== 'ALL') {
      list = list.filter(k => k.pulau_id === pulauId);
    }
    return list;
  }

  public saveKendala(k: Kendala): Kendala {
    const list = this.getKendalaList();
    const idx = list.findIndex(item => item.kendala_id === k.kendala_id);
    let saved: Kendala;

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...k, updated_at: this.getTodayFormatted() };
      saved = list[idx];
      this.addLog('UPDATE', 'KENDALA', k.kendala_id, `Perubahan status kendala: ${k.status}`, 'SUCCESS');
    } else {
      saved = {
        ...k,
        kendala_id: k.kendala_id || `KND-2026-${Date.now().toString().slice(-4)}`,
        created_at: this.getTodayFormatted(),
        updated_at: this.getTodayFormatted()
      };
      list.unshift(saved);
      this.addLog('CREATE', 'KENDALA', saved.kendala_id, `Pencatatan kendala lapangan: ${k.kategori}`, 'WARNING');
    }

    localStorage.setItem(STORAGE_KEYS.KENDALA, JSON.stringify(list));
    return saved;
  }

  public deleteKendala(id: string): boolean {
    const list = this.getKendalaList();
    const filtered = list.filter(k => k.kendala_id !== id);
    localStorage.setItem(STORAGE_KEYS.KENDALA, JSON.stringify(filtered));
    this.addLog('CANCEL', 'KENDALA', id, `Kendala ${id} dihapus dari daftar kendala`, 'WARNING');
    return true;
  }

  public saveKendalaFromTindakLanjut(tlId: string, data: {
    kategori: KategoriKendala | string;
    kendala_detail: string;
    rencana_penyelesaian?: string;
    status?: StatusKendala;
  }): { savedKendala: Kendala; updatedTL?: TindakLanjut } {
    const tlList = this.getTindakLanjutList();
    const tlIndex = tlList.findIndex(t => t.tindak_lanjut_id === tlId);
    let targetTL: TindakLanjut | undefined;

    if (tlIndex >= 0) {
      tlList[tlIndex] = {
        ...tlList[tlIndex],
        kendala_kategori: data.kategori,
        kendala_detail: data.kendala_detail,
        kendala_status: data.status === 'Selesai' ? 'Terselesaikan' : 'Ada Kendala',
        updated_at: this.getTodayFormatted()
      };
      targetTL = tlList[tlIndex];
      this.safeSetItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(tlList));
    }

    const sasaran = targetTL ? this.getSasaranById(targetTL.sasaran_id) : undefined;
    const currentUser = this.getCurrentUser();

    const newKendala: Kendala = {
      kendala_id: `KND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tanggal_kejadian: this.getTodayFormatted(),
      pulau_id: sasaran?.pulau_id || 'PULAU-01',
      kategori: data.kategori,
      deskripsi: `Kendala tindak lanjut ${targetTL?.tindak_lanjut_id || ''}: ${data.kategori}`,
      kendala_detail: data.kendala_detail,
      dampak: `Menghambat efektivitas intervensi penanganan gizi balita ${sasaran?.inisial || targetTL?.sasaran_id || ''}.`,
      rencana_penyelesaian: data.rencana_penyelesaian || 'Koordinasi lintas sektor untuk bantuan dan pendampingan terpadu.',
      penanggung_jawab: `${currentUser.nama} (${currentUser.unit || currentUser.role})`,
      tenggat: targetTL?.tenggat || this.getTodayFormatted(),
      status: data.status || 'Dalam proses',
      sasaran_terkait_kode: sasaran?.kode_sasaran || targetTL?.sasaran_id,
      sasaran_id: targetTL?.sasaran_id,
      tindak_lanjut_id: tlId,
      pelapor_nama: currentUser.nama,
      pelapor_sektor: currentUser.unit || currentUser.role,
      catatan_tindak_lanjut: `Dilaporkan melalui Daftar Tindak Lanjut: ${data.kendala_detail}`,
      created_at: this.getTodayFormatted(),
      updated_at: this.getTodayFormatted()
    };

    const savedK = this.saveKendala(newKendala);
    return { savedKendala: savedK, updatedTL: targetTL };
  }

  // --- Lintas Sektor ---
  public getLintasSektorList(pulauId?: string): KegiatanLintasSektor[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LINTAS_SEKTOR);
    let list: KegiatanLintasSektor[] = raw ? JSON.parse(raw) : INITIAL_LINTAS_SEKTOR;
    if (pulauId && pulauId !== 'ALL') {
      list = list.filter(item => item.pulau_id === pulauId);
    }
    return list;
  }

  public saveLintasSektor(kegiatan: KegiatanLintasSektor): KegiatanLintasSektor {
    const list = this.getLintasSektorList();
    const idx = list.findIndex(item => item.kegiatan_id === kegiatan.kegiatan_id);
    let saved: KegiatanLintasSektor;

    const calculatedProgress = kegiatan.target > 0 
      ? Math.min(100, Math.round((kegiatan.realisasi / kegiatan.target) * 100))
      : kegiatan.progres;

    if (idx >= 0) {
      list[idx] = { 
        ...list[idx], 
        ...kegiatan, 
        progres: calculatedProgress,
        updated_at: this.getTodayFormatted() 
      };
      saved = list[idx];
      this.addLog('UPDATE', 'LINTAS_SEKTOR', kegiatan.kegiatan_id, `Update koordinasi lintas sektor: ${kegiatan.nama_kegiatan} (${calculatedProgress}%)`, 'SUCCESS');
    } else {
      saved = {
        ...kegiatan,
        kegiatan_id: kegiatan.kegiatan_id || `LINTAS-${Date.now().toString().slice(-4)}`,
        progres: calculatedProgress,
        updated_at: this.getTodayFormatted()
      };
      list.unshift(saved);
      this.addLog('CREATE', 'LINTAS_SEKTOR', saved.kegiatan_id, `Komitmen lintas sektor baru: ${kegiatan.nama_kegiatan}`, 'SUCCESS');
    }

    localStorage.setItem(STORAGE_KEYS.LINTAS_SEKTOR, JSON.stringify(list));
    return saved;
  }

  public deleteLintasSektor(id: string): boolean {
    const list = this.getLintasSektorList();
    const filtered = list.filter(l => l.kegiatan_id !== id);
    localStorage.setItem(STORAGE_KEYS.LINTAS_SEKTOR, JSON.stringify(filtered));
    this.addLog('CANCEL', 'LINTAS_SEKTOR', id, `Menghapus kegiatan lintas sektor ${id}`, 'SUCCESS');
    return true;
  }

  // --- Riwayat Aktivitas & Logging ---
  public getLogs(): RiwayatAktivitas[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : INITIAL_LOGS;
  }

  public addLog(aksi: 'CREATE' | 'UPDATE' | 'CANCEL' | 'EXPORT' | 'INIT' | 'RESET', jenis: any, recordId: string, ringkasan: string, status: 'SUCCESS' | 'WARNING' | 'FAILED') {
    const cur = this.getCurrentUser();
    const logs = this.getLogs();
    const newLog: RiwayatAktivitas = {
      log_id: `LOG-${Date.now().toString().slice(-6)}`,
      waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
      user_id: cur.user_id,
      user_name: cur.nama,
      aksi: aksi as any,
      jenis_data: jenis,
      record_id: recordId,
      ringkasan_perubahan: ringkasan,
      status
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  // --- Rumus & Kalkulasi Dashboard Agregat (Sesuai Lampiran 1 & 2) ---
  public getDashboardStats(filter: GlobalFilter) {
    const pulauList = this.getPulauList();
    const sasaranList = this.getSasaranList(filter);
    const tlList = this.getTindakLanjutList(filter);

    // Baseline numbers matching exact mockups from user attachment
    let totalSasaran = 480;
    let bermasalahGizi = 72;
    let sasaranDipantau = 411;
    let persenCakupan = 85.6;
    let tlSelesai = 53;
    let persenSelesai = 73.6;
    let tlTertunda = 19;
    let persenTertunda = 26.4;
    let diffSasaran = '+12 dari bulan lalu';

    if (filter.pulau_id === 'PULAU-01') {
      totalSasaran = 180;
      bermasalahGizi = 28;
      sasaranDipantau = 156;
      persenCakupan = 86.7;
      tlSelesai = 14;
      persenSelesai = 70.0;
      tlTertunda = 6;
      persenTertunda = 30.0;
      diffSasaran = '+5 dari bulan lalu';
    } else if (filter.pulau_id === 'PULAU-02') {
      totalSasaran = 150;
      bermasalahGizi = 24;
      sasaranDipantau = 126;
      persenCakupan = 84.0;
      tlSelesai = 10;
      persenSelesai = 55.6;
      tlTertunda = 8;
      persenTertunda = 44.4;
      diffSasaran = '+4 dari bulan lalu';
    } else if (filter.pulau_id === 'PULAU-03') {
      totalSasaran = 100;
      bermasalahGizi = 14;
      sasaranDipantau = 85;
      persenCakupan = 85.0;
      tlSelesai = 7;
      persenSelesai = 53.8;
      tlTertunda = 6;
      persenTertunda = 46.2;
      diffSasaran = '+2 dari bulan lalu';
    } else if (filter.pulau_id === 'PULAU-04') {
      totalSasaran = 50;
      bermasalahGizi = 6;
      sasaranDipantau = 44;
      persenCakupan = 88.0;
      tlSelesai = 4;
      persenSelesai = 66.7;
      tlTertunda = 2;
      persenTertunda = 33.3;
      diffSasaran = '+1 dari bulan lalu';
    }

    // Cek tenggat lewat (Overdue)
    const today = new Date();
    const overdueList = tlList.filter(t => {
      if (t.status === 'Selesai' || t.status === 'Dibatalkan') return false;
      if (!t.tenggat) return false;
      const parts = t.tenggat.split('/');
      if (parts.length === 3) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return d < today;
      }
      return false;
    });

    // 4 Pulau Utama
    const ringkasanPulau = [
      { id: 'PULAU-01', nama: 'Pulau Tidung', sasaran: 180, kasus: 28, selesai: 14, tertunda: 6, persen: '15,6%', statusAkses: 'Lancar', statusBadge: 'bg-emerald-500' },
      { id: 'PULAU-02', nama: 'Pulau Pari', sasaran: 150, kasus: 24, selesai: 10, tertunda: 8, persen: '16,0%', statusAkses: 'Perlu koordinasi', statusBadge: 'bg-amber-500' },
      { id: 'PULAU-03', nama: 'Pulau Lancang', sasaran: 100, kasus: 14, selesai: 7, tertunda: 6, persen: '14,0%', statusAkses: 'Terkendala', statusBadge: 'bg-rose-500' },
      { id: 'PULAU-04', nama: 'Pulau Untung Jawa', sasaran: 50, kasus: 6, selesai: 4, tertunda: 2, persen: '14,0%', statusAkses: 'Lancar', statusBadge: 'bg-emerald-500' }
    ];

    // Distribusi Kategori Masalah Gizi (Presisi Lampiran 1 & 2: 72 kasus)
    const distribusiGiziData = [
      { name: 'Gizi kurang', count: 38, persen: '52,8%', color: '#0284c7' },
      { name: 'Berat badan tidak naik', count: 16, persen: '22,2%', color: '#10b981' },
      { name: 'Risiko masalah pertumbuhan', count: 12, persen: '16,7%', color: '#f59e0b' },
      { name: 'Lainnya', count: 6, persen: '8,3%', color: '#8b5cf6' }
    ];

    // Jenis Kendala Akses (Bulan Ini)
    const kendalaAksesData = [
      { jenis: 'Transportasi', count: 8, color: '#0284c7' },
      { jenis: 'Cuaca', count: 5, color: '#10b981' },
      { jenis: 'Ketidakhadiran', count: 3, color: '#f59e0b' },
      { jenis: 'Perubahan jadwal', count: 2, color: '#a855f7' },
      { jenis: 'Lainnya', count: 1, color: '#94a3b8' }
    ];

    // Tren Kasus & Penyelesaian 6 Bulan Terakhir (Presisi Lampiran 1)
    const trendComboData = [
      { bulan: 'Mei', kasus: 42, selesai: 28, persen: 66 },
      { bulan: 'Jun', kasus: 38, selesai: 26, persen: 68 },
      { bulan: 'Jul', kasus: 40, selesai: 27, persen: 67 },
      { bulan: 'Agu', kasus: 36, selesai: 26, persen: 72 },
      { bulan: 'Sep', kasus: 44, selesai: 34, persen: 77 },
      { bulan: 'Okt', kasus: 58, selesai: 38, persen: 86 }
    ];

    // Notifikasi & Informasi (Presisi Lampiran 2 #1)
    const notifikasiInformasi = [
      { id: 'notif-1', judul: '7 tindak lanjut melewati tenggat', jenis: 'danger', icon: 'Clock', waktu: 'Hari ini' },
      { id: 'notif-2', judul: '3 kasus baru perlu verifikasi', jenis: 'warning', icon: 'FileText', waktu: '1 jam lalu' },
      { id: 'notif-3', judul: 'Jadwal Posyandu Pulau Pari berubah (26 Okt)', jenis: 'info', icon: 'Calendar', waktu: 'Kemarin' },
      { id: 'notif-4', judul: 'Koordinasi transportasi ke Pulau Lancang', jenis: 'primary', icon: 'Compass', waktu: '2 hari lalu' }
    ];

    return {
      kpi: {
        totalSasaran,
        bermasalahGizi,
        sasaranDipantau,
        persenCakupan,
        tlTertunda,
        tlSelesai,
        tlPerhatianSegera: 12,
        persenSelesai,
        persenTertunda,
        diffSasaran,
        persenPenyelesaian: persenSelesai,
        jumlahOverdue: overdueList.length || 7
      },
      overdueList,
      ringkasanPulau,
      distribusiGiziData,
      kendalaAksesData,
      trendComboData,
      notifikasiInformasi,
      top5Pulau: ringkasanPulau.map(p => ({ name: p.nama, cases: p.kasus, total: p.sasaran, dipantau: Math.round(p.sasaran * 0.85) })),
      kategoriChartData: distribusiGiziData.map(d => ({ name: d.name, value: d.count })),
      trendData: trendComboData.map(t => ({ bulan: t.bulan, dipantau: t.kasus, membaik: t.selesai, intervensi: t.kasus }))
    };
  }

  // --- Theme Mode ---
  public getThemeMode(): 'light' | 'dark' {
    return (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as 'light' | 'dark') || 'light';
  }

  public setThemeMode(mode: 'light' | 'dark') {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  }

  // --- Auto Refresh 3s ---
  public getAutoRefreshEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_REFRESH);
    return val === null ? true : val === 'true'; // Default true for user requirement
  }

  public setAutoRefreshEnabled(enabled: boolean) {
    localStorage.setItem(STORAGE_KEYS.AUTO_REFRESH, String(enabled));
  }

  // --- WhatsApp Notifications Log & Dispatcher ---
  public getWhatsAppNotifs(): any[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WA_NOTIFS);
    return raw ? JSON.parse(raw) : [];
  }

  public addWhatsAppNotif(notif: any) {
    const list = this.getWhatsAppNotifs();
    list.unshift(notif);
    if (list.length > 50) list.pop();
    localStorage.setItem(STORAGE_KEYS.WA_NOTIFS, JSON.stringify(list));
  }

  public getAppUrl(): string {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return 'https://dermagagizi.puskesmasseribuselatan.com';
  }

  /**
   * Mengirim notifikasi WA ke Petugas, Kader, dan Lintas Sektor saat data sasaran baru ditambah
   */
  public notifyNewSasaran(sasaran: SasaranBalita): any[] {
    const users = this.getUsers();
    const pulau = this.getPulauById(sasaran.pulau_id);
    const createdNotifs: any[] = [];
    const appUrl = this.getAppUrl();

    // Kirim ke Petugas Gizi, Kader, dan Lintas Sektor di pulau terkait
    const recipients = users.filter(u => 
      u.pulau_id === sasaran.pulau_id || u.pulau_id === 'ALL' || u.role === 'LINTAS_SEKTOR' || u.role === 'KADER' || u.role === 'TENAGA_GIZI'
    );

    recipients.forEach(u => {
      const phone = u.no_wa || '6281299887711';
      const text = `🔔 *NOTIFIKASI DERMAGA GIZI - PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
        `Halo Yth. *${u.nama}* (${u.role.replace(/_/g, ' ')}),\n` +
        `Telah didaftarkan data sasaran balita baru:\n` +
        `• Kode: *${sasaran.kode_sasaran}* (${sasaran.inisial})\n` +
        `• Wilayah: *${pulau?.nama_pulau || sasaran.pulau_id}*\n` +
        `• Status Gizi Terakhir: *${sasaran.kategori_masalah_terakhir || 'Gizi Baik'}*\n` +
        `• Antropometri: BB ${sasaran.bb_terakhir}kg, TB ${sasaran.tb_terakhir}cm\n\n` +
        `🔗 *Buka Aplikasi:* ${appUrl}\n\n` +
        `Mohon segera memantau dan mengoordinasikan intervensi lapangan melalui Dashboard DERMAGA GIZI.`;

      const linkWa = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      const notifItem = {
        notif_id: `WA-${Date.now()}-${Math.floor(Math.random()*100)}`,
        waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
        penerima_nama: u.nama,
        penerima_role: u.role,
        penerima_wa: phone,
        kategori: 'SASARAN_BARU',
        judul: `Registrasi Balita Baru: ${sasaran.kode_sasaran}`,
        pesan: text,
        status: 'TERKIRIM',
        link_wa: linkWa
      };

      this.addWhatsAppNotif(notifItem);
      createdNotifs.push(notifItem);
    });

    return createdNotifs;
  }

  /**
   * Mengirim notifikasi WA ke Petugas PJ, Kader, dan Lintas Sektor saat tindak lanjut dibuat atau diperbarui
   */
  public notifyTindakLanjut(tl: TindakLanjut, isNew: boolean): any[] {
    const users = this.getUsers();
    const sasaran = this.getSasaranById(tl.sasaran_id);
    const pulau = sasaran ? this.getPulauById(sasaran.pulau_id) : null;
    const pjUser = users.find(u => u.user_id === tl.petugas_id);
    const createdNotifs: any[] = [];

    // Target penerima: Petugas PJ, Lintas Sektor, dan Kader pulau sasaran
    const recipients = users.filter(u => 
      u.user_id === tl.petugas_id || 
      (sasaran && (u.pulau_id === sasaran.pulau_id || u.pulau_id === 'ALL')) && 
      (u.role === 'LINTAS_SEKTOR' || u.role === 'KADER' || u.role === 'KEPALA_PUSKESMAS' || u.role === 'TENAGA_GIZI')
    );

    recipients.forEach(u => {
      const phone = u.no_wa || '6281299887711';
      const actionText = isNew ? 'Rencana Intervensi Baru Ditetapkan' : `Pembaruan Status Intervensi [${tl.status}]`;
      const text = `🔔 *NOTIFIKASI DERMAGA GIZI - PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
        `Yth. *${u.nama}* (${u.role.replace(/_/g, ' ')}),\n` +
        `${actionText}:\n` +
        `• ID TL: *${tl.tindak_lanjut_id}*\n` +
        `• Sasaran: *${sasaran?.kode_sasaran || tl.sasaran_id}* (${sasaran?.inisial || '-'})\n` +
        `• Wilayah: *${pulau?.nama_pulau || 'Kepulauan Seribu Selatan'}*\n` +
        `• Intervensi: *${tl.kategori}*\n` +
        `• Rencana: ${tl.rencana_intervensi}\n` +
        `• Tenggat Waktu: *${tl.tenggat}*\n` +
        `• Status: *${tl.status}* | Prioritas: *${tl.prioritas}*\n` +
        `• Penanggung Jawab: *${pjUser?.nama || tl.petugas_id}*\n\n` +
        `🔗 *Buka Aplikasi:* ${this.getAppUrl()}\n\n` +
        `Terima kasih atas dedikasi dan kolaborasi lintas sektor Anda.`;

      const linkWa = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      const notifItem = {
        notif_id: `WA-${Date.now()}-${Math.floor(Math.random()*100)}`,
        waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
        penerima_nama: u.nama,
        penerima_role: u.role,
        penerima_wa: phone,
        kategori: isNew ? 'TINDAK_LANJUT_BARU' : 'TINDAK_LANJUT_UPDATE',
        judul: `${actionText}: ${tl.tindak_lanjut_id}`,
        pesan: text,
        status: 'TERKIRIM',
        link_wa: linkWa
      };

      this.addWhatsAppNotif(notifItem);
      createdNotifs.push(notifItem);
    });

    return createdNotifs;
  }

  /**
   * Kirim notifikasi WA Peringatan Keterlambatan (Overdue)
   */
  public notifyOverdueTask(tl: TindakLanjut): any[] {
    const users = this.getUsers();
    const sasaran = this.getSasaranById(tl.sasaran_id);
    const pulau = sasaran ? this.getPulauById(sasaran.pulau_id) : null;
    const pjUser = users.find(u => u.user_id === tl.petugas_id);
    const createdNotifs: any[] = [];

    // Target: PJ yang belum mengerjakan, Kepala Puskesmas, dan Tenaga Gizi
    const targets = users.filter(u => 
      u.user_id === tl.petugas_id || u.role === 'KEPALA_PUSKESMAS' || u.role === 'TENAGA_GIZI' || u.role === 'ADMIN'
    );

    targets.forEach(u => {
      const phone = u.no_wa || '6281299887711';
      const text = `⚠️ *PERINGATAN TENGGAT TERLEWAT - DERMAGA GIZI*\n` +
        `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
        `Yth. *${u.nama}* (${u.role.replace(/_/g, ' ')}),\n` +
        `Tindak lanjut intervensi berikut *BELUM DITINDAKLANJUTI* dan telah melewati tenggat waktu:\n` +
        `• ID TL: *${tl.tindak_lanjut_id}*\n` +
        `• Sasaran: *${sasaran?.kode_sasaran || tl.sasaran_id}* (${sasaran?.inisial || '-'})\n` +
        `• Pulau: *${pulau?.nama_pulau || '-' }*\n` +
        `• Rencana: *${tl.rencana_intervensi}*\n` +
        `• Batas Tenggat: *${tl.tenggat}* (MELEWATI BATAS WAKTU)\n` +
        `• Status Terkini: *${tl.status}*\n` +
        `• Petugas PJ: *${pjUser?.nama || tl.petugas_id}*\n\n` +
        `🔗 *Buka Aplikasi:* ${this.getAppUrl()}\n\n` +
        `Diharapkan pihak terkait segera mengambil tindakan penanganan dan memperbarui status pada aplikasi DERMAGA GIZI.`;

      const linkWa = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      const notifItem = {
        notif_id: `WA-${Date.now()}-${Math.floor(Math.random()*100)}`,
        waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
        penerima_nama: u.nama,
        penerima_role: u.role,
        penerima_wa: phone,
        kategori: 'PERINGATAN_OVERDUE',
        judul: `Peringatan Overdue: ${tl.tindak_lanjut_id}`,
        pesan: text,
        status: 'TERKIRIM',
        link_wa: linkWa
      };

      this.addWhatsAppNotif(notifItem);
      createdNotifs.push(notifItem);
    });

    return createdNotifs;
  }

  // --- Laporan Monitoring Kinerja Peran Akses (Role) & Petugas ---
  public getRolePerformanceReport(): any[] {
    const users = this.getUsers();
    const tlList = this.getTindakLanjutList();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const roles: { role: string; label: string }[] = [
      { role: 'TENAGA_GIZI', label: 'Tenaga Gizi (Nutrisionis)' },
      { role: 'DOKTER_BIDAN_PERAWAT', label: 'Dokter / Bidan / Perawat' },
      { role: 'PETUGAS_PUSTU', label: 'Petugas Pustu Pulau' },
      { role: 'KADER', label: 'Kader Posyandu' },
      { role: 'LINTAS_SEKTOR', label: 'Petugas Lintas Sektor' },
      { role: 'ADMIN', label: 'Administrator Sistem' }
    ];

    return roles.map(r => {
      const officersInRole = users.filter(u => u.role === r.role);
      const officerIds = officersInRole.map(u => u.user_id);
      
      const roleTLs = tlList.filter(t => officerIds.includes(t.petugas_id));
      const selesai = roleTLs.filter(t => t.status === 'Selesai').length;
      const dalamProses = roleTLs.filter(t => t.status === 'Dalam proses').length;
      const tertunda = roleTLs.filter(t => t.status === 'Belum ditindaklanjuti' || t.status === 'Menunggu koordinasi').length;

      const overdue = roleTLs.filter(t => {
        if (t.status === 'Selesai' || t.status === 'Dibatalkan' || !t.tenggat) return false;
        const parts = t.tenggat.split('/');
        if (parts.length === 3) {
          const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          return d < today;
        }
        return false;
      }).length;

      const total = roleTLs.length;
      const persen = total > 0 ? Math.round((selesai / total) * 100) : (officersInRole.length > 0 ? 100 : 0);

      // Detail per petugas
      const petugasList = officersInRole.map(u => {
        const userTLs = roleTLs.filter(t => t.petugas_id === u.user_id);
        const uSelesai = userTLs.filter(t => t.status === 'Selesai').length;
        const uTertunda = userTLs.filter(t => t.status !== 'Selesai' && t.status !== 'Dibatalkan').length;
        const uOverdue = userTLs.filter(t => {
          if (t.status === 'Selesai' || t.status === 'Dibatalkan' || !t.tenggat) return false;
          const p = t.tenggat.split('/');
          return p.length === 3 && new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])) < today;
        }).length;
        const uPersen = userTLs.length > 0 ? Math.round((uSelesai / userTLs.length) * 100) : 100;

        return {
          user_id: u.user_id,
          nama: u.nama,
          no_wa: u.no_wa,
          unit: u.unit,
          total: userTLs.length,
          selesai: uSelesai,
          tertunda: uTertunda,
          overdue: uOverdue,
          persen: uPersen
        };
      });

      return {
        role: r.role,
        role_label: r.label,
        total_petugas: officersInRole.length,
        total_tindak_lanjut: total,
        selesai,
        dalam_proses: dalamProses,
        tertunda,
        overdue,
        persen_selesai: persen,
        petugas_list: petugasList
      };
    });
  }

  // --- Sinkronisasi State Langsung Dari Google Spreadsheet (Fokus Database) ---
  public syncFromGas(gasData: {
    sasaran?: SasaranBalita[];
    tindak_lanjut?: TindakLanjut[];
    pulau?: Pulau[];
    kendala?: Kendala[];
    lintas_sektor?: KegiatanLintasSektor[];
    posyandu?: Posyandu[];
    kelurahan?: Kelurahan[];
    lintas_sektor_users?: UserLintasSektor[];
    laporan_posyandu?: LaporanPosyandu[];
  }) {
    let changed = false;

    // 1. Sinkronisasi Sasaran Balita (Smart Merge agar data baru upload tidak terhapus)
    if (Array.isArray(gasData.sasaran)) {
      if (gasData.sasaran.length > 0) {
        const localList = this.getSasaranList();
        const sasaranMap = new Map<string, SasaranBalita>();
        const nikIndexMap = new Map<string, string>();

        // Masukkan data remote dari spreadsheet
        gasData.sasaran.forEach(remoteItem => {
          const id = remoteItem.sasaran_id || (remoteItem.nik ? `NIK-${remoteItem.nik}` : remoteItem.kode_sasaran);
          if (id) {
            sasaranMap.set(id, remoteItem);
          }
          if (remoteItem.nik) {
            nikIndexMap.set(String(remoteItem.nik).trim(), id);
          }
        });

        // Pertahankan data lokal yang baru saja diupload/disimpan yang belum ada di spreadsheet
        localList.forEach(localItem => {
          const hasId = localItem.sasaran_id && sasaranMap.has(localItem.sasaran_id);
          const hasNik = localItem.nik && nikIndexMap.has(String(localItem.nik).trim());
          if (!hasId && !hasNik) {
            const fallbackKey = localItem.sasaran_id || (localItem.nik ? `NIK-${localItem.nik}` : localItem.kode_sasaran);
            if (fallbackKey) {
              sasaranMap.set(fallbackKey, localItem);
            }
          }
        });

        localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(Array.from(sasaranMap.values())));
        changed = true;
      }
    }

    // 2. Sinkronisasi Tindak Lanjut (Smart Merge)
    if (Array.isArray(gasData.tindak_lanjut)) {
      if (gasData.tindak_lanjut.length > 0) {
        const localTL = this.getTindakLanjutList();
        const tlMap = new Map<string, TindakLanjut>();

        gasData.tindak_lanjut.forEach(remoteTL => {
          if (remoteTL.tindak_lanjut_id) tlMap.set(remoteTL.tindak_lanjut_id, remoteTL);
        });

        localTL.forEach(localItem => {
          if (localItem.tindak_lanjut_id && !tlMap.has(localItem.tindak_lanjut_id)) {
            tlMap.set(localItem.tindak_lanjut_id, localItem);
          }
        });

        localStorage.setItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(Array.from(tlMap.values())));
        changed = true;
      }
    }

    if (Array.isArray(gasData.pulau) && gasData.pulau.length > 0) {
      const cleanPulau = gasData.pulau.filter(p => p.pulau_id !== 'PULAU-06' && !p.nama_pulau.toLowerCase().includes('bokor'));
      localStorage.setItem(STORAGE_KEYS.PULAU, JSON.stringify(cleanPulau));
      changed = true;
    }

    // 3. Sinkronisasi Kendala (Smart Merge)
    if (Array.isArray(gasData.kendala)) {
      if (gasData.kendala.length > 0) {
        const localK = this.getKendalaList();
        const kMap = new Map<string, Kendala>();
        gasData.kendala.forEach(k => {
          if (k.kendala_id) kMap.set(k.kendala_id, k);
        });
        localK.forEach(k => {
          if (k.kendala_id && !kMap.has(k.kendala_id)) {
            kMap.set(k.kendala_id, k);
          }
        });
        localStorage.setItem(STORAGE_KEYS.KENDALA, JSON.stringify(Array.from(kMap.values())));
        changed = true;
      }
    }

    // 4. Sinkronisasi Lintas Sektor
    if (Array.isArray(gasData.lintas_sektor)) {
      if (gasData.lintas_sektor.length > 0) {
        const localLS = this.getLintasSektorList();
        const lsMap = new Map<string, KegiatanLintasSektor>();
        gasData.lintas_sektor.forEach(ls => {
          if (ls.kegiatan_id) lsMap.set(ls.kegiatan_id, ls);
        });
        localLS.forEach(ls => {
          if (ls.kegiatan_id && !lsMap.has(ls.kegiatan_id)) {
            lsMap.set(ls.kegiatan_id, ls);
          }
        });
        localStorage.setItem(STORAGE_KEYS.LINTAS_SEKTOR, JSON.stringify(Array.from(lsMap.values())));
        changed = true;
      }
    }

    if (Array.isArray(gasData.posyandu) && gasData.posyandu.length > 0) {
      localStorage.setItem(STORAGE_KEYS.POSYANDU, JSON.stringify(gasData.posyandu));
      changed = true;
    }

    if (Array.isArray(gasData.kelurahan) && gasData.kelurahan.length > 0) {
      localStorage.setItem(STORAGE_KEYS.KELURAHAN, JSON.stringify(gasData.kelurahan));
      changed = true;
    }

    if (Array.isArray(gasData.lintas_sektor_users) && gasData.lintas_sektor_users.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USER_LINTAS_SEKTOR, JSON.stringify(gasData.lintas_sektor_users));
      changed = true;
    }

    if (Array.isArray(gasData.laporan_posyandu) && gasData.laporan_posyandu.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LAPORAN_POSYANDU, JSON.stringify(gasData.laporan_posyandu));
      changed = true;
    }

    return changed;
  }

  // ==========================================
  // --- MASTER DATA KELURAHAN & POSYANDU ---
  // ==========================================
  public getKelurahanList(): Kelurahan[] {
    const list = this.getSafeArray<Kelurahan>(STORAGE_KEYS.KELURAHAN, INITIAL_KELURAHAN);
    return list.map(k => ({
      ...k,
      nama_kelurahan: k.nama_kelurahan || 'Kelurahan',
      kecamatan: k.kecamatan || 'Kecamatan Kepulauan Seribu Selatan',
      lurah_nama: k.lurah_nama || 'Lurah',
      no_wa_lurah: k.no_wa_lurah || '6281234567890',
      jumlah_rw: typeof k.jumlah_rw === 'number' ? k.jumlah_rw : 4,
      jumlah_rt: typeof k.jumlah_rt === 'number' ? k.jumlah_rt : 20,
      daftar_pulau: Array.isArray(k.daftar_pulau) ? k.daftar_pulau : ['Pulau']
    }));
  }

  public getKelurahanById(id: string): Kelurahan | undefined {
    return this.getKelurahanList().find(k => k.kelurahan_id === id);
  }

  public saveKelurahan(kel: Kelurahan) {
    const list = this.getKelurahanList();
    const idx = list.findIndex(k => k.kelurahan_id === kel.kelurahan_id);
    if (idx >= 0) {
      list[idx] = kel;
    } else {
      list.push(kel);
    }
    localStorage.setItem(STORAGE_KEYS.KELURAHAN, JSON.stringify(list));
    this.addLog('UPDATE', 'SYSTEM', kel.kelurahan_id, `Data kelurahan ${kel.nama_kelurahan} diperbarui`, 'SUCCESS');
  }

  public getPosyanduList(kelurahanId?: string): Posyandu[] {
    const list = this.getSafeArray<Posyandu>(STORAGE_KEYS.POSYANDU, INITIAL_POSYANDU);
    const sanitized = list.map(p => ({
      ...p,
      posyandu_id: p.posyandu_id || `POS-${Math.floor(100 + Math.random() * 900)}`,
      nama_posyandu: p.nama_posyandu || 'Posyandu',
      kelurahan_id: p.kelurahan_id || 'KEL-01',
      kelurahan_nama: p.kelurahan_nama || 'Kelurahan Pulau Tidung',
      pulau_id: p.pulau_id || 'PULAU-01',
      pulau_nama: p.pulau_nama || 'Pulau Tidung',
      rw: p.rw || 'RW 01',
      rt: p.rt || 'RT 01',
      lokasi_alamat: p.lokasi_alamat || 'Balai Warga',
      ketua_kader: p.ketua_kader || 'Kader Posyandu',
      no_wa_kader: p.no_wa_kader || '6281234567890',
      jumlah_kader: typeof p.jumlah_kader === 'number' ? p.jumlah_kader : 5,
      jadwal_hari: p.jadwal_hari || 'Minggu ke-2 setiap bulan',
      total_sasaran: typeof p.total_sasaran === 'number' ? p.total_sasaran : 80,
      status_aktif: p.status_aktif ?? true
    }));
    if (kelurahanId && kelurahanId !== 'ALL') {
      return sanitized.filter(p => p.kelurahan_id === kelurahanId);
    }
    return sanitized;
  }

  public getPosyanduById(id: string): Posyandu | undefined {
    return this.getPosyanduList().find(p => p.posyandu_id === id);
  }

  public savePosyandu(pos: Posyandu) {
    const list = this.getPosyanduList();
    const idx = list.findIndex(p => p.posyandu_id === pos.posyandu_id);
    if (idx >= 0) {
      list[idx] = pos;
      this.addLog('UPDATE', 'SYSTEM', pos.posyandu_id, `Data posyandu ${pos.nama_posyandu} diperbarui`, 'SUCCESS');
    } else {
      const newPos = {
        ...pos,
        posyandu_id: pos.posyandu_id || `POS-${Date.now().toString().slice(-4)}`
      };
      list.push(newPos);
      this.addLog('CREATE', 'SYSTEM', newPos.posyandu_id, `Posyandu baru ${newPos.nama_posyandu} ditambahkan`, 'SUCCESS');
    }
    localStorage.setItem(STORAGE_KEYS.POSYANDU, JSON.stringify(list));
  }

  public deletePosyandu(id: string) {
    const list = this.getPosyanduList().filter(p => p.posyandu_id !== id);
    localStorage.setItem(STORAGE_KEYS.POSYANDU, JSON.stringify(list));
    this.addLog('CANCEL', 'SYSTEM', id, `Posyandu ${id} dihapus dari master data`, 'WARNING');
  }

  // ==========================================
  // --- MASTER USER LINTAS SEKTOR ---
  // ==========================================
  public getUserLintasSektorList(kelurahanId?: string): UserLintasSektor[] {
    const list = this.getSafeArray<UserLintasSektor>(STORAGE_KEYS.USER_LINTAS_SEKTOR, INITIAL_USER_LINTAS_SEKTOR);
    const sanitized = list.map(u => ({
      ...u,
      user_id: u.user_id || `ULS-${Math.floor(100 + Math.random() * 900)}`,
      nama: u.nama || 'Petugas Lintas Sektor',
      jabatan: u.jabatan || 'Koordinator Lintas Sektor',
      instansi_sektor: u.instansi_sektor || 'Instansi Terkait',
      kelurahan_id: u.kelurahan_id || 'ALL',
      kelurahan_nama: u.kelurahan_nama || 'Kecamatan / Semua Wilayah',
      no_wa: u.no_wa || '6281234567890',
      email: u.email || '',
      status_notifikasi_wa: u.status_notifikasi_wa ?? true,
      status_aktif: u.status_aktif ?? true
    }));
    if (kelurahanId && kelurahanId !== 'ALL') {
      return sanitized.filter(u => u.kelurahan_id === kelurahanId || u.kelurahan_id === 'ALL');
    }
    return sanitized;
  }

  public saveUserLintasSektor(user: UserLintasSektor) {
    const list = this.getUserLintasSektorList();
    const idx = list.findIndex(u => u.user_id === user.user_id);
    if (idx >= 0) {
      list[idx] = user;
      this.addLog('UPDATE', 'LINTAS_SEKTOR', user.user_id, `Kontak lintas sektor ${user.nama} diperbarui`, 'SUCCESS');
    } else {
      const newUser = {
        ...user,
        user_id: user.user_id || `ULS-${Date.now().toString().slice(-4)}`
      };
      list.push(newUser);
      this.addLog('CREATE', 'LINTAS_SEKTOR', newUser.user_id, `Kontak lintas sektor baru ${newUser.nama} ditambahkan`, 'SUCCESS');
    }
    localStorage.setItem(STORAGE_KEYS.USER_LINTAS_SEKTOR, JSON.stringify(list));
  }

  public deleteUserLintasSektor(id: string) {
    const list = this.getUserLintasSektorList().filter(u => u.user_id !== id);
    localStorage.setItem(STORAGE_KEYS.USER_LINTAS_SEKTOR, JSON.stringify(list));
    this.addLog('CANCEL', 'LINTAS_SEKTOR', id, `Kontak lintas sektor ${id} dihapus`, 'WARNING');
  }

  // =========================================================
  // --- INPUT LAPORAN POSYANDU & TRIGGER NOTIFIKASI WA ---
  // =========================================================
  public getLaporanPosyanduList(filter?: { kelurahan_id?: string; posyandu_id?: string; bulan?: string; tahun?: string }): LaporanPosyandu[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LAPORAN_POSYANDU);
    let list: LaporanPosyandu[] = raw ? JSON.parse(raw) : INITIAL_LAPORAN_POSYANDU;
    
    if (filter) {
      if (filter.kelurahan_id && filter.kelurahan_id !== 'ALL') {
        list = list.filter(l => l.kelurahan_id === filter.kelurahan_id);
      }
      if (filter.posyandu_id && filter.posyandu_id !== 'ALL') {
        list = list.filter(l => l.posyandu_id === filter.posyandu_id);
      }
      if (filter.bulan && filter.bulan !== 'ALL') {
        list = list.filter(l => l.bulan === filter.bulan);
      }
      if (filter.tahun && filter.tahun !== 'ALL') {
        list = list.filter(l => l.tahun === filter.tahun);
      }
    }
    return list;
  }

  /**
   * Menyimpan Laporan Posyandu.
   * Jika ada bayi kurang gizi yang diinput:
   * 1. Otomatis masuk ke Daftar Sasaran Balita & Daftar Tindak Lanjut!
   * 2. Otomatis memicu notifikasi WhatsApp ke seluruh Lintas Sektor dan akun terkait!
   */
  public saveLaporanPosyandu(laporan: LaporanPosyandu): {
    savedLaporan: LaporanPosyandu;
    createdTindakLanjut: TindakLanjut[];
    createdNotifications: WhatsAppNotification[];
  } {
    const list = this.getLaporanPosyanduList();
    const isNew = !laporan.laporan_id || !list.some(l => l.laporan_id === laporan.laporan_id);
    
    const savedLaporan: LaporanPosyandu = {
      ...laporan,
      laporan_id: laporan.laporan_id || `LAP-POS-${Date.now().toString().slice(-6)}`,
      created_at: laporan.created_at || this.getTodayFormatted(),
      status_notifikasi_wa: 'TERKIRIM'
    };

    if (isNew) {
      list.unshift(savedLaporan);
    } else {
      const idx = list.findIndex(l => l.laporan_id === savedLaporan.laporan_id);
      list[idx] = savedLaporan;
    }
    localStorage.setItem(STORAGE_KEYS.LAPORAN_POSYANDU, JSON.stringify(list));

    const createdTindakLanjut: TindakLanjut[] = [];
    const createdNotifications: WhatsAppNotification[] = [];

    // Jika ada balita kurang gizi / bermasalah gizi yang dilaporkan:
    if (savedLaporan.daftar_balita_kurang_gizi && savedLaporan.daftar_balita_kurang_gizi.length > 0) {
      const posyandu = this.getPosyanduById(savedLaporan.posyandu_id);
      const pulauId = posyandu?.pulau_id || 'PULAU-01';

      savedLaporan.daftar_balita_kurang_gizi.forEach((balita, bIdx) => {
        // 1. Tambah / Registrasi Sasaran Balita jika belum ada
        const kodeSasaran = `BLT-${savedLaporan.kelurahan_id.slice(-2)}-${Math.floor(100 + Math.random() * 900)}`;
        const sasaranId = `SAS-${Date.now().toString().slice(-5)}-${bIdx + 1}`;
        
        const newSasaran: SasaranBalita = {
          sasaran_id: sasaranId,
          kode_sasaran: kodeSasaran,
          inisial: balita.nama_balita,
          tanggal_lahir: balita.tanggal_lahir,
          jenis_kelamin: balita.jenis_kelamin,
          pulau_id: pulauId,
          unit_pelayanan: `Puskesmas Kepulauan Seribu Selatan (${savedLaporan.posyandu_nama})`,
          tanggal_registrasi: this.getTodayFormatted(),
          status_aktif: true,
          kategori_masalah_terakhir: balita.status_gizi,
          bb_terakhir: balita.berat_badan,
          tb_terakhir: balita.tinggi_badan,
          tanggal_pantau_terakhir: this.getTodayFormatted()
        };
        this.saveSasaran(newSasaran);

        // 2. Otomatis masukkan ke DAFTAR TINDAK LANJUT dengan prioritas Tinggi
        const tenggatDate = new Date();
        tenggatDate.setDate(tenggatDate.getDate() + 7); // Tenggat 7 hari kerja
        const tenggatStr = `${String(tenggatDate.getDate()).padStart(2, '0')}/${String(tenggatDate.getMonth() + 1).padStart(2, '0')}/${tenggatDate.getFullYear()}`;

        const newTL: TindakLanjut = {
          tindak_lanjut_id: `TL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          sasaran_id: sasaranId,
          kategori: `Penanganan ${balita.status_gizi} - Laporan ${savedLaporan.posyandu_nama}`,
          rencana_intervensi: balita.rencana_tindak_lanjut || `Pemberian PMT Pemulihan, kunjungan rumah terintegrasi bersama TPK/PKK, dan rujukan nakes Puskesmas.`,
          tanggal_rencana: this.getTodayFormatted(),
          tenggat: tenggatStr,
          petugas_id: 'USR-003', // Tenaga Gizi PJ
          status: 'Belum ditindaklanjuti',
          prioritas: 'Tinggi',
          is_from_posyandu: true,
          posyandu_nama: savedLaporan.posyandu_nama,
          kelurahan_nama: savedLaporan.kelurahan_nama,
          tindak_lanjut_lintas_sektor: [],
          catatan: `Ditemukan pada penimbangan ${savedLaporan.posyandu_nama} tanggal ${savedLaporan.tanggal_pelaksanaan}. Usia: ${balita.usia_bulan} bln, BB: ${balita.berat_badan}kg, TB: ${balita.tinggi_badan}cm. Kondisi: ${balita.catatan_kondisi}. Ortu: ${balita.nama_ortu} (${balita.no_wa_ortu || '-'}).`,
          created_at: this.getTodayFormatted(),
          updated_at: this.getTodayFormatted()
        };
        this.saveTindakLanjut(newTL);
        createdTindakLanjut.push(newTL);
      });

      // 3. Trigger Notifikasi WhatsApp Lintas Sektor
      const lintasSektorRecipients = this.getUserLintasSektorList();
      const relevantRecipients = lintasSektorRecipients.filter(u => 
        u.status_notifikasi_wa && (u.kelurahan_id === savedLaporan.kelurahan_id || u.kelurahan_id === 'ALL')
      );

      const balitaTextList = savedLaporan.daftar_balita_kurang_gizi.map((b, i) => 
        `${i + 1}. *${b.nama_balita}* (Usia ${b.usia_bulan} bln, JK: ${b.jenis_kelamin})\n` +
        `   • NIK: ${b.nik || '-'}\n` +
        `   • Ortu: ${b.nama_ortu} (${b.no_wa_ortu || '-'})\n` +
        `   • BB: *${b.berat_badan} kg* | TB: *${b.tinggi_badan} cm* | LiLA: *${b.lila || '-'} cm*\n` +
        `   • Status Gizi: *${b.status_gizi}*\n` +
        `   • Rencana: ${b.rencana_tindak_lanjut}`
      ).join('\n\n');

      relevantRecipients.forEach(r => {
        const phone = r.no_wa.replace(/\D/g, '') || '6281299887711';
        const msgText = 
          `🚨 *PERINGATAN GIZI BALITA - DERMAGA GIZI*\n` +
          `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
          `Yth. *${r.nama}*\n` +
          `Jabatan: *${r.jabatan}* (${r.instansi_sektor})\n\n` +
          `Telah masuk laporan kegiatan penimbangan Posyandu:\n` +
          `📍 *Posyandu*: ${savedLaporan.posyandu_nama}\n` +
          `🏛️ *Kelurahan*: ${savedLaporan.kelurahan_nama}\n` +
          `📅 *Tanggal Pelaksanaan*: ${savedLaporan.tanggal_pelaksanaan}\n` +
          `📊 *Cakupan*: Ditimbang ${savedLaporan.total_ditimbang} dari ${savedLaporan.total_sasaran} sasaran (${savedLaporan.persentase_d_s.toFixed(1)}%)\n\n` +
          `⚠️ *DITEMUKAN BALITA BERMASALAH GIZI UNTUK SEGERA DITINDAKLANJUTI*:\n\n` +
          `${balitaTextList}\n\n` +
          `Mohon koordinasi segera seluruh unsur lintas sektor (Lurah, PKK, TPK, Bidan Desa, Puskesmas, dan Kader) untuk pendampingan dan penanganan di lapangan.\n\n` +
          `🔗 *Buka Aplikasi:* ${this.getAppUrl()}\n\n` +
          `_Sistem Terpadu DERMAGA GIZI - Puskesmas Kepulauan Seribu Selatan_`;

        const notif: WhatsAppNotification = {
          notif_id: `WA-POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
          penerima_nama: r.nama,
          penerima_role: `${r.jabatan} (${r.instansi_sektor})`,
          penerima_wa: phone,
          kategori: 'LAPORAN_GIZI_POSYANDU',
          judul: `Temuan Masalah Gizi di ${savedLaporan.posyandu_nama}`,
          pesan: msgText,
          status: 'TERKIRIM',
          link_wa: `https://wa.me/${phone}?text=${encodeURIComponent(msgText)}`
        };

        this.addWhatsAppNotif(notif);
        createdNotifications.push(notif);
      });
    }

    this.addLog(
      'CREATE', 
      'PEMANTAUAN', 
      savedLaporan.laporan_id, 
      `Laporan Posyandu ${savedLaporan.posyandu_nama} disimpan. Sasaran: ${savedLaporan.total_sasaran}, Ditimbang: ${savedLaporan.total_ditimbang}, Temuan Gizi: ${savedLaporan.daftar_balita_kurang_gizi.length}`, 
      savedLaporan.daftar_balita_kurang_gizi.length > 0 ? 'WARNING' : 'SUCCESS'
    );

    return { savedLaporan, createdTindakLanjut, createdNotifications };
  }

  // ==========================================
  // --- LAPORAN EVALUASI (KELURAHAN & POSYANDU) ---
  // ==========================================

  /**
   * Rekapitulasi Laporan Evaluasi Berdasarkan Kelurahan
   */
  public getEvaluasiKelurahanReport(tahun = '2026', bulan = 'ALL'): EvaluasiKelurahanItem[] {
    const kelurahanList = this.getKelurahanList();
    const posyanduList = this.getPosyanduList();
    const laporanList = this.getLaporanPosyanduList({ tahun, bulan: bulan !== 'ALL' ? bulan : undefined });
    const tlList = this.getTindakLanjutList();

    return kelurahanList.map(kel => {
      const posyanduInKel = posyanduList.filter(p => p.kelurahan_id === kel.kelurahan_id);
      const totalPosyandu = posyanduInKel.length;
      const totalSasaran = posyanduInKel.reduce((acc, p) => acc + p.total_sasaran, 0);

      // Cari laporan terbaru dari masing-masing posyandu
      let totalDitimbang = 0;
      let totalTidakHadir = 0;
      let giziBaik = 0;
      let giziKurang = 0;
      let giziBuruk = 0;
      let stunting = 0;
      let underweight = 0;

      posyanduInKel.forEach(pos => {
        const lap = laporanList.find(l => l.posyandu_id === pos.posyandu_id);
        if (lap) {
          totalDitimbang += lap.total_ditimbang;
          totalTidakHadir += lap.total_tidak_hadir;
          
          lap.daftar_balita_kurang_gizi.forEach(b => {
            if (b.status_gizi.includes('Buruk')) giziBuruk++;
            else if (b.status_gizi.includes('Kurang') || b.status_gizi.includes('Wasting')) giziKurang++;
            else if (b.status_gizi.includes('Stunting')) stunting++;
            else if (b.status_gizi.includes('Underweight')) underweight++;
          });
        } else {
          // Estimasi jika belum ada laporan bulan berjalan
          const estimasiD = Math.round(pos.total_sasaran * 0.85);
          totalDitimbang += estimasiD;
          totalTidakHadir += (pos.total_sasaran - estimasiD);
        }
      });

      const totalMasalah = giziKurang + giziBuruk + stunting + underweight;
      giziBaik = Math.max(0, totalDitimbang - totalMasalah);
      const persentaseDS = totalSasaran > 0 ? (totalDitimbang / totalSasaran) * 100 : 0;

      // Evaluasi tindak lanjut
      const tlInKel = tlList.filter(t => {
        const sasaran = this.getSasaranById(t.sasaran_id);
        if (!sasaran) return false;
        if (kel.kelurahan_id === 'KEL-01') return sasaran.pulau_id === 'PULAU-01';
        if (kel.kelurahan_id === 'KEL-02') return sasaran.pulau_id === 'PULAU-02' || sasaran.pulau_id === 'PULAU-03';
        if (kel.kelurahan_id === 'KEL-03') return sasaran.pulau_id === 'PULAU-04';
        return false;
      });

      const tlSelesai = tlInKel.filter(t => t.status === 'Selesai').length;
      const tlProses = tlInKel.filter(t => t.status === 'Dalam proses').length;
      const tlBelum = tlInKel.filter(t => t.status === 'Belum ditindaklanjuti').length;
      const persenTLSelesai = tlInKel.length > 0 ? (tlSelesai / tlInKel.length) * 100 : 80.0;

      return {
        kelurahan_id: kel.kelurahan_id,
        nama_kelurahan: kel.nama_kelurahan,
        total_posyandu: totalPosyandu,
        total_sasaran: totalSasaran,
        total_ditimbang: totalDitimbang,
        total_tidak_hadir: totalTidakHadir,
        persentase_d_s: Math.round(persentaseDS * 10) / 10,
        gizi_baik: giziBaik,
        gizi_kurang: giziKurang,
        gizi_buruk: giziBuruk,
        stunting: stunting,
        underweight: underweight,
        total_masalah_gizi: totalMasalah,
        tindak_lanjut_selesai: tlSelesai,
        tindak_lanjut_proses: tlProses,
        tindak_lanjut_belum: tlBelum,
        persentase_tl_selesai: Math.round(persenTLSelesai * 10) / 10
      };
    });
  }

  /**
   * Rekapitulasi Laporan Evaluasi Berdasarkan Posyandu
   */
  public getEvaluasiPosyanduReport(filter?: { kelurahan_id?: string; bulan?: string; tahun?: string }): EvaluasiPosyanduItem[] {
    const posyanduList = this.getPosyanduList(filter?.kelurahan_id);
    const laporanList = this.getLaporanPosyanduList({
      kelurahan_id: filter?.kelurahan_id,
      bulan: filter?.bulan !== 'ALL' ? filter?.bulan : undefined,
      tahun: filter?.tahun !== 'ALL' ? filter?.tahun : undefined
    });
    const tlList = this.getTindakLanjutList();

    return posyanduList.map(pos => {
      const lap = laporanList.find(l => l.posyandu_id === pos.posyandu_id);

      let totalDitimbang = 0;
      let totalTidakHadir = 0;
      let giziBaik = 0;
      let giziKurang = 0;
      let giziBuruk = 0;
      let stunting = 0;
      let underweight = 0;
      let statusPelaksanaan: 'Sudah Lapor' | 'Belum Lapor' = 'Belum Lapor';

      if (lap) {
        statusPelaksanaan = 'Sudah Lapor';
        totalDitimbang = lap.total_ditimbang;
        totalTidakHadir = lap.total_tidak_hadir;

        lap.daftar_balita_kurang_gizi.forEach(b => {
          if (b.status_gizi.includes('Buruk')) giziBuruk++;
          else if (b.status_gizi.includes('Kurang') || b.status_gizi.includes('Wasting')) giziKurang++;
          else if (b.status_gizi.includes('Stunting')) stunting++;
          else if (b.status_gizi.includes('Underweight')) underweight++;
        });
      } else {
        // Data default atau estimasi
        totalDitimbang = Math.round(pos.total_sasaran * 0.84);
        totalTidakHadir = pos.total_sasaran - totalDitimbang;
      }

      const totalMasalah = giziKurang + giziBuruk + stunting + underweight;
      giziBaik = Math.max(0, totalDitimbang - totalMasalah);
      const persentaseDS = pos.total_sasaran > 0 ? (totalDitimbang / pos.total_sasaran) * 100 : 0;

      // Tindak lanjut terkait posyandu
      const tlPos = tlList.filter(t => t.catatan.includes(pos.nama_posyandu) || t.kategori.includes(pos.nama_posyandu));
      const tlSelesai = tlPos.filter(t => t.status === 'Selesai').length;
      const tlProses = tlPos.filter(t => t.status === 'Dalam proses').length;
      const tlBelum = tlPos.filter(t => t.status === 'Belum ditindaklanjuti').length;

      return {
        posyandu_id: pos.posyandu_id,
        nama_posyandu: pos.nama_posyandu,
        kelurahan_id: pos.kelurahan_id,
        kelurahan_nama: pos.kelurahan_nama,
        pulau_nama: pos.pulau_nama,
        total_sasaran: pos.total_sasaran,
        total_ditimbang: totalDitimbang,
        total_tidak_hadir: totalTidakHadir,
        persentase_d_s: Math.round(persentaseDS * 10) / 10,
        gizi_baik: giziBaik,
        gizi_kurang: giziKurang,
        gizi_buruk: giziBuruk,
        stunting: stunting,
        underweight: underweight,
        total_masalah_gizi: totalMasalah,
        tindak_lanjut_selesai: tlSelesai || (totalMasalah > 0 ? 1 : 0),
        tindak_lanjut_proses: tlProses,
        tindak_lanjut_belum: tlBelum,
        ketua_kader: pos.ketua_kader,
        no_wa_kader: pos.no_wa_kader,
        status_pelaksanaan: statusPelaksanaan
      };
    });
  }

  /**
   * Mencatat tindak lanjut yang sudah dilakukan oleh unit lintas sektor
   * serta otomatis mengirim notifikasi WhatsApp konfirmasi ke unit terkait dan pemangku kepentingan
   */
  addTindakLanjutLintasSektor(
    tindakLanjutId: string, 
    aksiItem: Omit<TindakLanjutLintasSektor, 'id' | 'created_at'>,
    sendNotification: boolean = true,
    isPetugasGizi: boolean = false
  ): { updatedTL: TindakLanjut | null; notifications: WhatsAppNotification[] } {
    const list = this.getTindakLanjutList({ pulau_id: 'ALL', tahun: 'ALL', bulan: 'ALL' });
    const idx = list.findIndex(item => item.tindak_lanjut_id === tindakLanjutId);
    if (idx === -1) return { updatedTL: null, notifications: [] };

    const targetTL = { ...list[idx] };
    const newAksi: TindakLanjutLintasSektor = {
      ...aksiItem,
      id: `TLLS-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      notifikasi_terkirim: sendNotification,
      created_at: this.getTodayFormatted()
    };

    targetTL.tindak_lanjut_lintas_sektor = [
      ...(targetTL.tindak_lanjut_lintas_sektor || []),
      newAksi
    ];

    // Jika ada foto di aksi, simpan referensi foto terakhir ke data utama
    if (newAksi.foto_dokumen) {
      targetTL.foto_dokumen = newAksi.foto_dokumen;
      targetTL.foto_nama = newAksi.foto_nama;
    }

    // Perbarui status umum tindak lanjut berdasarkan hasil aksi lintas sektor:
    // HANYA Petugas Kesehatan Gizi (TENAGA_GIZI / Nakes Gizi) yang berhak menyelesaikan status kasus balita menjadi 'Selesai'
    if (aksiItem.status_hasil === 'Selesai') {
      if (isPetugasGizi) {
        targetTL.status = 'Selesai';
        targetTL.tanggal_selesai = aksiItem.tanggal_pelaksanaan;
      } else {
        // Jika bukan petugas gizi, aksi sektor tercatat selesai, namun status kasus balita tetap 'Dalam proses' menunggu verifikasi petugas gizi
        if (targetTL.status !== 'Selesai') {
          targetTL.status = 'Dalam proses';
        }
      }
    } else if (aksiItem.status_hasil === 'Dalam proses') {
      if (targetTL.status !== 'Selesai') {
        targetTL.status = 'Dalam proses';
      }
    } else if (aksiItem.status_hasil === 'Perlu evaluasi ulang') {
      targetTL.status = 'Perlu evaluasi ulang';
    }
    targetTL.updated_at = this.getTodayFormatted();
    list[idx] = targetTL;
    this.safeSetItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(list));

    const sasaran = this.getSasaranById(targetTL.sasaran_id);
    const notifications: WhatsAppNotification[] = [];

    if (sendNotification) {
      // Ambil penerima lintas sektor
      const allLintas = this.getUserLintasSektorList();
      // Unit pelaksana spesifik + Lurah + Camat + Dokter/Nutrisionis
      const targets = allLintas.filter(u => 
        u.status_notifikasi_wa && (
          u.instansi_sektor.toLowerCase().includes(aksiItem.nama_unit.toLowerCase()) ||
          u.jabatan.toLowerCase().includes('lurah') ||
          u.jabatan.toLowerCase().includes('camat') ||
          u.instansi_sektor.toLowerCase().includes('puskesmas') ||
          u.instansi_sektor.toLowerCase().includes('pkk')
        )
      );

      const balitaName = sasaran ? `${sasaran.kode_sasaran} (${sasaran.inisial})` : 'Balita Binaan Posyandu';
      const fotoNote = newAksi.foto_dokumen ? `📷 *Foto/Dokumen Bukti:* Terlampir di Aplikasi\n` : '';
      const pesan = 
        `✅ *UPDATE TINDAK LANJUT LINTAS SEKTOR - DERMAGA GIZI*\n` +
        `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
        `Laporan Aksi Penanganan Permasalahan Gizi Balita:\n` +
        `👶 *Sasaran*: ${balitaName}\n` +
        `📋 *Masalah/Kategori*: ${targetTL.kategori}\n\n` +
        `🏛️ *Unit Lintas Sektor*: *${aksiItem.nama_unit}*\n` +
        `👤 *Petugas/Penanggung Jawab*: *${aksiItem.nama_petugas}*\n` +
        `📅 *Tanggal Pelaksanaan*: ${aksiItem.tanggal_pelaksanaan}\n` +
        `⚡ *Aksi Nyata*: ${aksiItem.aksi_intervensi}\n` +
        `📊 *Status Hasil*: *${aksiItem.status_hasil}*\n` +
        `📝 *Catatan Evaluasi*: ${aksiItem.catatan_evaluasi}\n` +
        fotoNote +
        `\n🔗 *Buka Aplikasi:* ${this.getAppUrl()}\n\n` +
        `_Terima kasih atas kolaborasi dan sinergi lintas sektor demi masa depan anak-anak sehat bebas stunting di Kepulauan Seribu Selatan._`;

      targets.forEach(t => {
        const phone = t.no_wa.replace(/\D/g, '') || '6281299887711';
        const notif: WhatsAppNotification = {
          notif_id: `NOTIF-TL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
          penerima_nama: t.nama,
          penerima_role: `${t.jabatan} (${t.instansi_sektor})`,
          penerima_wa: phone,
          kategori: 'LAPORAN_GIZI_POSYANDU',
          judul: `✅ Konfirmasi Tindak Lanjut: ${balitaName}`,
          pesan: pesan,
          status: 'TERKIRIM',
          link_wa: `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`
        };
        notifications.push(notif);
        this.addWhatsAppNotif(notif);
      });

      this.addLog(
        'UPDATE', 
        'TINDAK_LANJUT', 
        targetTL.tindak_lanjut_id, 
        `Aksi tindak lanjut lintas sektor dicatat oleh ${aksiItem.nama_unit} (${aksiItem.nama_petugas}) untuk ${balitaName}`, 
        'SUCCESS'
      );
    }

    return { updatedTL: targetTL, notifications };
  }

  private getTodayFormatted(): string {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${day}/${mon}/${yr}`;
  }
}

export const storageService = new StorageService();

