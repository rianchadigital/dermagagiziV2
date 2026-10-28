import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  FileCode2, 
  Activity, 
  ShieldCheck, 
  RotateCcw,
  Clock,
  Download,
  MessageCircle,
  Send,
  Sparkles,
  Server,
  Layers,
  HelpCircle,
  CheckCheck,
  ChevronRight,
  Code
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { RiwayatAktivitas } from '../../types';
import { FULL_CODE_GS } from '../../gas/codeContent';

interface SettingsViewProps {
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshData }) => {
  const [gasUrl, setGasUrl] = useState(storageService.getGasUrl());
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latencyMs?: number;
    details?: any;
  }>({
    tested: false,
    success: false,
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'koneksi' | 'setup_db' | 'wa_api' | 'audit'>('setup_db');

  // WhatsApp Testing States
  const [testPhone, setTestPhone] = useState('081299887711');
  const [waTestLoading, setWaTestLoading] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    raw?: any;
  }>({
    tested: false,
    success: false,
    message: ''
  });

  // Setup Database State
  const [setupLoading, setSetupLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<{
    executed: boolean;
    success: boolean;
    message: string;
    log?: string[];
  }>({
    executed: false,
    success: false,
    message: ''
  });

  const logs = storageService.getLogs();

  const handleSaveUrl = async () => {
    storageService.setGasUrl(gasUrl);
    await handleTestConnection();
    if (gasUrl.trim()) {
      await apiService.fetchDatabaseData();
    }
    onRefreshData();
  };

  const handleCleanDummyAndSyncGAS = async () => {
    if (window.confirm('Bersihkan seluruh data dummy di browser dan sinkronkan data langsung dari database Google Spreadsheet (GAS)?')) {
      storageService.cleanDummyData(true);
      setIsLoading(true);
      await apiService.fetchDatabaseData();
      setIsLoading(false);
      onRefreshData();
      alert('Data dummy browser berhasil dibersihkan! Aplikasi kini terhubung langsung dengan database Google Apps Script.');
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    const res = await apiService.testConnection(gasUrl);
    setTestResult({
      tested: true,
      success: res.success,
      message: res.message,
      latencyMs: res.latencyMs,
      details: res.details
    });
    setIsLoading(false);
    onRefreshData();
  };

  const handleTriggerSetupDatabase = async () => {
    setSetupLoading(true);
    setSetupResult({ executed: false, success: false, message: '' });

    try {
      const res = await apiService.setupDatabase(gasUrl);
      setSetupResult({
        executed: true,
        success: res.success,
        message: res.message || 'Eksekusi setupDatabase() selesai.',
        log: res.data?.log || []
      });
      if (res.success) {
        handleTestConnection();
      }
    } catch (e: any) {
      setSetupResult({
        executed: true,
        success: false,
        message: 'Gagal menjalankan setupDatabase(): ' + e.message
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleTriggerClearDatabase = async () => {
    if (!window.confirm('Apakah Anda yakin ingin membersihkan semua baris data di Google Spreadsheet? Hanya baris 1 (Header Kolom) yang akan dipertahankan.')) {
      return;
    }
    setClearLoading(true);
    try {
      const res = await apiService.clearAllDatabaseRows(gasUrl);
      alert(res.message || 'Pembersihan data di spreadsheet selesai.');
      if (res.success) {
        onRefreshData();
      }
    } catch (e: any) {
      alert('Gagal membersihkan data: ' + e.message);
    } finally {
      setClearLoading(false);
    }
  };

  const handleSendTestWa = async () => {
    if (!testPhone.trim()) {
      alert('Masukkan nomor WhatsApp tujuan pengetesan.');
      return;
    }

    setWaTestLoading(true);
    setWaTestResult({ tested: false, success: false, message: '' });

    try {
      const res = await apiService.testWhatsAppApi(testPhone, gasUrl);
      setWaTestResult({
        tested: true,
        success: res.success,
        message: res.message || (res.success ? 'Pesan WhatsApp berhasil dikirim!' : 'Gagal mengirim pesan'),
        raw: res.data
      });
    } catch (e: any) {
      setWaTestResult({
        tested: true,
        success: false,
        message: 'Gagal mengirim pesan WhatsApp: ' + e.message
      });
    } finally {
      setWaTestLoading(false);
    }
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(FULL_CODE_GS);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const downloadScriptFile = () => {
    const blob = new Blob([FULL_CODE_GS], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh data demo kembali ke setelan default awal?')) {
      storageService.resetToDefault();
      onRefreshData();
      alert('Data demo berhasil direset ke setelan awal.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Info Banner */}
      <div className="bg-gradient-to-r from-[#0f2b48] via-[#133e66] to-[#0f2b48] text-white rounded-2xl p-5 md:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 text-[11px] font-semibold border border-sky-300/30">
                Puskesmas Kepulauan Seribu Selatan
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-semibold border border-emerald-300/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Backend Google Apps Script v2.0
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold mt-2 text-white">
              Setup Database Otomatis & Integrasi WhatsApp API
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Otomatisasi pembuatan seluruh sheet Google Spreadsheet (<code className="text-sky-300 font-mono">setupDatabase()</code>) dan integrasi Gateway WhatsApp untuk notifikasi real-time ke jajaran lintas sektor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCleanDummyAndSyncGAS}
              disabled={isLoading}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              title="Bersihkan data dummy dari browser dan muat data asli dari Google Apps Script"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>{isLoading ? 'Menghubungkan...' : 'Bersihkan Dummy & Sinkron GAS'}</span>
            </button>
            <button
              onClick={handleResetData}
              className="px-3 py-2 bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-200 text-xs font-semibold rounded-xl border border-white/15 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('setup_db')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'setup_db' 
              ? 'bg-[#0f2b48] text-white font-semibold shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-300" />
          <span>Setup Database (setupDatabase & Code.gs)</span>
        </button>

        <button
          onClick={() => setActiveTab('wa_api')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'wa_api' 
              ? 'bg-[#0f2b48] text-white font-semibold shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span>API WhatsApp & Notifikasi Otomatis</span>
        </button>

        <button
          onClick={() => setActiveTab('koneksi')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'koneksi' 
              ? 'bg-[#0f2b48] text-white font-semibold shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4 text-sky-400" />
          <span>Koneksi & URL Web App</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'audit' 
              ? 'bg-[#0f2b48] text-white font-semibold shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-violet-400" />
          <span>Audit Aktivitas ({logs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SETUP DATABASE & CODE.GS */}
      {/* ========================================================================= */}
      {activeTab === 'setup_db' && (
        <div className="space-y-6">
          
          {/* Quick Action Card: Setup Database Remotely */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-600" />
                    Eksekusi Fungsi <code className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded font-mono text-xs">setupDatabase()</code>
                  </h2>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Otomatis 13 Sheet
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Membuat seluruh sheet (USERS, PULAU, MASTER_KELURAHAN, MASTER_POSYANDU, MASTER_LINTAS_SEKTOR, SASARAN, PEMANTAUAN, LAPORAN_POSYANDU, TINDAK_LANJUT, KENDALA, LINTAS_SEKTOR, KONFIGURASI) dengan format header navy resmi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleTriggerSetupDatabase}
                  disabled={setupLoading || !gasUrl.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {setupLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{setupLoading ? 'Memproses Database...' : 'Jalankan setupDatabase()'}</span>
                </button>

                <button
                  onClick={handleTriggerClearDatabase}
                  disabled={clearLoading || !gasUrl.trim()}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900/60 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Menghapus seluruh baris data di sheet dan menyisakan header kolom"
                >
                  {clearLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>{clearLoading ? 'Membersihkan...' : 'Bersihkan Data di Sheet'}</span>
                </button>
              </div>
            </div>

            {/* Setup execution status */}
            {setupResult.executed && (
              <div className={`p-4 rounded-xl border text-xs ${
                setupResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-start gap-2.5">
                  {setupResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {setupResult.success ? 'Setup Database Berhasil!' : 'Gagal Menjalankan Setup'}
                    </div>
                    <p className="mt-1">{setupResult.message}</p>
                    {setupResult.log && setupResult.log.length > 0 && (
                      <div className="mt-2 p-2.5 bg-white/70 rounded-lg border border-emerald-200/60 font-mono text-[11px] space-y-0.5 max-h-40 overflow-y-auto">
                        {setupResult.log.map((item, i) => (
                          <div key={i}>{item}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Steps & Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <div className="font-bold text-slate-800 text-xs">Buat Google Spreadsheet</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-sky-600 underline font-semibold">sheets.new</a> lalu klik menu <b>Ekstensi &gt; Apps Script</b>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <div className="font-bold text-slate-800 text-xs">Tempel Code.gs & Simpan</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Salin seluruh kode di bawah, gantikan isi default editor Apps Script, lalu klik tombol Simpan.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <div className="font-bold text-slate-800 text-xs">Jalankan setupDatabase</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pilih fungsi <b>setupDatabase</b> di toolbar atas Apps Script, lalu klik tombol "Jalankan" (Run).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Code.gs Viewer & Downloader */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-amber-500" />
                  Script Lengkap: <code className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">Code.gs</code>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Telah disiapkan lengkap: fungsi <code className="font-mono text-sky-700">setupDatabase()</code>, WhatsApp Gateway, normalisasi nomor HP 628, menu spreadsheet kustom, dan router doGet/doPost.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={copyScriptToClipboard}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Kode Berhasil Disalin!' : 'Salin Seluruh Code.gs'}</span>
                </button>

                <button
                  onClick={downloadScriptFile}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Code.gs</span>
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0d1b2a] shadow-inner">
              <div className="flex items-center justify-between px-4 py-2 bg-[#08121d] border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="ml-2 font-semibold text-slate-300">Code.gs (Google Apps Script)</span>
                </div>
                <span>Siap Digunakan Tanpa Perubahan</span>
              </div>
              <pre className="p-4 text-[11px] font-mono text-sky-200/90 overflow-x-auto max-h-[380px] leading-relaxed select-all">
                {FULL_CODE_GS}
              </pre>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WHATSAPP API & NOTIFIKASI OTOMATIS */}
      {/* ========================================================================= */}
      {activeTab === 'wa_api' && (
        <div className="space-y-6 text-xs">
          
          {/* Card WhatsApp Gateway Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  Integrasi WhatsApp API Gateway
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Fonnte / Wablas / Webhook
                </span>
              </div>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Ketika kader posyandu atau petugas menginput temuan bayi stunting, wasting, atau kurang gizi, sistem DERMAGA GIZI secara otomatis memanggil API WhatsApp di backend Google Apps Script untuk mengirimkan notifikasi instan ke WhatsApp pimpinan dan anggota lintas sektor (Lurah, Camat, TP-PKK, TPK, Puskesmas, Bidan).
              </p>
            </div>

            {/* Provider Supported Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs">1. Fonnte (Rekomendasi)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-200 text-emerald-800 font-bold">Populer ID</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                  Daftar gratis di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="underline font-semibold">fonnte.com</a>, scan QR WhatsApp, dan salin token.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-900 text-xs">2. Wablas</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-200 text-sky-800 font-bold">Gateway</span>
                </div>
                <p className="text-[11px] text-sky-700 mt-1 leading-relaxed">
                  Mendukung endpoint server Wablas dengan header Authorization token API resmi.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-xs">3. Custom Webhook</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-200 text-purple-800 font-bold">Fleksibel</span>
                </div>
                <p className="text-[11px] text-purple-700 mt-1 leading-relaxed">
                  Hubungkan dengan server WA lokal / bot kustom Anda menggunakan format JSON standar.
                </p>
              </div>
            </div>

            {/* Live Testing Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span>Uji Coba Pengiriman Pesan WhatsApp (Real-time Diagnostic)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Masukkan nomor WhatsApp Anda untuk menguji apakah backend Google Apps Script berhasil mengirimkan pesan:
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">📱</span>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="0812xxxxxxxx atau 628xxxxxxxx"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  onClick={handleSendTestWa}
                  disabled={waTestLoading || !gasUrl.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {waTestLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{waTestLoading ? 'Mengirim...' : 'Kirim Pesan Uji Coba'}</span>
                </button>
              </div>

              {/* WA Test Result Alert */}
              {waTestResult.tested && (
                <div className={`p-3.5 rounded-xl border text-xs ${
                  waTestResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-start gap-2">
                    {waTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{waTestResult.success ? 'Berhasil Terkirim / Diproses' : 'Pengiriman Gagal'}</div>
                      <p className="mt-0.5">{waTestResult.message}</p>
                      {waTestResult.raw && (
                        <pre className="mt-2 p-2 bg-white/80 rounded border border-slate-200 font-mono text-[10px] overflow-x-auto">
                          {JSON.stringify(waTestResult.raw, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Konfigurasi Sheet KONFIGURASI Explanation */}
            <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 text-sky-950 space-y-2">
              <div className="font-bold text-xs flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-sky-700" />
                <span>Pengaturan Kunci di Sheet KONFIGURASI Google Spreadsheet:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-700 pl-1">
                <li>
                  <code className="bg-white px-1.5 py-0.5 rounded text-sky-800 font-mono font-bold">WA_GATEWAY_PROVIDER</code> : Isi dengan <code className="font-bold">FONNTE</code> atau <code className="font-bold">WABLAS</code>.
                </li>
                <li>
                  <code className="bg-white px-1.5 py-0.5 rounded text-sky-800 font-mono font-bold">WA_API_TOKEN</code> : Tempel token API dari Fonnte atau Wablas.
                </li>
                <li>
                  <code className="bg-white px-1.5 py-0.5 rounded text-sky-800 font-mono font-bold">WA_ADMIN_PHONE</code> : Nomor penanggung jawab utama gizi (misal: 6281299887711).
                </li>
                <li>
                  <code className="bg-white px-1.5 py-0.5 rounded text-sky-800 font-mono font-bold">WA_NOTIF_AUTO_SEND</code> : Atur <code className="font-bold">TRUE</code> agar otomatis kirim WA saat ada temuan gizi balita baru.
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KONEKSI & DIAGNOSTIK URL */}
      {/* ========================================================================= */}
      {activeTab === 'koneksi' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-900 text-sm mb-1">
                URL Google Apps Script Web App (API Endpoint)
              </label>
              <p className="text-slate-500 mb-2 leading-relaxed">
                Masukkan URL Web App hasil deployment Google Apps Script (berakhiran <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-800">/exec</code>). Saat belum diisi, aplikasi beroperasi dalam Mode Demo yang aman dengan data lokal.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:border-sky-500 focus:bg-white transition-all"
                />
                <button
                  onClick={handleSaveUrl}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  <span>Simpan & Uji Koneksi</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Card */}
            {testResult.tested && (
              <div className={`p-4 rounded-xl border ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-start gap-2.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {testResult.success ? 'Koneksi Berhasil Aktif' : 'Status Koneksi: Perlu Konfigurasi'}
                    </div>
                    <p className="mt-1 leading-relaxed">{testResult.message}</p>
                    {testResult.latencyMs !== undefined && (
                      <div className="mt-2 text-[11px] font-mono text-slate-600">
                        Latensi respons: <b>{testResult.latencyMs} ms</b>
                      </div>
                    )}
                    {testResult.success && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={handleTriggerSetupDatabase}
                          disabled={setupLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Jalankan setupDatabase() Otomatis</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Operasional Saat Ini */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-slate-800">Fokus Penyimpanan Utama: </span>
                <span className={apiService.isConnected() ? 'text-emerald-700 font-semibold' : ''}>
                  {apiService.isConnected() ? 'Database Google Spreadsheet (Prioritas Utama, Bukan Lokal)' : 'Mode Demo Terproteksi (Lokal)'}
                </span>
                <div className="text-[11px] text-slate-500 mt-1">
                  Sinkronisasi live polling otomatis berjalan setiap <b>3 detik</b> ke Google Spreadsheet Database saat aktif.
                </div>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-medium text-slate-700 text-xs self-start sm:self-center"
              >
                Uji Koneksi Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Riwayat Aktivitas & Audit Trail (Sheet RIWAYAT_AKTIVITAS)</h2>
              <p className="text-[11px] text-slate-500">Mencatat waktu, pengguna, jenis aksi, dan rincian perubahan data</p>
            </div>
            <span className="font-mono text-slate-500 font-semibold">{logs.length} Log</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
                <tr>
                  <th className="py-2.5 px-3">Waktu (WIB)</th>
                  <th className="py-2.5 px-3">Petugas</th>
                  <th className="py-2.5 px-2 text-center">Aksi</th>
                  <th className="py-2.5 px-2">Modul</th>
                  <th className="py-2.5 px-3">Rincian Perubahan</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{log.waktu}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">{log.user_name}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.aksi === 'CREATE' ? 'bg-sky-100 text-sky-800' :
                        log.aksi === 'UPDATE' ? 'bg-emerald-100 text-emerald-800' :
                        log.aksi === 'CANCEL' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.aksi}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 font-sans">{log.jenis_data}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700 max-w-sm truncate" title={log.ringkasan_perubahan}>
                      {log.ringkasan_perubahan}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        log.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
