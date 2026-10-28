import React, { useState, useMemo } from 'react';
import { 
  Baby, 
  Search, 
  Plus, 
  Download, 
  Edit3, 
  MapPin, 
  Calendar, 
  X, 
  Save, 
  Eye, 
  Scale, 
  Ruler, 
  Activity,
  Send,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  FileDown,
  Building,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Phone,
  User as UserIcon,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GlobalFilter, Pulau, SasaranBalita, User, KategoriMasalahGizi } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { getKategoriGiziBadge, exportToCSV } from '../../utils/formatters';

interface SasaranViewProps {
  filter: GlobalFilter;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilter>>;
  pulauList: Pulau[];
  currentUser: User;
  onRefreshData: () => void;
}

export const SasaranView: React.FC<SasaranViewProps> = ({
  filter,
  setFilter,
  pulauList,
  currentUser,
  onRefreshData
}) => {
  const [search, setSearch] = useState('');
  const [selectedPosyanduFilter, setSelectedPosyanduFilter] = useState<string>('ALL');
  const [selectedStatusGiziFilter, setSelectedStatusGiziFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeSasaran, setActiveSasaran] = useState<Partial<SasaranBalita>>({});
  
  // Modal Detail Rincian Balita (Eye Button)
  const [detailSasaran, setDetailSasaran] = useState<SasaranBalita | null>(null);
  
  // Modal Hapus Data Balita
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    sasaran: SasaranBalita | null;
  } | null>(null);

  // Modal Import Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<SasaranBalita>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  const [waAlertModal, setWaAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    pulauName: string;
    text: string;
    link: string;
    recipients: string[];
  } | null>(null);

  const sasaranList = storageService.getSasaranList(filter);
  const posyanduList = storageService.getPosyanduList();
  const kelurahanList = storageService.getKelurahanList();

  const canEdit = currentUser.role !== 'VIEWER';
  // Hanya Tenaga Gizi dan Admin (termasuk Kepala Puskesmas) yang dapat menghapus
  const canDelete = currentUser.role === 'ADMIN' || currentUser.role === 'TENAGA_GIZI' || currentUser.role === 'KEPALA_PUSKESMAS';

  const defaultBulan = 'Oktober 2026';

  // Filter Data Balita
  const filteredSasaran = useMemo(() => {
    return sasaranList.filter(s => {
      // Filter posyandu
      if (selectedPosyanduFilter !== 'ALL' && s.posyandu !== selectedPosyanduFilter) {
        return false;
      }

      // Filter status gizi masalah
      if (selectedStatusGiziFilter !== 'ALL') {
        const kat = (s.kategori_masalah_terakhir || s.status_gizi_bbtb || '').toLowerCase();
        if (selectedStatusGiziFilter === 'Wasting' && !kat.includes('wasting') && !kat.includes('kurang')) return false;
        if (selectedStatusGiziFilter === 'Stunting' && !kat.includes('stunting') && !kat.includes('pendek') && !(s.status_gizi_tbu || '').toLowerCase().includes('pendek')) return false;
        if (selectedStatusGiziFilter === 'Underweight' && !kat.includes('underweight') && !kat.includes('bb kurang') && !(s.status_gizi_bbu || '').toLowerCase().includes('kurang')) return false;
        if (selectedStatusGiziFilter === 'Gizi Buruk' && !kat.includes('buruk')) return false;
        if (selectedStatusGiziFilter === 'Overweight' && !kat.includes('overweight') && !kat.includes('lebih')) return false;
        if (selectedStatusGiziFilter === 'Obesitas' && !kat.includes('obesitas')) return false;
      }

      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchNIK = s.nik ? s.nik.toLowerCase().includes(q) : false;
        const matchKode = s.kode_sasaran.toLowerCase().includes(q);
        const matchNama = s.inisial.toLowerCase().includes(q);
        const matchOrtu = s.nama_ortu ? s.nama_ortu.toLowerCase().includes(q) : false;
        const matchPosyandu = s.posyandu ? s.posyandu.toLowerCase().includes(q) : false;
        const matchKelurahan = s.kelurahan_nama ? s.kelurahan_nama.toLowerCase().includes(q) : false;

        if (!matchNIK && !matchKode && !matchNama && !matchOrtu && !matchPosyandu && !matchKelurahan) {
          return false;
        }
      }

      return true;
    });
  }, [sasaranList, selectedPosyanduFilter, selectedStatusGiziFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filteredSasaran.length / pageSize) || 1;
  const paginatedSasaran = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSasaran.slice(start, start + pageSize);
  }, [filteredSasaran, currentPage, pageSize]);

  // Modal Open Create
  const handleOpenCreate = () => {
    setModalMode('create');
    const selectedPulau = pulauList.find(p => p.pulau_id === filter.pulau_id) || pulauList[0];
    const pulauCode = selectedPulau.nama_pulau.substring(6, 9).toUpperCase() || 'TDG';
    const randomCode = Math.floor(100 + Math.random() * 899);
    const matchedPosyandu = posyanduList.find(pos => pos.pulau_id === selectedPulau.pulau_id);

    setActiveSasaran({
      sasaran_id: `SAS-${Date.now().toString().slice(-4)}`,
      kode_sasaran: `BLT-${pulauCode}-${randomCode}`,
      nik: `310101${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      inisial: 'An. ',
      jenis_kelamin: 'L',
      tanggal_lahir: '01/01/2024',
      usia: '24 Bulan',
      tanggal_ukur: new Date().toLocaleDateString('id-ID'),
      cara_ukur: 'Berdiri',
      bb_terakhir: 10.0,
      tb_terakhir: 80.0,
      zscore_bbtb: '-1.50 SD',
      status_gizi_bbtb: 'Gizi Kurang (Wasting)',
      zscore_tbu: '-1.20 SD',
      status_gizi_tbu: 'Normal',
      zscore_bbu: '-1.80 SD',
      status_gizi_bbu: 'BB Kurang (Underweight)',
      naik_berat_badan: 'T',
      keterangan_naik_bb: 'T (Tidak Naik)',
      status_outlier_who: 'Normal',
      nama_ortu: '',
      no_hp: '',
      no_wa_ortu: '',
      wilayah_kecamatan: 'Kepulauan Seribu Selatan',
      kelurahan_nama: 'Kelurahan Pulau Tidung',
      puskesmas_pustu: selectedPulau.unit_pelayanan || 'Puskesmas Kepulauan Seribu Selatan',
      posyandu: matchedPosyandu ? matchedPosyandu.nama_posyandu : 'Posyandu Mawar I',
      pulau_id: selectedPulau.pulau_id,
      unit_pelayanan: selectedPulau.unit_pelayanan,
      tanggal_registrasi: new Date().toLocaleDateString('id-ID'),
      status_aktif: true,
      kategori_masalah_terakhir: 'Wasting (Kurus/Gizi Kurang)',
      tanggal_pantau_terakhir: new Date().toLocaleDateString('id-ID'),
      bulan_pengukuran: defaultBulan,
      alamat: 'Jl. Utama RT 01 / RW 01',
      rt_rw: 'RT 01 / RW 01',
      lila: 12.5
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SasaranBalita) => {
    setModalMode('edit');
    setActiveSasaran({ 
      ...s,
      nik: s.nik || '',
      usia: s.usia || '24 Bulan',
      tanggal_ukur: s.tanggal_ukur || s.tanggal_pantau_terakhir || new Date().toLocaleDateString('id-ID'),
      cara_ukur: s.cara_ukur || 'Berdiri',
      zscore_bbtb: s.zscore_bbtb || '-1.50 SD',
      status_gizi_bbtb: s.status_gizi_bbtb || s.kategori_masalah_terakhir || 'Gizi Kurang (Wasting)',
      zscore_tbu: s.zscore_tbu || '-1.00 SD',
      status_gizi_tbu: s.status_gizi_tbu || 'Normal',
      zscore_bbu: s.zscore_bbu || '-1.20 SD',
      status_gizi_bbu: s.status_gizi_bbu || 'Normal',
      naik_berat_badan: s.naik_berat_badan || 'T',
      keterangan_naik_bb: s.keterangan_naik_bb || 'T (Tidak Naik)',
      status_outlier_who: s.status_outlier_who || 'Normal',
      nama_ortu: s.nama_ortu || '',
      no_hp: s.no_hp || s.no_wa_ortu || '',
      wilayah_kecamatan: s.wilayah_kecamatan || 'Kepulauan Seribu Selatan',
      kelurahan_nama: s.kelurahan_nama || 'Kelurahan Pulau Tidung',
      puskesmas_pustu: s.puskesmas_pustu || s.unit_pelayanan || 'Puskesmas Kepulauan Seribu Selatan',
      posyandu: s.posyandu || posyanduList[0]?.nama_posyandu || 'Posyandu Mawar I',
      bulan_pengukuran: s.bulan_pengukuran || defaultBulan
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (s: SasaranBalita) => {
    setDetailSasaran(s);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal || !deleteConfirmModal.sasaran) return;
    const sasaranToDelete = deleteConfirmModal.sasaran;
    
    await apiService.deleteSasaran(sasaranToDelete.sasaran_id);
    setDeleteConfirmModal(null);
    onRefreshData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSasaran.inisial) return;

    const saved = await apiService.saveSasaran(activeSasaran as SasaranBalita);
    setIsModalOpen(false);
    onRefreshData();

    // Notifikasi jika kasus gizi bermasalah
    const isMasalahGizi = saved.kategori_masalah_terakhir && 
      !saved.kategori_masalah_terakhir.includes('Baik') && 
      !saved.kategori_masalah_terakhir.includes('Normal');

    if (isMasalahGizi) {
      const pulau = pulauList.find(p => p.pulau_id === saved.pulau_id);
      const text = `🔔 *NOTIFIKASI DATA BALITA BERMASALAH GIZI - DERMAGA GIZI*\n` +
        `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
        `Data balita telah diperbarui pada sistem:\n` +
        `• NIK: *${saved.nik || '-'}*\n` +
        `• Nama: *${saved.inisial}* (${saved.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'})\n` +
        `• Usia: *${saved.usia || '-'}*\n` +
        `• Wilayah: *${pulau?.nama_pulau || 'Kepulauan Seribu'}* (${saved.posyandu || 'Posyandu'})\n` +
        `• Antropometri: BB: *${saved.bb_terakhir} kg* | TB: *${saved.tb_terakhir} cm*\n` +
        `• Z-Score BB/TB: *${saved.zscore_bbtb || '-'}* (Wasting: *${saved.status_gizi_bbtb || saved.kategori_masalah_terakhir}*)\n` +
        `• Z-Score TB/U: *${saved.zscore_tbu || '-'}* (Stunting: *${saved.status_gizi_tbu || '-'}*)\n` +
        `• Status Naik BB: *${saved.naik_berat_badan || '-'}* (${saved.keterangan_naik_bb || '-'})\n` +
        `• Nama Orang Tua: ${saved.nama_ortu || '-'}\n` +
        `• Status: *Perlu Tindak Lanjut Kolaborasi Lintas Sektor*\n\n` +
        `Pantau dan koordinasikan bersama di sistem: ${storageService.getAppUrl()}`;

      setWaAlertModal({
        isOpen: true,
        title: `Peringatan: Balita Teridentifikasi ${saved.kategori_masalah_terakhir}`,
        pulauName: pulau?.nama_pulau || 'Kepulauan Seribu Selatan',
        text,
        link: `https://wa.me/?text=${encodeURIComponent(text)}`,
        recipients: [
          'Nutrisionis / Poli Gizi Puskesmas',
          `Kader Posyandu (${saved.posyandu || 'Posyandu Terkait'})`,
          'Tim Penggerak PKK Dasawisma',
          'Seksi Kesra Kelurahan'
        ]
      });
    }
  };

  const handleSendWA = (s: SasaranBalita) => {
    const pulau = pulauList.find(p => p.pulau_id === s.pulau_id);
    const text = `🔔 *NOTIFIKASI BALITA BERMASALAH GIZI - DERMAGA GIZI*\n` +
      `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
      `• NIK: *${s.nik || '-'}*\n` +
      `• Nama Balita: *${s.inisial}* (${s.jenis_kelamin === 'L' ? 'L' : 'P'})\n` +
      `• Tanggal Lahir: ${s.tanggal_lahir} (Usia: ${s.usia || '-'})\n` +
      `• Posyandu / Wilayah: *${s.posyandu || '-'}* / ${pulau?.nama_pulau || 'Kepulauan Seribu'}\n` +
      `• Tanggal Ukur: ${s.tanggal_ukur || s.tanggal_pantau_terakhir || '-'}\n` +
      `• BB: *${s.bb_terakhir} kg* | TB: *${s.tb_terakhir} cm*\n` +
      `• Z-Score BB/TB: *${s.zscore_bbtb || '-'}* (Wasting: ${s.status_gizi_bbtb || s.kategori_masalah_terakhir})\n` +
      `• Z-Score TB/U: *${s.zscore_tbu || '-'}* (Stunting: ${s.status_gizi_tbu || '-'})\n` +
      `• Z-Score BB/U: *${s.zscore_bbu || '-'}* (Underweight: ${s.status_gizi_bbu || '-'})\n` +
      `• Keterangan Naik BB: *${s.keterangan_naik_bb || s.naik_berat_badan || '-'}*\n` +
      `• Nama Orang Tua: ${s.nama_ortu || '-'}\n` +
      `• No HP: ${s.no_hp || s.no_wa_ortu || '-'}\n\n` +
      `Akses sistem DERMAGA GIZI: ${storageService.getAppUrl()}`;

    const phone = s.no_wa_ortu || s.no_hp || '';
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // --- Handlers Template & Ekspor Excel (24 Kolom e-PPGBM Standar) ---
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'NIK': '3101011405240001',
        'Nama': 'An. Alif Ramadhan',
        'Jenis Kelamin': 'L',
        'Tanggal Lahir': '14/05/2024',
        'Usia': '29 Bulan',
        'Tanggal Ukur': '12/10/2026',
        'Cara Ukur': 'Berdiri',
        'Berat Badan': 8.8,
        'Tinggi Badan': 78.0,
        'Z score BB/TB': '-2.35 SD',
        'Status Gizi BB/TB (Wasting)': 'Gizi Kurang (Wasting)',
        'Z-Score PB/U (TB/U)': '-1.45 SD',
        'Status Gizi PB/U (Stunting)': 'Normal',
        'Z-Score BB/U': '-2.15 SD',
        'Status Gizi BB/U (Underweight)': 'BB Kurang (Underweight)',
        'Naik Berat Badan': 'T',
        'Keterangan Naik Berat Badan': 'T (Tidak Naik)',
        'Status Outlier WHO': 'Normal',
        'Nama Orang Tua': 'Siti Aminah / Rahmat',
        'No Hp': '081299881122',
        'Wilayah Kecamatan': 'Kepulauan Seribu Selatan',
        'Kelurahan': 'Kelurahan Pulau Tidung',
        'Puskesmas Kel. / Pustu': 'Puskesmas Kepulauan Seribu Selatan',
        'Posyandu': 'Posyandu Mawar I'
      },
      {
        'NIK': '3101024211240002',
        'Nama': 'An. Maya Kusuma',
        'Jenis Kelamin': 'P',
        'Tanggal Lahir': '02/11/2024',
        'Usia': '23 Bulan',
        'Tanggal Ukur': '08/10/2026',
        'Cara Ukur': 'Terlentang',
        'Berat Badan': 7.2,
        'Tinggi Badan': 72.5,
        'Z score BB/TB': '-1.85 SD',
        'Status Gizi BB/TB (Wasting)': 'Gizi Kurang (Wasting)',
        'Z-Score PB/U (TB/U)': '-1.20 SD',
        'Status Gizi PB/U (Stunting)': 'Normal',
        'Z-Score BB/U': '-2.40 SD',
        'Status Gizi BB/U (Underweight)': 'BB Kurang (Underweight)',
        'Naik Berat Badan': 'T',
        'Keterangan Naik Berat Badan': 'T (Tidak Naik)',
        'Status Outlier WHO': 'Normal',
        'Nama Orang Tua': 'Nurjanah / Hendra',
        'No Hp': '081388776655',
        'Wilayah Kecamatan': 'Kepulauan Seribu Selatan',
        'Kelurahan': 'Kelurahan Pulau Pari',
        'Puskesmas Kel. / Pustu': 'Puskesmas Pembantu Pulau Pari',
        'Posyandu': 'Posyandu Melati I'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Sasaran_Balita');
    XLSX.writeFile(workbook, 'Template_Excel_Balita_Bermasalah_Gizi_ePPGBM.xlsx');
  };

  const handleExport = () => {
    const headers = [
      'No',
      'NIK',
      'Nama',
      'Jenis Kelamin',
      'Tanggal Lahir',
      'Usia',
      'Tanggal Ukur',
      'Cara Ukur',
      'Berat Badan',
      'Tinggi Badan',
      'Z score BB/TB',
      'Status Gizi BB/TB (Wasting)',
      'Z-Score PB/U (TB/U)',
      'Status Gizi PB/U (Stunting)',
      'Z-Score BB/U',
      'Status Gizi BB/U (Underweight)',
      'Naik Berat Badan',
      'Keterangan Naik Berat Badan',
      'Status Outlier WHO',
      'Nama Orang Tua',
      'No Hp',
      'Wilayah Kecamatan',
      'Kelurahan',
      'Puskesmas Kel. / Pustu',
      'Posyandu'
    ];

    const rows = filteredSasaran.map((s, idx) => [
      idx + 1,
      s.nik || '-',
      s.inisial,
      s.jenis_kelamin,
      s.tanggal_lahir,
      s.usia || '-',
      s.tanggal_ukur || s.tanggal_pantau_terakhir || '-',
      s.cara_ukur || 'Berdiri',
      s.bb_terakhir || 0,
      s.tb_terakhir || 0,
      s.zscore_bbtb || '-',
      s.status_gizi_bbtb || s.kategori_masalah_terakhir || '-',
      s.zscore_tbu || '-',
      s.status_gizi_tbu || '-',
      s.zscore_bbu || '-',
      s.status_gizi_bbu || '-',
      s.naik_berat_badan || '-',
      s.keterangan_naik_bb || '-',
      s.status_outlier_who || 'Normal',
      s.nama_ortu || '-',
      s.no_hp || s.no_wa_ortu || '-',
      s.wilayah_kecamatan || 'Kepulauan Seribu Selatan',
      s.kelurahan_nama || 'Kelurahan Pulau Tidung',
      s.puskesmas_pustu || s.unit_pelayanan || 'Puskesmas Kepulauan Seribu Selatan',
      s.posyandu || '-'
    ]);

    exportToCSV(`Data_Sasaran_Balita_Bermasalah_Gizi_${filter.pulau_id}`, headers, rows);
  };

  // --- Handlers Import Excel ---
  const handleOpenImportModal = () => {
    setParsedData([]);
    setImportFileName('');
    setImportError('');
    setImportSuccessMsg('');
    setIsImportModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError('');
    setImportSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          setImportError('Berkas Excel kosong atau tidak memiliki baris data.');
          return;
        }

        const headers: string[] = (rawJson[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
        const getIdx = (aliases: string[]) => headers.findIndex(h => aliases.some(a => h.includes(a)));

        const colNik = getIdx(['nik']);
        const colNama = getIdx(['nama', 'inisial', 'balita']);
        const colJK = getIdx(['jenis kelamin', 'jk', 'kelamin', 'gender', 'sex']);
        const colLahir = getIdx(['tanggal lahir', 'tgl lahir', 'lahir']);
        const colUsia = getIdx(['usia', 'umur']);
        const colTanggalUkur = getIdx(['tanggal ukur', 'tgl ukur', 'tanggal pantau']);
        const colCaraUkur = getIdx(['cara ukur', 'posisi']);
        const colBB = getIdx(['berat badan', 'berat', 'bb']);
        const colTB = getIdx(['tinggi badan', 'tinggi', 'tb', 'panjang', 'pb']);
        const colZScoreBBTB = getIdx(['z score bb/tb', 'z-score bb/tb', 'zscore bb/tb', 'bb/tb']);
        const colStatusBBTB = getIdx(['status gizi bb/tb', 'wasting', 'gizi bb/tb']);
        const colZScoreTBU = getIdx(['z-score pb/u', 'z-score tb/u', 'pb/u', 'tb/u']);
        const colStatusTBU = getIdx(['status gizi pb/u', 'stunting', 'gizi pb/u', 'gizi tb/u']);
        const colZScoreBBU = getIdx(['z-score bb/u', 'zscore bb/u', 'bb/u']);
        const colStatusBBU = getIdx(['status gizi bb/u', 'underweight', 'gizi bb/u']);
        const colNaikBB = getIdx(['naik berat badan', 'naik bb', 't/n', 'n/t']);
        const colKetNaik = getIdx(['keterangan naik', 'ket naik']);
        const colOutlier = getIdx(['outlier', 'status outlier']);
        const colOrtu = getIdx(['nama orang tua', 'orang tua', 'ortu', 'ibu', 'ayah']);
        const colNoHp = getIdx(['no hp', 'hp', 'no wa', 'wa', 'telepon', 'kontak']);
        const colKecamatan = getIdx(['wilayah kecamatan', 'kecamatan']);
        const colKelurahan = getIdx(['kelurahan', 'desa']);
        const colPuskesmas = getIdx(['puskesmas', 'pustu', 'faskes']);
        const colPosyandu = getIdx(['posyandu', 'pos']);

        const results: Partial<SasaranBalita>[] = [];

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          const namaRaw = colNama >= 0 ? String(row[colNama] || '').trim() : '';
          if (!namaRaw) continue; // Baris kosong dilewati

          const jkRaw = colJK >= 0 ? String(row[colJK] || '').trim().toUpperCase() : 'L';
          const jk: 'L' | 'P' = (jkRaw.startsWith('P') || jkRaw.includes('PEREMPUAN')) ? 'P' : 'L';

          const bbVal = colBB >= 0 ? parseFloat(String(row[colBB]).replace(',', '.')) : 10.0;
          const tbVal = colTB >= 0 ? parseFloat(String(row[colTB]).replace(',', '.')) : 80.0;

          // Status Gizi
          let statusGizi: KategoriMasalahGizi = 'Wasting (Kurus/Gizi Kurang)';
          const statusRaw = colStatusBBTB >= 0 && row[colStatusBBTB] ? String(row[colStatusBBTB]).toLowerCase() : '';
          const statusTbuRaw = colStatusTBU >= 0 && row[colStatusTBU] ? String(row[colStatusTBU]).toLowerCase() : '';
          const statusBbuRaw = colStatusBBU >= 0 && row[colStatusBBU] ? String(row[colStatusBBU]).toLowerCase() : '';

          if (statusRaw.includes('buruk')) statusGizi = 'Gizi Buruk';
          else if (statusRaw.includes('obesitas')) statusGizi = 'Obesitas';
          else if (statusRaw.includes('overweight') || statusRaw.includes('lebih')) statusGizi = 'Overweight';
          else if (statusTbuRaw.includes('pendek') || statusTbuRaw.includes('stunting')) statusGizi = 'Stunting (Pendek)';
          else if (statusBbuRaw.includes('kurang') || statusBbuRaw.includes('underweight')) statusGizi = 'Underweight (BB Kurang)';
          else if (statusRaw.includes('kurang') || statusRaw.includes('wasting')) statusGizi = 'Wasting (Kurus/Gizi Kurang)';
          else if (statusRaw.includes('baik') || statusRaw.includes('normal')) statusGizi = 'Gizi Baik (Normal)';

          const posyanduStr = colPosyandu >= 0 && row[colPosyandu] ? String(row[colPosyandu]).trim() : 'Posyandu Mawar I';
          const matchedPosyandu = posyanduList.find(pos => pos.nama_posyandu.toLowerCase().includes(posyanduStr.toLowerCase()));
          const kelurahanStr = colKelurahan >= 0 && row[colKelurahan] ? String(row[colKelurahan]).trim() : 'Kelurahan Pulau Tidung';
          
          let targetPulauId = filter.pulau_id === 'ALL' ? 'PULAU-01' : filter.pulau_id;
          if (matchedPosyandu && matchedPosyandu.pulau_id) {
            targetPulauId = matchedPosyandu.pulau_id;
          }

          results.push({
            kode_sasaran: `BLT-${Date.now().toString().slice(-4)}-${i}`,
            nik: colNik >= 0 && row[colNik] ? String(row[colNik]).trim() : `310101${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            inisial: namaRaw.startsWith('An.') ? namaRaw : `An. ${namaRaw}`,
            jenis_kelamin: jk,
            tanggal_lahir: colLahir >= 0 && row[colLahir] ? String(row[colLahir]).trim() : '01/01/2024',
            usia: colUsia >= 0 && row[colUsia] ? String(row[colUsia]).trim() : '24 Bulan',
            tanggal_ukur: colTanggalUkur >= 0 && row[colTanggalUkur] ? String(row[colTanggalUkur]).trim() : new Date().toLocaleDateString('id-ID'),
            cara_ukur: colCaraUkur >= 0 && row[colCaraUkur] ? String(row[colCaraUkur]).trim() : 'Berdiri',
            bb_terakhir: !isNaN(bbVal) && bbVal > 0 ? bbVal : 10.0,
            tb_terakhir: !isNaN(tbVal) && tbVal > 0 ? tbVal : 80.0,
            zscore_bbtb: colZScoreBBTB >= 0 && row[colZScoreBBTB] ? String(row[colZScoreBBTB]).trim() : '-2.10 SD',
            status_gizi_bbtb: colStatusBBTB >= 0 && row[colStatusBBTB] ? String(row[colStatusBBTB]).trim() : statusGizi,
            zscore_tbu: colZScoreTBU >= 0 && row[colZScoreTBU] ? String(row[colZScoreTBU]).trim() : '-1.50 SD',
            status_gizi_tbu: colStatusTBU >= 0 && row[colStatusTBU] ? String(row[colStatusTBU]).trim() : 'Normal',
            zscore_bbu: colZScoreBBU >= 0 && row[colZScoreBBU] ? String(row[colZScoreBBU]).trim() : '-2.00 SD',
            status_gizi_bbu: colStatusBBU >= 0 && row[colStatusBBU] ? String(row[colStatusBBU]).trim() : 'BB Kurang (Underweight)',
            naik_berat_badan: colNaikBB >= 0 && row[colNaikBB] ? String(row[colNaikBB]).trim() : 'T',
            keterangan_naik_bb: colKetNaik >= 0 && row[colKetNaik] ? String(row[colKetNaik]).trim() : 'T (Tidak Naik)',
            status_outlier_who: colOutlier >= 0 && row[colOutlier] ? String(row[colOutlier]).trim() : 'Normal',
            nama_ortu: colOrtu >= 0 && row[colOrtu] ? String(row[colOrtu]).trim() : '',
            no_hp: colNoHp >= 0 && row[colNoHp] ? String(row[colNoHp]).trim() : '',
            no_wa_ortu: colNoHp >= 0 && row[colNoHp] ? String(row[colNoHp]).trim() : '',
            wilayah_kecamatan: colKecamatan >= 0 && row[colKecamatan] ? String(row[colKecamatan]).trim() : 'Kepulauan Seribu Selatan',
            kelurahan_nama: kelurahanStr,
            puskesmas_pustu: colPuskesmas >= 0 && row[colPuskesmas] ? String(row[colPuskesmas]).trim() : 'Puskesmas Kepulauan Seribu Selatan',
            posyandu: posyanduStr,
            pulau_id: targetPulauId,
            unit_pelayanan: 'Puskesmas Kepulauan Seribu Selatan',
            kategori_masalah_terakhir: statusGizi,
            tanggal_pantau_terakhir: new Date().toLocaleDateString('id-ID'),
            bulan_pengukuran: defaultBulan
          });
        }

        if (results.length === 0) {
          setImportError('Tidak ada baris data balita valid yang berhasil dibaca dari lembar Excel.');
          return;
        }

        setParsedData(results);
      } catch (err: any) {
        setImportError('Gagal memproses file Excel: ' + (err.message || 'Format berkas tidak sesuai.'));
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);

    try {
      const result = await apiService.importSasaranBatch(parsedData);
      setIsImporting(false);
      setImportSuccessMsg(`Berhasil mengimpor ${result.count} data balita! Kasus balita bermasalah gizi otomatis didaftarkan ke Daftar Tindak Lanjut lintas sektor.`);
      onRefreshData();
      setTimeout(() => {
        setIsImportModalOpen(false);
      }, 1800);
    } catch (err: any) {
      setIsImporting(false);
      setImportError('Gagal menyimpan hasil import: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Header & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 rounded-2xl">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                  Data Sasaran Balita Bermasalah Gizi
                </h1>
                <span className="text-xs bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold px-2.5 py-0.5 rounded-full font-mono tabular-nums">
                  {filteredSasaran.length} Balita
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tabel rekaman antropometri balita bermasalah gizi sesuai standar 24 kolom e-PPGBM Posyandu.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Unduh Template Excel e-PPGBM */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Unduh Format Template Excel 24 Kolom e-PPGBM"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Format Excel</span>
          </button>

          {/* Tombol Import Excel */}
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenImportModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Import Data Balita dari File Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          )}

          {/* Tombol Ekspor CSV */}
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span>Ekspor CSV</span>
          </button>

          {/* Tombol Registrasi Baru */}
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrasi Balita</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter & Pencarian Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NIK, Nama balita, nama orang tua, atau posyandu..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 text-xs dark:text-white"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Filter Pulau */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Pulau:</span>
            <select
              value={filter.pulau_id}
              onChange={(e) => {
                setFilter(prev => ({ ...prev, pulau_id: e.target.value }));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium cursor-pointer"
            >
              <option value="ALL">Semua Pulau</option>
              {pulauList.map(p => (
                <option key={p.pulau_id} value={p.pulau_id}>{p.nama_pulau}</option>
              ))}
            </select>
          </div>

          {/* Filter Posyandu */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Posyandu:</span>
            <select
              value={selectedPosyanduFilter}
              onChange={(e) => {
                setSelectedPosyanduFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium cursor-pointer"
            >
              <option value="ALL">Semua Posyandu</option>
              {posyanduList.map(pos => (
                <option key={pos.posyandu_id} value={pos.nama_posyandu}>{pos.nama_posyandu}</option>
              ))}
            </select>
          </div>

          {/* Filter Status Gizi */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Masalah Gizi:</span>
            <select
              value={selectedStatusGiziFilter}
              onChange={(e) => {
                setSelectedStatusGiziFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium cursor-pointer"
            >
              <option value="ALL">Semua Masalah</option>
              <option value="Wasting">Wasting (Gizi Kurang)</option>
              <option value="Stunting">Stunting (Pendek)</option>
              <option value="Underweight">Underweight (BB Kurang)</option>
              <option value="Gizi Buruk">Gizi Buruk</option>
              <option value="Overweight">Overweight</option>
              <option value="Obesitas">Obesitas</option>
            </select>
          </div>

        </div>

      </div>

      {/* 3. TABEL DATA SASARAN BALITA BERMASALAH (PRESISI 24 KOLOM SESUAI EXCEL) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-3 text-center sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/90 shadow-xs w-10">No</th>
                <th className="py-3 px-3 min-w-[140px]">NIK</th>
                <th className="py-3 px-3 min-w-[160px]">Nama</th>
                <th className="py-3 px-2 text-center w-12">JK</th>
                <th className="py-3 px-3 min-w-[100px]">Tanggal Lahir</th>
                <th className="py-3 px-3 min-w-[90px]">Usia</th>
                <th className="py-3 px-3 min-w-[100px]">Tanggal Ukur</th>
                <th className="py-3 px-3 min-w-[95px]">Cara Ukur</th>
                <th className="py-3 px-3 text-right min-w-[90px]">Berat Badan</th>
                <th className="py-3 px-3 text-right min-w-[90px]">Tinggi Badan</th>
                <th className="py-3 px-3 text-center min-w-[100px]">Z score BB/TB</th>
                <th className="py-3 px-3 min-w-[160px]">Status Gizi BB/TB (Wasting)</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Z-Score PB/U (TB/U)</th>
                <th className="py-3 px-3 min-w-[160px]">Status Gizi PB/U (Stunting)</th>
                <th className="py-3 px-3 text-center min-w-[100px]">Z-Score BB/U</th>
                <th className="py-3 px-3 min-w-[170px]">Status Gizi BB/U (Underweight)</th>
                <th className="py-3 px-2 text-center w-24">Naik BB</th>
                <th className="py-3 px-3 min-w-[140px]">Keterangan Naik</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Status Outlier WHO</th>
                <th className="py-3 px-3 min-w-[170px]">Nama Orang Tua</th>
                <th className="py-3 px-3 min-w-[120px]">No Hp</th>
                <th className="py-3 px-3 min-w-[150px]">Wilayah Kecamatan</th>
                <th className="py-3 px-3 min-w-[140px]">Kelurahan</th>
                <th className="py-3 px-3 min-w-[170px]">Puskesmas Kel. / Pustu</th>
                <th className="py-3 px-3 min-w-[140px]">Posyandu</th>
                <th className="py-3 px-3 text-center sticky right-0 z-10 bg-slate-50 dark:bg-slate-800/90 shadow-xs min-w-[110px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedSasaran.length === 0 ? (
                <tr>
                  <td colSpan={26} className="py-16 text-center text-slate-400">
                    Tidak ada data balita bermasalah gizi yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedSasaran.map((s, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const pulau = pulauList.find(p => p.pulau_id === s.pulau_id);
                  const isNaik = (s.naik_berat_badan || '').toUpperCase() === 'N';
                  const isWasting = (s.status_gizi_bbtb || s.kategori_masalah_terakhir || '').toLowerCase().includes('kurang') || 
                    (s.status_gizi_bbtb || s.kategori_masalah_terakhir || '').toLowerCase().includes('wasting') ||
                    (s.status_gizi_bbtb || s.kategori_masalah_terakhir || '').toLowerCase().includes('buruk');
                  const isStunting = (s.status_gizi_tbu || s.kategori_masalah_terakhir || '').toLowerCase().includes('pendek');
                  const isUnderweight = (s.status_gizi_bbu || s.kategori_masalah_terakhir || '').toLowerCase().includes('kurang');

                  return (
                    <tr 
                      key={s.sasaran_id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* 1. No */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px] sticky left-0 bg-white dark:bg-slate-900 shadow-2xs">
                        {rowNumber}
                      </td>

                      {/* 2. NIK */}
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {s.nik || '-'}
                      </td>

                      {/* 3. Nama */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {s.inisial}
                        </div>
                        <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                          {s.kode_sasaran}
                        </div>
                      </td>

                      {/* 4. Jenis Kelamin */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.jenis_kelamin === 'L' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                            : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                        }`}>
                          {s.jenis_kelamin}
                        </span>
                      </td>

                      {/* 5. Tanggal Lahir */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {s.tanggal_lahir}
                      </td>

                      {/* 6. Usia */}
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {s.usia || '-'}
                      </td>

                      {/* 7. Tanggal Ukur */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {s.tanggal_ukur || s.tanggal_pantau_terakhir || '-'}
                      </td>

                      {/* 8. Cara Ukur */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {s.cara_ukur || 'Berdiri'}
                      </td>

                      {/* 9. Berat Badan */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {s.bb_terakhir ? `${s.bb_terakhir} kg` : '-'}
                      </td>

                      {/* 10. Tinggi Badan */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {s.tb_terakhir ? `${s.tb_terakhir} cm` : '-'}
                      </td>

                      {/* 11. Z score BB/TB */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {s.zscore_bbtb || '-'}
                      </td>

                      {/* 12. Status Gizi BB/TB (Wasting) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isWasting
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : (s.status_gizi_bbtb || '').includes('Obesitas') || (s.status_gizi_bbtb || '').includes('Overweight')
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {s.status_gizi_bbtb || s.kategori_masalah_terakhir || 'Normal'}
                        </span>
                      </td>

                      {/* 13. Z-Score PB/U (TB/U) */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {s.zscore_tbu || '-'}
                      </td>

                      {/* 14. Status Gizi PB/U (Stunting) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isStunting
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {s.status_gizi_tbu || 'Normal'}
                        </span>
                      </td>

                      {/* 15. Z-Score BB/U */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {s.zscore_bbu || '-'}
                      </td>

                      {/* 16. Status Gizi BB/U (Underweight) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isUnderweight
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {s.status_gizi_bbu || 'Normal'}
                        </span>
                      </td>

                      {/* 17. Naik Berat Badan */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          isNaik 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {s.naik_berat_badan || 'T'}
                        </span>
                      </td>

                      {/* 18. Keterangan Naik Berat Badan */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap text-[11px]">
                        {s.keterangan_naik_bb || (isNaik ? 'N (Naik)' : 'T (Tidak Naik)')}
                      </td>

                      {/* 19. Status Outlier WHO */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {s.status_outlier_who || 'Normal'}
                        </span>
                      </td>

                      {/* 20. Nama Orang Tua */}
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {s.nama_ortu || '-'}
                      </td>

                      {/* 21. No Hp */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {s.no_hp || s.no_wa_ortu || '-'}
                      </td>

                      {/* 22. Wilayah Kecamatan */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {s.wilayah_kecamatan || 'Kepulauan Seribu Selatan'}
                      </td>

                      {/* 23. Kelurahan */}
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {s.kelurahan_nama || pulau?.nama_pulau || 'Kelurahan Pulau Tidung'}
                      </td>

                      {/* 24. Puskesmas Kel. / Pustu */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {s.puskesmas_pustu || s.unit_pelayanan || 'Puskesmas Kepulauan Seribu Selatan'}
                      </td>

                      {/* 25. Posyandu */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-sky-700 dark:text-sky-400">
                          {s.posyandu || 'Posyandu Mawar I'}
                        </span>
                      </td>

                      {/* 26. Aksi (Sticky Right) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 shadow-2xs">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(s)}
                            className="p-1 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Balita"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(s)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Antropometri Balita"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSendWA(s)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Kirim Notifikasi Kasus Balita ke WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmModal({ isOpen: true, sasaran: s })}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Balita (Wewenang Tenaga Gizi & Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>data per halaman • Total <strong>{filteredSasaran.length}</strong> balita</span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-xs px-2 font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* MODAL REGISTRASI & EDIT SASARAN BALITA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 rounded-xl">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {modalMode === 'create' ? 'Registrasi Balita Bermasalah Gizi' : `Edit Data Balita: ${activeSasaran.inisial}`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Lengkapi identitas balita dan data antropometri standar e-PPGBM Posyandu
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              
              {/* Bagian 1: Identitas Balita & Wilayah */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <UserIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>1. Identitas Pasien & Wilayah Posyandu</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">NIK (16 Digit) *</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={activeSasaran.nik || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, nik: e.target.value }))}
                      placeholder="Contoh: 3101011405240001"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap Balita *</label>
                    <input
                      type="text"
                      required
                      value={activeSasaran.inisial || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, inisial: e.target.value }))}
                      placeholder="Nama balita (cth: An. Rizky)"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenis Kelamin *</label>
                    <select
                      value={activeSasaran.jenis_kelamin || 'L'}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, jenis_kelamin: e.target.value as 'L' | 'P' }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Lahir *</label>
                    <input
                      type="text"
                      required
                      value={activeSasaran.tanggal_lahir || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                      placeholder="DD/MM/YYYY"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Usia Balita</label>
                    <input
                      type="text"
                      value={activeSasaran.usia || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, usia: e.target.value }))}
                      placeholder="Contoh: 24 Bulan"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Posyandu Pelapor *</label>
                    <select
                      value={activeSasaran.posyandu || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matchPos = posyanduList.find(pos => pos.nama_posyandu === val);
                        setActiveSasaran(prev => ({
                          ...prev,
                          posyandu: val,
                          pulau_id: matchPos ? matchPos.pulau_id : prev.pulau_id,
                          kelurahan_nama: matchPos ? matchPos.kelurahan_nama : prev.kelurahan_nama
                        }));
                      }}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-300"
                    >
                      {posyanduList.map(pos => (
                        <option key={pos.posyandu_id} value={pos.nama_posyandu}>
                          {pos.nama_posyandu} ({pos.kelurahan_nama})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Orang Tua</label>
                    <input
                      type="text"
                      value={activeSasaran.nama_ortu || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, nama_ortu: e.target.value }))}
                      placeholder="Ayah / Ibu"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">No HP / WhatsApp Ortu</label>
                    <input
                      type="text"
                      value={activeSasaran.no_hp || activeSasaran.no_wa_ortu || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, no_hp: e.target.value, no_wa_ortu: e.target.value }))}
                      placeholder="0812xxxxxxxx"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kelurahan</label>
                    <input
                      type="text"
                      value={activeSasaran.kelurahan_nama || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, kelurahan_nama: e.target.value }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Hasil Pengukuran Antropometri & Z-Score WHO */}
              <div className="space-y-3 pt-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  <span>2. Hasil Pengukuran Antropometri & Status Gizi 3 Indeks</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Ukur</label>
                    <input
                      type="text"
                      value={activeSasaran.tanggal_ukur || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, tanggal_ukur: e.target.value }))}
                      placeholder="DD/MM/YYYY"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cara Ukur</label>
                    <select
                      value={activeSasaran.cara_ukur || 'Berdiri'}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, cara_ukur: e.target.value }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <option value="Berdiri">Berdiri</option>
                      <option value="Terlentang">Terlentang</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Berat Badan (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={activeSasaran.bb_terakhir ?? ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, bb_terakhir: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tinggi Badan (cm) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={activeSasaran.tb_terakhir ?? ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, tb_terakhir: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Z-Score BB/TB & Status Wasting</label>
                    <input
                      type="text"
                      value={activeSasaran.zscore_bbtb || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, zscore_bbtb: e.target.value }))}
                      placeholder="Contoh: -2.35 SD"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono mb-1"
                    />
                    <select
                      value={activeSasaran.status_gizi_bbtb || 'Gizi Kurang (Wasting)'}
                      onChange={(e) => setActiveSasaran(prev => ({ 
                        ...prev, 
                        status_gizi_bbtb: e.target.value,
                        kategori_masalah_terakhir: e.target.value as any
                      }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-rose-600"
                    >
                      <option value="Gizi Kurang (Wasting)">Gizi Kurang (Wasting)</option>
                      <option value="Gizi Buruk">Gizi Buruk</option>
                      <option value="Gizi Baik (Normal)">Gizi Baik (Normal)</option>
                      <option value="Overweight">Overweight</option>
                      <option value="Obesitas">Obesitas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Z-Score PB/U (TB/U) & Stunting</label>
                    <input
                      type="text"
                      value={activeSasaran.zscore_tbu || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, zscore_tbu: e.target.value }))}
                      placeholder="Contoh: -2.80 SD"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono mb-1"
                    />
                    <select
                      value={activeSasaran.status_gizi_tbu || 'Normal'}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, status_gizi_tbu: e.target.value }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-amber-600"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Pendek (Stunting)">Pendek (Stunting)</option>
                      <option value="Sangat Pendek">Sangat Pendek</option>
                      <option value="Tinggi">Tinggi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Z-Score BB/U & Underweight</label>
                    <input
                      type="text"
                      value={activeSasaran.zscore_bbu || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, zscore_bbu: e.target.value }))}
                      placeholder="Contoh: -2.15 SD"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono mb-1"
                    />
                    <select
                      value={activeSasaran.status_gizi_bbu || 'BB Kurang (Underweight)'}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, status_gizi_bbu: e.target.value }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-orange-600"
                    >
                      <option value="Normal">Normal</option>
                      <option value="BB Kurang (Underweight)">BB Kurang (Underweight)</option>
                      <option value="BB Sangat Kurang">BB Sangat Kurang</option>
                      <option value="Risiko BB Lebih">Risiko BB Lebih</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Naik Berat Badan (T/N)</label>
                    <select
                      value={activeSasaran.naik_berat_badan || 'T'}
                      onChange={(e) => setActiveSasaran(prev => ({ 
                        ...prev, 
                        naik_berat_badan: e.target.value,
                        keterangan_naik_bb: e.target.value === 'N' ? 'N (Naik)' : 'T (Tidak Naik)'
                      }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="T">T (Tidak Naik)</option>
                      <option value="N">N (Naik)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Keterangan Naik Berat Badan</label>
                    <input
                      type="text"
                      value={activeSasaran.keterangan_naik_bb || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, keterangan_naik_bb: e.target.value }))}
                      placeholder="Contoh: T (Tidak Naik) / O / B"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Outlier WHO</label>
                    <select
                      value={activeSasaran.status_outlier_who || 'Normal'}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, status_outlier_who: e.target.value }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Outlier">Outlier</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Data Balita</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL POPUP RINCIAN PASIEN DETAIL (KLIK GAMBAR MATA) */}
      {detailSasaran && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 p-6">
            
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 rounded-2xl">
                  <Baby className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {detailSasaran.inisial}
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                      {detailSasaran.kode_sasaran}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    NIK: <strong className="font-mono text-slate-700 dark:text-slate-300">{detailSasaran.nik || '-'}</strong> • {detailSasaran.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • Tgl Lahir: {detailSasaran.tanggal_lahir} ({detailSasaran.usia || '-'})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailSasaran(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rekap 3 Indeks Status Gizi WHO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold uppercase tracking-wider block">
                  1. BB/TB (Wasting)
                </span>
                <div className="text-lg font-bold text-rose-950 dark:text-rose-100 mt-1">
                  {detailSasaran.status_gizi_bbtb || detailSasaran.kategori_masalah_terakhir || 'Normal'}
                </div>
                <div className="text-[11px] font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                  Z-Score: <strong>{detailSasaran.zscore_bbtb || '-'}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider block">
                  2. PB/U (TB/U) (Stunting)
                </span>
                <div className="text-lg font-bold text-amber-950 dark:text-amber-100 mt-1">
                  {detailSasaran.status_gizi_tbu || 'Normal'}
                </div>
                <div className="text-[11px] font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                  Z-Score: <strong>{detailSasaran.zscore_tbu || '-'}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60">
                <span className="text-[10px] text-orange-800 dark:text-orange-300 font-bold uppercase tracking-wider block">
                  3. BB/U (Underweight)
                </span>
                <div className="text-lg font-bold text-orange-950 dark:text-orange-100 mt-1">
                  {detailSasaran.status_gizi_bbu || 'Normal'}
                </div>
                <div className="text-[11px] font-mono text-orange-700 dark:text-orange-300 mt-0.5">
                  Z-Score: <strong>{detailSasaran.zscore_bbu || '-'}</strong>
                </div>
              </div>
            </div>

            {/* Antropometri & Naik BB */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                Hasil Penimbangan & Pengukuran Terakhir:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Berat Badan:</span>
                  <strong className="text-sm font-mono text-slate-800 dark:text-white">{detailSasaran.bb_terakhir} kg</strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Tinggi Badan:</span>
                  <strong className="text-sm font-mono text-slate-800 dark:text-white">{detailSasaran.tb_terakhir} cm</strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Cara Ukur:</span>
                  <strong className="text-xs text-slate-800 dark:text-white">{detailSasaran.cara_ukur || 'Berdiri'}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Status Naik BB:</span>
                  <strong className={`text-xs ${detailSasaran.naik_berat_badan === 'N' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {detailSasaran.keterangan_naik_bb || detailSasaran.naik_berat_badan || 'T (Tidak Naik)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Wilayah & Orang Tua */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Lokasi & Fasilitas Kesehatan:</span>
                <div>Posyandu: <strong className="text-sky-700 dark:text-sky-300">{detailSasaran.posyandu || 'Posyandu Mawar I'}</strong></div>
                <div>Kelurahan: <strong>{detailSasaran.kelurahan_nama || 'Kelurahan Pulau Tidung'}</strong></div>
                <div>Kecamatan: <strong>{detailSasaran.wilayah_kecamatan || 'Kepulauan Seribu Selatan'}</strong></div>
                <div>Puskesmas / Pustu: <strong>{detailSasaran.puskesmas_pustu || detailSasaran.unit_pelayanan || 'Puskesmas Kep. Seribu Selatan'}</strong></div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Informasi Orang Tua / Kontak:</span>
                <div>Nama Orang Tua: <strong>{detailSasaran.nama_ortu || '-'}</strong></div>
                <div>No HP / WA: <strong className="font-mono">{detailSasaran.no_hp || detailSasaran.no_wa_ortu || '-'}</strong></div>
                <div>Alamat: <strong>{detailSasaran.alamat || '-'} ({detailSasaran.rt_rw || 'RT/RW'})</strong></div>
                <div>Status Outlier WHO: <strong className="text-slate-600">{detailSasaran.status_outlier_who || 'Normal'}</strong></div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSendWA(detailSasaran)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Rincian ke WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailSasaran(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL HAPUS DATA BALITA (KHUSUS TENAGA GIZI & ADMIN) */}
      {deleteConfirmModal && deleteConfirmModal.isOpen && deleteConfirmModal.sasaran && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Konfirmasi Hapus Data Balita
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Tindakan ini hanya dapat dilakukan oleh Tenaga Gizi & Admin
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-slate-700 dark:text-slate-300 space-y-1">
              <div>Nama Balita: <strong>{deleteConfirmModal.sasaran.inisial}</strong></div>
              <div>NIK: <strong className="font-mono">{deleteConfirmModal.sasaran.nik || '-'}</strong></div>
              <div>Posyandu: <strong>{deleteConfirmModal.sasaran.posyandu || '-'}</strong></div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 italic">
                Apakah Anda yakin ingin menghapus data balita ini dari basis data sasaran?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Ya, Hapus Data
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Import Data Balita Bermasalah Gizi dari Excel (e-PPGBM)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mendukung berkas format .xlsx, .xls, dan .csv dengan 24 kolom standar penimbangan posyandu
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Area Unggah File */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                Pilih atau Tarik Berkas Excel ke Sini
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Sistem akan membaca kolom NIK, Nama, JK, Tgl Lahir, Usia, Tgl Ukur, BB, TB, Z-Score, Status Gizi, Posyandu, dll.
              </p>
              
              <input
                type="file"
                id="fileExcelUpload"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2">
                <label
                  htmlFor="fileExcelUpload"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Pilih Berkas Excel</span>
                </label>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Format Kosong</span>
                </button>
              </div>

              {importFileName && (
                <div className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                  Berkas Terpilih: {importFileName}
                </div>
              )}
            </div>

            {importError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
                {importError}
              </div>
            )}

            {importSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {/* Pratinjau Data yang Terbaca */}
            {parsedData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Pratinjau Data Terbaca ({parsedData.length} Balita):
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    Siap diimpor ke sistem
                  </span>
                </div>

                <div className="overflow-x-auto max-h-56 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left text-[11px] border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300">
                        <th className="p-2">No</th>
                        <th className="p-2">NIK</th>
                        <th className="p-2">Nama Balita</th>
                        <th className="p-2">JK</th>
                        <th className="p-2">Tgl Lahir</th>
                        <th className="p-2">Usia</th>
                        <th className="p-2">BB</th>
                        <th className="p-2">TB</th>
                        <th className="p-2">Z-Score BB/TB</th>
                        <th className="p-2">Status Wasting</th>
                        <th className="p-2">Status Stunting</th>
                        <th className="p-2">Naik BB</th>
                        <th className="p-2">Posyandu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {parsedData.slice(0, 8).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/70">
                          <td className="p-2 text-center text-slate-400">{rIdx + 1}</td>
                          <td className="p-2">{row.nik}</td>
                          <td className="p-2 font-bold font-sans">{row.inisial}</td>
                          <td className="p-2 text-center">{row.jenis_kelamin}</td>
                          <td className="p-2">{row.tanggal_lahir}</td>
                          <td className="p-2">{row.usia}</td>
                          <td className="p-2">{row.bb_terakhir} kg</td>
                          <td className="p-2">{row.tb_terakhir} cm</td>
                          <td className="p-2">{row.zscore_bbtb}</td>
                          <td className="p-2 font-sans font-bold text-rose-600">{row.status_gizi_bbtb}</td>
                          <td className="p-2 font-sans">{row.status_gizi_tbu}</td>
                          <td className="p-2 text-center">{row.naik_berat_badan}</td>
                          <td className="p-2 font-sans">{row.posyandu}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Balita gizi bermasalah yang diimpor akan otomatis masuk ke Daftar Tindak Lanjut lintas sektor.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedData.length === 0 || isImporting}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isImporting ? 'Sedang Mengimpor...' : `Impor ${parsedData.length} Balita`}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL NOTIFIKASI WHATSAPP */}
      {waAlertModal && waAlertModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {waAlertModal.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Kirim notifikasi balita bermasalah gizi ke grup WhatsApp Lintas Sektor
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl font-mono text-[11px] whitespace-pre-wrap text-slate-800 dark:text-slate-200 max-h-52 overflow-y-auto">
              {waAlertModal.text}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWaAlertModal(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
              <a
                href={waAlertModal.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWaAlertModal(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Buka WhatsApp Sekarang</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
