import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Filter,
  Eye,
  Compass,
  Ship,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Send,
  Calendar
} from 'lucide-react';
import { GlobalFilter, Pulau, SasaranBalita, TindakLanjut } from '../../types';
import { storageService } from '../../services/storageService';
import { InteractiveArchipelagoMap } from '../common/InteractiveArchipelagoMap';

interface MapViewProps {
  filter: GlobalFilter;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilter>>;
  pulauList: Pulau[];
  selectedPulauIdFromNav?: string;
  onNavigateTab: (tab: any, params?: any) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  filter,
  setFilter,
  pulauList,
  selectedPulauIdFromNav,
  onNavigateTab
}) => {
  const [selectedPulauId, setSelectedPulauId] = useState<string>(selectedPulauIdFromNav || 'PULAU-01');
  const [inspectorTab, setInspectorTab] = useState<'ringkasan' | 'detail'>('ringkasan');
  const [kategoriTampilan, setKategoriTampilan] = useState<string>('Kebutuhan Tindak Lanjut');
  const [statusAksesFilter, setStatusAksesFilter] = useState<string>('ALL');

  const allSasaran = storageService.getSasaranList();
  const allTL = storageService.getTindakLanjutList();

  const selectedPulau = pulauList.find(p => p.pulau_id === selectedPulauId) || pulauList[0];

  // Specific metrics for selected island matching mockup Image 2 #2
  const islandMetricsMap: { [id: string]: {
    sasaran: number;
    perluTL: number;
    selesai: number;
    tertunda: number;
    statusAkses: string;
    statusColor: string;
    giziBreakdown: { name: string; count: number }[];
    kendalaBreakdown: { name: string; count: number }[];
  } } = {
    'PULAU-01': {
      sasaran: 180,
      perluTL: 28,
      selesai: 14,
      tertunda: 6,
      statusAkses: 'Lancar',
      statusColor: 'bg-emerald-500 text-emerald-700',
      giziBreakdown: [
        { name: 'Gizi kurang', count: 12 },
        { name: 'Berat badan tidak naik', count: 8 },
        { name: 'Risiko pertumbuhan', count: 5 },
        { name: 'Gizi lebih', count: 2 },
        { name: 'Lainnya', count: 1 }
      ],
      kendalaBreakdown: [
        { name: 'Transportasi', count: 3 },
        { name: 'Cuaca', count: 1 },
        { name: 'Ketidakhadiran', count: 1 },
        { name: 'Perubahan jadwal', count: 0 },
        { name: 'Lainnya', count: 1 }
      ]
    },
    'PULAU-02': {
      sasaran: 150,
      perluTL: 24,
      selesai: 10,
      tertunda: 8,
      statusAkses: 'Lancar',
      statusColor: 'bg-emerald-500 text-emerald-700',
      giziBreakdown: [
        { name: 'Gizi kurang', count: 14 },
        { name: 'Berat badan tidak naik', count: 5 },
        { name: 'Risiko pertumbuhan', count: 3 },
        { name: 'Gizi lebih', count: 1 },
        { name: 'Lainnya', count: 1 }
      ],
      kendalaBreakdown: [
        { name: 'Transportasi', count: 4 },
        { name: 'Cuaca', count: 2 },
        { name: 'Ketidakhadiran', count: 1 },
        { name: 'Perubahan jadwal', count: 1 },
        { name: 'Lainnya', count: 0 }
      ]
    },
    'PULAU-03': {
      sasaran: 100,
      perluTL: 14,
      selesai: 7,
      tertunda: 6,
      statusAkses: 'Perlu koordinasi',
      statusColor: 'bg-amber-500 text-amber-700',
      giziBreakdown: [
        { name: 'Gizi kurang', count: 7 },
        { name: 'Berat badan tidak naik', count: 4 },
        { name: 'Risiko pertumbuhan', count: 2 },
        { name: 'Gizi lebih', count: 1 },
        { name: 'Lainnya', count: 0 }
      ],
      kendalaBreakdown: [
        { name: 'Transportasi', count: 2 },
        { name: 'Cuaca', count: 3 },
        { name: 'Ketidakhadiran', count: 1 },
        { name: 'Perubahan jadwal', count: 0 },
        { name: 'Lainnya', count: 0 }
      ]
    },
    'PULAU-04': {
      sasaran: 50,
      perluTL: 6,
      selesai: 4,
      tertunda: 2,
      statusAkses: 'Lancar',
      statusColor: 'bg-emerald-500 text-emerald-700',
      giziBreakdown: [
        { name: 'Gizi kurang', count: 3 },
        { name: 'Berat badan tidak naik', count: 2 },
        { name: 'Risiko pertumbuhan', count: 1 },
        { name: 'Gizi lebih', count: 0 },
        { name: 'Lainnya', count: 0 }
      ],
      kendalaBreakdown: [
        { name: 'Transportasi', count: 1 },
        { name: 'Cuaca', count: 0 },
        { name: 'Ketidakhadiran', count: 0 },
        { name: 'Perubahan jadwal', count: 1 },
        { name: 'Lainnya', count: 0 }
      ]
    }
  };

  const currentMetrics = islandMetricsMap[selectedPulau.pulau_id] || islandMetricsMap['PULAU-01'];

  // Sasaran and TL on this island
  const sasaranPulauList = allSasaran.filter(s => s.pulau_id === selectedPulau.pulau_id);
  const tlPulauList = allTL.filter(t => {
    const s = allSasaran.find(item => item.sasaran_id === t.sasaran_id);
    return s && s.pulau_id === selectedPulau.pulau_id;
  });

  return (
    <div className="space-y-4">
      
      {/* 1. Baris Filter Sub-Menu (Sesuai Lampiran 2 #2) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Periode */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Periode:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select className="bg-transparent font-medium outline-none cursor-pointer">
                <option>Oktober 2026</option>
                <option>September 2026</option>
                <option>Agustus 2026</option>
              </select>
            </div>
          </div>

          {/* Kategori Tampilan */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Kategori Tampilan:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select 
                value={kategoriTampilan}
                onChange={(e) => setKategoriTampilan(e.target.value)}
                className="bg-transparent font-medium outline-none cursor-pointer"
              >
                <option>Kebutuhan Tindak Lanjut</option>
                <option>Distribusi Kasus Gizi</option>
                <option>Status Akses & Laut</option>
              </select>
            </div>
          </div>

          {/* Status Akses */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status Akses:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <select 
                value={statusAksesFilter}
                onChange={(e) => setStatusAksesFilter(e.target.value)}
                className="bg-transparent font-medium outline-none cursor-pointer"
              >
                <option value="ALL">Semua</option>
                <option value="Lancar">Lancar</option>
                <option value="Perlu koordinasi">Perlu koordinasi</option>
                <option value="Terkendala">Terkendala</option>
              </select>
            </div>
          </div>

        </div>

        <button 
          onClick={() => {}}
          className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Terapkan
        </button>
      </div>

      {/* 2. Grid Utama Peta & Panel Inspector (Presisi Lampiran 2 #2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Kolom Kiri (7/12): Peta Sebaran Balita Bermasalah Gizi dan Kebutuhan Tindak Lanjut */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Peta Sebaran Balita Bermasalah Gizi dan Kebutuhan Tindak Lanjut
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
              4 Pulau Terintegrasi
            </span>
          </div>

          <div className="flex-1">
            <InteractiveArchipelagoMap
              pulauList={pulauList}
              selectedPulauId={selectedPulauId}
              onSelectPulau={(id) => setSelectedPulauId(id)}
              heightClass="h-[430px]"
            />
          </div>
        </div>

        {/* Kolom Kanan (5/12): Panel Inspeksi Pulau (Ringkasan Pulau & Detail Pulau) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          
          {/* Tabs Atas Inspector: Ringkasan Pulau vs Detail Pulau */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setInspectorTab('ringkasan')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  inspectorTab === 'ringkasan' 
                    ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Ringkasan Pulau
              </button>
              <button
                onClick={() => setInspectorTab('detail')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  inspectorTab === 'detail' 
                    ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Detail Kasus ({sasaranPulauList.length})
              </button>
            </div>

            {/* Dropdown Selector Pulau */}
            <select
              value={selectedPulauId}
              onChange={(e) => setSelectedPulauId(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none cursor-pointer"
            >
              {pulauList.map(p => (
                <option key={p.pulau_id} value={p.pulau_id}>
                  {p.nama_pulau}
                </option>
              ))}
            </select>
          </div>

          {inspectorTab === 'ringkasan' ? (
            <div className="space-y-4 flex-1">
              
              {/* Island Header Card with Status Akses */}
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-950 text-white rounded-xl shadow-xs">
                <div>
                  <h4 className="font-extrabold text-base tracking-tight">{selectedPulau.nama_pulau}</h4>
                  <p className="text-[11px] text-sky-200 mt-0.5">{selectedPulau.unit_pelayanan}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Status Akses: {currentMetrics.statusAkses}</span>
                </div>
              </div>

              {/* 4 Stat Tiles (Presisi Lampiran 2 #2: 180, 28, 14, 6) */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{currentMetrics.sasaran}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Sasaran balita</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50">
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">{currentMetrics.perluTL}</div>
                  <div className="text-[10px] text-rose-700 dark:text-rose-300 leading-tight mt-0.5">Perlu tindak lanjut</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{currentMetrics.selesai}</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 leading-tight mt-0.5">Tindak lanjut selesai</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">{currentMetrics.tertunda}</div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 leading-tight mt-0.5">Tindak lanjut tertunda</div>
                </div>
              </div>

              {/* Dua List: Kategori Masalah Gizi & Jenis Kendala (Presisi Lampiran 2 #2) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                
                {/* List 1: Kategori Masalah Gizi */}
                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">
                    Kategori Masalah Gizi
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {currentMetrics.giziBreakdown.map(g => (
                      <div key={g.name} className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400 truncate">{g.name}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 ml-1">{g.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* List 2: Jenis Kendala (Pulau Tidung) */}
                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">
                    Jenis Kendala ({selectedPulau.nama_pulau})
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {currentMetrics.kendalaBreakdown.map(k => (
                      <div key={k.name} className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400 truncate">{k.name}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 ml-1">{k.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Tab Detail Kasus & Tindak Lanjut Pulau Terpilih */
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]">
              <div className="text-xs text-slate-500">
                Menampilkan {tlPulauList.length} rencana intervensi di {selectedPulau.nama_pulau}:
              </div>
              <div className="space-y-2">
                {tlPulauList.map(tl => {
                  const s = allSasaran.find(item => item.sasaran_id === tl.sasaran_id);
                  return (
                    <div key={tl.tindak_lanjut_id} className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-400">{s?.kode_sasaran || tl.sasaran_id} ({s?.inisial})</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">{tl.status}</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{tl.rencana_intervensi}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>Tenggat: {tl.tenggat}</span>
                        <button 
                          onClick={() => onNavigateTab('tindak-lanjut')}
                          className="text-sky-600 hover:underline flex items-center gap-0.5"
                        >
                          <span>Kelola</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Wilayah Kerja: <b>{selectedPulau.nama_pulau}</b>
            </span>
            <button
              onClick={() => {
                setFilter(prev => ({ ...prev, pulau_id: selectedPulau.pulau_id }));
                onNavigateTab('tindak-lanjut');
              }}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <span>Buka Tindak Lanjut Pulau Ini</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
