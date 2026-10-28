/**
 * Utility functions for DERMAGA GIZI
 */

export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  return dateStr;
}

export function isOverdue(deadlineStr?: string, status?: string): boolean {
  if (!deadlineStr || status === 'Selesai' || status === 'Dibatalkan') return false;
  const parts = deadlineStr.split('/');
  if (parts.length !== 3) return false;
  const targetDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return targetDate < today;
}

export function getStatusTindakLanjutColor(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'Selesai':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'Dalam proses':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
    case 'Menunggu koordinasi':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'Belum ditindaklanjuti':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'Perlu evaluasi ulang':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'Dibatalkan':
      return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

export function getPrioritasColor(prioritas: string): { bg: string; text: string } {
  switch (prioritas) {
    case 'Tinggi':
      return { bg: 'bg-rose-100 text-rose-800', text: 'text-rose-700 font-semibold' };
    case 'Sedang':
      return { bg: 'bg-amber-100 text-amber-800', text: 'text-amber-700 font-medium' };
    case 'Rendah':
      return { bg: 'bg-slate-100 text-slate-700', text: 'text-slate-600' };
    default:
      return { bg: 'bg-slate-100 text-slate-700', text: 'text-slate-600' };
  }
}

export function getKategoriGiziBadge(kategori?: string): { color: string; dot: string } {
  switch (kategori) {
    case 'Stunting (Pendek)':
      return { color: 'text-amber-700 font-medium', dot: 'bg-amber-500' };
    case 'Wasting (Kurus/Gizi Kurang)':
      return { color: 'text-orange-700 font-medium', dot: 'bg-orange-500' };
    case 'Gizi Buruk':
      return { color: 'text-rose-700 font-semibold', dot: 'bg-rose-600' };
    case 'Underweight (BB Kurang)':
      return { color: 'text-yellow-700 font-medium', dot: 'bg-yellow-500' };
    case 'Overweight':
      return { color: 'text-violet-700 font-medium', dot: 'bg-violet-500' };
    case 'Obesitas':
      return { color: 'text-purple-800 font-semibold', dot: 'bg-purple-600' };
    case 'Gizi Baik (Normal)':
      return { color: 'text-emerald-700 font-medium', dot: 'bg-emerald-500' };
    default:
      return { color: 'text-slate-600', dot: 'bg-slate-400' };
  }
}

/**
 * Ekspor CSV dengan BOM UTF-8 untuk kompatibilitas Microsoft Excel
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  // UTF-8 BOM untuk membuka karakter khusus dan aksen di Excel
  const BOM = '\uFEFF';
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';'),
    ...rows.map(row => 
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')
    )
  ].join('\r\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
