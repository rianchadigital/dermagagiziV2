import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  UserCircle2, 
  Check, 
  X, 
  ShieldAlert, 
  Lock, 
  Key, 
  Edit3, 
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Building,
  RefreshCw
} from 'lucide-react';
import { User, Role } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';

interface UsersViewProps {
  users: User[];
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  onRefreshData: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onSwitchUser,
  onRefreshData
}) => {
  // Modal Add State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<Partial<User>>({});

  // Modal Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  // Modal Reset Password State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');

  // Modal Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);

  // Loading & Feedback State
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const canManage = currentUser.role === 'ADMIN' || currentUser.role === 'KEPALA_PUSKESMAS';

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Matriks Hak Akses RBAC
  const permissionsMatrix = [
    { module: 'Dashboard Ringkasan Wilayah', admin: true, kapus: true, gizi: true, pustu: true, kader: true, lintas: true, viewer: true },
    { module: 'Peta Sebaran per Pulau', admin: true, kapus: true, gizi: true, pustu: true, kader: true, lintas: true, viewer: true },
    { module: 'Registrasi Sasaran Balita', admin: true, kapus: false, gizi: true, pustu: true, kader: true, lintas: false, viewer: false },
    { module: 'Input Pemantauan & Antropometri', admin: true, kapus: false, gizi: true, pustu: true, kader: true, lintas: false, viewer: false },
    { module: 'Kelola & Edit Tindak Lanjut', admin: true, kapus: false, gizi: true, pustu: true, kader: false, lintas: false, viewer: false },
    { module: 'Pencatatan Kendala Akses & Laut', admin: true, kapus: true, gizi: true, pustu: true, kader: true, lintas: true, viewer: false },
    { module: 'Monitoring Lintas Sektor', admin: true, kapus: true, gizi: true, pustu: true, kader: false, lintas: true, viewer: false },
    { module: 'Laporan Eksekutif & Cetak PDF', admin: true, kapus: true, gizi: true, pustu: true, kader: false, lintas: false, viewer: true },
    { module: 'Pengelolaan Data Master', admin: true, kapus: false, gizi: false, pustu: false, kader: false, lintas: false, viewer: false },
    { module: 'Konfigurasi Google Apps Script', admin: true, kapus: false, gizi: false, pustu: false, kader: false, lintas: false, viewer: false }
  ];

  // --- Handlers: Tambah Pengguna ---
  const handleOpenAdd = () => {
    setActiveUser({
      user_id: `USR-00${users.length + 1}`,
      email: '',
      nama: '',
      no_wa: '628',
      role: 'PETUGAS_PUSTU',
      unit: 'Puskesmas Pembantu',
      pulau_id: 'PULAU-01',
      status_aktif: true,
      password: 'user2026'
    });
    setIsModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser.nama || !activeUser.email) return;

    setActionLoading(true);
    try {
      await apiService.saveUser(activeUser as User);
      setIsModalOpen(false);
      onRefreshData();
      showToast(`Pengguna baru ${activeUser.nama} berhasil ditambahkan!`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Handlers: Edit Pengguna ---
  const handleOpenEdit = (user: User) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.user_id || !editingUser.nama || !editingUser.email) return;

    setActionLoading(true);
    try {
      await apiService.saveUser(editingUser as User);
      setIsEditModalOpen(false);
      onRefreshData();
      showToast(`Data pengguna ${editingUser.nama} berhasil diperbarui!`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Handlers: Reset Password ---
  const handleOpenResetPassword = (user: User) => {
    setResetTargetUser(user);
    setNewPasswordInput('dermaga2026'); // Rekomendasi password baru default
    setIsResetPasswordModalOpen(true);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;

    const pwd = newPasswordInput.trim() || 'dermaga2026';
    setActionLoading(true);
    try {
      await apiService.resetUserPassword(resetTargetUser.user_id, pwd);
      setIsResetPasswordModalOpen(false);
      onRefreshData();
      showToast(`Kata sandi akun ${resetTargetUser.nama} berhasil direset menjadi: "${pwd}"`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Handlers: Hapus Pengguna ---
  const handleOpenDelete = (user: User) => {
    setDeleteTargetUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    if (deleteTargetUser.user_id === currentUser.user_id) {
      alert('Anda tidak dapat menghapus akun yang saat ini sedang aktif digunakan!');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.deleteUser(deleteTargetUser.user_id);
      setIsDeleteModalOpen(false);
      onRefreshData();
      showToast(`Akun pengguna ${deleteTargetUser.nama} berhasil dihapus dari sistem.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              Pengaturan Akun Pengguna & Hak Akses Sistem (RBAC)
            </h1>
            <span className="text-xs bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-semibold px-2.5 py-0.5 rounded-full font-mono tabular-nums">
              {users.length} Akun Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola akun petugas medis, kepala puskesmas, nutrisionis gizi, kader posyandu, dan tim lintas sektor kepulauan.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        )}
      </div>

      {/* Akun Pengguna Saat Ini */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/30 border border-sky-300/30 text-white flex items-center justify-center font-bold text-lg">
            {currentUser.nama.charAt(0)}
          </div>
          <div>
            <div className="text-xs text-sky-300 font-semibold uppercase tracking-wider">
              Sesi Pengguna Sedang Aktif
            </div>
            <div className="font-bold text-sm sm:text-base">{currentUser.nama}</div>
            <div className="text-xs text-sky-100/80">
              Peran: <span className="font-semibold text-white">{String(currentUser.role || '').replace(/_/g, ' ')}</span> · {currentUser.unit}
            </div>
          </div>
        </div>

        <div className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
          Gunakan tombol <b>"Edit"</b>, <b>"Reset Password"</b>, atau <b>"Hapus"</b> pada setiap baris di tabel bawah.
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center justify-between">
          <span>Daftar Akun Petugas & Pengguna Sistem</span>
          <span className="text-xs text-slate-400 font-normal">Fokus Database Google Spreadsheet</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Nama & Email</th>
                <th className="py-3 px-3">Peran (Role)</th>
                <th className="py-3 px-3">Unit Kerja Faskes</th>
                <th className="py-3 px-3">No. WhatsApp</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi Manajemen Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => {
                const isCurrent = u.user_id === currentUser.user_id;
                return (
                  <tr key={u.user_id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isCurrent ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{u.nama}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{u.email}</div>
                      <div className="text-[10px] text-slate-400">ID: {u.user_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {String(u.role || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{u.unit || '-'}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{u.no_wa || '-'}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        u.status_aktif !== false ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {u.status_aktif !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Switch Account */}
                        {isCurrent ? (
                          <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2 py-1 rounded-lg">
                            Sedang Aktif
                          </span>
                        ) : (
                          <button
                            onClick={() => onSwitchUser(u.user_id)}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                            title="Ganti ke sesi akun ini untuk menguji peran"
                          >
                            Uji Akun
                          </button>
                        )}

                        {/* Tombol Edit */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Pengguna"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Reset Password */}
                        <button
                          onClick={() => handleOpenResetPassword(u)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                          title="Reset Kata Sandi"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Hapus */}
                        <button
                          disabled={isCurrent}
                          onClick={() => handleOpenDelete(u)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isCurrent 
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600'
                          }`}
                          title={isCurrent ? 'Tidak bisa menghapus akun yang sedang aktif' : 'Hapus Pengguna'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matriks Hak Akses RBAC */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-sky-700 dark:text-sky-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Matriks Hak Akses Berdasarkan Peran (Role-Based Access Control)
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Hak akses ini divalidasi pada antarmuka pengguna untuk menjamin kepatuhan privasi data balita dan peran lintas sektor.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">Modul / Fungsi Sistem</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">Admin</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">Kepala Pusk</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">Tenaga Gizi</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">Pustu / Nakes</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">Kader</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">Lintas Sektor</th>
                <th className="py-2.5 px-2 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium border-r border-slate-200 dark:border-slate-800">{item.module}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">{item.admin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">{item.kapus ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">{item.gizi ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">{item.pustu ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">{item.kader ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">{item.lintas ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center">{item.viewer ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Tambah Pengguna Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white text-base">Tambah Pengguna Baru</div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3 pt-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  value={activeUser.nama || ''}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, nama: e.target.value }))}
                  placeholder="Contoh: dr. Ahmad Fauzi"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Resmi Instansi *</label>
                <input
                  type="email"
                  value={activeUser.email || ''}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Contoh: ahmad.fauzi@jakarta.go.id"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp Aktif</label>
                <input
                  type="text"
                  value={activeUser.no_wa || ''}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, no_wa: e.target.value }))}
                  placeholder="Contoh: 6281234567890"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Peran Akses (Role) *</label>
                <select
                  value={activeUser.role || 'PETUGAS_PUSTU'}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, role: e.target.value as Role }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="KEPALA_PUSKESMAS">Kepala Puskesmas</option>
                  <option value="TENAGA_GIZI">Tenaga Gizi</option>
                  <option value="DOKTER_BIDAN_PERAWAT">Dokter / Bidan / Perawat</option>
                  <option value="PETUGAS_PUSTU">Petugas Pustu</option>
                  <option value="KADER">Kader Posyandu</option>
                  <option value="LINTAS_SEKTOR">Lintas Sektor (Kelurahan/Kecamatan)</option>
                  <option value="VIEWER">Viewer (Hanya Melihat)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Kerja / Penempatan</label>
                <input
                  type="text"
                  value={activeUser.unit || ''}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Contoh: Puskesmas Pembantu Pulau Lancang"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Awal</label>
                <input
                  type="text"
                  value={activeUser.password || 'user2026'}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Pengguna */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white text-base">Edit Data Pengguna</div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 pt-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ID Pengguna (Sistem)</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.user_id || ''}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  value={editingUser.nama || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, nama: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Resmi *</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  value={editingUser.no_wa || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, no_wa: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Peran Akses (Role) *</label>
                <select
                  value={editingUser.role || 'PETUGAS_PUSTU'}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value as Role }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="KEPALA_PUSKESMAS">Kepala Puskesmas</option>
                  <option value="TENAGA_GIZI">Tenaga Gizi</option>
                  <option value="DOKTER_BIDAN_PERAWAT">Dokter / Bidan / Perawat</option>
                  <option value="PETUGAS_PUSTU">Petugas Pustu</option>
                  <option value="KADER">Kader Posyandu</option>
                  <option value="LINTAS_SEKTOR">Lintas Sektor (Kelurahan/Kecamatan)</option>
                  <option value="VIEWER">Viewer (Hanya Melihat)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Kerja / Instansi</label>
                <input
                  type="text"
                  value={editingUser.unit || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={editingUser.status_aktif !== false}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, status_aktif: e.target.checked }))}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Akun Pengguna Aktif</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Kata Sandi */}
      {isResetPasswordModalOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-900 dark:text-white text-base">Reset Kata Sandi</span>
              </div>
              <button onClick={() => setIsResetPasswordModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-3 pt-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
                Anda akan mereset kata sandi untuk akun: <strong>{resetTargetUser.nama}</strong> ({resetTargetUser.user_id}).
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi Baru *
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Contoh: dermaga2026"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPasswordInput('dermaga2026')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] hover:bg-slate-200 cursor-pointer"
                >
                  Gunakan "dermaga2026"
                </button>
                <button
                  type="button"
                  onClick={() => setNewPasswordInput('gizi2026')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] hover:bg-slate-200 cursor-pointer"
                >
                  Gunakan "gizi2026"
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>Terapkan Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Konfirmasi Hapus Pengguna */}
      {isDeleteModalOpen && deleteTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-rose-200 dark:border-rose-900 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white text-base">Konfirmasi Hapus Akun</span>
            </div>

            <div className="py-3 space-y-2">
              <p className="text-slate-600 dark:text-slate-300">
                Apakah Anda yakin ingin menghapus akun pengguna berikut dari sistem?
              </p>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{deleteTargetUser.nama}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{deleteTargetUser.email}</div>
                <div className="text-[10px] text-slate-500 mt-1">Peran: {deleteTargetUser.role} · ID: {deleteTargetUser.user_id}</div>
              </div>
              <p className="text-[11px] text-rose-500">
                Tindakan ini permanen dan akan menghapus baris pengguna pada database Google Spreadsheet.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
