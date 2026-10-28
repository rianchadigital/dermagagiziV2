/**
 * API Service for DERMAGA GIZI
 * Integrates directly with Google Apps Script Web App Backend & Google Spreadsheet
 * Synchronizes directly with the remote database (Clean Database Mode, Focus on Spreadsheet)
 */

import { storageService } from './storageService';
import { 
  ApiResponse, 
  SasaranBalita, 
  TindakLanjut, 
  Kendala, 
  KegiatanLintasSektor,
  Posyandu,
  Kelurahan,
  User,
  UserLintasSektor,
  TindakLanjutLintasSektor,
  WhatsAppNotification
} from '../types';

export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbws8A6yMS1C7rCCs5afT0skv53UzH3qBpxrWwUvHmoyRQK0MDu9MmbJDpkEMHEmeQKt/exec';

class ApiService {
  private isPolling = false;

  public getBaseUrl(): string {
    return storageService.getGasUrl() || DEFAULT_GAS_URL;
  }

  public isConnected(): boolean {
    const url = this.getBaseUrl();
    return !!(url && url.startsWith('https://script.google.com/'));
  }

  /**
   * Helper pengiriman POST ke Web App Google Apps Script
   * Menggunakan text/plain agar tidak memicu CORS Preflight OPTIONS blocking
   */
  private async postToGas(action: string, data: any): Promise<boolean> {
    const targetUrl = this.getBaseUrl();
    if (!targetUrl || !targetUrl.startsWith('https://script.google.com/')) {
      return false;
    }

    try {
      const payload = {
        action,
        data,
        user: storageService.getCurrentUser(),
        timestamp: new Date().toISOString()
      };

      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      // Jadwalkan polling setelah Google Apps Script selesai menulis ke spreadsheet
      setTimeout(() => this.fetchDatabaseData(), 2000);
      return true;
    } catch (e) {
      console.warn(`[ApiService] Gagal POST "${action}" ke Google Apps Script:`, e);
      return false;
    }
  }

