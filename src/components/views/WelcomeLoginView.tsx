import React, { useState } from 'react';
import { 
  Ship, 
  MapPin, 
  ShieldCheck, 
  Users2, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  Baby, 
  HeartHandshake, 
  Activity,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Phone
} from 'lucide-react';
import { User } from '../../types';

interface WelcomeLoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const WelcomeLoginView: React.FC<WelcomeLoginViewProps> = ({ users, onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('USR-001'); // Default Petugas Gizi
  const [usernameInput, setUsernameInput] = useState<string>('gizi.puskesmas');
  const [passwordInput, setPasswordInput] = useState<string>('gizi2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle Form Submission
  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameInput.trim()) {
      setErrorMessage('Silakan masukkan username atau NIP');
      return;
    }

    // Cari user yang cocok atau fallback ke selectedUserId
    const foundUser = users.find(u => 
      u.user_id.toLowerCase() === usernameInput.toLowerCase() ||
      u.nama.toLowerCase().includes(usernameInput.toLowerCase()) ||
      u.role.toLowerCase() === usernameInput.toLowerCase()
    ) || users.find(u => u.user_id === selectedUserId) || users[0];

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setErrorMessage('Pengguna tidak ditemukan. Silakan gunakan tombol Akses Cepat di bawah.');
    }
  };

  const handleQuickLogin = (user: User) => {
    onLogin(user);
  };

  // Group quick login users by category
  const quickUsers = [
    {
      id: 'USR-001',
      title: 'Petugas Gizi Puskesmas',
      tag: 'Kesehatan Gizi (Otoritas Penuh)',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      desc: 'Penetapan status Selesai, analisis klinis & tindak lanjut'
    },
    {
      id: 'USR-002',
      title: 'Dokter / Tim Medis Puskesmas',
      tag: 'Tenaga Medis',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      desc: 'Pemeriksaan lanjutan, resep PMT & rujukan'
    },
    {
      id: 'USR-005',
      title: 'Kader Posyandu (Kader Mawar)',
      tag: 'Kader Posyandu',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      desc: 'Input penimbangan, temuan gizi & pemantauan lapangan'
    },
    {
      id: 'USR-004',
      title: 'Kelurahan (Lurah Pulau Panggang)',
      tag: 'Pemerintah Kelurahan',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      desc: 'Fasilitasi bantuan warga & koordinasi lintas sektor'
    },
    {
      id: 'USR-008',
      title: 'Dinas Perhubungan (Dishub Laut)',
      tag: 'Transportasi Laut Antar-Pulau',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      desc: 'Armada kapal ambulans laut rujukan cepat balita'
    },
    {
      id: 'USR-009',
      title: 'TP PKK (Pokja IV Dasawisma)',
      tag: 'Pemberdayaan Keluarga',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      desc: 'Dapur sehat balita, PMT pangan lokal & pola asuh'
    },
    {
      id: 'USR-010',
      title: 'Satpol PP Kecamatan',
      tag: 'Pendampingan Wilayah',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      desc: 'Pengawalan penjangkauan keluarga rentan pulau terpencil'
    },
    {
      id: 'USR-011',
      title: 'Suku Dinas Sosial (Dinsos)',
      tag: 'Bantuan Sosial Pangan',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      desc: 'Bantuan sembako tinggi protein & jaminan bansos'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background Decorative Gradients & Island Silhouette */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header Brand */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
            <Ship className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-white">DERMAGA GIZI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Puskesmas Kep. Seribu Selatan
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pemerintah Provinsi DKI Jakarta · Wilayah Kerja Kepulauan Seribu Selatan
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Sistem Aktif & Terintegrasi Real-time</span>
        </div>
      </header>

      {/* Main Container: Split Hero & Login */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Ringkasan & Profil Singkat DERMAGA GIZI (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Inovasi Akselerasi Penurunan Masalah Gizi Kepulauan</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                DERMAGA <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300">GIZI</span>
              </h1>
              
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                <strong>Dashboard Elektronik Rekap, Monitoring, dan Analisis Gizi</strong> — platform kolaborasi terpadu Puskesmas Kepulauan Seribu Selatan untuk percepatan deteksi dini balita berisiko, penanganan lintas sektor berbasis gugus pulau, serta tindak lanjut langsung terhubung WhatsApp.
              </p>
            </div>

            {/* 4 Pilar Fitur Utama DERMAGA GIZI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/40 transition-all shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Baby className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Deteksi Dini Posyandu</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Input laporan penimbangan 12 posyandu di seluruh pulau, deteksi otomatis status gizi kurang, gizi buruk, stunting, dan underweight.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/40 transition-all shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Users2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Kolaborasi Lintas Sektor</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Satu anak bermasalah gizi ditangani bersama oleh Nakes Gizi, Kader, Kelurahan, Kecamatan, Dishub, PKK, Satpol PP, dan Dinsos dalam 1 sistem terpadu.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/40 transition-all shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Ship className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rujukan Kapal Laut</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dukungan integrasi Dishub Laut untuk mobilitas cepat ambulans perairan antar-pulau rujukan balita ke Puskesmas & RSUD Kep. Seribu.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-sky-500/40 transition-all shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Validasi Khusus Nakes Gizi</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kualitas klinis terjamin: Hanya Petugas Gizi Puskesmas yang berwenang mengevaluasi dan meresmikan status kasus menjadi Selesai.
                </p>
              </div>

            </div>

            {/* Banner Lokasi Wilayah */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 border border-slate-800/80 px-4 py-2.5 rounded-xl">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Wilayah Cakupan: <strong>Pulau Tidung</strong>, <strong>Pulau Pari</strong>, <strong>Pulau Untung Jawa</strong>, <strong>Pulau Lancang</strong>, <strong>Pulau Payung</strong>
              </span>
            </div>

          </div>

          {/* Right Column: Form Login & Quick Access (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Login Card */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-sky-950/50 backdrop-blur-xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Masuk ke Sistem</h2>
                  <p className="text-xs text-slate-400">Gunakan akun kedinasan atau akses cepat demo</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username / ID Petugas / NIP
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Contoh: USR-001 atau gizi.puskesmas"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="rounded border-slate-800 text-sky-600 focus:ring-sky-500 bg-slate-950" />
                    <span>Ingat saya di perangkat ini</span>
                  </label>
                  <span className="text-sky-400 hover:underline cursor-pointer">Bantuan Akses</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
                >
                  <span>Masuk ke Dashboard Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick 1-Click Role Switcher */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilihan Akses Cepat Login (1-Klik)
                  </span>
                  <span className="text-[10px] text-sky-400">Langsung Masuk</span>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {quickUsers.map(item => {
                    const matchedUser = users.find(u => u.user_id === item.id);
                    if (!matchedUser) return null;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleQuickLogin(matchedUser)}
                        className="text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 hover:border-sky-500/50 transition-all group cursor-pointer"
                        title={item.desc}
                      >
                        <div className="text-[11px] font-bold text-white group-hover:text-sky-300 truncate">
                          {matchedUser.nama.split(',')[0]}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate mt-0.5">
                          {item.tag}
                        </div>
                        <span className={`inline-block mt-1 text-[8px] font-semibold px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                          Masuk Sebagai {matchedUser.role.replace(/_/g, ' ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bantuan Teknis */}
            <div className="text-center text-[11px] text-slate-500">
              Butuh bantuan akses dinas? Hubungi Admin Sistem Puskesmas Kepulauan Seribu Selatan
            </div>

          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <div>
          <span className="text-slate-400 font-semibold">DERMAGA GIZI</span> © 2026 Puskesmas Kepulauan Seribu Selatan · Dinas Kesehatan DKI Jakarta
        </div>
        <div className="text-[11px] text-slate-500">
          Versi 2.4.0 · Mendukung Standar Tata Kelola SPBE & Penurunan Stunting Nasional
        </div>
      </footer>

    </div>
  );
};
