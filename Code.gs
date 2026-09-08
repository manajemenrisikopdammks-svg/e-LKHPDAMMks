/**
 * =========================================================================
 * SISTEM LAPORAN KEGIATAN HARIAN PEGAWAI PERUMDA AIR MINUM KOTA MAKASSAR
 * File: Code.gs (SEMUA FUNGSI BACKEND LENGKAP)
 * =========================================================================
 */

// ID Spreadsheet Resmi PERUMDA Air Minum Kota Makassar
const SPREADSHEET_ID = '1_h2oNUCUA80iunTYMXij889zSllm6a2zIZA4poWaUXM';

function getSpreadsheetSafe() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active && active.getId() === SPREADSHEET_ID) return active;
  } catch (e) {}
  
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * 1. ENTRY POINT UTAMA WEB APP (WAJIB ADA)
 * Menampilkan antarmuka web saat URL Web App diakses di browser
 */
function doGet(e) {
  // Pastikan Master_Admin & Struktur 14 Kolom Header terisi rapi
  try { getPinAdminFromSheet(); } catch (err) {}
  try { perbaikiStrukturSemuaData(); } catch (err) {}
  
  const template = HtmlService.createTemplateFromFile('ui');
  return template.evaluate()
    .setTitle('Sistem Laporan Kegiatan Harian - PERUMDA Air Minum Kota Makassar')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper menyertakan file parsial jika diperlukan
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * VERIFIKASI & MANAJEMEN PIN RAHASIA ADMIN / SUPERADMIN
 * PIN Default: 123456 (Disimpan di sheet Master_Admin & ScriptProperties)
 */
const DEFAULT_ADMIN_PIN = '123456';

function getPinAdminFromSheet() {
  try {
    const ss = getSpreadsheetSafe();
    let sheetAdmin = ss.getSheetByName('Master_Admin');
    
    // Otomatis buat sheet Master_Admin jika belum ada di spreadsheet!
    if (!sheetAdmin) {
      sheetAdmin = ss.insertSheet('Master_Admin');
      const headersAdmin = ['Kunci Pengaturan', 'Nilai', 'Keterangan', 'Terakhir Diubah'];
      sheetAdmin.appendRow(headersAdmin);
      
      const nowStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'dd/MM/yyyy HH:mm:ss');
      sheetAdmin.appendRow(['PIN_ADMIN', '123456', 'PIN Rahasia untuk Akses Dashboard & Riwayat Laporan', nowStr]);
      
      const adminHeader = sheetAdmin.getRange(1, 1, 1, 4);
      adminHeader.setBackground('#8B5CF6').setFontColor('#FFFFFF').setFontWeight('bold');
      sheetAdmin.setFrozenRows(1);
    }

    if (sheetAdmin && sheetAdmin.getLastRow() > 1) {
      const data = sheetAdmin.getRange(2, 1, sheetAdmin.getLastRow() - 1, 2).getValues();
      for (let i = 0; i < data.length; i++) {
        if (String(data[i][0]).trim() === 'PIN_ADMIN') {
          const val = String(data[i][1]).trim();
          if (val) return val;
        }
      }
    }
  } catch (err) {
    Logger.log('Gagal membaca PIN dari Master_Admin: ' + err.toString());
  }
  
  // Fallback ke Script Properties atau Constant
  const scriptProps = PropertiesService.getScriptProperties();
  return scriptProps.getProperty('ADMIN_PIN') || DEFAULT_ADMIN_PIN;
}

function verifikasiPinAdmin(pinInput) {
  try {
    const validPin = getPinAdminFromSheet();
    const cleanInput = String(pinInput || '').trim();
    if (cleanInput === String(validPin).trim()) {
      return { success: true, message: 'Akses Admin Diterima.' };
    } else {
      return { success: false, message: 'PIN Admin Salah! Silakan coba lagi.' };
    }
  } catch (err) {
    Logger.log('Error verifikasiPinAdmin: ' + err.toString());
    if (String(pinInput || '').trim() === DEFAULT_ADMIN_PIN) {
      return { success: true, message: 'Akses Admin Diterima.' };
    }
    return { success: false, message: 'PIN Admin Salah!' };
  }
}

