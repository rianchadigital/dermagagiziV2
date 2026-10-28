import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Send, 
  Download, 
  Search, 
  TrendingUp, 
  ArrowUpRight, 
  MessageSquare,
  Filter
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { RolePerformanceSummary, User } from '../../types';
import { exportToCSV } from '../../utils/formatters';

interface KinerjaRoleViewProps {
  currentUser: User;
  onRefreshData: () => void;
  onOpenWhatsAppModal: () => void;
}

export const KinerjaRoleView: React.FC<KinerjaRoleViewProps> = ({
  currentUser,
  onRefreshData,
  onOpenWhatsAppModal
}) => {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const report: RolePerformanceSummary[] = storageService.getRolePerformanceReport();

  // Hitung total akumulatif
  const totalTugas = report.reduce((acc, r) => acc + r.total_tindak_lanjut, 0);
  const totalSelesai = report.reduce((acc, r) => acc + r.selesai, 0);
  const totalTertunda = report.reduce((acc, r) => acc + r.tertunda, 0);
  const totalOverdue = report.reduce((acc, r) => acc + r.overdue, 0);
  const avgPenyelesaian = totalTugas > 0 ? Math.round((totalSelesai / totalTugas) * 100) : 0;

  const filteredReport = report.filter(r => {
    if (selectedRoleFilter !== 'ALL' && r.role !== selectedRoleFilter) return false;
    return true;
  });

  const handleSendDirectWAReminder = (petugasNama: string, roleLabel: string, phone?: string, overdueCount: number = 0, pendingCount: number = 0) => {
    const targetPhone = phone || '6281299887711';
    const text = `⚠️ *PENGINGAT KINERJA TINDAK LANJUT GIZI*\n` +
      `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
      `Yth. Rekan *${petugasNama}* (${roleLabel}),\n` +
      `Berdasarkan Laporan Monitoring Kinerja Peran Akses Sistem DERMAGA GIZI:\n` +
      `• Tugas Belum Ditindaklanjuti: *${pendingCount} Kasus*\n` +
      `• Melewati Tenggat (Overdue): *${overdueCount} Kasus*\n\n` +
      `Mohon kesediaannya untuk segera menindaklanjuti dan melakukan pembaruan status intervensi di aplikasi demi percepatan penurunan masalah gizi balita kepulauan.\n\n` +
      `Terima kasih.`;

    const link = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(link, '_blank');
  };

  const handleExportCSV = () => {
    const headers = [
      'Peran Akses (Role)',
      'Nama Petugas',
      'Unit Kerja',
      'Nomor WhatsApp',
      'Total Tugas',
      'Selesai',
      'Tertunda / Belum',
      'Overdue (Lewat Tenggat)',
      'Persentase Capaian (%)'
    ];

    const rows: (string | number)[][] = [];
    report.forEach(r => {
      r.petugas_list.forEach(p => {
        rows.push([
          r.role_label,
          p.nama,
          p.unit,
          p.no_wa || '-',
          p.total,
          p.selesai,
          p.tertunda,
          p.overdue,
          `${p.persen}%`
        ]);
      });
    });

    exportToCSV('Laporan_Monitoring_Kinerja_Role_Petugas', headers, rows);
    storageService.addLog('EXPORT', 'SYSTEM', 'REPORT-KINERJA', 'Ekspor Laporan Monitoring Kinerja Petugas per Role ke CSV', 'SUCCESS');
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              Monitoring Kinerja Peran Akses (Role) & Penanggung Jawab
            </h1>
            <span className="text-xs bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold px-2 py-0.5 rounded-full font-mono tabular-nums">
              {totalOverdue} Tugas Lewat Tenggat
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Laporan transparansi akuntabilitas pelaksanaan tindak lanjut gizi balita oleh Tenaga Gizi, Dokter/Bidan, Pustu, Kader, dan Lintas Sektor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV Kinerja</span>
          </button>

          <button
            onClick={onOpenWhatsAppModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Pusat Notifikasi WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu KPI Akumulatif Kinerja */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Total Intervensi</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">{totalTugas}</div>
          <p className="text-[11px] text-slate-400 mt-1">Ditugaskan ke seluruh nakes</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">Tuntas / Selesai</span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1">{totalSelesai} ({avgPenyelesaian}%)</div>
          <p className="text-[11px] text-slate-400 mt-1">Telah dikerjakan & diverifikasi</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider text-[11px]">Belum / Tertunda</span>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono tabular-nums mt-1">{totalTertunda}</div>
          <p className="text-[11px] text-slate-400 mt-1">Masih menunggu penanganan</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider text-[11px]">Melewati Tenggat</span>
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 font-mono tabular-nums mt-1">{totalOverdue}</div>
          <p className="text-[11px] text-slate-400 mt-1">Wajib segera diingatkan via WA</p>
        </div>
      </div>

      {/* Filter Role */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Filter Peran (Role):</span>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
          >
            <option value="ALL">Semua Peran Akses</option>
            <option value="TENAGA_GIZI">Tenaga Gizi (Nutrisionis)</option>
            <option value="DOKTER_BIDAN_PERAWAT">Dokter / Bidan / Perawat</option>
            <option value="PETUGAS_PUSTU">Petugas Pustu Pulau</option>
            <option value="KADER">Kader Posyandu</option>
            <option value="LINTAS_SEKTOR">Petugas Lintas Sektor</option>
          </select>
        </div>

        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
          Menampilkan rangkuman beban kerja dan tindak lanjut tertunda per petugas
        </div>
      </div>

      {/* Daftar Kinerja Berdasarkan Peran */}
      <div className="space-y-4">
        {filteredReport.map(r => {
          return (
            <div 
              key={r.role}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-xs space-y-4"
            >
              {/* Header Role */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{r.role_label}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                      {r.total_petugas} Petugas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Beban Tindak Lanjut: <b>{r.total_tindak_lanjut}</b> · Selesai: <b className="text-emerald-600">{r.selesai}</b> · Tertunda: <b className="text-amber-600">{r.tertunda}</b> · Overdue: <b className="text-rose-600">{r.overdue}</b>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Capaian Kinerja</span>
                    <div className="font-bold text-base font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {r.persen_selesai}%
                    </div>
                  </div>
                  <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${r.persen_selesai >= 80 ? 'bg-emerald-500' : r.persen_selesai >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${r.persen_selesai}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Rincian Petugas di Bawah Role Ini */}
              {r.petugas_list.length === 0 ? (
                <div className="py-4 text-center text-slate-400">
                  Belum ada penugasan tindak lanjut tercatat untuk peran ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                        <th className="pb-2">Nama Petugas</th>
                        <th className="pb-2">Unit Faskes</th>
                        <th className="pb-2 text-center">Total Tugas</th>
                        <th className="pb-2 text-center text-emerald-600">Selesai</th>
                        <th className="pb-2 text-center text-amber-600">Tertunda / Belum</th>
                        <th className="pb-2 text-center text-rose-600">Lewat Tenggat</th>
                        <th className="pb-2 text-center">Persentase</th>
                        <th className="pb-2 text-right">Tindakan Pengingat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {r.petugas_list.map(p => {
                        const hasIssues = p.overdue > 0 || p.tertunda > 0;
                        return (
                          <tr key={p.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                              {p.nama}
                            </td>
                            <td className="py-2.5 text-slate-500 dark:text-slate-400">
                              {p.unit}
                            </td>
                            <td className="py-2.5 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                              {p.total}
                            </td>
                            <td className="py-2.5 text-center font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                              {p.selesai}
                            </td>
                            <td className="py-2.5 text-center font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                              {p.tertunda}
                            </td>
                            <td className="py-2.5 text-center font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                              {p.overdue > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px]">
                                  {p.overdue} Kasus
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">0</span>
                              )}
                            </td>
                            <td className="py-2.5 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {p.persen}%
                            </td>
                            <td className="py-2.5 text-right">
                              {hasIssues ? (
                                <button
                                  onClick={() => handleSendDirectWAReminder(p.nama, r.role_label, p.no_wa, p.overdue, p.tertunda)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs transition-colors"
                                  title="Kirim pesan peringatan WhatsApp langsung ke nomor petugas"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Kirim WA Peringatan</span>
                                </button>
                              ) : (
                                <span className="text-emerald-600 text-[11px] font-medium flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Tuntas</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
