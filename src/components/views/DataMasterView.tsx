import React, { useState } from 'react';
import { 
  Database, 
  MapPin, 
  Layers, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  AlertCircle,
  Building2,
  Tag,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Pulau, User, StatusAkses } from '../../types';
import { storageService } from '../../services/storageService';

interface DataMasterViewProps {
  pulauList: Pulau[];
  currentUser: User;
  onRefreshData: () => void;
}

export const DataMasterView: React.FC<DataMasterViewProps> = ({
  pulauList,
  currentUser,
  onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pulau' | 'kategori' | 'target'>('pulau');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePulau, setActivePulau] = useState<Partial<Pulau>>({});

  const canEdit = currentUser.role === 'ADMIN';

  const handleOpenAddPulau = () => {
    setActivePulau({
      pulau_id: `PULAU-0${pulauList.length + 1}`,
      nama_pulau: 'Pulau ',
      unit_pelayanan: 'Puskesmas Pembantu ',
      latitude: -5.85,
      longitude: 106.60,
      status_akses: 'Sedang',
      keterangan: '',
      status_aktif: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditPulau = (p: Pulau) => {
    setActivePulau({ ...p });
    setIsModalOpen(true);
  };

  const handleToggleStatusPulau = (p: Pulau) => {
    storageService.savePulau({ ...p, status_aktif: !p.status_aktif });
    onRefreshData();
  };

  const handleSavePulau = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePulau.nama_pulau || !activePulau.pulau_id) return;
    storageService.savePulau(activePulau as Pulau);
    setIsModalOpen(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900">
              Pengelolaan Data Master Sistem
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              Kewenangan: Administrator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi pulau wilayah kerja, faskes pelayanan, kategori masalah gizi, dan target indikator program.
          </p>
        </div>

        {canEdit && activeSubTab === 'pulau' && (
          <button
            onClick={handleOpenAddPulau}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Wilayah Pulau</span>
          </button>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('pulau')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'pulau' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Pulau & Unit Pelayanan</span>
        </button>
        <button
          onClick={() => setActiveSubTab('kategori')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'kategori' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Kategori Masalah & Intervensi</span>
        </button>
        <button
          onClick={() => setActiveSubTab('target')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'target' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Target Indikator & Periode</span>
        </button>
      </div>

      {/* Tab Content 1: Pulau */}
      {activeSubTab === 'pulau' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">ID Pulau</th>
                  <th className="py-3 px-3">Nama Pulau</th>
                  <th className="py-3 px-3">Unit Pelayanan Faskes</th>
                  <th className="py-3 px-3">Koordinat (Lat, Long)</th>
                  <th className="py-3 px-3 text-center">Status Akses</th>
                  <th className="py-3 px-3 text-center">Status Aktif</th>
                  {canEdit && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pulauList.map(p => (
                  <tr key={p.pulau_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-800">{p.pulau_id}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{p.nama_pulau}</td>
                    <td className="py-3 px-3 text-slate-600">{p.unit_pelayanan}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {p.latitude}, {p.longitude}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {p.status_akses}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.status_aktif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {p.status_aktif ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditPulau(p)}
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg"
                            title="Edit Data"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatusPulau(p)}
                            className={`p-1.5 rounded-lg ${p.status_aktif ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            title={p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {p.status_aktif ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Kategori */}
      {activeSubTab === 'kategori' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Kategori Masalah Gizi Standar WHO & Kemenkes</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Stunting (Pendek / Sangat Pendek)</div>
                  <div className="text-[11px] text-slate-500">Z-score TB/U &lt; -2 SD</div>
                </div>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded">Prioritas Intervensi</span>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Wasting (Kurus / Gizi Kurang)</div>
                  <div className="text-[11px] text-slate-500">Z-score BB/TB &lt; -2 SD</div>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">PMT Pemulihan</span>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Gizi Buruk (Severe Wasting)</div>
                  <div className="text-[11px] text-slate-500">Z-score BB/TB &lt; -3 SD atau Edema bilateral</div>
                </div>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded">Terapeutik F-100/F-75</span>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Underweight (Berat Badan Kurang)</div>
                  <div className="text-[11px] text-slate-500">Z-score BB/U &lt; -2 SD</div>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">Pendampingan Posyandu</span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Paket Intervensi Gizi Spesifik Kepulauan</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-semibold text-slate-900">PMT Pangan Lokal Berbasis Ikan Segar (90 Hari)</div>
                <div className="text-[11px] text-slate-500">Optimalisasi tangkapan nelayan lokal (tenggiri, tongkol, kakap) + telur puyuh</div>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-semibold text-slate-900">Konseling PMBA & Praktik Masak Bergizi</div>
                <div className="text-[11px] text-slate-500">Edukasi ibu baduta oleh nutrisionis & kader posyandu</div>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-semibold text-slate-900">Rujukan Ambulans Laut ke RSUD Kepulauan Seribu</div>
                <div className="text-[11px] text-slate-500">Protokol penanganan komplikasi medis gizi buruk antarpulau</div>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab Content 3: Target */}
      {activeSubTab === 'target' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-3">Target Indikator Kinerja Utama (IKU) Program Gizi 2026</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Target Cakupan Pemantauan</span>
              <div className="text-2xl font-bold text-sky-800 font-mono mt-1">&ge; 90.0%</div>
              <p className="text-[11px] text-slate-500 mt-1">Seluruh sasaran balita terdaftar dipantau per bulan</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Target Penyelesaian Tindak Lanjut</span>
              <div className="text-2xl font-bold text-emerald-800 font-mono mt-1">&ge; 85.0%</div>
              <p className="text-[11px] text-slate-500 mt-1">Intervensi jatuh tempo tuntas terlaksana</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Target Penurunan Prevalensi Stunting</span>
              <div className="text-2xl font-bold text-rose-800 font-mono mt-1">&le; 10.0%</div>
              <p className="text-[11px] text-slate-500 mt-1">Sesuai target eliminasi stunting DKI Jakarta</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit / Add Pulau */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-base">Kelola Data Wilayah Pulau</div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePulau} className="space-y-3 pt-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ID Pulau *</label>
                <input
                  type="text"
                  value={activePulau.pulau_id || ''}
                  onChange={(e) => setActivePulau(prev => ({ ...prev, pulau_id: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pulau *</label>
                <input
                  type="text"
                  value={activePulau.nama_pulau || ''}
                  onChange={(e) => setActivePulau(prev => ({ ...prev, nama_pulau: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit Pelayanan Faskes</label>
                <input
                  type="text"
                  value={activePulau.unit_pelayanan || ''}
                  onChange={(e) => setActivePulau(prev => ({ ...prev, unit_pelayanan: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={activePulau.latitude || ''}
                    onChange={(e) => setActivePulau(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={activePulau.longitude || ''}
                    onChange={(e) => setActivePulau(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Akses Laut</label>
                <select
                  value={activePulau.status_akses || 'Sedang'}
                  onChange={(e) => setActivePulau(prev => ({ ...prev, status_akses: e.target.value as StatusAkses }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tergantung Cuaca/Gelombang">Tergantung Cuaca/Gelombang</option>
                  <option value="Terisolasi">Terisolasi</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Geografis</label>
                <textarea
                  rows={2}
                  value={activePulau.keterangan || ''}
                  onChange={(e) => setActivePulau(prev => ({ ...prev, keterangan: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Data Pulau</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