function simpanPinAdminBaru(pinLama, pinBaru) {
  try {
    const currentPin = getPinAdminFromSheet();
    if (String(pinLama || '').trim() !== String(currentPin).trim()) {
      return { success: false, message: 'PIN Admin Saat Ini / PIN Lama Salah!' };
    }
    
    const cleanBaru = String(pinBaru || '').trim();
    if (!cleanBaru || cleanBaru.length < 4) {
      return { success: false, message: 'PIN Baru minimal terdiri dari 4 karakter / angka.' };
    }
    
    const ss = getSpreadsheetSafe();
    let sheetAdmin = ss.getSheetByName('Master_Admin');
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'dd/MM/yyyy HH:mm:ss');
    
    if (!sheetAdmin) {
      sheetAdmin = ss.insertSheet('Master_Admin');
      sheetAdmin.appendRow(['Kunci Pengaturan', 'Nilai', 'Keterangan', 'Terakhir Diubah']);
      sheetAdmin.appendRow(['PIN_ADMIN', cleanBaru, 'PIN Rahasia untuk Akses Dashboard & Riwayat Laporan', nowStr]);
      sheetAdmin.getRange(1, 1, 1, 4).setBackground('#8B5CF6').setFontColor('#FFFFFF').setFontWeight('bold');
      sheetAdmin.setFrozenRows(1);
    } else {
      let found = false;
      if (sheetAdmin.getLastRow() > 1) {
        const data = sheetAdmin.getRange(2, 1, sheetAdmin.getLastRow() - 1, 2).getValues();
        for (let i = 0; i < data.length; i++) {
          if (String(data[i][0]).trim() === 'PIN_ADMIN') {
            sheetAdmin.getRange(i + 2, 2).setValue(cleanBaru);
            sheetAdmin.getRange(i + 2, 4).setValue(nowStr);
            found = true;
            break;
          }
        }
      }
      if (!found) {
        sheetAdmin.appendRow(['PIN_ADMIN', cleanBaru, 'PIN Rahasia untuk Akses Dashboard & Riwayat Laporan', nowStr]);
      }
    }
    
    // Backup ke ScriptProperties
    PropertiesService.getScriptProperties().setProperty('ADMIN_PIN', cleanBaru);
    
    return { success: true, message: 'PIN Admin berhasil diperbarui menjadi: ' + cleanBaru };
  } catch (err) {
    Logger.log('Error simpanPinAdminBaru: ' + err.toString());
    return { success: false, message: 'Gagal memperbarui PIN: ' + err.toString() };
  }
}

/**
 * PENCARIAN & AUTO-FILL PEGAWAI DARI SHEET MASTER_PEGAWAI
 */
function getPegawaiByNpp(nppQuery) {
  try {
    if (!nppQuery) return { success: false, found: false, message: 'NPP Kosong' };
    const cleanQuery = String(nppQuery).trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanQuery) return { success: false, found: false, message: 'NPP Tidak Valid' };

    const ss = getSpreadsheetSafe();
    const sheetPeg = ss.getSheetByName('Master_Pegawai');
    
    if (sheetPeg && sheetPeg.getLastRow() > 1) {
      const data = sheetPeg.getRange(2, 1, sheetPeg.getLastRow() - 1, 4).getValues();
      for (let i = 0; i < data.length; i++) {
        const rawNpp = String(data[i][0]).trim();
        const cleanNpp = rawNpp.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        if (cleanNpp === cleanQuery) {
          return {
            success: true,
            found: true,
            data: {
              npp: rawNpp,
              nama: String(data[i][1] || '').trim(),
              unitKerja: String(data[i][2] || '').trim(),
              seksi: String(data[i][3] || '').trim()
            }
          };
        }
      }
    }
    return { success: true, found: false, message: 'Pegawai tidak ditemukan di Master_Pegawai' };
  } catch (err) {
    Logger.log('Error getPegawaiByNpp: ' + err.toString());
    return { success: false, found: false, message: err.toString() };
  }
}

/**
 * 2. MASTER DATA ORGANISASI (CASCADING DROPDOWN)
 * Mengambil daftar Unit Kerja & Seksi/Jabatan
 */