  /**
   * Menguji koneksi Web App Google Apps Script
   */
  public async testConnection(url?: string): Promise<{ success: boolean; message: string; latencyMs?: number; details?: any }> {
    const targetUrl = (url || this.getBaseUrl()).trim();
    if (!targetUrl) {
      return {
        success: false,
        message: 'URL Google Apps Script belum dikonfigurasi.'
      };
    }

    if (!targetUrl.startsWith('https://script.google.com/')) {
      return {
        success: false,
        message: 'Format URL tidak valid. URL Web App Google Apps Script harus diawali dengan https://script.google.com/'
      };
    }

    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          success: false,
          message: `Server merespons dengan HTTP Status ${response.status} (${response.statusText}). Pastikan deployment 'Who has access' diatur ke 'Anyone'.`,
          latencyMs
        };
      }

      const json = await response.json();
      if (json && json.success) {
        // Ambil data awal dari database jika terkoneksi
        this.fetchDatabaseData();
        return {
          success: true,
          message: 'Koneksi berhasil! Database Google Spreadsheet aktif dan tersinkronisasi.',
          latencyMs,
          details: json.data
        };
      }

      return {
        success: false,
        message: json.message || 'Menerima respons tidak valid dari Google Apps Script.',
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        message: `Gagal terhubung ke Google Apps Script: ${err.message || 'Jaringan atau CORS'}. Pastikan akses diatur ke 'Anyone'.`,
        latencyMs
      };
    }
  }

  /**
   * Sinkronisasi data utama dari Google Spreadsheet Database (Remote) ke Aplikasi
   * Dipanggil secara periodik atau setelah transaksi simpan/hapus
   */
  public async fetchDatabaseData(): Promise<boolean> {
    if (!this.isConnected() || this.isPolling) return false;
    this.isPolling = true;

    try {
      const targetUrl = this.getBaseUrl();
      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=getAllData&_t=${Date.now()}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json && json.success && json.data) {
          const changed = storageService.syncFromGas(json.data);
          this.isPolling = false;
          return changed;
        }
      }
    } catch (err) {
      // Quiet catch
    } finally {
      this.isPolling = false;
    }

    return false;
  }

  /**
   * Menjalankan fungsi setupDatabase() otomatis di Google Spreadsheet via Web App
   */
  public async setupDatabase(url?: string): Promise<ApiResponse> {
    const targetUrl = (url || this.getBaseUrl()).trim();
    if (!targetUrl) {
      return {
        success: false,
        message: 'URL Web App belum diisi. Masukkan URL Web App Google Apps Script terlebih dahulu.',
        data: null
      };
    }

    try {
      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=setupDatabase&_t=${Date.now()}`;
      const res = await fetch(endpoint, { method: 'GET' });
      const json = await res.json();
      if (json && json.success) {
        setTimeout(() => this.fetchDatabaseData(), 1000);
      }
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menjalankan setupDatabase: ${err.message}`,
        data: null
      };
    }
  }

  /**
   * Membersihkan semua baris data di spreadsheet (menyisakan baris header)
   */
  public async clearAllData(url?: string): Promise<ApiResponse> {
    const targetUrl = (url || this.getBaseUrl()).trim();
    if (!targetUrl) {
      return {
        success: false,
        message: 'URL Web App belum diisi. Masukkan URL Web App Google Apps Script terlebih dahulu.',
        data: null
      };
    }

    try {
      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=clearAllData&_t=${Date.now()}`;
      const res = await fetch(endpoint, { method: 'GET' });
      const json = await res.json();
      if (json && json.success) {
        storageService.cleanDummyData(true);
        setTimeout(() => this.fetchDatabaseData(), 800);
      }
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal membersihkan data baris spreadsheet: ${err.message}`,
        data: null
      };
    }
  }

  public async clearAllDatabaseRows(url?: string): Promise<ApiResponse> {
    return this.clearAllData(url);
  }

  /**
   * Menguji Pengiriman Pesan WhatsApp melalui Gateway Google Apps Script
   */
  public async testWhatsAppApi(phone: string, url?: string): Promise<ApiResponse> {
    const targetUrl = (url || this.getBaseUrl()).trim();
    if (!targetUrl) {
      return {
        success: false,
        message: 'URL Google Apps Script belum dikonfigurasi.',
        data: null
      };
    }

    try {
      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=testWA&phone=${encodeURIComponent(phone)}&_t=${Date.now()}`;
      const res = await fetch(endpoint, { method: 'GET' });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menguji WhatsApp API: ${err.message}`,
        data: null
      };
    }
  }

  /**
   * Mengirim Pesan WhatsApp Langsung melalui Apps Script Backend
   */
  public async sendWhatsAppViaBackend(phone: string, message: string): Promise<ApiResponse> {
    if (!this.isConnected()) {
      return {
        success: false,
        message: 'Aplikasi belum terhubung ke Google Apps Script Web App.',
        data: null
      };
    }

    try {
      const res = await fetch(this.getBaseUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sendWhatsApp',
          data: { phone, message }
        })
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal mengirim WhatsApp: ${err.message}`,
        data: null
      };
    }
  }

  /**
   * Menyimpan Konfigurasi ke Sheet KONFIGURASI
   */
  public async saveConfig(key: string, value: string, deskripsi: string = ''): Promise<ApiResponse> {
    if (!this.isConnected()) {
      return { success: false, message: 'Belum terhubung ke Google Apps Script', data: null };
    }

    try {
      await this.postToGas('saveConfig', { key, value, deskripsi });
      return { success: true, message: `Konfigurasi ${key} berhasil disimpan.`, data: { key, value } };
    } catch (e: any) {
      return { success: false, message: e.message, data: null };
    }
  }

  // ==========================================
  // --- CRUD SASARAN BALITA ---
  // ==========================================
  public async saveSasaran(sasaran: SasaranBalita): Promise<SasaranBalita> {
    const saved = storageService.saveSasaran(sasaran);
    storageService.notifyNewSasaran(saved);
    await this.postToGas(sasaran.sasaran_id ? 'updateSasaran' : 'createSasaran', saved);
    return saved;
  }

  public async createSasaran(sasaran: SasaranBalita): Promise<SasaranBalita> {
    return this.saveSasaran(sasaran);
  }

  public async deleteSasaran(id: string): Promise<boolean> {
    const success = storageService.deleteSasaran(id);
    await this.postToGas('deleteSasaran', { sasaran_id: id });
    return success;
  }

  public async importSasaranBatch(items: Partial<SasaranBalita>[]): Promise<{ count: number; imported: SasaranBalita[] }> {
    const result = storageService.importSasaranBatch(items);
    await this.postToGas('importSasaranBatch', result.imported);
    return result;
  }

  // ==========================================
  // --- CRUD TINDAK LANJUT ---
  // ==========================================
  public async saveTindakLanjut(tl: TindakLanjut, isNew: boolean = false): Promise<TindakLanjut> {
    const saved = storageService.saveTindakLanjut(tl);
    storageService.notifyTindakLanjut(saved, isNew);
    await this.postToGas(tl.tindak_lanjut_id && !isNew ? 'updateTindakLanjut' : 'createTindakLanjut', saved);
    return saved;
  }

  public async deleteTindakLanjut(id: string): Promise<boolean> {
    const success = storageService.deleteTindakLanjut(id);
    await this.postToGas('deleteTindakLanjut', { tindak_lanjut_id: id });
    return success;
  }

  public async addTindakLanjutLintasSektor(
    tindakLanjutId: string, 
    aksiItem: Omit<TindakLanjutLintasSektor, 'id' | 'created_at'>,
    sendNotification: boolean = true,
    isPetugasGizi: boolean = false
  ): Promise<{ updatedTL: TindakLanjut | null; notifications: WhatsAppNotification[] }> {
    const result = storageService.addTindakLanjutLintasSektor(tindakLanjutId, aksiItem, sendNotification, isPetugasGizi);
    if (result.updatedTL) {
      await this.postToGas('updateTindakLanjut', result.updatedTL);
    }
    return result;
  }

  // ==========================================
  // --- CRUD KENDALA ---
  // ==========================================
  public async saveKendala(k: Kendala): Promise<Kendala> {
    const saved = storageService.saveKendala(k);
    await this.postToGas(k.kendala_id ? 'updateKendala' : 'createKendala', saved);
    return saved;
  }

  public async deleteKendala(id: string): Promise<boolean> {
    const success = storageService.deleteKendala(id);
    await this.postToGas('deleteKendala', { kendala_id: id });
    return success;
  }

  // ==========================================
  // --- CRUD LINTAS SEKTOR ---
  // ==========================================
  public async saveLintasSektor(ls: KegiatanLintasSektor): Promise<KegiatanLintasSektor> {
    const saved = storageService.saveLintasSektor(ls);
    await this.postToGas(ls.kegiatan_id ? 'updateLintasSektor' : 'createLintasSektor', saved);
    return saved;
  }

  public async deleteLintasSektor(id: string): Promise<boolean> {
    const success = storageService.deleteLintasSektor(id);
    await this.postToGas('deleteLintasSektor', { kegiatan_id: id });
    return success;
  }

  // ==========================================
  // --- MASTER POSYANDU & KELURAHAN ---
  // ==========================================
  public async savePosyandu(pos: Posyandu): Promise<Posyandu> {
    storageService.savePosyandu(pos);
    await this.postToGas(pos.posyandu_id ? 'updatePosyandu' : 'createPosyandu', pos);
    return pos;
  }

  public async deletePosyandu(id: string): Promise<boolean> {
    storageService.deletePosyandu(id);
    await this.postToGas('deletePosyandu', { posyandu_id: id });
    return true;
  }

  public async saveKelurahan(kel: Kelurahan): Promise<Kelurahan> {
    storageService.saveKelurahan(kel);
    await this.postToGas(kel.kelurahan_id ? 'updateKelurahan' : 'createKelurahan', kel);
    return kel;
  }

  // ==========================================
  // --- MASTER USER LINTAS SEKTOR ---
  // ==========================================
  public async saveUserLintasSektor(u: UserLintasSektor): Promise<UserLintasSektor> {
    storageService.saveUserLintasSektor(u);
    await this.postToGas(u.user_id ? 'updateUserLintasSektor' : 'createUserLintasSektor', u);
    return u;
  }

  public async deleteUserLintasSektor(id: string): Promise<boolean> {
    storageService.deleteUserLintasSektor(id);
    await this.postToGas('deleteUserLintasSektor', { user_id: id });
    return true;
  }

  // ==========================================
  // --- MANAJEMEN USER SISTEM ---
  // ==========================================
  public async saveUser(user: User): Promise<User> {
    storageService.saveUser(user);
    await this.postToGas(user.user_id ? 'updateUser' : 'createUser', user);
    return user;
  }

  // ==========================================
  // --- LAPORAN POSYANDU ---
  // ==========================================
  public async saveLaporanPosyandu(laporan: any): Promise<any> {
    const result = storageService.saveLaporanPosyandu(laporan);
    await this.postToGas('createLaporanPosyandu', result.savedLaporan);
    return result;
  }
}

export const apiService = new ApiService();
