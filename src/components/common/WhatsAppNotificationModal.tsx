import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  Bell, 
  User, 
  Clock, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { WhatsAppNotification } from '../../types';

interface WhatsAppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const WhatsAppNotificationModal: React.FC<WhatsAppNotificationModalProps> = ({
  isOpen,
  onClose,
  onRefresh
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterKat, setFilterKat] = useState<string>('ALL');

  if (!isOpen) return null;

  const notifs: WhatsAppNotification[] = storageService.getWhatsAppNotifs();

  const filteredNotifs = notifs.filter(n => {
    if (filterKat !== 'ALL' && n.kategori !== filterKat) return false;
    return true;
  });

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTriggerOverdueScan = () => {
    const stats = storageService.getDashboardStats({ pulau_id: 'ALL', tahun: '2026', bulan: 'ALL' });
    const overdueList = stats.overdueList;
    if (overdueList.length === 0) {
      alert('Tidak ada tindak lanjut yang melewati tenggat saat ini.');
      return;
    }

    let count = 0;
    overdueList.forEach(tl => {
      const created = storageService.notifyOverdueTask(tl);
      count += created.length;
    });

    onRefresh();
    alert(`Berhasil membuat ${count} draf notifikasi peringatan WhatsApp untuk ${overdueList.length} kasus overdue.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col text-xs">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Pusat Notifikasi WhatsApp Otomatis
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kirim pesan ke Petugas Lintas Sektor, Kader Posyandu, dan Nakes
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Kategori:</span>
            <select
              value={filterKat}
              onChange={(e) => setFilterKat(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs"
            >
              <option value="ALL">Semua Notifikasi ({notifs.length})</option>
              <option value="SASARAN_BARU">Sasaran Balita Baru</option>
              <option value="TINDAK_LANJUT_BARU">Tindak Lanjut Baru</option>
              <option value="TINDAK_LANJUT_UPDATE">Pembaruan Tindak Lanjut</option>
              <option value="PERINGATAN_OVERDUE">Peringatan Overdue Tenggat</option>
            </select>
          </div>

          <button
            onClick={handleTriggerOverdueScan}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kirim Peringatan Kasus Overdue</span>
          </button>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-slate-600 dark:text-slate-400">Belum ada riwayat pengiriman notifikasi WhatsApp.</p>
              <p className="text-[11px] mt-0.5">Notifikasi otomatis dibuat saat menambah sasaran, mengubah intervensi, atau mendeteksi tenggat lewat.</p>
            </div>
          ) : (
            filteredNotifs.map(n => {
              const isOverdue = n.kategori === 'PERINGATAN_OVERDUE';
              return (
                <div 
                  key={n.notif_id}
                  className={`p-3.5 rounded-xl border transition-all text-xs ${
                    isOverdue 
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOverdue 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' 
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                      }`}>
                        {n.kategori.replace(/_/g, ' ')}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{n.judul}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{n.waktu}</span>
                  </div>

                  <div className="mt-2 text-slate-600 dark:text-slate-300 text-[11px] whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-sans">
                    {n.pesan}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <User className="w-3.5 h-3.5" />
                      <span>Ke: <b>{n.penerima_nama}</b> ({n.penerima_role.replace(/_/g, ' ')})</span>
                      <span>·</span>
                      <span className="font-mono">{n.penerima_wa}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyText(n.notif_id, n.pesan)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-medium flex items-center gap-1 transition-colors"
                      >
                        {copiedId === n.notif_id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === n.notif_id ? 'Tersalin' : 'Salin Teks'}</span>
                      </button>

                      <a
                        href={n.link_wa}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Kirim WA</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Format WhatsApp API Standard (Direct `wa.me` links)</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-semibold"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
