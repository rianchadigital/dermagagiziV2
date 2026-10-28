import React, { useState } from 'react';
import { 
  Menu, 
  MapPin, 
  Calendar, 
  UserCircle2, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Layers,
  CheckSquare,
  Sparkles,
  LogOut
} from 'lucide-react';
import { GlobalFilter, Pulau, User } from '../../types';
import { apiService } from '../../services/apiService';

interface HeaderProps {
  filter: GlobalFilter;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilter>>;
  pulauList: Pulau[];
  currentUser: User;
  users: User[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  isSyncing: boolean;
  onSwitchUser: (userId: string) => void;
  onOpenMobileSidebar: () => void;
  onRefreshData: () => void;
  onOpenSettings: () => void;
  onOpenWhatsAppModal: () => void;
  waNotifCount: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filter,
  setFilter,
  pulauList,
  currentUser,
  users,
  isDarkMode,
  onToggleDarkMode,
  autoRefresh,
  onToggleAutoRefresh,
  isSyncing,
  onSwitchUser,
  onOpenMobileSidebar,
  onRefreshData,
  onOpenSettings,
  onOpenWhatsAppModal,
  waNotifCount,
  onLogout
}) => {
  const isConnected = apiService.isConnected();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
      
      {/* 1. Baris Utama Header (Sesuai Lampiran 1) */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 gap-3 border-b border-slate-100 dark:border-slate-800/80">
        
        {/* Left: Hamburger + Brand Icon & Title + Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Island Icon Logo */}
          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 text-white items-center justify-center shadow-xs shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1" />
              <path d="M12 4v10" />
              <path d="m8 8 4-4 4 4" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 dark:text-white text-base lg:text-lg tracking-tight">
                DERMAGA GIZI
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
              Sistem Integrasi dan Akselerasi Tindak Lanjut Gizi Balita Berbasis Wilayah Kepulauan
            </p>
          </div>
        </div>

        {/* Right: Controls + Notification Bell + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Live 3s Auto Refresh status */}
          <button
            onClick={onToggleAutoRefresh}
            title={autoRefresh ? 'Sinkronisasi Otomatis 3 Detik ke Database Aktif' : 'Sinkronisasi Otomatis Dijeda'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
              autoRefresh 
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-sky-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="hidden sm:inline text-[11px] font-medium font-mono">
              {isSyncing ? 'Syncing...' : 'Live 3d'}
            </span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Bell Icon Notification Button */}
          <button
            onClick={onOpenWhatsAppModal}
            title="Pusat Notifikasi WhatsApp & Peringatan Tindak Lanjut"
            className="relative p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 text-[9px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xs">
              {waNotifCount > 0 ? waNotifCount : 5}
            </span>
          </button>

          {/* User Profile Pill (Sesuai Lampiran 1: Avatar + Pertugas Gizi + Puskesmas Kepulauan Seribu Selatan) */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser.nama.charAt(0)}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {currentUser.role === 'TENAGA_GIZI' ? 'Petugas Gizi' : currentUser.nama.split(',')[0]}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                  Puskesmas Kepulauan Seribu Selatan
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown switch user for testing RBAC */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                  <span>Simulasi Peran (RBAC)</span>
                  <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold px-1.5 py-0.5 rounded">Aktif</span>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {users.map(u => (
                    <button
                      key={u.user_id}
                      onClick={() => {
                        onSwitchUser(u.user_id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors ${
                        u.user_id === currentUser.user_id ? 'bg-sky-50/70 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 font-semibold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <UserCircle2 className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                      <div>
                        <div className="text-xs leading-tight font-medium">{u.nama}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{u.role.replace(/_/g, ' ')} · {u.unit}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full text-center py-1 text-[11px] text-sky-700 dark:text-sky-400 hover:underline font-medium"
                  >
                    Buka Pengaturan & API Database
                  </button>
                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Logout Header Icon */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Keluar dari Aplikasi (Logout)"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* 2. Baris Filter Terpadu (Presisi sesuai Lampiran 1 & 2) */}
      <div className="px-4 lg:px-6 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs w-full lg:w-auto">
          
          {/* Filter Periode */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Periode:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <select
                value={filter.bulan}
                onChange={(e) => setFilter(prev => ({ ...prev, bulan: e.target.value }))}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="10" className="dark:bg-slate-800">Oktober 2026</option>
                <option value="09" className="dark:bg-slate-800">September 2026</option>
                <option value="08" className="dark:bg-slate-800">Agustus 2026</option>
                <option value="07" className="dark:bg-slate-800">Juli 2026</option>
                <option value="ALL" className="dark:bg-slate-800">Semua Periode 2026</option>
              </select>
            </div>
          </div>

          {/* Filter Wilayah Pulau */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Wilayah Pulau:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <select
                value={filter.pulau_id}
                onChange={(e) => setFilter(prev => ({ ...prev, pulau_id: e.target.value }))}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="dark:bg-slate-800">Semua Pulau</option>
                {pulauList.map(p => (
                  <option key={p.pulau_id} value={p.pulau_id} className="dark:bg-slate-800">
                    {p.nama_pulau}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Kategori Masalah Gizi */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Kategori Masalah Gizi:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <select
                value={filter.kategori_masalah || 'ALL'}
                onChange={(e) => setFilter(prev => ({ ...prev, kategori_masalah: e.target.value }))}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="dark:bg-slate-800">Semua Kategori</option>
                <option value="Wasting (Kurus/Gizi Kurang)" className="dark:bg-slate-800">Gizi Kurang</option>
                <option value="Underweight (BB Kurang)" className="dark:bg-slate-800">Berat Badan Tidak Naik</option>
                <option value="Stunting (Pendek)" className="dark:bg-slate-800">Risiko Masalah Pertumbuhan</option>
                <option value="Risiko Gizi Lebih / Obesitas" className="dark:bg-slate-800">Gizi Lebih</option>
              </select>
            </div>
          </div>

          {/* Filter Status Tindak Lanjut */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Status Tindak Lanjut:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
              <CheckSquare className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <select
                value={filter.status_tindak_lanjut || 'ALL'}
                onChange={(e) => setFilter(prev => ({ ...prev, status_tindak_lanjut: e.target.value }))}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="dark:bg-slate-800">Semua Status</option>
                <option value="Dalam proses" className="dark:bg-slate-800">Dalam Proses</option>
                <option value="Selesai" className="dark:bg-slate-800">Selesai</option>
                <option value="Belum ditindaklanjuti" className="dark:bg-slate-800">Terlambat / Tertunda</option>
                <option value="Menunggu koordinasi" className="dark:bg-slate-800">Menunggu Koordinasi</option>
              </select>
            </div>
          </div>

        </div>

        {/* Action Button: Perbarui Data (Biru sesuai mockup Lampiran 1) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshData}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Perbarui Data</span>
          </button>
        </div>
      </div>

    </div>
  );
};
