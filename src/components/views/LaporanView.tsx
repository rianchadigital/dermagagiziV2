import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Building2, 
  UserCheck,
  TrendingUp,
  Award,
  ArrowUpRight,
  TrendingDown,
  Activity,
  HeartHandshake,
  Scale,
  Baby,
  Search,
  MessageCircle,
  FileSpreadsheet,
  Check,
  Eye,
  Camera,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Cell 
} from 'recharts';
import { GlobalFilter, Pulau, User, EvaluasiKelurahanItem, EvaluasiPosyanduItem } from '../../types';
import { storageService } from '../../services/storageService';
import { exportToCSV } from '../../utils/formatters';

interface LaporanViewProps {
  filter: GlobalFilter;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilter>>;
  pulauList: Pulau[];
  currentUser: User;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  filter,
  setFilter,
  pulauList,
  currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kelurahan' | 'posyandu' | 'ringkasan' | 'rekapitulasi_tl'>('kelurahan');

  // Filter Evaluasi
  const [evalTahun, setEvalTahun] = useState<string>('2026');
  const [evalBulan, setEvalBulan] = useState<string>('ALL');
  const [evalKelurahanFilter, setEvalKelurahanFilter] = useState<string>('ALL');
  const [searchPosyanduQuery, setSearchPosyanduQuery] = useState<string>('');

  // Filter Rekapitulasi & Status Tindak Lanjut
  const [filterTindakLanjutStatus, setFilterTindakLanjutStatus] = useState<'ALL' | 'SUDAH' | 'BELUM'>('ALL');
  const [rekapFilterStatus, setRekapFilterStatus] = useState<string>('ALL');
  const [rekapFilterKelurahan, setRekapFilterKelurahan] = useState<string>('ALL');
  const [rekapSearch, setRekapSearch] = useState<string>('');

  // Modal Popup Pratinjau Foto Bukti Tindak Lanjut
  const [photoPreviewModal, setPhotoPreviewModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    namaUnit?: string;
    namaPetugas?: string;
    tanggal?: string;
    keterangan?: string;
  } | null>(null);

  const allSasaran = useMemo(() => storageService.getSasaranList(), []);
  const allUsers = useMemo(() => storageService.getUsers(), []);

  const [catatanEvaluasi, setCatatanEvaluasi] = useState(
    'Berdasarkan evaluasi terpadu Puskesmas Kepulauan Seribu Selatan periode berjalan, intervensi PMT pangan lokal ikan laut berprotein tinggi terbukti efektif meningkatkan berat badan pada 69,0% balita bermasalah gizi. Tingkat kepatuhan kunjungan kader dan nakes mencapai 85,6%. Disarankan memperkuat armada operasional kapal laut pada musim angin barat agar distribusi formula F-75/F-100 tetap tepat waktu.'
  );

  const kelurahanList = useMemo(() => storageService.getKelurahanList(), []);
  
  // Data Evaluasi Kelurahan
  const evaluasiKelurahanData: EvaluasiKelurahanItem[] = useMemo(() => {
    return storageService.getEvaluasiKelurahanReport(evalTahun, evalBulan);
  }, [evalTahun, evalBulan]);

  // Data Evaluasi Posyandu
  const evaluasiPosyanduData: EvaluasiPosyanduItem[] = useMemo(() => {
    return storageService.getEvaluasiPosyanduReport({
      kelurahan_id: evalKelurahanFilter !== 'ALL' ? evalKelurahanFilter : undefined,
      bulan: evalBulan !== 'ALL' ? evalBulan : undefined,
      tahun: evalTahun !== 'ALL' ? evalTahun : undefined
    }).filter(p => {
      if (!searchPosyanduQuery) return true;
      const q = searchPosyanduQuery.toLowerCase();
      return (
        p.nama_posyandu.toLowerCase().includes(q) ||
        p.kelurahan_nama.toLowerCase().includes(q) ||
        p.ketua_kader.toLowerCase().includes(q)
      );
    });
  }, [evalKelurahanFilter, evalBulan, evalTahun, searchPosyanduQuery]);

  // Rekapitulasi Data Gizi & Filter Tindak Lanjut (Sudah vs Belum)
  const rawTLAll = useMemo(() => {
    return storageService.getTindakLanjutList({ pulau_id: 'ALL', tahun: 'ALL', bulan: 'ALL' });
  }, []);

