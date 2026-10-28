import React, { useState } from 'react';
import { 
  Handshake, 
  Plus, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Eye, 
  X, 
  Save, 
  Layers, 
  TrendingUp,
  Share2,
  Building2,
  Filter
} from 'lucide-react';
import { GlobalFilter, Pulau, KegiatanLintasSektor, User, StatusLintasSektor } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { exportToCSV } from '../../utils/formatters';

interface LintasSektorViewProps {
  filter: GlobalFilter;
  pulauList: Pulau[];
  currentUser: User;
  onRefreshData: () => void;
}

export const LintasSektorView: React.FC<LintasSektorViewProps> = ({
  filter,
  pulauList,
  currentUser,
  onRefreshData
}) => {
  const [search, setSearch] = useState('');
  const [mitraFilter, setMitraFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [activeItem, setActiveItem] = useState<Partial<KegiatanLintasSektor>>({});
  const [sendWANotif, setSendWANotif] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const list = storageService.getLintasSektorList(filter.pulau_id);

  const filteredList = list.filter(item => {
    if (mitraFilter !== 'ALL' && !item.mitra.toLowerCase().includes(mitraFilter.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.nama_kegiatan.toLowerCase().includes(q) ||
        item.mitra.toLowerCase().includes(q) ||
        item.penanggung_jawab.toLowerCase().includes(q) ||
        item.indikator.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate 4 KPI Cards from Mockup Lampiran 2 Menu 5 (18, 10, 6, 2)
  const totalPrograms = 18;
  const selesaiPrograms = 10;
  const prosesPrograms = 6;
  const koordinasiPrograms = 2;

  const canEdit = currentUser.role !== 'VIEWER';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenCreate = () => {
    setActiveItem({
      kegiatan_id: `LINTAS-0${Math.floor(10 + Math.random() * 89)}`,
      tanggal_kesepakatan: new Date().toLocaleDateString('id-ID'),
      nama_kegiatan: '',
      pulau_id: filter.pulau_id === 'ALL' ? pulauList[0]?.pulau_id || 'P01' : filter.pulau_id,
      mitra: 'Kelurahan & TP-PKK',
      penanggung_jawab: '',
      tenggat: new Date(Date.now() + 60 * 24 * 3600 * 1000).toLocaleDateString('id-ID'),
      indikator: '',
      target: 20,
      realisasi: 0,
      progres: 0,
      status: 'Berjalan',
      catatan: '',
      terakhir_evaluasi: new Date().toLocaleDateString('id-ID')
    });
    setSendWANotif(true);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KegiatanLintasSektor) => {
    setActiveItem({ ...item });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDetail = (item: KegiatanLintasSektor) => {
    setActiveItem({ ...item });
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem.nama_kegiatan || !activeItem.mitra) return;

    await apiService.saveLintasSektor(activeItem as KegiatanLintasSektor);

    if (sendWANotif) {
      const pulau = pulauList.find(p => p.pulau_id === activeItem.pulau_id)?.nama_pulau || 'Kepulauan';
      storageService.addWhatsAppNotif({
        penerima_nama: activeItem.mitra || 'Mitra Lintas Sektor',
        penerima_no: '081312345678',
        peran: 'LINTAS_SEKTOR',
        pesan: `*[DERMAGA GIZI - KOORDINASI LINTAS SEKTOR]*\nProgram: ${activeItem.nama_kegiatan}\nMitra: ${activeItem.mitra}\nWilayah: ${pulau}\nTarget: ${activeItem.target}\nIndikator: ${activeItem.indikator}\nPIC Puskesmas: ${currentUser.nama}\nMari bersama tuntaskan penanganan balita bermasalah gizi di Kepulauan Seribu Selatan.`
      });
      showToast('Program berhasil disimpan & notifikasi WhatsApp diteruskan ke Mitra Sektor!');
    } else {
      showToast('Data kegiatan lintas sektor berhasil diperbarui di database.');
    }

    setIsModalOpen(false);
    onRefreshData();
  };

  const handleSendWA = (item: KegiatanLintasSektor) => {
    storageService.addWhatsAppNotif({
      penerima_nama: item.mitra,
      penerima_no: '081312345678',
      peran: 'LINTAS_SEKTOR',
      pesan: `*[DERMAGA GIZI - PROGRES KOORDINASI]*\nProgram: ${item.nama_kegiatan}\nMitra: ${item.mitra}\nProgres: ${item.progres}%\nStatus: ${item.status}\nCatatan: ${item.catatan || 'Terus koordinasikan pendampingan sasaran'}\nTerima kasih atas kolaborasinya bersama Puskesmas Kepulauan Seribu Selatan.`
    });
    showToast(`Pesan koordinasi WhatsApp dikirim ke ${item.mitra}`);
  };

  const handleExport = () => {
    const headers = [
      'No',
      'ID Kegiatan',
      'Nama Kegiatan',
      'Pulau',
      'Mitra Lintas Sektor',
      'Penanggung Jawab',
      'Target',
      'Realisasi',
      'Progres (%)',
      'Status'
    ];

    const rows = filteredList.map((item, idx) => {
      const p = pulauList.find(x => x.pulau_id === item.pulau_id);
      return [
        idx + 1,
        item.kegiatan_id,
        item.nama_kegiatan,
        p?.nama_pulau || item.pulau_id,
        item.mitra,
        item.penanggung_jawab,
        item.target,
        item.realisasi,
        `${item.progres}%`,
        item.status
      ];
    });

    exportToCSV(`Lintas_Sektor_${filter.pulau_id}_${filter.tahun}`, headers, rows);
    storageService.addLog('EXPORT', 'LINTAS_SEKTOR', 'EXPORT-CSV', `Ekspor ${rows.length} kegiatan lintas sektor`, 'SUCCESS');
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Sub Header & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              Monitoring Lintas Sektor
            </h1>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full font-mono tabular-nums">
              {totalPrograms} Kolaborasi
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sinergi intervensi gizi terintegrasi bersama Kelurahan, TP-PKK, Sudin Sosial, Sudin KPKP, dan Baznas (Bazis).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Program Lintas Sektor</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI Cards (Lampiran 2 Menu 5: 18, 10, 6, 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Program */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
            <Handshake className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Kolaborasi</div>
            <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {totalPrograms}
            </div>
            <div className="text-[10px] text-slate-400">Program Terkoordinasi</div>
          </div>
        </div>

        {/* KPI 2: Selesai */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Selesai / Tercapai</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
              {selesaiPrograms}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">55.6% Sukses</div>
          </div>
        </div>

        {/* KPI 3: Dalam Proses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Dalam Proses</div>
            <div className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums tracking-tight">
              {prosesPrograms}
            </div>
            <div className="text-[10px] text-sky-600 font-medium">33.3% Berjalan</div>
          </div>
        </div>

        {/* KPI 4: Perlu Koordinasi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Perlu Koordinasi</div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
              {koordinasiPrograms}
            </div>
            <div className="text-[10px] text-amber-600 font-medium">11.1% Tertunda</div>
          </div>
        </div>

      </div>

      {/* Search & Sub-Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari program kegiatan, mitra sektor, atau penanggung jawab..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mitra Filter */}
          <select
            value={mitraFilter}
            onChange={e => setMitraFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Mitra Sektor</option>
            <option value="Kelurahan">Kelurahan & TP-PKK</option>
            <option value="Sosial">Sudin Sosial</option>
            <option value="Baznas">Baznas (Bazis)</option>
            <option value="KPKP">Sudin KPKP (Ketahanan Pangan)</option>
          </select>

          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: 'Selesai', label: 'Selesai' },
              { id: 'Berjalan', label: 'Berjalan' },
              { id: 'Perlu koordinasi', label: 'Perlu Koordinasi' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table: Monitoring Lintas Sektor (Lampiran 2 Menu 5) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[200px]">Program & Kegiatan</th>
                <th className="py-3 px-3 w-32">Pulau</th>
                <th className="py-3 px-3 w-40">Mitra Lintas Sektor</th>
                <th className="py-3 px-3 w-36">Penanggung Jawab</th>
                <th className="py-3 px-4 min-w-[170px]">Indikator & Target</th>
                <th className="py-3 px-4 w-44">Realisasi & Progres</th>
                <th className="py-3 px-3 w-32 text-center">Status</th>
                <th className="py-3 px-3 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada kegiatan lintas sektor yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const pulau = pulauList.find(p => p.pulau_id === item.pulau_id)?.nama_pulau || item.pulau_id;

                  return (
                    <tr key={item.kegiatan_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                          {item.nama_kegiatan}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {item.kegiatan_id} · Kesepakatan: {item.tanggal_kesepakatan}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{pulau}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3" />
                          {item.mitra}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        {item.penanggung_jawab}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                        <div className="leading-tight">{item.indikator}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Target: {item.target} sasaran</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {item.realisasi} / {item.target}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{item.progres}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.progres >= 100 
                                ? 'bg-emerald-500' 
                                : item.progres >= 50 
                                  ? 'bg-sky-500' 
                                  : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(item.progres, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.status === 'Selesai' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </span>
                        )}
                        {item.status === 'Berjalan' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            <Clock className="w-3 h-3" /> Berjalan
                          </span>
                        )}
                        {item.status === 'Perlu koordinasi' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" /> Perlu koordinasi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            title="Lihat Detail"
                            className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Program"
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSendWA(item)}
                            title="Kirim Notifikasi Koordinasi WA"
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Form / Detail Program Lintas Sektor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Handshake className="w-4 h-4 text-sky-600" />
                {modalMode === 'create' && 'Tambah Program Lintas Sektor'}
                {modalMode === 'edit' && `Ubah Program (${activeItem.kegiatan_id})`}
                {modalMode === 'detail' && `Detail Program (${activeItem.kegiatan_id})`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMode === 'detail' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Nama Program</label>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{activeItem.nama_kegiatan}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Mitra Kerja Sama</label>
                    <p className="font-semibold text-indigo-600">{activeItem.mitra}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Wilayah</label>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {pulauList.find(p => p.pulau_id === activeItem.pulau_id)?.nama_pulau}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Indikator Keberhasilan</label>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {activeItem.indikator}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 uppercase block">Target</span>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{activeItem.target}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 uppercase block">Realisasi</span>
                    <span className="font-bold text-sky-600 text-sm">{activeItem.realisasi}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 uppercase block">Progres</span>
                    <span className="font-bold text-emerald-600 text-sm">{activeItem.progres}%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Catatan Evaluasi Bersama</label>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {activeItem.catatan || 'Belum ada catatan tambahan.'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Program / Kegiatan *
                  </label>
                  <input
                    type="text"
                    required
                    value={activeItem.nama_kegiatan || ''}
                    onChange={e => setActiveItem(prev => ({ ...prev, nama_kegiatan: e.target.value }))}
                    placeholder="Contoh: Distribusi Paket Protein Ikan Segar Baznas & Kelurahan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mitra Lintas Sektor *
                    </label>
                    <select
                      value={activeItem.mitra}
                      onChange={e => setActiveItem(prev => ({ ...prev, mitra: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Kelurahan & TP-PKK">Kelurahan & TP-PKK</option>
                      <option value="Sudin Sosial">Sudin Sosial</option>
                      <option value="Baznas (Bazis)">Baznas (Bazis)</option>
                      <option value="Sudin KPKP">Sudin KPKP (Pangan)</option>
                      <option value="Kader Posyandu">Kader Posyandu</option>
                      <option value="Puskesmas Kepulauan Seribu Selatan">Puskesmas Kepulauan Seribu Selatan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Wilayah Pulau *
                    </label>
                    <select
                      value={activeItem.pulau_id}
                      onChange={e => setActiveItem(prev => ({ ...prev, pulau_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {pulauList.map(p => (
                        <option key={p.pulau_id} value={p.pulau_id}>{p.nama_pulau}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Indikator Keberhasilan *
                  </label>
                  <input
                    type="text"
                    required
                    value={activeItem.indikator || ''}
                    onChange={e => setActiveItem(prev => ({ ...prev, indikator: e.target.value }))}
                    placeholder="Contoh: Terdistribusi bantuan pangan berprotein ke seluruh balita gizi kurang"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={activeItem.target || 20}
                      onChange={e => {
                        const tgt = Number(e.target.value);
                        const rel = activeItem.realisasi || 0;
                        const pct = tgt > 0 ? Math.round((rel / tgt) * 100) : 0;
                        setActiveItem(prev => ({ ...prev, target: tgt, progres: pct }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Realisasi *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={activeItem.realisasi || 0}
                      onChange={e => {
                        const rel = Number(e.target.value);
                        const tgt = activeItem.target || 20;
                        const pct = tgt > 0 ? Math.round((rel / tgt) * 100) : 0;
                        setActiveItem(prev => ({ ...prev, realisasi: rel, progres: pct }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Progres (%)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={activeItem.progres || 0}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Penanggung Jawab *
                    </label>
                    <input
                      type="text"
                      required
                      value={activeItem.penanggung_jawab || ''}
                      onChange={e => setActiveItem(prev => ({ ...prev, penanggung_jawab: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status Program *
                    </label>
                    <select
                      value={activeItem.status}
                      onChange={e => setActiveItem(prev => ({ ...prev, status: e.target.value as StatusLintasSektor }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Berjalan">Berjalan</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Perlu koordinasi">Perlu koordinasi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Koordinasi & RTL
                  </label>
                  <textarea
                    rows={2}
                    value={activeItem.catatan || ''}
                    onChange={e => setActiveItem(prev => ({ ...prev, catatan: e.target.value }))}
                    placeholder="Catatan hasil pertemuan koordinasi dan kesepakatan tindak lanjut..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Auto-WA Notification */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="waLintasNotif"
                    checked={sendWANotif}
                    onChange={e => setSendWANotif(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="waLintasNotif" className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-tight">
                    <span className="font-bold">Notifikasi WhatsApp Otomatis:</span> Kirimkan pesan pembaruan progres langsung ke PIC Mitra Lintas Sektor dan Tim Gizi Puskesmas.
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Program</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
