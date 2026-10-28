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
  Save 
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<Partial<User>>({});

  const canManage = currentUser.role === 'ADMIN';

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

  const handleOpenAdd = () => {
    setActiveUser({
      user_id: `USR-00${users.length + 1}`,
      email: '',
      nama: '',
      role: 'PETUGAS_PUSTU',
      unit: 'Pustu Kepulauan',
      pulau_id: 'PULAU-01',
      status_aktif: true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser.nama || !activeUser.email) return;

    await apiService.saveUser(activeUser as User);
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
              Manajemen Pengguna & Hak Akses Berbasis Peran (RBAC)
            </h1>
            <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full font-mono tabular-nums">
              {users.length} Akun Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemisahan kewenangan tugas medis, verifikasi gizi, pembatasan data pribadi balita, dan peran lintas sektor.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start"
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
              Sesi Pengguna Aktif
            </div>
            <div className="font-bold text-sm sm:text-base">{currentUser.nama}</div>
            <div className="text-xs text-sky-100/80">
              Peran: <span className="font-semibold text-white">{currentUser.role.replace(/_/g, ' ')}</span> · {currentUser.unit}
            </div>
          </div>
        </div>

        <div className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
          Uji hak akses peran lain menggunakan tombol <b>"Ganti ke Akun Ini"</b> pada tabel di bawah.
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
          Daftar Petugas & Pengguna Sistem
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Nama & Email</th>
                <th className="py-3 px-3">Peran (Role)</th>
                <th className="py-3 px-3">Unit Kerja Faskes</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi & Uji Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isCurrent = u.user_id === currentUser.user_id;
                return (
                  <tr key={u.user_id} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-sky-50/40' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.nama}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{u.unit}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        Aktif
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isCurrent ? (
                        <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-lg">
                          Sedang Aktif
                        </span>
                      ) : (
                        <button
                          onClick={() => onSwitchUser(u.user_id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Ganti ke Akun Ini
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matriks Hak Akses RBAC */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-sky-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Matriks Hak Akses Berdasarkan Peran (Role-Based Access Control)
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Hak akses ini divalidasi pada level API server Google Apps Script dan antarmuka pengguna untuk menjamin kepatuhan UU Perlindungan Data Pribadi (PDP).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 border-r border-slate-200">Modul / Fungsi Sistem</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200">Admin</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200">Kepala Pusk</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200">Tenaga Gizi</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200">Pustu / Nakes</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200">Kader</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200">Lintas Sektor</th>
                <th className="py-2.5 px-2 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-medium border-r border-slate-200">{item.module}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200">{item.admin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200">{item.kapus ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200">{item.gizi ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200">{item.pustu ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200">{item.kader ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200">{item.lintas ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center">{item.viewer ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-base">Tambah Pengguna Baru</div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 pt-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  value={activeUser.nama || ''}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, nama: e.target.value }))}
                  placeholder="Contoh: dr. Ahmad Fauzi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Resmi Instansi *</label>
                <input
                  type="email"
                  value={activeUser.email || ''}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Contoh: ahmad.fauzi@seribuselatan.jakarta.go.id"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran Akses (Role) *</label>
                <select
                  value={activeUser.role || 'PETUGAS_PUSTU'}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, role: e.target.value as Role }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
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
                <label className="block font-semibold text-slate-700 mb-1">Unit Kerja / Penempatan</label>
                <input
                  type="text"
                  value={activeUser.unit || ''}
                  onChange={(e) => setActiveUser(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Contoh: Puskesmas Pembantu Pulau Lancang"
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
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