  const totalKasusGiziCount = rawTLAll.length;
  const sudahDitindaklanjutiCount = rawTLAll.filter(tl => 
    (tl.tindak_lanjut_lintas_sektor && tl.tindak_lanjut_lintas_sektor.length > 0) || tl.status === 'Selesai'
  ).length;
  const belumDitindaklanjutiCount = totalKasusGiziCount - sudahDitindaklanjutiCount;

  // Data Terfilter berdasarkan status tindak lanjut (Semua / Sudah / Belum)
  const rekapitulasiTindakLanjutData = useMemo(() => {
    return rawTLAll.filter(tl => {
      const s = allSasaran.find(item => item.sasaran_id === tl.sasaran_id);
      const hasAction = (tl.tindak_lanjut_lintas_sektor && tl.tindak_lanjut_lintas_sektor.length > 0) || tl.status === 'Selesai';
      
      // Filter Utama: Sudah vs Belum Ditindaklanjuti
      if (filterTindakLanjutStatus === 'SUDAH' && !hasAction) return false;
      if (filterTindakLanjutStatus === 'BELUM' && hasAction) return false;

      // Filter status umum (Selesai vs Dalam proses)
      if (rekapFilterStatus === 'Selesai' && tl.status !== 'Selesai') return false;
      if (rekapFilterStatus === 'Dalam proses' && tl.status !== 'Dalam proses') return false;
      
      // Filter kelurahan
      if (rekapFilterKelurahan !== 'ALL') {
        if (s) {
          if (rekapFilterKelurahan === 'KEL-01' && s.pulau_id !== 'PULAU-01') return false;
          if (rekapFilterKelurahan === 'KEL-02' && s.pulau_id !== 'PULAU-02' && s.pulau_id !== 'PULAU-03') return false;
          if (rekapFilterKelurahan === 'KEL-03' && s.pulau_id !== 'PULAU-04') return false;
        }
      }

      // Filter search
      if (rekapSearch) {
        const q = rekapSearch.toLowerCase();
        const matchCode = s?.kode_sasaran.toLowerCase().includes(q) || false;
        const matchName = s?.inisial.toLowerCase().includes(q) || false;
        const matchCat = tl.kategori.toLowerCase().includes(q);
        const matchPos = tl.posyandu_nama?.toLowerCase().includes(q) || false;
        const matchAksi = tl.tindak_lanjut_lintas_sektor?.some(a => 
          a.nama_unit.toLowerCase().includes(q) || a.aksi_intervensi.toLowerCase().includes(q)
        ) || false;

        if (!matchCode && !matchName && !matchCat && !matchPos && !matchAksi) return false;
      }

      return true;
    });
  }, [rawTLAll, allSasaran, filterTindakLanjutStatus, rekapFilterStatus, rekapFilterKelurahan, rekapSearch]);

  const rekapSummary = useMemo(() => {
    const total = rekapitulasiTindakLanjutData.length;
    const selesai = rekapitulasiTindakLanjutData.filter(t => t.status === 'Selesai').length;
    const proses = rekapitulasiTindakLanjutData.filter(t => t.status !== 'Selesai').length;
    const sudah = rekapitulasiTindakLanjutData.filter(t => 
      (t.tindak_lanjut_lintas_sektor && t.tindak_lanjut_lintas_sektor.length > 0) || t.status === 'Selesai'
    ).length;
    const belum = total - sudah;
    const rate = total > 0 ? Math.round((selesai / total) * 100) : 0;
    
    let totalAksiSektor = 0;
    rekapitulasiTindakLanjutData.forEach(t => {
      totalAksiSektor += (t.tindak_lanjut_lintas_sektor?.length || 0);
    });

    return { total, selesai, proses, sudah, belum, rate, totalAksiSektor };
  }, [rekapitulasiTindakLanjutData]);

