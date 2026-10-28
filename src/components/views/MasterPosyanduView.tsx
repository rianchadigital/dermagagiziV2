import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Users, 
  Phone, 
  Calendar, 
  Baby, 
  HeartHandshake,
  MessageCircle,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Posyandu, Kelurahan, User } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';

interface MasterPosyanduViewProps {
  currentUser: User;
  onRefreshData: () => void;
}

export const MasterPosyanduView: React.FC<MasterPosyanduViewProps> = ({
  currentUser,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'posyandu' | 'kelurahan'>('posyandu');
  const [filterKelurahan, setFilterKelurahan] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const kelurahanList = storageService.getKelurahanList();
  const posyanduList = storageService.getPosyanduList(filterKelurahan);

  // Modal Posyandu State
  const [isPosyanduModalOpen, setIsPosyanduModalOpen] = useState(false);
  const [editingPosyandu, setEditingPosyandu] = useState<Partial<Posyandu>>({});

  // Modal Kelurahan State
  const [isKelurahanModalOpen, setIsKelurahanModalOpen] = useState(false);
  const [editingKelurahan, setEditingKelurahan] = useState<Partial<Kelurahan>>({});

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'TENAGA_GIZI' || currentUser?.role === 'KEPALA_PUSKESMAS';

  // Filtered Posyandu list
  const safePosyanduList = Array.isArray(posyanduList) ? posyanduList : [];
  const safeKelurahanList = Array.isArray(kelurahanList) ? kelurahanList : [];

  const filteredPosyandu = safePosyanduList.filter(p => {
    if (!p) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.nama_posyandu || '').toLowerCase().includes(q) ||
      (p.ketua_kader || '').toLowerCase().includes(q) ||
      (p.rw || '').toLowerCase().includes(q) ||
      (p.pulau_nama || '').toLowerCase().includes(q)
    );
  });

  const totalSasaranAll = safePosyanduList.reduce((acc, p) => acc + (p?.total_sasaran || 0), 0);
  const totalKaderAll = safePosyanduList.reduce((acc, p) => acc + (p?.jumlah_kader || 0), 0);

  // Handlers Posyandu
  const handleOpenAddPosyandu = () => {
    const defaultKel = kelurahanList[0];
    setEditingPosyandu({
      posyandu_id: `POS-${Date.now().toString().slice(-4)}`,
      nama_posyandu: '',
      kelurahan_id: defaultKel?.kelurahan_id || 'KEL-01',
      kelurahan_nama: defaultKel?.nama_kelurahan || 'Kelurahan Pulau Tidung',
      pulau_id: 'PULAU-01',
      pulau_nama: 'Pulau Tidung',
      rw: 'RW 01',
      rt: 'RT 01',
      lokasi_alamat: '',
      ketua_kader: '',
      no_wa_kader: '628',
      jumlah_kader: 5,
      jadwal_hari: 'Minggu ke-2 setiap bulan',
      total_sasaran: 90,
      status_aktif: true
    });
    setIsPosyanduModalOpen(true);
  };

  const handleOpenEditPosyandu = (p: Posyandu) => {
    setEditingPosyandu({ ...p });
    setIsPosyanduModalOpen(true);
  };

  const handleSavePosyandu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosyandu.nama_posyandu || !editingPosyandu.kelurahan_id) return;
    
    const kel = kelurahanList.find(k => k.kelurahan_id === editingPosyandu.kelurahan_id);
    const payload: Posyandu = {
      ...(editingPosyandu as Posyandu),
      kelurahan_nama: kel?.nama_kelurahan || editingPosyandu.kelurahan_nama || ''
    };
    await apiService.savePosyandu(payload);
    setIsPosyanduModalOpen(false);
    onRefreshData();
  };

  const handleDeletePosyandu = async (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus posyandu "${nama}" dari master data?`)) {
      await apiService.deletePosyandu(id);
      onRefreshData();
    }
  };

  // Handlers Kelurahan
  const handleOpenEditKelurahan = (k: Kelurahan) => {
    setEditingKelurahan({ ...k });
    setIsKelurahanModalOpen(true);
  };

  const handleSaveKelurahan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKelurahan.nama_kelurahan || !editingKelurahan.kelurahan_id) return;
    await apiService.saveKelurahan(editingKelurahan as Kelurahan);
    setIsKelurahanModalOpen(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Stats Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
                Master Data Posyandu & Kelurahan
              </h1>
              <span className="text-xs bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-semibold px-2.5 py-0.5 rounded-full">
                Kecamatan Kepulauan Seribu Selatan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Data induk posyandu, wilayah kelurahan, pulau kerja, kontak ketua kader posyandu, dan sasaran balita terintegrasi.
            </p>
          </div>

          {canManage && activeTab === 'posyandu' && (
            <button
              onClick={handleOpenAddPosyandu}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Posyandu Baru</span>
            </button>
          )}
        </div>

        {/* Quick Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Total Kelurahan</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">3 Kelurahan</div>
          </div>
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-100 dark:border-sky-900/40">
            <div className="text-[11px] text-sky-600">Total Posyandu Aktif</div>
            <div className="text-base font-bold text-sky-800 dark:text-sky-200 mt-0.5">{posyanduList.length} Posyandu</div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="text-[11px] text-emerald-600">Total Kader Terdaftar</div>
            <div className="text-base font-bold text-emerald-800 dark:text-emerald-200 mt-0.5">{totalKaderAll} Kader</div>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <div className="text-[11px] text-amber-600">Total Sasaran Balita</div>
            <div className="text-base font-bold text-amber-800 dark:text-amber-200 mt-0.5">{totalSasaranAll} Balita</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('posyandu')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'posyandu'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Daftar Posyandu ({posyanduList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kelurahan')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'kelurahan'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Data 3 Kelurahan</span>
        </button>
      </div>

      {/* TAB 1: DATA POSYANDU */}
      {activeTab === 'posyandu' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500">Filter Kelurahan:</span>
              <button
                onClick={() => setFilterKelurahan('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterKelurahan === 'ALL'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Semua ({storageService.getPosyanduList().length})
              </button>
              {safeKelurahanList.map(k => (
                <button
                  key={k.kelurahan_id}
                  onClick={() => setFilterKelurahan(k.kelurahan_id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    filterKelurahan === k.kelurahan_id
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {(k.nama_kelurahan || '').replace('Kelurahan ', '')}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama posyandu / kader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-52 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Table Posyandu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Posyandu</th>
                    <th className="py-3 px-4">Wilayah & Pulau</th>
                    <th className="py-3 px-4">Alamat / RT-RW</th>
                    <th className="py-3 px-4">Ketua Kader & Kontak WA</th>
                    <th className="py-3 px-4 text-center">Jml Kader</th>
                    <th className="py-3 px-4">Jadwal Buka</th>
                    <th className="py-3 px-4 text-center">Sasaran</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {canManage && <th className="py-3 px-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredPosyandu.map((pos) => {
                    const waClean = (pos.no_wa_kader || '').replace(/\D/g, '');
                    return (
                    <tr key={pos.posyandu_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{pos.nama_posyandu}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{pos.posyandu_id}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-sky-700 dark:text-sky-300">{pos.kelurahan_nama}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{pos.pulau_nama}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{pos.rw} ({pos.rt})</div>
                        <div className="text-[10px] text-slate-500 max-w-xs truncate">{pos.lokasi_alamat}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{pos.ketua_kader}</div>
                        <a 
                          href={`https://wa.me/${waClean}?text=Halo%20${encodeURIComponent(pos.ketua_kader || '')}%20(Posyandu%20${encodeURIComponent(pos.nama_posyandu || '')}),%20mohon%20informasi%20terkait%20kegiatan%20gizi`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 font-mono"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-500" />
                          <span>{pos.no_wa_kader || '-'}</span>
                        </a>
                      </td>

                      <td className="py-3 px-4 text-center font-bold font-mono">
                        {pos.jumlah_kader} Orang
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          {pos.jadwal_hari}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-sky-700 dark:text-sky-300 font-mono text-sm">
                          {pos.total_sasaran}
                        </span>
                        <div className="text-[10px] text-slate-400">Anak</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pos.status_aktif ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {pos.status_aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {canManage && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditPosyandu(pos)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Posyandu"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePosyandu(pos.posyandu_id, pos.nama_posyandu)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              title="Hapus Posyandu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA KELURAHAN */}
      {activeTab === 'kelurahan' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {safeKelurahanList.map((kel) => {
            const posyanduInKel = storageService.getPosyanduList(kel?.kelurahan_id) || [];
            const totalSasaran = posyanduInKel.reduce((acc, p) => acc + (p?.total_sasaran || 0), 0);
            const lurahWaClean = (kel?.no_wa_lurah || '').replace(/\D/g, '');
            const safeDaftarPulau = Array.isArray(kel?.daftar_pulau) ? kel.daftar_pulau : [];

            return (
              <div 
                key={kel.kelurahan_id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold">
                        {kel.kelurahan_id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {kel.nama_kelurahan}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {kel.kecamatan}
                      </p>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => handleOpenEditKelurahan(kel)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Data Kelurahan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Info Lurah */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 text-xs">
                    <div className="text-[11px] text-slate-500 font-medium">Pimpinan Kelurahan (Lurah):</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{kel.lurah_nama}</div>
                    <a
                      href={`https://wa.me/${lurahWaClean}?text=Yth.%20Bapak%20Lurah%20${encodeURIComponent(kel.nama_kelurahan || '')},%20mohon%20koordinasi%20terkait%20monitoring%20gizi%20balita`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono pt-0.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{kel.no_wa_lurah || '-'} (WhatsApp Aktif)</span>
                    </a>
                  </div>

                  {/* Pulau Wilayah Kerja */}
                  <div className="text-xs space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium">Pulau Wilayah Naungan:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {safeDaftarPulau.map((p, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metrik RW RT dan Posyandu */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                      <div className="text-[10px] text-slate-400">RW / RT</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {kel.jumlah_rw} RW / {kel.jumlah_rt} RT
                      </div>
                    </div>
                    <div className="p-2 bg-sky-50 dark:bg-sky-950/40 rounded-lg">
                      <div className="text-[10px] text-sky-600">Posyandu</div>
                      <div className="text-xs font-bold text-sky-800 dark:text-sky-200 mt-0.5">
                        {posyanduInKel.length} Pos
                      </div>
                    </div>
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                      <div className="text-[10px] text-amber-600">Sasaran</div>
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-200 mt-0.5 font-mono">
                        {totalSasaran} Anak
                      </div>
                    </div>
                  </div>
                </div>

                {/* List Posyandu per Kelurahan */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                    Daftar Posyandu di {kel.nama_kelurahan}:
                  </div>
                  <div className="space-y-1">
                    {posyanduInKel.map(p => (
                      <div key={p.posyandu_id} className="text-[11px] flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span>• {p.nama_posyandu} ({p.rw})</span>
                        <span className="font-mono text-slate-500">{p.total_sasaran} sasaran</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT POSYANDU */}
      {isPosyanduModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {editingPosyandu.nama_posyandu ? `Edit: ${editingPosyandu.nama_posyandu}` : 'Tambah Posyandu Baru'}
              </h3>
              <button 
                onClick={() => setIsPosyanduModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePosyandu} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Posyandu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Posyandu Melati 3"
                  value={editingPosyandu.nama_posyandu || ''}
                  onChange={(e) => setEditingPosyandu({ ...editingPosyandu, nama_posyandu: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kelurahan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingPosyandu.kelurahan_id || 'KEL-01'}
                    onChange={(e) => setEditingPosyandu({ ...editingPosyandu, kelurahan_id: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  >
                    {kelurahanList.map(k => (
                      <option key={k.kelurahan_id} value={k.kelurahan_id}>{k.nama_kelurahan}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pulau
                  </label>
                  <input
                    type="text"
                    value={editingPosyandu.pulau_nama || ''}
                    onChange={(e) => setEditingPosyandu({ ...editingPosyandu, pulau_nama: e.target.value })}
                    placeholder="Contoh: Pulau Tidung"
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    RW / RT
                  </label>
                  <input
                    type="text"
                    value={editingPosyandu.rw || ''}
                    onChange={(e) => setEditingPosyandu({ ...editingPosyandu, rw: e.target.value })}
                    placeholder="Contoh: RW 02"
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Total Sasaran Balita
                  </label>
                  <input
                    type="number"
                    value={editingPosyandu.total_sasaran || 90}
                    onChange={(e) => setEditingPosyandu({ ...editingPosyandu, total_sasaran: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Ketua Kader <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ibu..."
                  value={editingPosyandu.ketua_kader || ''}
                  onChange={(e) => setEditingPosyandu({ ...editingPosyandu, ketua_kader: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp Kader
                  </label>
                  <input
                    type="text"
                    placeholder="628..."
                    value={editingPosyandu.no_wa_kader || ''}
                    onChange={(e) => setEditingPosyandu({ ...editingPosyandu, no_wa_kader: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Jadwal Buka Posyandu
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Selasa Minggu ke-2"
                    value={editingPosyandu.jadwal_hari || ''}
                    onChange={(e) => setEditingPosyandu({ ...editingPosyandu, jadwal_hari: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Alamat / Lokasi Pos
                </label>
                <input
                  type="text"
                  placeholder="Balai warga RW / Gedung Serbaguna..."
                  value={editingPosyandu.lokasi_alamat || ''}
                  onChange={(e) => setEditingPosyandu({ ...editingPosyandu, lokasi_alamat: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPosyanduModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Data Posyandu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT KELURAHAN */}
      {isKelurahanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Edit Data: {editingKelurahan.nama_kelurahan}
              </h3>
              <button 
                onClick={() => setIsKelurahanModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKelurahan} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lurah
                </label>
                <input
                  type="text"
                  required
                  value={editingKelurahan.lurah_nama || ''}
                  onChange={(e) => setEditingKelurahan({ ...editingKelurahan, lurah_nama: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp Lurah
                </label>
                <input
                  type="text"
                  required
                  value={editingKelurahan.no_wa_lurah || ''}
                  onChange={(e) => setEditingKelurahan({ ...editingKelurahan, no_wa_lurah: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah RW
                  </label>
                  <input
                    type="number"
                    value={editingKelurahan.jumlah_rw || 4}
                    onChange={(e) => setEditingKelurahan({ ...editingKelurahan, jumlah_rw: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah RT
                  </label>
                  <input
                    type="number"
                    value={editingKelurahan.jumlah_rt || 20}
                    onChange={(e) => setEditingKelurahan({ ...editingKelurahan, jumlah_rt: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKelurahanModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