function getMasterOrganisasi() {
  try {
    const ss = getSpreadsheetSafe();
    const sheetOrg = ss.getSheetByName('Master_Organisasi');
    
    if (sheetOrg && sheetOrg.getLastRow() > 1) {
      const data = sheetOrg.getRange(2, 1, sheetOrg.getLastRow() - 1, 2).getValues();
      const unitMap = {};
      
      data.forEach(row => {
        const unit = String(row[0]).trim();
        const seksi = String(row[1]).trim();
        if (unit && seksi) {
          if (!unitMap[unit]) unitMap[unit] = [];
          if (!unitMap[unit].includes(seksi)) {
            unitMap[unit].push(seksi);
          }
        }
      });
      return { success: true, data: unitMap };
    }
  } catch (err) {
    Logger.log('Gagal membaca Master_Organisasi: ' + err.toString());
  }
  
  // Data fallback default
  const fallback = {
    "UMUM DAN KEPEGAWAIAN": [
      "KASIE. MANAJEMEN RISIKO",
      "KASIE. PENDAYAGUNAAN PEGAWAI",
      "KASIE. TATA USAHA DAN PDE",
      "KASIE. KESELAMATAN DAN KESEHATAN KERJA"
    ],
    "SPI": [
      "KASIE. PENGAWASAN TEKNIK & OPERASIONAL",
      "KASIE. PENGAWASAN KEUANGAN & ASET"
    ],
    "SEKPER": [
      "KASIE. HUKUM",
      "KASIE. HUBUNGAN MASYARAKAT",
      "KASIE. HUBUNGAN LANGGANAN",
      "KASIE. PENELITIAN DAN PENGEMBANGAN",
      "KASIE. RUMAH TANGGA DAN KEPROTOKOLERAN"
    ],
    "PERLENGKAPAN": [
      "KASIE. ANALISA KEBUTUHAN DAN PENGADAAN",
      "KASIE. INVENTARISASI ASSET",
      "KASIE. PERGUDANGAN"
    ],
    "ANGGARAN DAN PERBENDAHARAAN": [
      "KASIE. ANGGARAN",
      "KASIE. PERBENDAHARAAN"
    ],
    "VERIFIKASI DAN AKUNTANSI": [
      "KASIE. VERIFIKASI",
      "KASIE. AKUNTANSI DAN PELAPORAN",
      "KASIE. PAJAK"
    ],
    "PERENCANAAN TEKNIK": [
      "KASIE. PERENCANAAN & PEMETAAN",
      "KASIE. PENGAWASAN TEKNIK"
    ],
    "DISTRIBUSI DAN KEHILANGAN AIR": [
      "KASIE. KEBOCORAN AIR DAN PELAYANAN SOSIAL",
      "KASIE. PEMELIHARAAN"
    ],
    "PRODUKSI": [
      "KASIE. IPA I",
      "KASIE. IPA II",
      "KASIE. IPA III",
      "KASIE. IPA IV",
      "KASIE. IPA V",
      "KASIE. LABORATORIUM",
      "KASIE. AIR BAKU"
    ],
    "WILAYAH 1": [
      "SEKRETARIS WILAYAH PELAYANAN",
      "KASIE. PELAYANAN PELANGGAN WP",
      "KASIE. TEKNIK WP",
      "KASIE. BACA METER DAN PENAGIHAN WP"
    ],
    "WILAYAH 2": [
      "SEKRETARIS WILAYAH PELAYANAN",
      "KASIE. PELAYANAN PELANGGAN",
      "KASIE. TEKNIK WP",
      "KASIE. BACA METER DAN PENAGIHAN WP"
    ],
    "WILAYAH 3": [
      "SEKRETARIS WILAYAH PELAYANAN",
      "KASIE. PELAYANAN PELANGGAN",
      "KASIE. TEKNIK WP",
      "KASIE. BACA METER DAN PENAGIHAN WP"
    ],
    "WILAYAH 4": [
      "SEKRETARIS WILAYAH PELAYANAN",
      "KASIE. PELAYANAN PELANGGAN",
      "KASIE. TEKNIK WP",
      "KASIE. BACA METER DAN PENAGIHAN WP"
    ],
    "WILAYAH 5": [
      "SEKRETARIS WILAYAH PELAYANAN",
      "KASIE. PELAYANAN PELANGGAN",
      "KASIE. TEKNIK WP",
      "KASIE. BACA METER DAN PENAGIHAN WP"
    ],
    "WILAYAH 6": [
      "SEKRETARIS WILAYAH PELAYANAN",
      "KASIE. PELAYANAN PELANGGAN",
      "KASIE. TEKNIK WP",
      "KASIE. BACA METER DAN PENAGIHAN WP"
    ]
  };
  return { success: true, data: fallback };
}

/**
 * 3. SIMPAN LAPORAN KE GOOGLE SHEETS & FOTO KE GOOGLE DRIVE
 */