  // Handler Export CSV Rekapitulasi Tindak Lanjut
  const handleExportRekapitulasiCSV = () => {
    const headers = [
      'No',
      'ID Tindak Lanjut',
      'Kode Balita',
      'Nama Inisial',
      'Wilayah Pulau',
      'Posyandu',
      'Kategori Masalah Gizi',
      'Rencana Intervensi',
      'Total Aksi Sektor',
      'Unit yang Menindaklanjuti',
      'Tenggat',
      'Tanggal Selesai',
      'Status Kasus'
    ];
    const rows = rekapitulasiTindakLanjutData.map((tl, i) => {
      const s = allSasaran.find(item => item.sasaran_id === tl.sasaran_id);
      const p = pulauList.find(item => item.pulau_id === s?.pulau_id);
      const units = tl.tindak_lanjut_lintas_sektor?.map(u => `${u.nama_unit} (${u.status_hasil})`).join('; ') || '-';
      return [
        i + 1,
        tl.tindak_lanjut_id,
        s?.kode_sasaran || tl.sasaran_id,
        s?.inisial || '-',
        p?.nama_pulau || 'Kepulauan Seribu Selatan',
        tl.posyandu_nama || '-',
        s?.kategori_masalah_terakhir || tl.kategori,
        tl.rencana_intervensi,
        tl.tindak_lanjut_lintas_sektor?.length || 0,
        units,
        tl.tenggat,
        tl.tanggal_selesai || '-',
        tl.status
      ];
    });
    exportToCSV(`Rekapitulasi_Tindak_Lanjut_Gizi_${evalTahun}`, headers, rows);
  };

  // Data Ringkasan Terpadu KPI
  const stats = storageService.getDashboardStats(filter);
  const { kpi, ringkasanPulau } = stats;
  const tindakLanjutList = storageService.getTindakLanjutList(filter);

  // 5 Top Metric Cards from Lampiran 2 Menu 6 (85,6%, 73,6%, 69,0%, 91,0%, 55,6%)
  const metrics = [
    {
      title: 'Kepatuhan Kunjungan',
      value: '85,6%',
      badge: '+2.4%',
      badgePositive: true,
      subtext: '411 dari 480 sasaran',
      icon: UserCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/50'
    },
    {
      title: 'Penyelesaian Tindak Lanjut',
      value: '73,6%',
      badge: '53 / 72',
      badgePositive: true,
      subtext: 'Target tuntas bulan ini',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50'
    },
    {
      title: 'Intervensi Efektif',
      value: '69,0%',
      badge: '+5.1%',
      badgePositive: true,
      subtext: 'Peningkatan BB 33 balita',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/50'
    },
    {
      title: 'Cakupan Penimbangan (D/S)',
      value: '91,0%',
      badge: '437 / 480',
      badgePositive: true,
      subtext: 'Target SPM tercapai',
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Sinergi Lintas Sektor',
      value: '55,6%',
      badge: '5 / 9 program',
      badgePositive: false,
      subtext: 'Dukungan pangan & edukasi',
      icon: HeartHandshake,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50'
    }
  ];

  // Handler Export CSV Posyandu
  const handleExportPosyanduCSV = () => {
    const headers = [
      'ID Posyandu',
      'Nama Posyandu',
      'Kelurahan',
      'Pulau',
      'Sasaran (S)',
      'Ditimbang (D)',
      'Tidak Hadir (T)',
      'Cakupan D/S (%)',
      'Gizi Baik',
      'Gizi Kurang',
      'Gizi Buruk',
      'Stunting',
      'Underweight',
      'Total Masalah Gizi',
      'Ketua Kader',
      'No. WA Kader',
      'Status Laporan'
    ];
    const rows = evaluasiPosyanduData.map(p => [
      p.posyandu_id,
      p.nama_posyandu,
      p.kelurahan_nama,
      p.pulau_nama,
      p.total_sasaran,
      p.total_ditimbang,
      p.total_tidak_hadir,
      p.persentase_d_s,
      p.gizi_baik,
      p.gizi_kurang,
      p.gizi_buruk,
      p.stunting,
      p.underweight,
      p.total_masalah_gizi,
      p.ketua_kader,
      p.no_wa_kader,
      p.status_pelaksanaan
    ]);
    exportToCSV(`Evaluasi_Posyandu_${evalTahun}_${evalBulan}`, headers, rows);
  };

