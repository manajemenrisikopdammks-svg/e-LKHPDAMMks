# Panduan Setup Aplikasi Laporan Kegiatan Harian Pegawai
### PERUMDA Air Minum Kota Makassar (Berbasis Google Apps Script)

Aplikasi ini dirancang sebagai **Web App mandiri** yang menggantikan Google Form konvensional, dilengkapi dengan:
1. **Cascading Dropdown Dinamis**: Memilih *Unit Kerja / Bagian* otomatis menyaring pilihan *Seksi / Jabatan Kasie*.
2. **Form Input Lengkap & Responsif**: Pengisian jam kerja (08:00 - 16:00), uraian tugas, status, serta upload foto bukti *Time Mark* dari kamera ponsel atau file.
3. **Penyimpanan Terintegrasi & Rapi**:
   - **Google Sheets**: Menyimpan database master (`Laporan_Kegiatan`) sekaligus menyinkronkan data secara otomatis ke **Sheet Tab Khusus per Unit Kerja / Bagian** (misal tab `PRODUKSI`, tab `UMUM DAN KEPEGAWAIAN`, `SPI`, `SEKPER`, dll).
   - **Google Drive**: Foto bukti Time Mark tersimpan rapi dalam folder bertingkat: `Foto_TimeMark_Laporan_Harian_PERUMDA` $\rightarrow$ `[Unit Kerja / Bagian]` $\rightarrow$ `[Nama Pegawai (NPP)]`.
4. **Cetak / Ekspor PDF Resmi**: Format cetak dibuat **100% persis** dengan dokumen baku `form.docx` (*FORMAT LAPORAN KEGIATAN HARIAN PEGAWAI PERUMDA AIR MINUM KOTA MAKASSAR*).
5. **Dashboard Monitoring**: Rekap laporan yang masuk, filter per unit kerja, dan pencarian cepat.
6. **Utility Auto-Organizer**: Fungsi `organisirSistemRapi` di backend untuk merapikan data lama dari master ke sheet tab bagian masing-masing secara serentak.

---

## File dalam Paket Ini

1. **`Code.gs`**: Skrip backend Google Apps Script (`doGet`, validasi input, simpan data ke Sheets master & tab unit kerja, upload foto ke folder Drive bertingkat, `organisirSistemRapi`, dan pembuat PDF).
2. **`Setup.gs`**: Skrip inisialisasi sekali jalan untuk membuat sheet database master, sheet tab per-bagian, mengisi master data organisasi, dan membuat hierarki folder foto di Google Drive.
3. **`ui.html`**: Antarmuka web modern (Tailwind CSS, Lucide Icons, Mobile Friendly, Cetak PDF Resmi).

---