function simpanLaporan(payload) {
  try {
    const ss = getSpreadsheetSafe();
    let sheet = ss.getSheetByName('Laporan_Kegiatan');
    if (!sheet) {
      inisialisasiSistem();
      sheet = ss.getSheetByName('Laporan_Kegiatan');
    }
    
    // Validasi Field Utama
    if (!payload.nama || !payload.npp || !payload.unitKerja || !payload.seksi) {
      return { success: false, message: 'Harap lengkapi Nama, NPP, Unit Kerja, dan Seksi/Jabatan.' };
    }
    
    // Generate ID Unik: LHR-YYYYMMDD-XXXX
    const now = new Date();
    const dateCode = Utilities.formatDate(now, 'Asia/Makassar', 'yyyyMMdd');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const idLaporan = 'LHR-' + dateCode + '-' + randomSuffix;
    const timestamp = Utilities.formatDate(now, 'Asia/Makassar', 'dd/MM/yyyy HH:mm:ss');
    
    // Kumpulkan daftar foto (Multi-Foto Support)
    const listFoto = Array.isArray(payload.fotoList) && payload.fotoList.length > 0 
      ? payload.fotoList 
      : (payload.fotoBase64 ? [payload.fotoBase64] : []);

    const fotoUrls = [];
    if (listFoto.length > 0) {
      try {
        const folder = getOrCreateFotoFolder(payload.unitKerja, payload.nama, payload.npp);
        const cleanNpp = String(payload.npp).replace(/[^a-zA-Z0-9]/g, '');
        
        listFoto.forEach((b64, idx) => {
          try {
            if (!b64) return;
            const base64Parts = b64.split(',');
            const mimeMatch = base64Parts[0].match(/:(.*?);/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const rawBase64 = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];
            const bytes = Utilities.base64Decode(rawBase64);
            
            const filename = 'TimeMark_' + cleanNpp + '_' + dateCode + '_' + (idx + 1) + '_' + randomSuffix + '.jpg';
            const blob = Utilities.newBlob(bytes, mimeType, filename);
            
            const file = folder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            fotoUrls.push('https://lh3.googleusercontent.com/d/' + file.getId());
          } catch (errFoto) {
            Logger.log('Gagal upload photo ke-' + (idx + 1) + ': ' + errFoto.toString());
          }
        });
      } catch (errUpload) {
        Logger.log('Gagal upload foto list: ' + errUpload.toString());
      }
    }
    
    const fotoUrlString = fotoUrls.join('\n');
    
    // Pemetaan Atasan Langsung Default
    const ATASAN_MAP = {
      'UMUM DAN KEPEGAWAIAN': 'Kepala Bagian Umum dan Kepegawaian',
      'SPI': 'Kepala Satuan Pengawasan Intern',
      'SEKPER': 'Kepala Sekretariat Perusahaan',
      'PERLENGKAPAN': 'Kepala Bagian Perlengkapan',
      'ANGGARAN DAN PERBENDAHARAAN': 'Kepala Bagian Anggaran dan Perbendaharaan',
      'VERIFIKASI DAN AKUNTANSI': 'Kepala Bagian Verifikasi dan Akuntansi',
      'PERENCANAAN TEKNIK': 'Kepala Bagian Perencanaan Teknik',
      'DISTRIBUSI DAN KEHILANGAN AIR': 'Kepala Bagian Distribusi dan Kehilangan Air',
      'PRODUKSI': 'Kepala Bagian Produksi',
      'WILAYAH 1': 'Kepala Wilayah Pelayanan 1',
      'WILAYAH 2': 'Kepala Wilayah Pelayanan 2',
      'WILAYAH 3': 'Kepala Wilayah Pelayanan 3',
      'WILAYAH 4': 'Kepala Wilayah Pelayanan 4',
      'WILAYAH 5': 'Kepala Wilayah Pelayanan 5',
      'WILAYAH 6': 'Kepala Wilayah Pelayanan 6'
    };

    const unitKey = payload.unitKerja.trim();
    const atasanDefault = ATASAN_MAP[unitKey] || ('Kepala Bagian ' + unitKey);
    const atasanFinal = (payload.atasanLangsung && payload.atasanLangsung.trim() !== '' && payload.atasanLangsung !== 'Sekretaris Direktur Umum')
      ? payload.atasanLangsung.trim()
      : atasanDefault;
    
    // Serialisasi rincian kegiatan ke format JSON
    const rincianKegiatanJson = JSON.stringify(payload.kegiatan || []);
    const hariTanggal = payload.hariTanggal || Utilities.formatDate(now, 'Asia/Makassar', 'EEEE, dd MMMM yyyy');
    
    // Tentukan Nama Jabatan secara Rapi
    const levelMap = {
      'STAF': 'Staf / Pelaksana',
      'KASIE': 'Kepala Seksi',
      'KABAG': 'Kepala Bagian / Kepala Wilayah'
    };
    const levelKey = String(payload.level || 'STAF').toUpperCase();
    const jabatanText = payload.jabatan || levelMap[levelKey] || 'Staf / Pelaksana';

    // Susun baris baru di sheet (14 Kolom)
    const row = [
      idLaporan,
      timestamp,
      hariTanggal,
      payload.nama.trim(),
      payload.npp.trim(),
      jabatanText,
      payload.unitKerja.trim(),
      payload.seksi.trim(),
      atasanFinal,
      payload.direkturUmum || 'Direktur Umum',
      rincianKegiatanJson,
      fotoUrlString,
      'Tersimpan',
      payload.catatan || ''
    ];
    
    // 1. Simpan ke Sheet Master (Laporan_Kegiatan)
    sheet.appendRow(row);
    
    // 2. Simpan juga ke Sheet Tab Bagian/Unit Kerja
    appendRowToUnitSheet(ss, payload.unitKerja, row);
    
    return {
      success: true,
      id: idLaporan,
      fotoUrl: fotoUrlString,
      message: 'Laporan kegiatan harian berhasil disimpan dengan nomor: ' + idLaporan
    };
  } catch (err) {
    Logger.log('Error simpanLaporan: ' + err.toString());
    return { success: false, message: 'Terjadi kesalahan sistem: ' + err.toString() };
  }
}

/**
 * 4. AMBIL DAFTAR LAPORAN UNTUK DASHBOARD & RIWAYAT
 */
