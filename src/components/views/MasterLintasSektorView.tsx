import React, { useState } from 'react';
import { 
  Users2, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  MessageCircle, 
  ShieldCheck, 
  Building, 
  MapPin, 
  Send, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  PhoneCall,
  Bell,
  BellOff
} from 'lucide-react';
import { UserLintasSektor, User, Kelurahan } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';

interface MasterLintasSektorViewProps {
  currentUser: User;
  onRefreshData: () => void;
}

const INSTANSI_OPTIONS = [
  'Puskesmas Kepulauan Seribu Selatan',
  'Kecamatan Kepulauan Seribu Selatan',
  'Kelurahan Pulau Tidung',
  'Kelurahan Pulau Pari',
  'Kelurahan Pulau Untung Jawa',
  'TP PKK Kepulauan Seribu Selatan',
  'TP PKK Kelurahan',
  'Kader Posyandu & TPK Stunting',
  'KUA Kepulauan Seribu Selatan',
  'Satpol PP & Dinsos Wilayah',
  'Babinsa & Bhabinkamtibmas'
];

export const MasterLintasSektorView: React.FC<MasterLintasSektorViewProps> = ({
  currentUser,
  onRefreshData
}) => {
  const kelurahanList = storageService.getKelurahanList();
  const safeKelurahanList = Array.isArray(kelurahanList) ? kelurahanList : [];
  const [filterKelurahan, setFilterKelurahan] = useState<string>('ALL');
  const [filterInstansi, setFilterInstansi] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const lintasSektorList = storageService.getUserLintasSektorList(filterKelurahan);
  const safeLintasSektorList = Array.isArray(lintasSektorList) ? lintasSektorList : [];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserLintasSektor>>({});

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'KEPALA_PUSKESMAS' || currentUser?.role === 'TENAGA_GIZI';

  // Filtered list
  const filteredUsers = safeLintasSektorList.filter(u => {
    if (!u) return false;
    const instansi = (u.instansi_sektor || '').toLowerCase();
    if (filterInstansi !== 'ALL' && !instansi.includes(filterInstansi.toLowerCase())) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.nama || '').toLowerCase().includes(q) ||
      (u.jabatan || '').toLowerCase().includes(q) ||
      instansi.includes(q) ||
      (u.no_wa || '').includes(q)
    );
  });

  const totalActiveWa = safeLintasSektorList.filter(u => u && u.status_notifikasi_wa).length;

  const handleOpenAdd = () => {
    setEditingUser({
      user_id: `ULS-${Date.now().toString().slice(-4)}`,
      nama: '',
      jabatan: '',
      instansi_sektor: INSTANSI_OPTIONS[0],
      kelurahan_id: 'ALL',
      kelurahan_nama: 'Kecamatan / Semua Wilayah',
      no_wa: '628',
      email: '',
      status_notifikasi_wa: true,
      status_aktif: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserLintasSektor) => {
    setEditingUser({ ...u });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.nama || !editingUser.no_wa) return;

    let kelNama = 'Kecamatan / Semua Wilayah';
    if (editingUser.kelurahan_id && editingUser.kelurahan_id !== 'ALL') {
      const kel = kelurahanList.find(k => k.kelurahan_id === editingUser.kelurahan_id);
      if (kel) kelNama = kel.nama_kelurahan;
    }

    const payload: UserLintasSektor = {
      ...(editingUser as UserLintasSektor),
      kelurahan_nama: kelNama,
      no_wa: editingUser.no_wa.replace(/\s+/g, '')
    };

    await apiService.saveUserLintasSektor(payload);
    setIsModalOpen(false);
    onRefreshData();
  };

  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus kontak lintas sektor "${nama}"?`)) {
      await apiService.deleteUserLintasSektor(id);
      onRefreshData();
    }
  };

  const handleToggleNotifWa = async (u: UserLintasSektor) => {
    await apiService.saveUserLintasSektor({
      ...u,
      status_notifikasi_wa: !u.status_notifikasi_wa
    });
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Stats Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-sky-600" />
              <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
                Master Data User & Stakeholder Lintas Sektor
              </h1>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Bell className="w-3 h-3 text-emerald-600" />
                <span>WhatsApp Broadcast Terintegrasi</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Daftar pejabat, tokoh masyarakat, tim pendamping keluarga, TP PKK, lurah, dan instansi lintas sektor yang menerima notifikasi otomatis saat ditemukan kasus gizi di Posyandu.
            </p>
          </div>

          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kontak Lintas Sektor</span>
            </button>
          )}
        </div>

        {/* Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Total Kontak Stakeholder</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
              {lintasSektorList.length} Orang
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="text-[11px] text-emerald-600">Penerima Broadcast Aktif</div>
            <div className="text-base font-bold text-emerald-800 dark:text-emerald-200 mt-0.5 font-mono">
              {totalActiveWa} Akun WA
            </div>
          </div>
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-100 dark:border-sky-900/40">
            <div className="text-[11px] text-sky-600">Unsur Instansi</div>
            <div className="text-base font-bold text-sky-800 dark:text-sky-200 mt-0.5">
              Kelurahan, PKK, TPK, Pusk
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <div className="text-[11px] text-amber-600">Respon Tindak Lanjut</div>
            <div className="text-base font-bold text-amber-800 dark:text-amber-200 mt-0.5">
              Koordinasi Cepat 1x24 Jam
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Kelurahan */}
          <select
            value={filterKelurahan}
            onChange={(e) => setFilterKelurahan(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Wilayah Tugas</option>
            {safeKelurahanList.map(k => (
              <option key={k.kelurahan_id} value={k.kelurahan_id}>{k.nama_kelurahan}</option>
            ))}
          </select>

          {/* Filter Instansi */}
          <select
            value={filterInstansi}
            onChange={(e) => setFilterInstansi(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Instansi / Sektor</option>
            <option value="Kelurahan">Pemerintah Kelurahan</option>
            <option value="Kecamatan">Pemerintah Kecamatan</option>
            <option value="PKK">TP PKK</option>
            <option value="Puskesmas">Puskesmas & Pustu</option>
            <option value="TPK">TPK Stunting & Kader</option>
            <option value="KUA">KUA & Penyuluh</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama / nomor WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-56 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table Stakeholders */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Pejabat / Petugas</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Instansi / Sektor</th>
                <th className="py-3 px-4">Wilayah Tugas</th>
                <th className="py-3 px-4">Nomor WhatsApp</th>
                <th className="py-3 px-4 text-center">Status Notif WA</th>
                <th className="py-3 px-4 text-center">Aksi Hubungi</th>
                {canManage && <th className="py-3 px-4 text-center">Kelola</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredUsers.map((u) => {
                const phoneClean = (u.no_wa || '').replace(/\D/g, '');
                return (
                  <tr key={u.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{u.nama}</div>
                      {u.email && <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{u.jabatan}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{u.instansi_sektor}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{u.kelurahan_nama}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {u.no_wa}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => canManage && handleToggleNotifWa(u)}
                        disabled={!canManage}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          u.status_notifikasi_wa
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 cursor-pointer'
                        }`}
                        title="Klik untuk ubah status notifikasi otomatis"
                      >
                        {u.status_notifikasi_wa ? (
                          <>
                            <Bell className="w-3 h-3" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3 h-3" />
                            <span>Mati</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <a
                        href={`https://wa.me/${phoneClean}?text=Yth.%20Bapak%2FIbu%20${encodeURIComponent(u.nama)}%20(${encodeURIComponent(u.jabatan)}),%20mohon%20koordinasi%20terkait%20penanganan%20gizi%20balita%20Puskesmas%20Kepulauan%20Seribu%20Selatan.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-[11px] font-bold transition-colors border border-emerald-200 dark:border-emerald-800"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat WA</span>
                      </a>
                    </td>

                    {canManage && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800"
                            title="Edit Data"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.user_id, u.nama)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800"
                            title="Hapus Kontak"
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

      {/* MODAL TAMBAH / EDIT KONTAK LINTAS SEKTOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {editingUser.nama ? `Edit Kontak: ${editingUser.nama}` : 'Tambah Kontak Lintas Sektor'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: dr. Farah Anggraini, M.K.M."
                  value={editingUser.nama || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, nama: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lurah / Ketua TP PKK"
                    value={editingUser.jabatan || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, jabatan: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Instansi / Sektor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingUser.instansi_sektor || INSTANSI_OPTIONS[0]}
                    onChange={(e) => setEditingUser({ ...editingUser, instansi_sektor: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  >
                    {INSTANSI_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Wilayah Tugas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingUser.kelurahan_id || 'ALL'}
                    onChange={(e) => setEditingUser({ ...editingUser, kelurahan_id: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">Kecamatan (Semua Kelurahan)</option>
                    {safeKelurahanList.map(k => (
                      <option key={k.kelurahan_id} value={k.kelurahan_id}>{k.nama_kelurahan}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="628123456789"
                    value={editingUser.no_wa || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, no_wa: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="pejabat@jakarta.go.id"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Aktifkan Notifikasi WhatsApp Otomatis
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Otomatis kirim broadcast WA saat kader lapor balita kurang gizi
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editingUser.status_notifikasi_wa ?? true}
                  onChange={(e) => setEditingUser({ ...editingUser, status_notifikasi_wa: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kontak Lintas Sektor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