  const handleExportKelurahanCSV = () => {
    const headers = [
      'ID Kelurahan',
      'Nama Kelurahan',
      'Jumlah Posyandu',
      'Total Sasaran (S)',
      'Total Ditimbang (D)',
      'Total Tidak Hadir (T)',
      'Cakupan D/S (%)',
      'Gizi Baik',
      'Gizi Kurang',
      'Gizi Buruk',
      'Stunting',
      'Underweight',
      'Total Kasus Gizi',
      'Tindak Lanjut Selesai',
      'Tindak Lanjut Dalam Proses',
      'Tindak Lanjut Belum',
      '% Kasus Selesai'
    ];
    const rows = evaluasiKelurahanData.map(k => [
      k.kelurahan_id,
      k.nama_kelurahan,
      k.total_posyandu,
      k.total_sasaran,
      k.total_ditimbang,
      k.total_tidak_hadir,
      k.persentase_d_s,
      k.gizi_baik,
      k.gizi_kurang,
      k.gizi_buruk,
      k.stunting,
      k.underweight,
      k.total_masalah_gizi,
      k.tindak_lanjut_selesai,
      k.tindak_lanjut_proses,
      k.tindak_lanjut_belum,
      k.persentase_tl_selesai
    ]);
    exportToCSV(`Evaluasi_Kelurahan_${evalTahun}_${evalBulan}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
              Laporan Evaluasi Gizi Wilayah
            </h1>
            <span className="text-xs bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full">
              Puskesmas Kepulauan Seribu Selatan
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluasi capaian penimbangan balita (D/S), prevalensi kasus gizi, dan efektivitas intervensi <strong>Berdasarkan Kelurahan</strong> dan <strong>Berdasarkan Posyandu</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Laporan</span>
          </button>

          <button
            onClick={() => {
              if (activeSubTab === 'kelurahan') handleExportKelurahanCSV();
              else if (activeSubTab === 'posyandu') handleExportPosyanduCSV();
              else if (activeSubTab === 'rekapitulasi_tl') handleExportRekapitulasiCSV();
              else handleExportKelurahanCSV();
            }}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Main Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('kelurahan')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'kelurahan'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Evaluasi Berdasarkan Kelurahan</span>
          </button>

          <button
            onClick={() => setActiveSubTab('posyandu')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'posyandu'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Evaluasi Berdasarkan Posyandu</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rekapitulasi_tl')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'rekapitulasi_tl'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Data Gizi Bermasalah & Status Tindak Lanjut</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ringkasan')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'ringkasan'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Ringkasan Indikator Terpadu</span>
          </button>
        </div>

        {/* Global Year & Month Filter */}
        <div className="flex items-center gap-2">
          <select
            value={evalBulan}
            onChange={(e) => setEvalBulan(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Bulan</option>
            <option value="10">Oktober 2026</option>
            <option value="09">September 2026</option>
            <option value="08">Agustus 2026</option>
          </select>

          <select
            value={evalTahun}
            onChange={(e) => setEvalTahun(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 font-mono"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* TAB 1: EVALUASI BERDASARKAN KELURAHAN */}
      {activeSubTab === 'kelurahan' && (
        <div className="space-y-6">
          
          {/* 3 Kelurahan Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {evaluasiKelurahanData.map((kel) => {
              const isTargetAchieved = kel.persentase_d_s >= 80;
              return (
                <div 
                  key={kel.kelurahan_id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold">
                        {kel.kelurahan_id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {kel.nama_kelurahan}
                      </h3>
                      <div className="text-xs text-slate-500">{kel.total_posyandu} Posyandu Aktif</div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isTargetAchieved 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {kel.persentase_d_s}% (D/S)
                    </span>
                  </div>

                  {/* Penimbangan Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">Sasaran (S)</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5 font-mono text-sm">
                        {kel.total_sasaran}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-sky-600">Ditimbang (D)</div>
                      <div className="font-bold text-sky-700 dark:text-sky-400 mt-0.5 font-mono text-sm">
                        {kel.total_ditimbang}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-600">Tidak Hadir (T)</div>
                      <div className="font-bold text-amber-700 dark:text-amber-400 mt-0.5 font-mono text-sm">
                        {kel.total_tidak_hadir}
                      </div>
                    </div>
                  </div>

                  {/* Temuan Kasus Gizi */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Total Kasus Gizi:</span>
                      <span className="font-bold text-rose-600 font-mono">{kel.total_masalah_gizi} Balita</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                      <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-900/40">
                        <div className="text-amber-700 font-bold">{kel.gizi_kurang}</div>
                        <div className="text-slate-500 truncate">Wasting</div>
                      </div>
                      <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900/40">
                        <div className="text-rose-700 font-bold">{kel.gizi_buruk}</div>
                        <div className="text-slate-500 truncate">Buruk</div>
                      </div>
                      <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded border border-purple-200 dark:border-purple-900/40">
                        <div className="text-purple-700 font-bold">{kel.stunting}</div>
                        <div className="text-slate-500 truncate">Stunting</div>
                      </div>
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900/40">
                        <div className="text-blue-700 font-bold">{kel.underweight}</div>
                        <div className="text-slate-500 truncate">Underwt</div>
                      </div>
                    </div>
                  </div>

                  {/* Tindak Lanjut Completion Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Penyelesaian Tindak Lanjut</span>
                      <span className="font-bold text-emerald-600">{kel.persentase_tl_selesai}% Selesai</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, kel.persentase_tl_selesai)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphic Comparison: Cakupan D/S and Kasus Gizi per Kelurahan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Chart 1: Cakupan D/S vs Target 80% */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Perbandingan Cakupan Penimbangan D/S (%) Antar Kelurahan
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Target SPM Nasional adalah minimal 80% balita sasaran hadir dan ditimbang
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evaluasiKelurahanData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="nama_kelurahan" 
                      tick={{ fontSize: 11 }} 
                      tickFormatter={(v) => v.replace('Kelurahan ', '')}
                    />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'Cakupan D/S']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="persentase_d_s" name="Cakupan D/S (%)" radius={[6, 6, 0, 0]}>
                      {evaluasiKelurahanData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.persentase_d_s >= 80 ? '#10b981' : '#f43f5e'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Sebaran Masalah Gizi */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Sebaran Kasus Gizi (Gizi Kurang, Gizi Buruk, Stunting)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Jumlah balita yang membutuhkan tindak lanjut intervensi pangan dan medis
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evaluasiKelurahanData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="nama_kelurahan" 
                      tick={{ fontSize: 11 }} 
                      tickFormatter={(v) => v.replace('Kelurahan ', '')}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="gizi_kurang" name="Wasting / Gizi Kurang" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stunting" name="Stunting (Pendek)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gizi_buruk" name="Gizi Buruk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Table Rekapitulasi Evaluasi Kelurahan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tabel Matriks Rekapitulasi Evaluasi 3 Kelurahan
              </h3>
              <button
                onClick={handleExportKelurahanCSV}
                className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-sky-200 dark:border-sky-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Rekap Kelurahan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Kelurahan</th>
                    <th className="py-3 px-4 text-center">Posyandu</th>
                    <th className="py-3 px-4 text-center">Sasaran (S)</th>
                    <th className="py-3 px-4 text-center">Ditimbang (D)</th>
                    <th className="py-3 px-4 text-center">Tidak Hadir (T)</th>
                    <th className="py-3 px-4 text-center">Cakupan (D/S)</th>
                    <th className="py-3 px-4 text-center">Gizi Kurang</th>
                    <th className="py-3 px-4 text-center">Gizi Buruk</th>
                    <th className="py-3 px-4 text-center">Stunting</th>
                    <th className="py-3 px-4 text-center">Underweight</th>
                    <th className="py-3 px-4 text-center">Total Masalah</th>
                    <th className="py-3 px-4 text-center">TL Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {evaluasiKelurahanData.map((k) => (
                    <tr key={k.kelurahan_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {k.nama_kelurahan}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{k.total_posyandu} Pos</td>
                      <td className="py-3.5 px-4 text-center font-mono">{k.total_sasaran}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-600">{k.total_ditimbang}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-600">{k.total_tidak_hadir}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          k.persentase_d_s >= 80 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {k.persentase_d_s}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-700 font-semibold">{k.gizi_kurang}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-rose-700 font-bold">{k.gizi_buruk}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-purple-700 font-semibold">{k.stunting}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-blue-700">{k.underweight}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold font-mono">
                          {k.total_masalah_gizi} Anak
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                        {k.persentase_tl_selesai}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: EVALUASI BERDASARKAN POSYANDU */}
      {activeSubTab === 'posyandu' && (
        <div className="space-y-4">
          
          {/* Filters Bar Posyandu */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500">Filter Kelurahan:</span>
              <select
                value={evalKelurahanFilter}
                onChange={(e) => setEvalKelurahanFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Semua Kelurahan</option>
                {kelurahanList.map(k => (
                  <option key={k.kelurahan_id} value={k.kelurahan_id}>{k.nama_kelurahan}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama posyandu / kader..."
                  value={searchPosyanduQuery}
                  onChange={(e) => setSearchPosyanduQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-56"
                />
              </div>

              <button
                onClick={handleExportPosyanduCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Excel/CSV</span>
              </button>
            </div>
          </div>

          {/* Table Matriks Posyandu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Posyandu</th>
                    <th className="py-3 px-4">Kelurahan & Pulau</th>
                    <th className="py-3 px-4 text-center">Sasaran (S)</th>
                    <th className="py-3 px-4 text-center">Ditimbang (D)</th>
                    <th className="py-3 px-4 text-center">Tidak Hadir (T)</th>
                    <th className="py-3 px-4 text-center">Cakupan (D/S)</th>
                    <th className="py-3 px-4 text-center">Temuan Masalah Gizi</th>
                    <th className="py-3 px-4">Ketua Kader & Kontak</th>
                    <th className="py-3 px-4 text-center">Status Laporan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {evaluasiPosyanduData.map((p) => {
                    const isTargetAchieved = p.persentase_d_s >= 80;
                    return (
                      <tr key={p.posyandu_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {p.nama_posyandu}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-sky-700 dark:text-sky-300">{p.kelurahan_nama}</div>
                          <div className="text-[10px] text-slate-400">{p.pulau_nama}</div>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          {p.total_sasaran}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-sky-600">
                          {p.total_ditimbang}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-amber-600">
                          {p.total_tidak_hadir}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isTargetAchieved 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {p.persentase_d_s}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {p.total_masalah_gizi > 0 ? (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">
                                {p.total_masalah_gizi} Balita
                              </span>
                              <div className="text-[9px] text-slate-400">
                                W:{p.gizi_kurang} · B:{p.gizi_buruk} · S:{p.stunting}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium">Nihil Kasus</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{p.ketua_kader}</div>
                          <a
                            href={`https://wa.me/${p.no_wa_kader.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(p.ketua_kader)}%20(${encodeURIComponent(p.nama_posyandu)}),%20koordinasi%20evaluasi%20penimbangan%20gizi.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>{p.no_wa_kader}</span>
                          </a>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status_pelaksanaan === 'Sudah Lapor'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {p.status_pelaksanaan === 'Sudah Lapor' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Sudah Lapor</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Menunggu</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: DATA GIZI BERMASALAH & STATUS TINDAK LANJUT */}
      {activeSubTab === 'rekapitulasi_tl' && (
        <div className="space-y-6">

          {/* Baris Tombol Filter Utama: Sudah vs Belum Ditindaklanjuti */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sky-600" />
                <span>Filter Tindak Lanjut:</span>
              </span>

              <button
                type="button"
                onClick={() => setFilterTindakLanjutStatus('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterTindakLanjutStatus === 'ALL'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Semua Data Gizi</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterTindakLanjutStatus === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  {totalKasusGiziCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTindakLanjutStatus('SUDAH')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterTindakLanjutStatus === 'SUDAH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${filterTindakLanjutStatus === 'SUDAH' ? 'text-white' : 'text-emerald-500'}`} />
                <span>Sudah Ditindaklanjuti</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterTindakLanjutStatus === 'SUDAH' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'}`}>
                  {sudahDitindaklanjutiCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTindakLanjutStatus('BELUM')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterTindakLanjutStatus === 'BELUM'
                    ? 'bg-rose-600 text-white shadow-xs animate-none'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className={`w-3.5 h-3.5 ${filterTindakLanjutStatus === 'BELUM' ? 'text-white' : 'text-rose-500'}`} />
                <span>Belum Ditindaklanjuti</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterTindakLanjutStatus === 'BELUM' ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'}`}>
                  {belumDitindaklanjutiCount}
                </span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              Menampilkan <strong>{rekapSummary.total}</strong> dari <strong>{totalKasusGiziCount}</strong> kasus gizi
            </div>
          </div>

          {/* Metric Cards Rekapitulasi & Status Tindak Lanjut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-xs font-medium">Total Kasus Terfilter</span>
                <HeartHandshake className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {rekapSummary.total}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Balita bermasalah gizi</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
                <span className="text-xs font-semibold">Sudah Ditindaklanjuti</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                {sudahDitindaklanjutiCount}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                {totalKasusGiziCount > 0 ? `${Math.round((sudahDitindaklanjutiCount / totalKasusGiziCount) * 100)}% dari total kasus` : '0%'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
                <span className="text-xs font-semibold">Belum Ditindaklanjuti</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
                {belumDitindaklanjutiCount}
              </div>
              <div className="text-[10px] text-rose-600 font-semibold mt-1">Perlu respon cepat unit</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-xs font-medium">Kasus Selesai</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {rekapSummary.selesai}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-1">Disahkan Petugas Gizi</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-xs font-medium">Aksi Lintas Sektor</span>
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {rekapSummary.totalAksiSektor}
              </div>
              <div className="text-[10px] text-indigo-600 mt-1">Tercatat di lapangan</div>
            </div>
          </div>

          {/* Filter & Action Bar Rekapitulasi */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Status:</span>
                <select
                  value={rekapFilterStatus}
                  onChange={(e) => setRekapFilterStatus(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 font-medium outline-none"
                >
                  <option value="ALL">Semua Kasus</option>
                  <option value="Selesai">Hanya Selesai (Tuntas)</option>
                  <option value="Dalam proses">Dalam Proses Intervensi</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Kelurahan:</span>
                <select
                  value={rekapFilterKelurahan}
                  onChange={(e) => setRekapFilterKelurahan(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 font-medium outline-none"
                >
                  <option value="ALL">Semua Kelurahan</option>
                  {kelurahanList.map(k => (
                    <option key={k.kelurahan_id} value={k.kelurahan_id}>
                      {k.nama_kelurahan}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari balita / posyandu / aksi..."
                  value={rekapSearch}
                  onChange={(e) => setRekapSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-56 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Cetak Laporan Rekapitulasi PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportRekapitulasiCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* Tabel Detail Rekapitulasi Kasus yang Sudah Ditindaklanjuti */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Daftar Rekapitulasi Sasaran yang Sudah Ditindaklanjuti ({rekapitulasiTindakLanjutData.length} Kasus)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Riwayat lengkap intervensi kolaborasi lintas sektor (Kader, Kecamatan, Petugas Puskesmas, Kelurahan, PKK, TPK) beserta bukti dokumentasi.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-3 text-center">No</th>
                    <th className="py-3 px-3">Kode & Balita</th>
                    <th className="py-3 px-3">Wilayah & Posyandu</th>
                    <th className="py-3 px-3">Masalah Gizi Awal</th>
                    <th className="py-3 px-3">Rencana Intervensi</th>
                    <th className="py-3 px-3 text-center">Status Tindak Lanjut</th>
                    <th className="py-3 px-3">Aksi Kolaborasi Lintas Sektor</th>
                    <th className="py-3 px-3 text-center">Bukti Foto</th>
                    <th className="py-3 px-3">Tenggat / Selesai</th>
                    <th className="py-3 px-3 text-center">Status Kasus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rekapitulasiTindakLanjutData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Tidak ada data masalah gizi yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    rekapitulasiTindakLanjutData.map((tl, index) => {
                      const s = allSasaran.find(item => item.sasaran_id === tl.sasaran_id);
                      const p = pulauList.find(item => item.pulau_id === s?.pulau_id);
                      const nakes = allUsers.find(u => u.user_id === tl.petugas_id);

                      return (
                        <tr key={tl.tindak_lanjut_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {index + 1}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {s?.kode_sasaran || tl.sasaran_id}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              Inisial: {s?.inisial || '-'} ({s?.jenis_kelamin || '-'})
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {p?.nama_pulau || 'Kepulauan Seribu Selatan'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {tl.posyandu_nama || 'Posyandu Wilayah'}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              {s?.kategori_masalah_terakhir || tl.kategori}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="max-w-[200px] text-[11px] text-slate-700 dark:text-slate-300">
                              {tl.rencana_intervensi}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {(tl.tindak_lanjut_lintas_sektor && tl.tindak_lanjut_lintas_sektor.length > 0) || tl.status === 'Selesai' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Sudah Ditindaklanjuti</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Belum Ditindaklanjuti</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="max-w-[280px] space-y-1">
                              {tl.tindak_lanjut_lintas_sektor && tl.tindak_lanjut_lintas_sektor.length > 0 ? (
                                tl.tindak_lanjut_lintas_sektor.map((item, aIdx) => (
                                  <div 
                                    key={aIdx} 
                                    className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-[10px]"
                                  >
                                    <div className="flex items-center justify-between font-bold text-emerald-950 dark:text-emerald-300">
                                      <span>{item.nama_unit.split('(')[0].trim()}</span>
                                      <span className="text-emerald-700 font-mono">{item.status_hasil}</span>
                                    </div>
                                    <div className="text-slate-700 dark:text-slate-300 mt-0.5 truncate" title={item.aksi_intervensi}>
                                      • {item.aksi_intervensi}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Belum ada catatan aksi unit</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {tl.foto_dokumen || (tl.tindak_lanjut_lintas_sektor?.some(a => a.foto_dokumen)) ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const photoUrl = tl.foto_dokumen || tl.tindak_lanjut_lintas_sektor?.find(a => a.foto_dokumen)?.foto_dokumen;
                                  if (photoUrl) {
                                    setPhotoPreviewModal({
                                      isOpen: true,
                                      url: photoUrl,
                                      title: `Dokumentasi Intervensi: ${s?.inisial || tl.sasaran_id}`,
                                      namaUnit: tl.tindak_lanjut_lintas_sektor?.[0]?.nama_unit || 'Dokumentasi Terpadu',
                                      namaPetugas: tl.tindak_lanjut_lintas_sektor?.[0]?.nama_petugas || nakes?.nama || 'Petugas',
                                      tanggal: tl.tanggal_selesai || tl.tanggal_rencana,
                                      keterangan: tl.rencana_intervensi
                                    });
                                  }
                                }}
                                className="px-2.5 py-1 bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 text-sky-800 dark:text-sky-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 border border-sky-300 dark:border-sky-700 cursor-pointer shadow-2xs"
                                title="Lihat Foto Bukti Dokumentasi"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Lihat Foto</span>
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-[11px]">-</span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                            <div>Tenggat: {tl.tenggat}</div>
                            {tl.tanggal_selesai && (
                              <div className="text-emerald-600 font-semibold mt-0.5">Selesai: {tl.tanggal_selesai}</div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              tl.status === 'Selesai'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300'
                            }`}>
                              {tl.status === 'Selesai' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Selesai (Nakes)</span>
                                </>
                              ) : (
                                <>
                                  <Activity className="w-3 h-3 text-sky-600" />
                                  <span>Dalam Proses</span>
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Lembar Tanda Tangan Cetak Resmi (Muncul saat print PDF) */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 print:block mt-4 text-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 text-center">
                <div className="space-y-1">
                  <p className="text-slate-500">Mengetahui,</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Kepala Puskesmas Kec. Kepulauan Seribu Selatan</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900 dark:text-white">dr. Ahmad Faisal, M.K.M</p>
                  <p className="text-slate-500 text-[11px]">NIP. 198205142008011005</p>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-500">Kepulauan Seribu Selatan, {new Date().toLocaleDateString('id-ID')}</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Penanggung Jawab Program Gizi & KIA</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900 dark:text-white">Siti Rahmawati, S.Gz</p>
                  <p className="text-slate-500 text-[11px]">NIP. 199108202015022003</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: RINGKASAN INDIKATOR TERPADU (ORIGINAL VIEW ENHANCED) */}
      {activeSubTab === 'ringkasan' && (
        <div className="space-y-6">
          
          {/* 5 Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div 
                  key={i} 
                  className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                      {m.title}
                    </span>
                    <div className={`p-1.5 rounded-lg ${m.bg} ${m.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                      {m.value}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        m.badgePositive 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                      }`}>
                        {m.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {m.subtext}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analisis & Rekomendasi Terpadu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              <span>Analisis & Rekomendasi Tim Koordinasi Penurunan Stunting (TPPS)</span>
            </h3>

            <textarea
              rows={4}
              value={catatanEvaluasi}
              onChange={(e) => setCatatanEvaluasi(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 leading-relaxed"
            />
            
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Disusun oleh Petugas Nutrisionis & Tim Koordinasi Puskesmas Kepulauan Seribu Selatan</span>
              <button 
                onClick={() => alert('Catatan evaluasi berhasil disimpan!')}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Simpan Catatan
              </button>
            </div>
          </div>

        </div>
      )}

      {/* POPUP MODAL PREVIEW FOTO DOKUMENTASI BUKTI INTERVENSI */}
      {photoPreviewModal && photoPreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {photoPreviewModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {photoPreviewModal.namaUnit} • {photoPreviewModal.namaPetugas} • {photoPreviewModal.tanggal}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoPreviewModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center max-h-[60vh] border border-slate-200 dark:border-slate-800">
              <img 
                src={photoPreviewModal.url} 
                alt={photoPreviewModal.title} 
                className="max-h-[60vh] w-auto max-w-full object-contain"
              />
            </div>

            {photoPreviewModal.keterangan && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                <strong>Uraian Kegiatan / Evaluasi:</strong> {photoPreviewModal.keterangan}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPhotoPreviewModal(null)}
                className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold rounded-xl text-xs hover:opacity-90 cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