function getDaftarLaporan(filter) {
  try {
    const ss = getSpreadsheetSafe();
    const sheet = ss.getSheetByName('Laporan_Kegiatan');
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, data: [], stats: { total: 0, hariIni: 0, diverifikasi: 0, pending: 0 } };
    }
    
    const lastCol = Math.max(14, sheet.getLastColumn());
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'dd/MM/yyyy');
    
    let total = 0;
    let hariIni = 0;
    let diverifikasi = 0;
    let pending = 0;
    
    const list = [];
    
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      if (!r[0]) continue; // Skip baris kosong
      
      total++;
      
      // Sanitasi Tanggal agar SELALU STRING
      let tsVal = r[1];
      if (tsVal instanceof Date) {
        tsVal = Utilities.formatDate(tsVal, 'Asia/Makassar', 'dd/MM/yyyy HH:mm:ss');
      } else {
        tsVal = String(tsVal || '');
      }
      
      let tglVal = r[2];
      if (tglVal instanceof Date) {
        tglVal = Utilities.formatDate(tglVal, 'Asia/Makassar', 'EEEE, dd MMMM yyyy');
      } else {
        tglVal = String(tglVal || '');
      }
      
      // Cek apakah baris ini memuat 14 kolom (Format Baru dengan Jabatan terpisah)
      const hasJabatanCol = r.length >= 14 && (r[13] !== undefined || r[5] === 'Staf / Pelaksana' || r[5] === 'Kepala Seksi' || r[5] === 'Kepala Bagian / Kepala Wilayah');
      const jabatanVal = hasJabatanCol ? String(r[5] || 'Staf / Pelaksana') : 'Staf / Pelaksana';
      const unitVal = hasJabatanCol ? String(r[6] || '') : String(r[5] || '');
      const seksiVal = hasJabatanCol ? String(r[7] || '') : String(r[6] || '');
      const atasanVal = hasJabatanCol ? String(r[8] || '') : String(r[7] || '');
      const dirVal = hasJabatanCol ? String(r[9] || '') : String(r[8] || '');
      const rincianVal = hasJabatanCol ? r[10] : r[9];
      const fotoVal = hasJabatanCol ? r[11] : r[10];
      const statusVal = hasJabatanCol ? r[12] : r[11];
      const catatanVal = hasJabatanCol ? r[13] : r[12];
      
      const item = {
        id: String(r[0]),
        timestamp: tsVal,
        hariTanggal: tglVal,
        nama: String(r[3] || ''),
        npp: String(r[4] || ''),
        jabatan: jabatanVal,
        unitKerja: unitVal,
        seksi: seksiVal,
        atasanLangsung: atasanVal,
        direkturUmum: dirVal,
        rincian: parseJsonSafe(rincianVal),
        fotoUrl: String(fotoVal || ''),
        status: String(statusVal || 'Menunggu Verifikasi'),
        catatan: String(catatanVal || '')
      };
      
      if (tsVal.indexOf(todayStr) !== -1 || tglVal.indexOf(todayStr) !== -1) {
        hariIni++;
      }
      
      if (item.status === 'Disetujui' || item.status === 'Selesai') {
        diverifikasi++;
      } else {
        pending++;
      }
      
      let match = true;
      if (filter && filter.unit && filter.unit !== 'ALL' && item.unitKerja !== filter.unit) {
        match = false;
      }
      if (filter && filter.search) {
        const query = String(filter.search).toLowerCase();
        const fullText = (item.nama + ' ' + item.npp + ' ' + item.jabatan + ' ' + item.seksi + ' ' + item.hariTanggal + ' ' + item.id).toLowerCase();
        if (fullText.indexOf(query) === -1) match = false;
      }
      
      if (match) {
        list.push(item);
      }
    }
    
    return {
      success: true,
      data: list,
      stats: {
        total: total,
        hariIni: hariIni,
        diverifikasi: diverifikasi,
        pending: pending
      }
    };
  } catch (err) {
    Logger.log('Error getDaftarLaporan: ' + err.toString());
    return { success: false, message: err.toString(), data: [], stats: { total: 0, hariIni: 0, diverifikasi: 0, pending: 0 } };
  }
}

/**
 * 5. DETAIL SATU LAPORAN
 */
