import React from 'react';
import { 
  Home,
  Map, 
  ClipboardList, 
  Compass, 
  Users2, 
  FileBarChart2, 
  Baby, 
  Stethoscope, 
  UserCheck, 
  HelpCircle, 
  Settings, 
  MapPin,
  X,
  ChevronRight,
  ShieldAlert,
  Building2,
  Scale,
  Contact2,
  LogOut
} from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../../types';

export type ActiveTab = 
  | 'dashboard'
  | 'map'
  | 'tindak-lanjut'
  | 'kendala'
  | 'lintas-sektor'
  | 'laporan'
  | 'kinerja-role'
  | 'sasaran'
  | 'master-posyandu'
  | 'master-lintas-sektor'
  | 'users'
  | 'panduan'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  overdueCount: number;
  kendalaCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenWhatsAppModal: () => void;
  waNotifCount: number;
  currentUser?: User;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  overdueCount,
  kendalaCount,
  isOpenMobile,
  setIsOpenMobile,
  onOpenWhatsAppModal,
  waNotifCount,
  currentUser,
  onLogout
}) => {
  // Pengaturan Hak Akses Menu:
  // - Petugas Gizi & Admin: Muncul SEMUA menu
  // - Lintas Sektor & Kader: HANYA muncul 4 menu: Beranda, Peta Wilayah, Daftar Tindak Lanjut, Daftar Kendala
  const isAdminOrGizi = currentUser?.role === 'ADMIN' || 
    currentUser?.role === 'TENAGA_GIZI' || 
    currentUser?.role === 'KEPALA_PUSKESMAS';

  const isKaderOrLintasSektor = !isAdminOrGizi;

  // 4 Menu Utama untuk Kader & Lintas Sektor
  const restrictedNav = [
    {
      id: 'dashboard',
      label: 'Beranda / Ringkasan',
      icon: Home,
      badge: null
    },
    {
      id: 'map',
      label: 'Peta Wilayah',
      icon: Map,
      badge: null
    },
    {
      id: 'tindak-lanjut',
      label: 'Daftar Tindak Lanjut',
      icon: ClipboardList,
      badge: overdueCount > 0 ? `${overdueCount}` : null,
      badgeColor: 'bg-rose-500 text-white font-bold'
    },
    {
      id: 'kendala',
      label: 'Daftar Kendala',
      icon: Compass,
      badge: kendalaCount > 0 ? `${kendalaCount}` : null,
      badgeColor: 'bg-amber-500 text-white font-bold'
    }
  ];

  // Menu Lengkap untuk Tenaga Gizi & Admin
  const adminMainNav = [
    {
      id: 'dashboard',
      label: 'Beranda / Ringkasan',
      icon: Home,
      badge: null
    },
    {
      id: 'map',
      label: 'Peta Wilayah',
      icon: Map,
      badge: null
    },
    {
      id: 'sasaran',
      label: 'Data Sasaran Balita Bermasalah Gizi',
      icon: Baby,
      badge: null
    },
    {
      id: 'tindak-lanjut',
      label: 'Daftar Tindak Lanjut',
      icon: ClipboardList,
      badge: overdueCount > 0 ? `${overdueCount}` : null,
      badgeColor: 'bg-rose-500 text-white font-bold'
    },
    {
      id: 'kendala',
      label: 'Daftar Kendala',
      icon: Compass,
      badge: kendalaCount > 0 ? `${kendalaCount}` : null,
      badgeColor: 'bg-amber-500/90 text-white font-bold'
    },
    {
      id: 'lintas-sektor',
      label: 'Monitoring Lintas Sektor',
      icon: Users2,
      badge: null
    },
    {
      id: 'laporan',
      label: 'Laporan & Evaluasi',
      icon: FileBarChart2,
      badge: null
    },
    {
      id: 'kinerja-role',
      label: 'Kinerja Peran Akses',
      icon: UserCheck,
      badge: overdueCount > 0 ? 'Perlu Follow-up' : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
    }
  ];

  const dataMasterNav = [
    {
      id: 'master-posyandu',
      label: 'Data Posyandu & Kelurahan',
      icon: Building2
    },
    {
      id: 'master-lintas-sektor',
      label: 'Data User Lintas Sektor',
      icon: Contact2
    },
    {
      id: 'users',
      label: 'Pengguna & Akses Sistem',
      icon: ShieldAlert
    }
  ];

  const bantuanNav = [
    {
      id: 'panduan',
      label: 'Panduan Penggunaan',
      icon: HelpCircle
    },
    {
      id: 'settings',
      label: 'Pusat Bantuan & API',
      icon: Settings
    }
  ];

  const renderNavButton = (item: { id: string; label: string; icon: any; badge?: string | null; badgeColor?: string }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          setActiveTab(item.id as ActiveTab);
          setIsOpenMobile(false);
        }}
        className={`
          w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer
          ${isActive 
            ? 'bg-[#1e4e8c] text-white shadow-md shadow-sky-950/40 font-semibold' 
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}
        `}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'}`} />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge ? (
          <span className={`px-2 py-0.5 text-[10px] rounded-full ${item.badgeColor || 'bg-sky-500 text-white'}`}>
            {item.badge}
          </span>
        ) : (
          isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-200 shrink-0" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0c1f38] text-slate-200 
        border-r border-slate-800/90 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header Branding */}
        <div className="p-4 border-b border-slate-800/80 flex items-start justify-between">
          <Logo size="md" />
          <button 
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Banner: Untuk Kader atau Lintas Sektor */}
        {isKaderOrLintasSektor && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-xs">
            <div className="font-bold flex items-center gap-1.5 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {currentUser?.role === 'KADER' ? 'Akses Kader Posyandu' : 'Akses Lintas Sektor'}
              </span>
            </div>
            <p className="text-[10px] text-emerald-200/80 mt-1 leading-tight">
              Menu aktif: Beranda, Peta Wilayah, Daftar Tindak Lanjut, dan Daftar Kendala.
            </p>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          
          {/* Main Operational Menus */}
          <div className="space-y-1">
            {isKaderOrLintasSektor ? (
              // HANYA 4 MENU UNTUK KADER & LINTAS SEKTOR SESUAI PERMINTAAN USER
              restrictedNav.map(renderNavButton)
            ) : (
              // MENU LENGKAP UNTUK ADMIN & PETUGAS GIZI
              adminMainNav.map(renderNavButton)
            )}
          </div>

          {/* DATA MASTER Section (Hanya untuk Tenaga Gizi & Admin) */}
          {isAdminOrGizi && (
            <div className="pt-2">
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                DATA MASTER
              </div>
              <div className="space-y-1">
                {dataMasterNav.map(renderNavButton)}
              </div>
            </div>
          )}

          {/* BANTUAN Section (Hanya untuk Tenaga Gizi & Admin) */}
          {isAdminOrGizi && (
            <div className="pt-2">
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                BANTUAN
              </div>
              <div className="space-y-1">
                {bantuanNav.map(renderNavButton)}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Island Card from Mockup */}
        <div className="p-3 border-t border-slate-800/80 bg-[#09172b]">
          <div className="relative overflow-hidden rounded-xl border border-sky-900/40 bg-gradient-to-br from-[#102d52] via-[#0b203c] to-[#08172c] p-3 text-white shadow-inner">
            
            {/* Visual Island Graphic Header */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    Puskesmas
                  </h4>
                  <div className="text-[11px] font-bold text-sky-300 leading-tight">
                    Kepulauan Seribu Selatan
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-300/90 leading-relaxed mt-1">
                Integrasi Data untuk Pelayanan Gizi Balita yang Lebih Merata dan Berkelanjutan
              </p>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-2.5 w-full py-1.5 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Aplikasi</span>
                </button>
              )}
            </div>

            {/* Subtle island landscape silhouettes in background */}
            <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
              <svg width="100" height="50" viewBox="0 0 100 50" fill="none">
                <path d="M10 40C25 25 45 20 60 32C75 44 85 30 95 38V50H0V40H10Z" fill="#38bdf8" />
                <path d="M40 35C55 22 75 18 90 30V50H40V35Z" fill="#0284c7" />
              </svg>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
