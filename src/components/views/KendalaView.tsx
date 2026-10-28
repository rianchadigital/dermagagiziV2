import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  Download, 
  X, 
  Save, 
  Edit3, 
  Eye, 
  Share2, 
  Trash2,
  TrendingDown, 
  Filter,
  DollarSign,
  Ship,
  UserX,
  BookOpen,
  HelpCircle,
  BarChart3,
  Table as TableIcon,
  RefreshCw,
  Send,
  Building2,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  CartesianGrid,
  Legend
} from 'recharts';
import { GlobalFilter, Pulau, Kendala, User, KategoriKendala, StatusKendala } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { exportToCSV } from '../../utils/formatters';

interface KendalaViewProps {
  filter: GlobalFilter;
  pulauList: Pulau[];
  currentUser: User;
  onRefreshData: () => void;
}

const KATEGORI_COLORS: Record<string, string> = {
  'Ekonomi': '#f59e0b',          // Amber
  'Transportasi': '#0284c7',     // Sky Blue
  'Penolakan': '#ef4444',        // Rose/Red
  'Kurang Pengetahuan': '#8b5cf6', // Purple/Violet
  'Lainnya': '#64748b'           // Slate
};

const STATUS_COLORS: Record<string, string> = {
  'Selesai': '#10b981',
  'Terselesaikan': '#10b981',
  'Dalam proses': '#0284c7',
  'Dalam Penanganan': '#0284c7',
  'Menunggu koordinasi': '#f59e0b',
  'Ada Kendala': '#ef4444',
  'Baru': '#ef4444'
};