function getDetailLaporan(id) {
  try {
    const ss = getSpreadsheetSafe();
    const sheet = ss.getSheetByName('Laporan_Kegiatan');
    if (!sheet || sheet.getLastRow() <= 1) return { success: false, message: 'Data tidak ditemukan.' };
    
    const lastCol = Math.max(14, sheet.getLastColumn());
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        const r = rows[i];
        
        let tsVal = r[1] instanceof Date ? Utilities.formatDate(r[1], 'Asia/Makassar', 'dd/MM/yyyy HH:mm:ss') : String(r[1] || '');
        let tglVal = r[2] instanceof Date ? Utilities.formatDate(r[2], 'Asia/Makassar', 'EEEE, dd MMMM yyyy') : String(r[2] || '');
        
        const hasJabatanCol = r.length >= 14 && (r[13] !== undefined || r[5] === 'Staf / Pelaksana' || r[5] === 'Kepala Seksi' || r[5] === 'Kepala Bagian / Kepala Wilayah');
        const jabatanVal = hasJabatanCol ? String(r[5] || 'Staf / Pelaksana') : 'Staf / Pelaksana';
        const unitVal = hasJabatanCol ? String(r[6] || '') : String(r[5] || '');
        const seksiVal = hasJabatanCol ? String(r[7] || '') : String(r[6] || '');
        const atasanVal = hasJabatanCol ? String(r[8] || '') : String(r[7] || '');
        const dirVal = hasJabatanCol ? String(r[9] || '') : String(r[8] || '');
        const rincianVal = hasJabatanCol ? r[10] : r[9];
        const fotoVal = hasJabatanCol ? r[11] : r[10];
        const statusVal = hasJabatanCol ? r[12] : r[11];
        const catatanVal = hasJabatanCol ? r[13] : r[12];
        
        return {
          success: true,
          data: {
            id: String(r[0]),
            timestamp: tsVal,
            hariTanggal: tglVal,
            nama: String(r[3] || ''),
            npp: String(r[4] || ''),
            jabatan: jabatanVal,
            unitKerja: unitVal,
            seksi: seksiVal,
            atasanLangsung: atasanVal,
            direkturUmum: dirVal,
            rincian: parseJsonSafe(rincianVal),
            fotoUrl: String(fotoVal || ''),
            status: String(statusVal || 'Menunggu Verifikasi'),
            catatan: String(catatanVal || '')
          }
        };
      }
    }
    return { success: false, message: 'Laporan tidak ditemukan.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * 6. INISIALISASI STRUKTUR SPREADSHEET (JALANKAN 1 KALI)
 */
function inisialisasiSistem() {
  const ss = getSpreadsheetSafe();
  
  // Tab Laporan_Kegiatan
  let sheetLaporan = ss.getSheetByName('Laporan_Kegiatan');
  if (!sheetLaporan) {
    sheetLaporan = ss.insertSheet('Laporan_Kegiatan');
    const headers = [
      'ID Laporan', 'Timestamp', 'Hari / Tanggal', 'Nama Pegawai', 'NPP',
      'Jabatan', 'Unit Kerja', 'Seksi', 'Atasan Langsung', 'Direktur Umum',
      'Rincian Kegiatan (JSON)', 'Foto Time Mark URL', 'Status Approval', 'Catatan Atasan'
    ];
    sheetLaporan.appendRow(headers);
    const headerRange = sheetLaporan.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#165DFF').setFontColor('#FFFFFF').setFontWeight('bold');
    sheetLaporan.setFrozenRows(1);
  }
  
  // Tab Master_Organisasi
  let sheetOrg = ss.getSheetByName('Master_Organisasi');
  if (!sheetOrg) {
    sheetOrg = ss.insertSheet('Master_Organisasi');
    sheetOrg.appendRow(['Unit Kerja / Bagian', 'Seksi / Jabatan']);
    
    const masterData = [
      ['UMUM DAN KEPEGAWAIAN', 'KASIE. MANAJEMEN RISIKO'],
      ['UMUM DAN KEPEGAWAIAN', 'KASIE. PENDAYAGUNAAN PEGAWAI'],
      ['UMUM DAN KEPEGAWAIAN', 'KASIE. TATA USAHA DAN PDE'],
      ['UMUM DAN KEPEGAWAIAN', 'KASIE. KESELAMATAN DAN KESEHATAN KERJA'],
      ['SPI', 'KASIE. PENGAWASAN TEKNIK & OPERASIONAL'],
      ['SPI', 'KASIE. PENGAWASAN KEUANGAN & ASET'],
      ['SEKPER', 'KASIE. HUKUM'],
      ['SEKPER', 'KASIE. HUBUNGAN MASYARAKAT'],
      ['SEKPER', 'KASIE. HUBUNGAN LANGGANAN'],
      ['SEKPER', 'KASIE. PENELITIAN DAN PENGEMBANGAN'],
      ['SEKPER', 'KASIE. RUMAH TANGGA DAN KEPROTOKOLERAN'],
      ['PERLENGKAPAN', 'KASIE. ANALISA KEBUTUHAN DAN PENGADAAN'],
      ['PERLENGKAPAN', 'KASIE. INVENTARISASI ASSET'],
      ['PERLENGKAPAN', 'KASIE. PERGUDANGAN'],
      ['ANGGARAN DAN PERBENDAHARAAN', 'KASIE. ANGGARAN'],
      ['ANGGARAN DAN PERBENDAHARAAN', 'KASIE. PERBENDAHARAAN'],
      ['VERIFIKASI DAN AKUNTANSI', 'KASIE. VERIFIKASI'],
      ['VERIFIKASI DAN AKUNTANSI', 'KASIE. AKUNTANSI DAN PELAPORAN'],
      ['VERIFIKASI DAN AKUNTANSI', 'KASIE. PAJAK'],
      ['PERENCANAAN TEKNIK', 'KASIE. PERENCANAAN & PEMETAAN'],
      ['PERENCANAAN TEKNIK', 'KASIE. PENGAWASAN TEKNIK'],
      ['DISTRIBUSI DAN KEHILANGAN AIR', 'KASIE. KEBOCORAN AIR DAN PELAYANAN SOSIAL'],
      ['DISTRIBUSI DAN KEHILANGAN AIR', 'KASIE. PEMELIHARAAN'],
      ['PRODUKSI', 'KASIE. IPA I'],
      ['PRODUKSI', 'KASIE. IPA II'],
      ['PRODUKSI', 'KASIE. IPA III'],
      ['PRODUKSI', 'KASIE. IPA IV'],
      ['PRODUKSI', 'KASIE. IPA V'],
      ['PRODUKSI', 'KASIE. LABORATORIUM'],
      ['PRODUKSI', 'KASIE. AIR BAKU'],
      ['WILAYAH 1', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 1', 'KASIE. PELAYANAN PELANGGAN WP'],
      ['WILAYAH 1', 'KASIE. TEKNIK WP'],
      ['WILAYAH 1', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      ['WILAYAH 2', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 2', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 2', 'KASIE. TEKNIK WP'],
      ['WILAYAH 2', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      ['WILAYAH 3', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 3', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 3', 'KASIE. TEKNIK WP'],
      ['WILAYAH 3', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      ['WILAYAH 4', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 4', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 4', 'KASIE. TEKNIK WP'],
      ['WILAYAH 4', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      ['WILAYAH 5', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 5', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 5', 'KASIE. TEKNIK WP'],
      ['WILAYAH 5', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      ['WILAYAH 6', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 6', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 6', 'KASIE. TEKNIK WP'],
      ['WILAYAH 6', 'KASIE. BACA METER DAN PENAGIHAN WP']
    ];
    
    sheetOrg.getRange(2, 1, masterData.length, 2).setValues(masterData);
    sheetOrg.getRange(1, 1, 1, 2).setBackground('#0E4BD9').setFontColor('#FFFFFF').setFontWeight('bold');
    sheetOrg.setFrozenRows(1);
  }
  
  // Folder Drive
  getOrCreateFotoFolder();
  
  Logger.log('Inisialisasi selesai!');
}

/**
 * 7. FOLDER DRIVE FOTO (BERTINGKAT: Root -> Unit Kerja -> Nama Pegawai)
 */
function getOrCreateFotoFolder(unitKerja, nama, npp) {
  const rootFolderName = 'Foto_TimeMark_Laporan_Harian_PERUMDA';
  let rootFolder;
  const rootFolders = DriveApp.getFoldersByName(rootFolderName);
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(rootFolderName);
    rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }
  
  if (!unitKerja) return rootFolder;
  
  // 1. Folder Level 1: Unit Kerja / Bagian
  const cleanUnit = String(unitKerja).trim().replace(/[\\/:*?"<>|]/g, '_');
  let unitFolder;
  const unitFolders = rootFolder.getFoldersByName(cleanUnit);
  if (unitFolders.hasNext()) {
    unitFolder = unitFolders.next();
  } else {
    unitFolder = rootFolder.createFolder(cleanUnit);
    unitFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }
  
  if (!nama) return unitFolder;
  
  // 2. Folder Level 2: Nama Pegawai (NPP)
  const cleanNama = String(nama).trim().replace(/[\\/:*?"<>|]/g, '_');
  const cleanNpp = npp ? String(npp).trim().replace(/[^a-zA-Z0-9]/g, '') : '';
  const pegawaiFolderName = cleanNpp ? cleanNama + ' (' + cleanNpp + ')' : cleanNama;
  
  let pegawaiFolder;
  const pegawaiFolders = unitFolder.getFoldersByName(pegawaiFolderName);
  if (pegawaiFolders.hasNext()) {
    pegawaiFolder = pegawaiFolders.next();
  } else {
    pegawaiFolder = unitFolder.createFolder(pegawaiFolderName);
    pegawaiFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }
  
  return pegawaiFolder;
}

/**
 * 8. HELPER TAMBAH BARIS KE SHEET TAB UNIT KERJA / BAGIAN
 */
function appendRowToUnitSheet(ss, unitKerja, row) {
  if (!unitKerja) return;
  const sheetName = String(unitKerja).trim().substring(0, 95).replace(/[:\/?*\[\]]/g, '_');
  let sheet = ss.getSheetByName(sheetName);
  const headers = [
    'ID Laporan', 'Timestamp', 'Hari / Tanggal', 'Nama Pegawai', 'NPP',
    'Jabatan', 'Unit Kerja', 'Seksi', 'Atasan Langsung', 'Direktur Umum',
    'Rincian Kegiatan (JSON)', 'Foto Time Mark URL', 'Status Approval', 'Catatan Atasan'
  ];
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#165DFF').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  // Cek duplikasi baris berdasarkan ID Laporan (row[0])
  const idLaporan = row[0];
  if (sheet.getLastRow() > 1 && idLaporan) {
    const existingIds = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(r => r[0]);
    if (existingIds.indexOf(idLaporan) !== -1) {
      return; // Sudah tersimpan
    }
  }
  
  sheet.appendRow(row);
}

/**
 * 9. UTILITY MERAPIKAN DATA DARI MASTER KE SHEET PER BAGIAN
 * Jalankan fungsi ini dari Editor Apps Script jika ingin menyinkronkan data lama
 */
function organisirSistemRapi() {
  try {
    const ss = getSpreadsheetSafe();
    let sheetMaster = ss.getSheetByName('Laporan_Kegiatan');
    if (!sheetMaster || sheetMaster.getLastRow() <= 1) {
      Logger.log('Belum ada data di Laporan_Kegiatan untuk diorganisir.');
      return 'Belum ada data di Laporan_Kegiatan untuk diorganisir.';
    }
    
    const rows = sheetMaster.getRange(2, 1, sheetMaster.getLastRow() - 1, 13).getValues();
    let count = 0;
    
    rows.forEach(r => {
      const unitKerja = String(r[5]).trim();
      if (unitKerja) {
        appendRowToUnitSheet(ss, unitKerja, r);
        count++;
      }
    });
    
    Logger.log('Berhasil merapikan ' + count + ' baris data ke sheet tab per bagian.');
    return 'Berhasil merapikan ' + count + ' baris data ke sheet tab per bagian.';
  } catch (err) {
    Logger.log('Error organisirSistemRapi: ' + err.toString());
    return 'Gagal: ' + err.toString();
  }
}

// Helpers
function parseJsonSafe(str) {
  try { return JSON.parse(str); } catch (e) { return []; }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * OTOMATIS MEMPERBAIKI BANNER HEADER (14 KOLOM RESMI) & STRUKTUR BARIS TERGESER
 */
function perbaikiStrukturSemuaData() {
  try {
    const ss = getSpreadsheetSafe();
    const OFFICIAL_HEADERS = [
      'ID Laporan', 'Timestamp', 'Hari / Tanggal', 'Nama Pegawai', 'NPP',
      'Jabatan', 'Unit Kerja', 'Seksi', 'Atasan Langsung', 'Direktur Umum',
      'Rincian Kegiatan (JSON)', 'Foto Time Mark URL', 'Status Approval', 'Catatan Atasan'
    ];
    
    const sheets = ss.getSheets();
    sheets.forEach(sheet => {
      const name = sheet.getName();
      if (name === 'Master_Organisasi' || name === 'Master_Pegawai' || name === 'Master_Admin') return;
      
      if (sheet.getLastRow() < 1) return;
      
      // Update Header (Baris 1) ke 14 Kolom Resmi
      const hRange = sheet.getRange(1, 1, 1, OFFICIAL_HEADERS.length);
      hRange.setValues([OFFICIAL_HEADERS]);
      hRange.setBackground('#165DFF').setFontColor('#FFFFFF').setFontWeight('bold');
      sheet.setFrozenRows(1);
      
      // Perbaiki Baris Data (Baris 2 ke bawah) Jika Menggunakan Format 13 Kolom Lama
      if (sheet.getLastRow() > 1) {
        const lastCol = Math.max(14, sheet.getLastColumn());
        const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol);
        const values = range.getValues();
        let modified = false;
        
        for (let i = 0; i < values.length; i++) {
          const r = values[i];
          if (!r[0]) continue;
          
          const valF = String(r[5] || '').trim();
          const isUnitInColF = (
            valF.indexOf('UMUM') !== -1 || valF.indexOf('SPI') !== -1 || valF.indexOf('SEKPER') !== -1 ||
            valF.indexOf('PERLENGKAPAN') !== -1 || valF.indexOf('ANGGARAN') !== -1 || valF.indexOf('VERIFIKASI') !== -1 ||
            valF.indexOf('PERENCANAAN') !== -1 || valF.indexOf('DISTRIBUSI') !== -1 || valF.indexOf('PRODUKSI') !== -1 ||
            valF.indexOf('WILAYAH') !== -1
          );
          
          if (isUnitInColF) {
            // Sisipkan 'Staf / Pelaksana' pada Kolom F (index 5) agar bergeser rapi ke kanan
            r.splice(5, 0, 'Staf / Pelaksana');
            values[i] = r.slice(0, 14);
            modified = true;
          }
        }
        
        if (modified) {
          range.setValues(values);
        }
      }
    });
  } catch (err) {
    Logger.log('Error perbaikiStrukturSemuaData: ' + err.toString());
  }
}
