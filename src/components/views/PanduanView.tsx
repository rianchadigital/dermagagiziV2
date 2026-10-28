import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  CheckCircle2, 
  Share2, 
  Ship, 
  Users2, 
  Database, 
  ShieldCheck, 
  FileText, 
  Smartphone, 
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  PhoneCall
} from 'lucide-react';

export const PanduanView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'alur' | 'wa' | 'laut' | 'peran' | 'gas'>('alur');

  return (
    <div className="space-y-6">
      
      {/* Title Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              Panduan Penggunaan & SOP Operasional
            </h1>
            <span className="text-xs bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full">
              Versi 2.0 (Resmi)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Petunjuk teknis sistem DERMAGA GIZI untuk seluruh tenaga kesehatan, kader posyandu, dan tim lintas sektor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
            <span>Call Center Gizi: 0812-9876-5432</span>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'alur', label: '1. Alur Kerja Monitoring', icon: BookOpen },
          { id: 'wa', label: '2. Notifikasi WhatsApp Otomatis', icon: Share2 },
          { id: 'laut', label: '3. SOP Mobilitas Laut & Cuaca', icon: Ship },
          { id: 'peran', label: '4. Matriks Kewenangan Peran', icon: ShieldCheck },
          { id: 'gas', label: '5. Sinkronisasi Google Sheets', icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs transition-colors">
        
        {/* Section 1: Alur Kerja Monitoring */}
        {activeSection === 'alur' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-600" />
                Alur Standar Operasional Pemantauan Balita Bermasalah Gizi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Langkah berjenjang sejak penemuan kasus di posyandu hingga evaluasi tergraduasi di Puskesmas Kepulauan Seribu Selatan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                {
                  step: '01',
                  title: 'Penemuan & Pengukuran',
                  desc: 'Kader posyandu mengukur BB/TB balita pada penimbangan bulanan di 4 pulau kerja.',
                  actor: 'Kader & Bidan Desa'
                },
                {
                  step: '02',
                  title: 'Verifikasi Klinis',
                  desc: 'Tenaga gizi atau dokter memverifikasi data dan menetapkan status gizi klinis.',
                  actor: 'Tenaga Gizi / Dokter'
                },
                {
                  step: '03',
                  title: 'Rencana Tindak Lanjut',
                  desc: 'Penyusunan paket intervensi (PMT pangan lokal ikan laut, formula F-75/F-100, kunjungan rumah).',
                  actor: 'Tim Tenaga Kesehatan'
                },
                {
                  step: '04',
                  title: 'Kolaborasi Sektor',
                  desc: 'Pelibatan Kelurahan, TP-PKK, Sudin Sosial, Sudin KPKP, dan Baznas jika ada kendala ekonomi/sosial.',
                  actor: 'Lintas Sektor'
                },
                {
                  step: '05',
                  title: 'Evaluasi & Graduasi',
                  desc: 'Pemantauan berkala setiap 7-14 hari sampai balita mencapai status gizi baik (normal).',
                  actor: 'Kepala Puskesmas & Tim'
                }
              ].map((s, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-lg">{s.step}</span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{s.title}</h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 uppercase">{s.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Notifikasi WhatsApp Otomatis */}
        {activeSection === 'wa' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                Mekanisme Notifikasi WhatsApp Otomatis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sistem secara cerdas mengirimkan notifikasi instan untuk mempercepat respon lapangan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">1. Data Sasaran Baru Ditambahkan</h3>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Ketika Admin/Nakes menambahkan balita bermasalah gizi baru, notifikasi otomatis langsung disiarkan ke Kader Posyandu dan Bidan pulau terkait untuk penjadwalan kunjungan rumah perdana.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-bold text-sky-950 dark:text-sky-200">2. Rencana Tindak Lanjut Diperbarui</h3>
                </div>
                <p className="text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
                  Setiap perubahan status intervensi, jadwal pemberian PMT pangan lokal, atau rujukan dokter spesialis akan ternotifikasi langsung ke penanggung jawab teknis.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-rose-950 dark:text-rose-200">3. Peringatan Tenggat Terlewat (Overdue)</h3>
                </div>
                <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                  Bila tanggal rencana tindak lanjut telah melewati batas waktu (overdue), sistem memberikan penanda merah dan menerbitkan pesan peringatan ke penanggung jawab dan atasan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: SOP Mobilitas Laut & Cuaca */}
        {activeSection === 'laut' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Ship className="w-4 h-4 text-sky-600" />
                SOP Mitigasi Kendala Transportasi Laut & Cuaca Kepulauan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Panduan operasional tim Puskesmas Kepulauan Seribu Selatan menghadapi cuaca gelombang angin barat/timur.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  A. Gelombang Laut Rendah (&lt; 0.8 meter):
                </span>
                Operasional rutin berjalan normal menggunakan perahu motor puskesmas keliling atau kapal penumpang reguler.
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-1">
                  B. Gelombang Sedang (0.8 - 1.5 meter):
                </span>
                Penyeberangan lintas pulau harus berkoordinasi dengan Syahbandar/Dishub. Jika kapal reguler tidak diizinkan berlayar, gunakan kapal Ambulans Laut Puskesmas yang memiliki spesifikasi keselamatan tinggi.
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                <span className="font-bold block mb-1">
                  C. Peringatan Cuaca Buruk (&gt; 1.5 meter):
                </span>
                Segera input kendala ke menu "Kendala Akses". Penundaan kunjungan wajib dilaporkan ke sistem dan didistribusikan secara daring melalui telekonsultasi WhatsApp kepada keluarga sasaran balita.
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Matriks Kewenangan Peran */}
        {activeSection === 'peran' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Matriks Hak Akses & Kewenangan Peran (Role RBAC)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tiap peran memiliki batasan wewenang resmi sesuai Keputusan Kepala Puskesmas Kepulauan Seribu Selatan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <th className="py-2.5 px-3">Peran Akses</th>
                    <th className="py-2.5 px-3">Kewenangan Utama</th>
                    <th className="py-2.5 px-3">Akses Menu</th>
                    <th className="py-2.5 px-3">Hak Ekspor / Ubah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">ADMIN</td>
                    <td className="py-2.5 px-3">Konfigurasi sistem, integrasi Google Apps Script, manajemen pengguna</td>
                    <td className="py-2.5 px-3">Seluruh Menu (Full Access)</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Semua Wewenang</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">DOKTER</td>
                    <td className="py-2.5 px-3">Verifikasi klinis balita, diagnosa medis, rujukan spesialis kepulauan</td>
                    <td className="py-2.5 px-3">Sasaran, Tindak Lanjut, Laporan, Peta</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Ubah Data Medis</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">TENAGA GIZI</td>
                    <td className="py-2.5 px-3">Penginputan sasaran, penentuan formula PMT, evaluasi gizi bulanan</td>
                    <td className="py-2.5 px-3">Sasaran, Tindak Lanjut, Kendala, Laporan</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Ubah Intervensi</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">KADER</td>
                    <td className="py-2.5 px-3">Penimbangan posyandu, pencatatan kehadiran balita, kunjungan rumah</td>
                    <td className="py-2.5 px-3">Sasaran, Tindak Lanjut, Kendala</td>
                    <td className="py-2.5 px-3 text-sky-600 font-semibold">Input Pemantauan</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">LINTAS SEKTOR</td>
                    <td className="py-2.5 px-3">Koordinasi bansos, bantuan protein ikan, sanitasi kelurahan</td>
                    <td className="py-2.5 px-3">Monitoring Lintas Sektor, Kendala</td>
                    <td className="py-2.5 px-3 text-sky-600 font-semibold">Update Progres Mitra</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 5: Sinkronisasi Google Sheets */}
        {activeSection === 'gas' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Arsitektur Basis Data Google Spreadsheet & Google Apps Script
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Koneksi langsung tanpa server pihak ketiga yang rumit, menjamin data tersimpan di Google Drive resmi instansi.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-3">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                DERMAGA GIZI menggunakan Google Spreadsheet sebagai database relasional terstruktur yang dihubungkan melalui Google Apps Script Web App (REST API JSON).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-sky-600 block mb-1">Live Auto-Refresh 3 Detik:</span>
                  Setiap kali tombol "Live 3d" diaktifkan di header, sistem memverifikasi data baru langsung ke API Spreadsheet sehingga perubahan dari petugas lapangan di pulau lain langsung tampil real-time.
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-emerald-600 block mb-1">Keamanan & Kepemilikan Data:</span>
                  Tidak ada kredensial yang bocor ke publik. Spreadsheet sepenuhnya berada dalam akun Google Workspace Dinas Kesehatan Provinsi DKI Jakarta.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
