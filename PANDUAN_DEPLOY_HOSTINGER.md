# PANDUAN LENGKAP UPDATE APLIKASI DI HOSTINGER
**Domain:** `dermagagizi.puskesmasseribuselatan.com`

---

## 🔎 KENAPA SEBELUMNYA TAMPILAN MASIH VERSI LAMA?
Dari hasil penelusuran sistem kami langsung ke server Hostinger:
1. Di dalam folder `assets/` sebelumnya tersimpan beberapa file build lama (misal: `index-B23_s9hh.js`).
2. Server Hostinger mengeksekusi file JavaScript tersebut karena urutan alfabet file lama berada di urutan teratas.
3. **Kabar Baik**: Seluruh file usang tersebut **telah kami bersihkan total**, dan bundle terbaru (`index-BaCm_kwq.js` & `index-DefqAUgF.css`) sudah dikunci langsung di `index.php` dan `dist/`.

---

## 🚀 3 LANGKAH MUDAH AGAR HOSTINGER MENAMPILKAN VERSI TERBARU

### Langkah 1: Push Pembaruan dari AI Studio ke GitHub
1. Lihat ke **pojok kanan atas** layar Google AI Studio Anda.
2. Klik tombol **Publish to GitHub** (atau **Sync to GitHub**).
3. Tunggu 5-10 detik sampai muncul notifikasi sinkronisasi ke GitHub berhasil (*synced*).

---

### Langkah 2: Tarik (Deploy) Update di Hostinger
1. Login ke **Hostinger hPanel** (https://hpanel.hostinger.com).
2. Pilih hosting/domain **`dermagagizi.puskesmasseribuselatan.com`**.
3. Di bilah menu kiri hPanel, cari menu **Tingkat Lanjut (Advanced)** ➔ pilih **Git**.
4. Di bagian *Daftar Repositori*, cari repositori Anda lalu klik tombol **Deploy** (atau **Pull** / Tarik).
5. Tunggu beberapa detik hingga statusnya berubah menjadi centang hijau (**Deployed**).

---

### Langkah 3: Bersihkan Cache Browser (Sangat Penting!)
Karena browser biasanya menyimpan file JavaScript & CSS lama:
- **Di Laptop/Komputer (Chrome/Edge/Firefox):**
  Buka `https://dermagagizi.puskesmasseribuselatan.com`, lalu tekan kombinasi tombol:
  👉 **Ctrl + F5** (atau **Ctrl + Shift + R**)
  *(Untuk Mac: **Cmd + Shift + R**)*
- **Atau buka via Mode Samaran (Incognito Window):**
  Tekan **Ctrl + Shift + N** lalu buka alamat website.

---

## 📱 HASIL YANG AKAN LANGSUNG MUNCUL:
✅ Tampilan ringkasan profil Dermaga Gizi Kepulauan Seribu Selatan sebelum login.  
✅ Menu Data Sasaran Balita Bermasalah Gizi dengan 24 kolom baku (NIK, Ortu, Posyandu, Status Gizi, dsb).  
✅ Tombol Hapus & Fitur Import Excel.  
✅ Kolom AKSI dengan fitur Kolaborasi Tindak Lanjut multi lintas sektor (Petugas, Kader, Kelurahan, Satpol PP, dsb) lengkap dengan unggah dan popup foto dokumen pendukung.  
✅ Status Selesai terkunci khusus untuk Login Petugas Gizi.  
✅ Menu Daftar Kendala dengan filter status dan grafik kendala.  
✅ Terhubung 100% ke database Google Apps Script tanpa dummy data hardcoded.