## Langkah-Langkah Pemasangan di Google Drive / Google Sheets

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka browser dan masuk ke [Google Sheets](https://sheets.new).
2. Beri nama file Spreadsheet Anda, misalnya:  
   `Database Laporan Harian - PERUMDA Air Minum Kota Makassar`.

### Langkah 2: Buka Google Apps Script Editor
1. Di menu atas Google Sheets, klik **Ekstensi (Extensions)** $\rightarrow$ **Apps Script**.
2. Tab baru editor Google Apps Script akan terbuka.

### Langkah 3: Salin File Skrip ke Apps Script Editor
1. **File `Code.gs`**:
   - Buka file `Code.gs` bawaan di editor.
   - Hapus semua isinya, lalu salin (*copy-paste*) seluruh kode dari file [Code.gs](file:///c:/laragon/www/laporan%20harian/Code.gs) lokal Anda.
2. **File `Setup.gs`**:
   - Di sebelah kiri panel *Files*, klik tanda tambah (**+**) $\rightarrow$ pilih **Script**.
   - Beri nama: `Setup`.
   - Salin (*copy-paste*) seluruh isi dari file [Setup.gs](file:///c:/laragon/www/laporan%20harian/Setup.gs) lokal Anda.
3. **File `ui.html`**:
   - Di panel *Files*, klik tanda tambah (**+**) $\rightarrow$ pilih **HTML**.
   - Beri nama: `ui` (tanpa mengetik `.html` karena akan otomatis ditambahkan oleh Google).
   - Salin (*copy-paste*) seluruh isi dari file [ui.html](file:///c:/laragon/www/laporan%20harian/ui.html) lokal Anda.
4. Tekan tombol **Save (Simpan / Ikon Disket)** di bagian atas.

---

### Langkah 4: Jalankan Inisialisasi Database (Hanya 1x)
1. Pada dropdown fungsi di bagian atas Apps Script Editor (di sebelah tombol *Debug* dan *Run*), pilih fungsi: **`inisialisasiSistem`**.
2. Klik tombol **Run (Jalankan)**.
3. Google akan meminta izin akses (*Authorization Required*):
   - Klik **Review Permissions** (Tinjau Izin).
   - Pilih akun Google Anda.
   - Klik **Advanced (Lanjutan)** di pojok kiri bawah $\rightarrow$ klik **Go to ... (unsafe) / Buka ... (tidak aman)**.
   - Klik **Allow (Izinkan)**.
4. Script akan otomatis membuat:
   - Tab sheet master **`Laporan_Kegiatan`** lengkap dengan header kolom.
   - Tab sheet **`Master_Organisasi`** dan **`Master_Pegawai`**.
   - Tab sheet khusus untuk masing-masing Unit Kerja (`PRODUKSI`, `UMUM DAN KEPEGAWAIAN`, `SPI`, `SEKPER`, `WILAYAH 1-6`, dll).
   - Folder Google Drive **`Foto_TimeMark_Laporan_Harian_PERUMDA`** dengan sub-folder per bagian.

> **Catatan Tambahan:** Jika Anda sudah memiliki data lama di tab `Laporan_Kegiatan`, Anda dapat menjalankan fungsi **`organisirSistemRapi`** dari editor Apps Script untuk mendistribusikan data tersebut ke tab per-bagian masing-masing secara otomatis!

---

### Langkah 5: Deploy Aplikasi Web (Publikasi Link)
1. Di pojok kanan atas Apps Script Editor, klik tombol biru **Deploy (Terapkan)** $\rightarrow$ pilih **New deployment (Penerapan baru)**.
2. Klik ikon gerigi (pilih jenis) $\rightarrow$ pilih **Web app (Aplikasi web)**.
3. Konfigurasikan sebagai berikut:
   - **Description**: `Versi 1.0 - Laporan Harian PERUMDA`
   - **Execute as (Jalankan sebagai)**: `Me (email-anda@gmail.com)`
   - **Who has access (Siapa yang memiliki akses)**:  
     - Pilih **`Anyone (Siapa saja)`** jika ingin diakses oleh semua pegawai tanpa kendala login domain.
     - Atau pilih **`Anyone with Google account`** / organisasi Anda jika menggunakan Google Workspace instansi.
4. Klik **Deploy (Terapkan)**.
5. Salin URL **Web app URL** yang muncul (contoh: `https://script.google.com/macros/s/.../exec`).
6. Bagikan tautan tersebut kepada seluruh staf dan kasie untuk mulai mengisi laporan harian!

---

## Uji Coba Langsung di Komputer (Pratinjau Offline)
Anda juga dapat langsung membuka file [ui.html](file:///c:/laragon/www/laporan%20harian/ui.html) di browser (Google Chrome, Edge, dll) pada komputer Anda saat ini. Sistem telah dilengkapi dengan *mode simulasi lokal (mock data)* sehingga Anda bisa mencoba mengisi formulir, mencoba cascading dropdown, melihat dashboard, dan mencoba tombol **Cetak Format Resmi** secara langsung tanpa koneksi Google Apps Script terlebih dahulu.
