import React, { useState } from 'react';
import { 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  MapPin, 
  Calendar,
  AlertTriangle,
  Info,
  Send,
  UserCheck,
  ChevronRight,
  Search,
  Filter,
  Eye,
  Ship,
  Sparkles,
  TrendingUp,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { GlobalFilter, Pulau, TindakLanjut, SasaranBalita } from '../../types';
import { storageService } from '../../services/storageService';
import { InteractiveArchipelagoMap } from '../common/InteractiveArchipelagoMap';

interface DashboardViewProps {
  filter: GlobalFilter;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilter>>;
  pulauList: Pulau[];
  onNavigateTab: (tab: any, params?: any) => void;
  onOpenWhatsAppModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  filter,
  setFilter,
  pulauList,
  onNavigateTab,
  onOpenWhatsAppModal
}) => {
  const [searchTable, setSearchTable] = useState('');
  const [activeSubView, setActiveSubView] = useState<'operasional' | 'ringkasan_pulau'>('operasional');

  const stats = storageService.getDashboardStats(filter);
  const { kpi, overdueList, ringkasanPulau, distribusiGiziData, kendalaAksesData, trendComboData, notifikasiInformasi } = stats;

  const allSasaran = storageService.getSasaranList();
  const allTindakLanjut = storageService.getTindakLanjutList(filter);
  const allLintasSektor = storageService.getLintasSektorList();

  // Filtered operational tindak lanjut table rows (showing first 5 by default, matching mockup)
  const displayTindakLanjut = allTindakLanjut
    .filter(tl => {
      if (!searchTable) return true;
      const q = searchTable.toLowerCase();
      const s = allSasaran.find(item => item.sasaran_id === tl.sasaran_id);
      return (
        (s?.kode_sasaran && s.kode_sasaran.toLowerCase().includes(q)) ||
        (s?.inisial && s.inisial.toLowerCase().includes(q)) ||
        tl.rencana_intervensi.toLowerCase().includes(q)
      );
    })
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">Selesai</span>;
      case 'Dalam proses':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">Dalam proses</span>;
      case 'Belum ditindaklanjuti':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">Terlambat</span>;
      case 'Menunggu koordinasi':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">Terjadwal</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">{status}</span>;
    }
  };

  const getLintasStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">Selesai</span>;
      case 'Berjalan':
      case 'Dalam proses':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">Dalam proses</span>;
      case 'Menunggu Evaluasi':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300">Perlu koordinasi</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Belum dimulai</span>;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Peringatan Otomatis Jika Ada Tenggat Terlewat */}
      {overdueList.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                  {overdueList.length} Tindak Lanjut Melewati Tenggat Waktu
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                  Perlu Tindakan
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Balita bermasalah gizi memerlukan intervensi lanjutan dan konfirmasi dari petugas penanggung jawab serta kader.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('kinerja-role')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Monitoring Kinerja</span>
            </button>
            <button
              onClick={onOpenWhatsAppModal}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Notifikasi WA</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Baris 5 Kartu Indikator Statistik Utama (Presisi Lampiran 1 & 2) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Sasaran Balita */}
        <div className="bg-[#f0f8ff] dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
              Total Sasaran Balita
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-tight">
              {kpi.totalSasaran}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {kpi.diffSasaran}
            </div>
          </div>
        </div>

        {/* Card 2: Balita Bermasalah Gizi (Terverifikasi) */}
        <div className="bg-[#fff7ed] dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
              Balita Bermasalah Gizi (Terverifikasi)
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-tight">
              {kpi.bermasalahGizi}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              15,0% dari total sasaran
            </div>
          </div>
        </div>

        {/* Card 3: Cakupan Pemantauan */}
        <div className="bg-[#eff6ff] dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
              Cakupan Pemantauan
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-tight">
              {kpi.sasaranDipantau}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {kpi.persenCakupan}% dari sasaran
            </div>
          </div>
        </div>

        {/* Card 4: Tindak Lanjut Selesai */}
        <div className="bg-[#f0fdf4] dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
              Tindak Lanjut Selesai
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-tight">
              {kpi.tlSelesai}
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {kpi.persenSelesai}% dari {kpi.bermasalahGizi} sasaran
            </div>
          </div>
        </div>

        {/* Card 5: Tindak Lanjut Tertunda */}
        <div className="bg-[#fef2f2] dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
              Tindak Lanjut Tertunda
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-tight">
              {kpi.tlTertunda}
            </div>
            <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mt-0.5">
              {kpi.persenTertunda}% dari {kpi.bermasalahGizi} sasaran
            </div>
          </div>
        </div>

      </div>

      {/* 2. Baris Tengah: Peta Sebaran (Kiri) & Grafik Analisis (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Kolom Kiri (7/12): Peta Sebaran dan Kebutuhan Tindak Lanjut per Pulau */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Peta Sebaran dan Kebutuhan Tindak Lanjut per Pulau
              </h3>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <button
              onClick={() => onNavigateTab('map')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 transition-colors"
            >
              <span>Lihat Detail Peta</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Archipelago Vector Sea Map */}
          <div className="flex-1">
            <InteractiveArchipelagoMap
              pulauList={pulauList}
              selectedPulauId={filter.pulau_id === 'ALL' ? undefined : filter.pulau_id}
              onSelectPulau={(id) => setFilter(prev => ({ ...prev, pulau_id: id }))}
              heightClass="h-[380px]"
            />
          </div>
        </div>

        {/* Kolom Kanan (5/12): Tren Kasus & Grafik Distribusi + Kendala */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Card Atas: Tren Kasus dan Penyelesaian Tindak Lanjut (6 Bulan Terakhir) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                  Tren Kasus dan Penyelesaian TindakLanjut
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg shrink-0">
                6 Bulan Terakhir
              </span>
            </div>

            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendComboData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="bulan" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#f97316" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, fontSize: 11, background: '#0f172a', color: '#fff' }}
                    formatter={(val, name) => [name === 'persen' ? `${val}%` : `${val} kasus`, name === 'kasus' ? 'Kasus Terverifikasi' : name === 'selesai' ? 'Tindak Lanjut Selesai' : 'Persentase']}
                  />
                  <Bar yAxisId="left" dataKey="kasus" name="kasus" fill="#0f2b48" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar yAxisId="left" dataKey="selesai" name="selesai" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
                  <Line yAxisId="right" type="monotone" dataKey="persen" name="persen" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: '#f97316' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend for ComposedChart */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0f2b48]" />
                <span>Kasus terverifikasi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]" />
                <span>Tindak lanjut selesai</span>
              </div>
              <div className="flex items-center gap-1.5 text-orange-600 font-medium">
                <span className="w-2.5 h-1 rounded-full bg-[#f97316]" />
                <span>Persentase penyelesaian</span>
              </div>
            </div>
          </div>

          {/* Baris Bawah Kolom Kanan: Distribusi Kategori Masalah Gizi & Jenis Kendala Akses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
            
            {/* Card Donut: Distribusi Kategori Masalah Gizi */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                Distribusi Kategori Masalah Gizi
              </h4>

              <div className="relative h-28 flex items-center justify-center my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribusiGiziData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {distribusiGiziData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none">72</span>
                  <span className="text-[9px] text-slate-400">kasus</span>
                </div>
              </div>

              <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                {distribusiGiziData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </div>
                    <span className="font-mono font-medium shrink-0 ml-1">{d.count} ({d.persen})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Progress Bars: Jenis Kendala Akses (Bulan Ini) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Jenis Kendala Akses (Bulan Ini)
                </h4>
              </div>

              <div className="space-y-2 text-[10px] my-auto">
                {kendalaAksesData.map(k => (
                  <div key={k.jenis}>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-0.5">
                      <span className="truncate">{k.jenis}</span>
                      <span className="font-mono font-bold">{k.count}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(k.count / 10) * 100}%`,
                          backgroundColor: k.color 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigateTab('kendala')}
                className="mt-2 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center justify-between"
              >
                <span>Lihat Seluruh Kendala</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* 3. Baris Bawah: Daftar Tindak Lanjut (Kiri) & Tugas Lintas Sektor (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Kolom Kiri (7/12): Daftar Tindak Lanjut Balita Bermasalah Gizi */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Daftar Tindak Lanjut Balita Bermasalah Gizi
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('tindak-lanjut')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search bar inside Card */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Cari kode balita, nama inisial, atau pulau..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-sky-500"
              />
            </div>
            <button
              onClick={() => onNavigateTab('tindak-lanjut')}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 shrink-0"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Lanjutan</span>
            </button>
          </div>

          {/* Table Data (Presisi Kolom Lampiran 1) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2 pr-2">Kode Balita</th>
                  <th className="py-2 px-2">Inisial</th>
                  <th className="py-2 px-2">Pulau / Wilayah</th>
                  <th className="py-2 px-2">Kategori Masalah Gizi</th>
                  <th className="py-2 px-2">Rencana Intervensi</th>
                  <th className="py-2 px-2">Target Tindak Lanjut</th>
                  <th className="py-2 px-2">Penanggung Jawab</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 pl-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayTindakLanjut.map(tl => {
                  const s = allSasaran.find(item => item.sasaran_id === tl.sasaran_id);
                  const p = pulauList.find(item => item.pulau_id === s?.pulau_id);

                  return (
                    <tr key={tl.tindak_lanjut_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 pr-2 font-mono font-bold text-sky-700 dark:text-sky-400">
                        {s?.kode_sasaran || tl.sasaran_id}
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-200">
                        {s?.inisial || '-'}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {p?.nama_pulau || 'Pulau Tidung'}
                      </td>
                      <td className="py-2.5 px-2 text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">
                        {s?.kategori_masalah_terakhir || tl.kategori}
                      </td>
                      <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300 max-w-[150px] truncate" title={tl.rencana_intervensi}>
                        {tl.rencana_intervensi}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {tl.tenggat}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        Petugas Gizi
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {getStatusBadge(tl.status)}
                      </td>
                      <td className="py-2.5 pl-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => onNavigateTab('tindak-lanjut')}
                          className="p-1 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Kolom Kanan (5/12): Tugas dan Koordinasi Lintas Sektor */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Tugas dan Koordinasi Lintas Sektor
            </h3>
            <button
              onClick={() => onNavigateTab('lintas-sektor')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2 pr-2">Tugas / Kegiatan</th>
                  <th className="py-2 px-2">Penanggung Jawab</th>
                  <th className="py-2 px-2">Tenggat</th>
                  <th className="py-2 px-2">Progres</th>
                  <th className="py-2 pl-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {allLintasSektor.slice(0, 5).map(ls => (
                  <tr key={ls.kegiatan_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pr-2 font-medium text-slate-800 dark:text-slate-200 max-w-[140px] truncate" title={ls.nama_kegiatan}>
                      {ls.nama_kegiatan}
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {ls.penanggung_jawab.split(' ')[0]}
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {ls.tenggat}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-sky-500" 
                            style={{ width: `${ls.progres}%` }} 
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 font-semibold">{ls.progres}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-2 whitespace-nowrap">
                      {getLintasStatusBadge(ls.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* 4. Alternate Executive View Toggle (Sesuai Lampiran 2 #1: Ringkasan per Pulau & Notifikasi) */}
      <div className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Rekap Wilayah & Peringatan Siaga Pulau
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribusi beban kasus dan antrean koordinasi lapangan Puskesmas Kepulauan Seribu Selatan.
            </p>
          </div>
          <button
            onClick={onOpenWhatsAppModal}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Pusat Notifikasi WA</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* 4 Kartu Ringkasan per Pulau (Lampiran 2 #1) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ringkasanPulau.map(p => (
              <div 
                key={p.id}
                onClick={() => setFilter(prev => ({ ...prev, pulau_id: p.id }))}
                className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs hover:border-sky-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-white text-xs truncate">{p.nama}</span>
                  <span className={`w-2 h-2 rounded-full ${p.statusBadge}`} />
                </div>
                <div className="flex items-center gap-2 text-xs font-mono my-1.5">
                  <span className="text-slate-700 dark:text-slate-300">👤 <b>{p.sasaran}</b></span>
                  <span className="text-rose-600 font-bold">🎗️ {p.kasus}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                  <span>Prevalensi:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{p.persen}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Notifikasi dan Informasi Cepat (Lampiran 2 #1) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white text-[11px] pb-1 border-b border-slate-100 dark:border-slate-700">
              <span>Notifikasi dan Informasi</span>
              <button onClick={onOpenWhatsAppModal} className="text-sky-600 hover:underline text-[10px]">Lihat Semua</button>
            </div>
            <div className="space-y-1.5 text-[11px]">
              {notifikasiInformasi.map(n => (
                <div key={n.id} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="mt-0.5 text-slate-400">
                    {n.jenis === 'danger' ? '🕒' : n.jenis === 'warning' ? '📋' : n.jenis === 'info' ? '📅' : '🛥️'}
                  </span>
                  <span className="leading-tight flex-1">{n.judul}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