export const KendalaView: React.FC<KendalaViewProps> = ({
  filter,
  pulauList,
  currentUser,
  onRefreshData
}) => {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'semua' | 'ringkasan' | 'tabel'>('semua');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [activeKendala, setActiveKendala] = useState<Partial<Kendala>>({});
  const [sendWANotif, setSendWANotif] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const allSasaran = storageService.getSasaranList();
  const kendalaList = storageService.getKendalaList(filter.pulau_id);

  const canEdit = currentUser.role !== 'VIEWER';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 5 Kategori Kendala Terstandar
  const standarKategori = ['Ekonomi', 'Transportasi', 'Penolakan', 'Kurang Pengetahuan', 'Lainnya'];

  // Normalize category mapping
  const normalizeKategori = (rawKategori?: string): 'Ekonomi' | 'Transportasi' | 'Penolakan' | 'Kurang Pengetahuan' | 'Lainnya' => {
    if (!rawKategori) return 'Lainnya';
    const lower = rawKategori.toLowerCase();
    if (lower.includes('ekonomi') || lower.includes('finansial') || lower.includes('daya beli')) return 'Ekonomi';
    if (lower.includes('transport') || lower.includes('laut') || lower.includes('kapal') || lower.includes('perahu') || lower.includes('ombak') || lower.includes('cuaca')) return 'Transportasi';
    if (lower.includes('tolak') || lower.includes('tidak hadir') || lower.includes('enggan') || lower.includes('alasan')) return 'Penolakan';
    if (lower.includes('pengetahuan') || lower.includes('edukasi') || lower.includes('asuh') || lower.includes('paham')) return 'Kurang Pengetahuan';
    return 'Lainnya';
  };

  const filteredKendala = useMemo(() => {
    return kendalaList.filter(k => {
      const normKat = normalizeKategori(k.kategori);
      if (kategoriFilter !== 'ALL' && normKat !== kategoriFilter && k.kategori !== kategoriFilter) return false;
      
      if (statusFilter !== 'ALL') {
        const lowerStatus = k.status.toLowerCase();
        if (statusFilter === 'Selesai' && !lowerStatus.includes('selesai')) return false;
        if (statusFilter === 'Dalam Penanganan' && (!lowerStatus.includes('proses') && !lowerStatus.includes('penanganan'))) return false;
        if (statusFilter === 'Ada Kendala' && (!lowerStatus.includes('baru') && !lowerStatus.includes('koordinasi') && !lowerStatus.includes('ada kendala'))) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        const sasaran = allSasaran.find(s => s.sasaran_id === k.sasaran_id || s.kode_sasaran === k.sasaran_terkait_kode);
        const matchSasaran = sasaran ? (sasaran.inisial.toLowerCase().includes(q) || sasaran.kode_sasaran.toLowerCase().includes(q)) : false;
        return (
          k.deskripsi.toLowerCase().includes(q) ||
          (k.kendala_detail && k.kendala_detail.toLowerCase().includes(q)) ||
          k.dampak.toLowerCase().includes(q) ||
          k.rencana_penyelesaian.toLowerCase().includes(q) ||
          k.kategori.toLowerCase().includes(q) ||
          (k.sasaran_terkait_kode && k.sasaran_terkait_kode.toLowerCase().includes(q)) ||
          matchSasaran
        );
      }
      return true;
    });
  }, [kendalaList, kategoriFilter, statusFilter, search, allSasaran]);

  // Rekapitulasi per Kategori untuk Tabel & Grafik Ringkasan
  const summaryPerKategori = useMemo(() => {
    const map: Record<string, { total: number; selesai: number; proses: number; aktif: number }> = {
      'Ekonomi': { total: 0, selesai: 0, proses: 0, aktif: 0 },
      'Transportasi': { total: 0, selesai: 0, proses: 0, aktif: 0 },
      'Penolakan': { total: 0, selesai: 0, proses: 0, aktif: 0 },
      'Kurang Pengetahuan': { total: 0, selesai: 0, proses: 0, aktif: 0 },
      'Lainnya': { total: 0, selesai: 0, proses: 0, aktif: 0 }
    };

    kendalaList.forEach(k => {
      const kat = normalizeKategori(k.kategori);
      const s = (k.status || '').toLowerCase();
      
      map[kat].total += 1;
      if (s.includes('selesai')) {
        map[kat].selesai += 1;
      } else if (s.includes('proses') || s.includes('penanganan')) {
        map[kat].proses += 1;
      } else {
        map[kat].aktif += 1;
      }
    });

    return map;
  }, [kendalaList]);

  // Data untuk Grafik Batang (Bar Chart)
  const chartDataKategori = useMemo(() => {
    return [
      { name: 'Ekonomi', jumlah: summaryPerKategori['Ekonomi'].total, aktif: summaryPerKategori['Ekonomi'].aktif, selesai: summaryPerKategori['Ekonomi'].selesai },
      { name: 'Transportasi', jumlah: summaryPerKategori['Transportasi'].total, aktif: summaryPerKategori['Transportasi'].aktif, selesai: summaryPerKategori['Transportasi'].selesai },
      { name: 'Penolakan', jumlah: summaryPerKategori['Penolakan'].total, aktif: summaryPerKategori['Penolakan'].aktif, selesai: summaryPerKategori['Penolakan'].selesai },
      { name: 'Kurang Pengetahuan', jumlah: summaryPerKategori['Kurang Pengetahuan'].total, aktif: summaryPerKategori['Kurang Pengetahuan'].aktif, selesai: summaryPerKategori['Kurang Pengetahuan'].selesai },
      { name: 'Lainnya', jumlah: summaryPerKategori['Lainnya'].total, aktif: summaryPerKategori['Lainnya'].aktif, selesai: summaryPerKategori['Lainnya'].selesai }
    ];
  }, [summaryPerKategori]);

  // Data untuk Grafik Donut / Pie Status
  const chartDataStatus = useMemo(() => {
    let selesai = 0;
    let proses = 0;
    let aktif = 0;

    kendalaList.forEach(k => {
      const s = (k.status || '').toLowerCase();
      if (s.includes('selesai')) selesai++;
      else if (s.includes('proses') || s.includes('penanganan')) proses++;
      else aktif++;
    });

    return [
      { name: 'Terselesaikan', value: selesai, color: '#10b981' },
      { name: 'Dalam Penanganan', value: proses, color: '#0284c7' },
      { name: 'Ada Kendala (Aktif)', value: aktif, color: '#ef4444' }
    ];
  }, [kendalaList]);

  const totalKendala = kendalaList.length;

  const handleOpenCreate = () => {
    const firstSasaran = allSasaran[0];
    setActiveKendala({
      kendala_id: `KND-${Date.now().toString().slice(-4)}`,
      tanggal_kejadian: new Date().toLocaleDateString('id-ID'),
      pulau_id: filter.pulau_id === 'ALL' ? pulauList[0]?.pulau_id || 'P01' : filter.pulau_id,
      kategori: 'Ekonomi',
      kendala_detail: '',
      deskripsi: 'Keluarga mengalami keterbatasan ekonomi untuk membeli bahan makanan berprotein tinggi.',
      dampak: 'Asupan gizi hewani harian balita kurang dari standar AKG pemulihan gizi.',
      rencana_penyelesaian: 'Koordinasi dengan Kelurahan dan Sudin Sosial untuk stimulus paket sembako telur dan ikan segar.',
      penanggung_jawab: currentUser.nama,
      tenggat: new Date(Date.now() + 7 * 86400000).toLocaleDateString('id-ID'),
      status: 'Ada Kendala',
      sasaran_terkait_kode: firstSasaran?.kode_sasaran || '',
      sasaran_id: firstSasaran?.sasaran_id || ''
    });
    setSendWANotif(true);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (k: Kendala) => {
    setActiveKendala({ ...k });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDetail = (k: Kendala) => {
    setActiveKendala({ ...k });
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const handleDeleteKendala = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data kendala ini?')) {
      await apiService.deleteKendala(id);
      showToast('Data kendala berhasil dihapus.');
      onRefreshData();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKendala.deskripsi && !activeKendala.kendala_detail) return;

    const dataToSave: Kendala = {
      ...(activeKendala as Kendala),
      kendala_detail: activeKendala.kendala_detail || activeKendala.deskripsi || '',
      deskripsi: activeKendala.deskripsi || activeKendala.kendala_detail || '',
      pelapor_nama: activeKendala.pelapor_nama || currentUser.nama,
      pelapor_sektor: activeKendala.pelapor_sektor || currentUser.unit || 'Tenaga Kesehatan'
    };

    await apiService.saveKendala(dataToSave);

    if (sendWANotif) {
      const pulau = pulauList.find(p => p.pulau_id === dataToSave.pulau_id)?.nama_pulau || 'Kepulauan Seribu';
      const text = `*[DERMAGA GIZI - NOTIFIKASI KENDALA PELAYANAN]*\n` +
        `• ID Kendala: *${dataToSave.kendala_id}*\n` +
        `• Wilayah: *${pulau}*\n` +
        `• Kategori: *${dataToSave.kategori}*\n` +
        `• Rincian Masalah: ${dataToSave.kendala_detail || dataToSave.deskripsi}\n` +
        `• Rencana Solusi: ${dataToSave.rencana_penyelesaian}\n` +
        `• Status: *${dataToSave.status}*\n` +
        `• PIC / Pelapor: ${dataToSave.pelapor_nama} (${dataToSave.pelapor_sektor})\n\n` +
        `Mohon dukungan koordinasi lintas sektor Puskesmas Kepulauan Seribu Selatan:\n${storageService.getAppUrl()}`;

      storageService.addWhatsAppNotif({
        penerima_nama: 'Grup Koordinasi Lintas Sektor',
        penerima_no: '081298765432',
        peran: 'LINTAS_SEKTOR',
        pesan: text
      });
      showToast('Data kendala berhasil disimpan dan disiarkan ke Lintas Sektor via WhatsApp!');
    } else {
      showToast('Data kendala berhasil diperbarui di database.');
    }

    setIsModalOpen(false);
    onRefreshData();
  };

  const handleSendWA = (k: Kendala) => {
    const pulau = pulauList.find(p => p.pulau_id === k.pulau_id)?.nama_pulau || 'Kepulauan Seribu';
    const text = `*[DERMAGA GIZI - NOTIFIKASI KENDALA LAPANGAN]*\n` +
      `• ID: *${k.kendala_id}*\n` +
      `• Kategori Kendala: *${k.kategori}*\n` +
      `• Wilayah: *${pulau}*\n` +
      `• Rincian Masalah: ${k.kendala_detail || k.deskripsi}\n` +
      `• Dampak: ${k.dampak}\n` +
      `• Solusi / Mitigasi: ${k.rencana_penyelesaian}\n` +
      `• Status: *${k.status}*\n\n` +
      `Pantau bersama di sistem: ${storageService.getAppUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExport = () => {
    const headers = [
      'No',
      'ID Kendala',
      'Tanggal',
      'Pulau',
      'Kode Balita',
      'Kategori Kendala',
      'Rincian Kendala',
      'Dampak Pelayanan',
      'Rencana Solusi',
      'Penanggung Jawab',
      'Status'
    ];

    const rows = filteredKendala.map((k, idx) => {
      const p = pulauList.find(item => item.pulau_id === k.pulau_id);
      return [
        idx + 1,
        k.kendala_id,
        k.tanggal_kejadian,
        p?.nama_pulau || k.pulau_id,
        k.sasaran_terkait_kode || k.sasaran_id || '-',
        k.kategori,
        k.kendala_detail || k.deskripsi,
        k.dampak,
        k.rencana_penyelesaian,
        k.penanggung_jawab,
        k.status
      ];
    });

    exportToCSV(`Daftar_Kendala_Gizi_${filter.pulau_id}`, headers, rows);
  };

  const getKategoriIcon = (kategori: string) => {
    const norm = normalizeKategori(kategori);
    switch (norm) {
      case 'Ekonomi':
        return <DollarSign className="w-3.5 h-3.5 text-amber-500" />;
      case 'Transportasi':
        return <Ship className="w-3.5 h-3.5 text-sky-500" />;
      case 'Penolakan':
        return <UserX className="w-3.5 h-3.5 text-rose-500" />;
      case 'Kurang Pengetahuan':
        return <BookOpen className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-500" />;
    }
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

      {/* Header & Aksi Cepat */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                Daftar Kendala Pelayanan & Intervensi Gizi
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoring dan mitigasi hambatan penanganan balita (Ekonomi, Transportasi, Penolakan, Kurang Pengetahuan, dan Lainnya).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Kendala Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Cepat Kartu 5 Kategori */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Ekonomi', icon: '💰', data: summaryPerKategori['Ekonomi'], border: 'border-amber-200 dark:border-amber-900/60', bg: 'bg-amber-50/50 dark:bg-amber-950/20' },
          { label: 'Transportasi', icon: '🚤', data: summaryPerKategori['Transportasi'], border: 'border-sky-200 dark:border-sky-900/60', bg: 'bg-sky-50/50 dark:bg-sky-950/20' },
          { label: 'Penolakan', icon: '🚫', data: summaryPerKategori['Penolakan'], border: 'border-rose-200 dark:border-rose-900/60', bg: 'bg-rose-50/50 dark:bg-rose-950/20' },
          { label: 'Kurang Pengetahuan', icon: '📖', data: summaryPerKategori['Kurang Pengetahuan'], border: 'border-purple-200 dark:border-purple-900/60', bg: 'bg-purple-50/50 dark:bg-purple-950/20' },
          { label: 'Lainnya', icon: '⚙️', data: summaryPerKategori['Lainnya'], border: 'border-slate-200 dark:border-slate-700', bg: 'bg-slate-50 dark:bg-slate-800/40' }
        ].map((item, i) => (
          <div 
            key={i} 
            onClick={() => setKategoriFilter(kategoriFilter === item.label ? 'ALL' : item.label)}
            className={`p-3.5 rounded-2xl border ${item.border} ${item.bg} cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
              kategoriFilter === item.label ? 'ring-2 ring-sky-500' : ''
            }`}
          >
            <div className="flex items-center justify-between text-lg mb-1">
              <span>{item.icon}</span>
              <span className="font-mono text-base font-extrabold text-slate-800 dark:text-white">
                {item.data.total}
              </span>
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
              {item.label}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span className="text-rose-600 font-semibold">{item.data.aktif} Aktif</span>
              <span className="text-emerald-600 font-semibold">{item.data.selesai} Selesai</span>
            </div>
          </div>
        ))}
      </div>

      {/* BAGIAN 1: GRAFIK RINGKASAN KENDALA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Grafik Batang: Distribusi 5 Kategori Kendala */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                <span>Grafik Distribusi Kendala per Kategori</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pemetaan frekuensi hambatan lapangan penanganan gizi balita
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Total {totalKendala} Kasus
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataKategori} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="jumlah" name="Total Kendala" radius={[6, 6, 0, 0]}>
                  {chartDataKategori.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={KATEGORI_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px]">
            {chartDataKategori.map(c => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: KATEGORI_COLORS[c.name] }} />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{c.name}: <strong>{c.jumlah}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Grafik Donut: Status Penyelesaian Kendala */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Status Penanganan Kendala
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Progres penyelesaian masalah lapangan
            </p>
          </div>

          <div className="h-48 relative flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartDataStatus.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Label Tengah */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {totalKendala}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                Kasus Kendala
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {chartDataStatus.map((st, sIdx) => (
              <div key={sIdx} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                  <span>{st.name}</span>
                </div>
                <strong className="font-mono">{st.value}</strong>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BAGIAN 2: TABEL RINGKASAN KENDALA (REKAPITULASI KATEGORI) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Tabel Ringkasan Kendala per Kategori & Rekomendasi Mitigasi
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Kolaborasi Lintas Sektor Terpadu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <th className="py-2.5 px-3">Kategori Kendala</th>
                <th className="py-2.5 px-3 text-center">Total Kasus</th>
                <th className="py-2.5 px-3 text-center">Ada Kendala (Aktif)</th>
                <th className="py-2.5 px-3 text-center">Dalam Penanganan</th>
                <th className="py-2.5 px-3 text-center">Terselesaikan</th>
                <th className="py-2.5 px-3">Mitigasi & Rekomendasi Sektor Terkait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {[
                {
                  kategori: 'Ekonomi',
                  icon: '💰',
                  data: summaryPerKategori['Ekonomi'],
                  solusi: 'Penyaluran stimulus bansos pangan bergizi (Kelurahan & Sudin Sosial), stimulan PMT telur segar/ikan.'
                },
                {
                  kategori: 'Transportasi',
                  icon: '🚤',
                  data: summaryPerKategori['Transportasi'],
                  solusi: 'Fasilitasi armada Ambulans Laut Dishub untuk penjemputan balita rujukan antar-pulau gratis.'
                },
                {
                  kategori: 'Penolakan',
                  icon: '🚫',
                  data: summaryPerKategori['Penolakan'],
                  solusi: 'Pendampingan door-to-door oleh Ketua RT, Lurah, dan Dasawisma TP-PKK untuk pendekatan persuasif keluarga.'
                },
                {
                  kategori: 'Kurang Pengetahuan',
                  icon: '📖',
                  data: summaryPerKategori['Kurang Pengetahuan'],
                  solusi: 'Demo masak MP-ASI kaya protein hewani, konseling gizi intensif oleh Petugas Gizi Puskesmas & Kader Posyandu.'
                },
                {
                  kategori: 'Lainnya',
                  icon: '⚙️',
                  data: summaryPerKategori['Lainnya'],
                  solusi: 'Intervensi sanitasi jamban sehat air bersih, penanganan medis komorbid oleh Dokter Puskesmas.'
                }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    <span className="mr-1.5">{row.icon}</span>
                    <span>{row.kategori}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white font-mono">
                    {row.data.total}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      {row.data.aktif}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      {row.data.proses}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {row.data.selesai}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                    {row.solusi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BAGIAN 3: TABEL DATA OPERASIONAL DAFTAR KENDALA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
        
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari balita, deskripsi kendala, atau pulau..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter Kategori */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Kategori:</span>
              <select
                value={kategoriFilter}
                onChange={e => setKategoriFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Ekonomi">💰 Ekonomi</option>
                <option value="Transportasi">🚤 Transportasi</option>
                <option value="Penolakan">🚫 Penolakan</option>
                <option value="Kurang Pengetahuan">📖 Kurang Pengetahuan</option>
                <option value="Lainnya">⚙️ Lainnya</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Ada Kendala">⚠️ Ada Kendala</option>
                <option value="Dalam Penanganan">⏳ Dalam Penanganan</option>
                <option value="Selesai">✅ Selesai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Data Kendala */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 w-28">Tanggal</th>
                <th className="py-3 px-3 w-32">Balita / Kode</th>
                <th className="py-3 px-3 w-28">Pulau</th>
                <th className="py-3 px-3 w-36">Kategori Kendala</th>
                <th className="py-3 px-4 min-w-[220px]">Rincian Kendala & Redaksi Masalah</th>
                <th className="py-3 px-4 min-w-[180px]">Rencana Solusi / Mitigasi</th>
                <th className="py-3 px-3 w-36">PIC / Pelapor</th>
                <th className="py-3 px-3 text-center w-28">Status</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredKendala.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ada catatan kendala yang sesuai dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredKendala.map((k, idx) => {
                  const pulau = pulauList.find(p => p.pulau_id === k.pulau_id)?.nama_pulau || k.pulau_id;
                  const sasaran = allSasaran.find(s => s.sasaran_id === k.sasaran_id || s.kode_sasaran === k.sasaran_terkait_kode);
                  const isDone = (k.status || '').toLowerCase().includes('selesai');
                  const isProses = (k.status || '').toLowerCase().includes('proses') || (k.status || '').toLowerCase().includes('penanganan');

                  return (
                    <tr key={k.kendala_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {k.tanggal_kejadian}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                            {sasaran?.kode_sasaran || k.sasaran_terkait_kode || '-'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            {sasaran?.inisial || 'Balita Terdata'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {pulau}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {getKategoriIcon(k.kategori)}
                          <span>{k.kategori}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {k.kendala_detail || k.deskripsi}
                        </div>
                        {k.dampak && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <strong>Dampak:</strong> {k.dampak}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        {k.rencana_penyelesaian}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {k.penanggung_jawab}
                        </div>
                        {k.pelapor_sektor && (
                          <div className="text-[10px] text-slate-400">{k.pelapor_sektor}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Terselesaikan
                          </span>
                        ) : isProses ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            <Clock className="w-3 h-3" /> Dalam Penanganan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" /> Ada Kendala
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(k)}
                            title="Lihat Detail Kendala"
                            className="p-1.5 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(k)}
                              title="Edit Kendala"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSendWA(k)}
                            title="Kirim Notifikasi WA"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteKendala(k.kendala_id)}
                              title="Hapus Kendala"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* MODAL: CATAT / EDIT / DETAIL KENDALA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {modalMode === 'create' && 'Catat Kendala Lapangan Baru'}
                {modalMode === 'edit' && `Ubah Kendala (${activeKendala.kendala_id})`}
                {modalMode === 'detail' && `Detail Kendala (${activeKendala.kendala_id})`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMode === 'detail' ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Wilayah & Tanggal</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {pulauList.find(p => p.pulau_id === activeKendala.pulau_id)?.nama_pulau} • {activeKendala.tanggal_kejadian}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Kategori Kendala</label>
                  <p className="font-bold text-amber-600 text-sm mt-0.5">{activeKendala.kategori}</p>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Rincian Masalah / Deskripsi</label>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed mt-1">
                    {activeKendala.kendala_detail || activeKendala.deskripsi}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Dampak pada Balita / Pelayanan</label>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed mt-1">
                    {activeKendala.dampak || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Rencana Tindak Koreksi / Solusi Lintas Sektor</label>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed mt-1">
                    {activeKendala.rencana_penyelesaian}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">PIC / Penanggung Jawab</label>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{activeKendala.penanggung_jawab}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Status Penanganan</label>
                    <p className="font-bold text-sky-600">{activeKendala.status}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-3.5">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Wilayah Pulau *
                    </label>
                    <select
                      value={activeKendala.pulau_id}
                      onChange={e => setActiveKendala(prev => ({ ...prev, pulau_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    >
                      {pulauList.map(p => (
                        <option key={p.pulau_id} value={p.pulau_id}>{p.nama_pulau}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori Kendala *
                    </label>
                    <select
                      value={activeKendala.kategori}
                      onChange={e => setActiveKendala(prev => ({ ...prev, kategori: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-semibold text-amber-700 dark:text-amber-400"
                    >
                      <option value="Ekonomi">💰 Ekonomi</option>
                      <option value="Transportasi">🚤 Transportasi</option>
                      <option value="Penolakan">🚫 Penolakan</option>
                      <option value="Kurang Pengetahuan">📖 Kurang Pengetahuan</option>
                      <option value="Lainnya">⚙️ Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sasaran Balita Terkait (Opsional):
                  </label>
                  <select
                    value={activeKendala.sasaran_id || ''}
                    onChange={e => {
                      const sas = allSasaran.find(s => s.sasaran_id === e.target.value);
                      setActiveKendala(prev => ({
                        ...prev,
                        sasaran_id: e.target.value,
                        sasaran_terkait_kode: sas?.kode_sasaran || ''
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="">-- Pilih Balita Terkait --</option>
                    {allSasaran.map(s => (
                      <option key={s.sasaran_id} value={s.sasaran_id}>
                        {s.kode_sasaran} ({s.inisial}) - {s.kategori_masalah_terakhir}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rincian Masalah / Kendala Lapangan *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={activeKendala.kendala_detail || activeKendala.deskripsi || ''}
                    onChange={e => setActiveKendala(prev => ({ 
                      ...prev, 
                      kendala_detail: e.target.value,
                      deskripsi: e.target.value 
                    }))}
                    placeholder="Uraikan detail masalah spesifik di lapangan..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dampak terhadap Balita / Pelayanan *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={activeKendala.dampak || ''}
                    onChange={e => setActiveKendala(prev => ({ ...prev, dampak: e.target.value }))}
                    placeholder="Contoh: Balita berisiko gagal tumbuh karena asupan protein hewani rendah..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rencana Solusi / Mitigasi Lintas Sektor *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={activeKendala.rencana_penyelesaian || ''}
                    onChange={e => setActiveKendala(prev => ({ ...prev, rencana_penyelesaian: e.target.value }))}
                    placeholder="Contoh: Koordinasi dengan Kelurahan untuk stimulus pangan dan pendampingan PKK Dasawisma..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PIC / Penanggung Jawab *
                    </label>
                    <input
                      type="text"
                      required
                      value={activeKendala.penanggung_jawab || ''}
                      onChange={e => setActiveKendala(prev => ({ ...prev, penanggung_jawab: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Penanganan *
                    </label>
                    <select
                      value={activeKendala.status}
                      onChange={e => setActiveKendala(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-semibold"
                    >
                      <option value="Ada Kendala">⚠️ Ada Kendala</option>
                      <option value="Dalam Penanganan">⏳ Dalam Penanganan</option>
                      <option value="Selesai">✅ Terselesaikan</option>
                    </select>
                  </div>
                </div>

                {/* WhatsApp Checkbox */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="waKendalaNotif"
                    checked={sendWANotif}
                    onChange={e => setSendWANotif(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="waKendalaNotif" className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-tight cursor-pointer">
                    <span className="font-bold">Kirim Notifikasi WhatsApp Otomatis:</span> Siarkan informasi kendala ini ke grup WhatsApp koordinasi Lintas Sektor dan Tim Faskes.
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Kendala</span>
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
