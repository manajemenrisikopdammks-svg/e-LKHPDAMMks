/**
 * =========================================================================
 * SISTEM LAPORAN KEGIATAN HARIAN PEGAWAI PERUMDA AIR MINUM KOTA MAKASSAR
 * File: Setup.gs
 * Fungsi: Inisialisasi Database Sheet, Master Data Unit/Seksi, & Folder Drive
 * =========================================================================
 */

/**
 * Jalankan fungsi ini SATU KALI dari Apps Script Editor untuk membuat:
 * 1. Sheet 'Laporan_Kegiatan' (Database utama pengisian laporan harian)
 * 2. Sheet 'Master_Organisasi' (Pemetaan Unit Kerja & Seksi/Jabatan)
 * 3. Sheet 'Master_Pegawai' (Data referensi pegawai)
 * 4. Folder khusus di Google Drive untuk menyimpan Foto Time Mark
 */
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

function inisialisasiSistem() {
  const ss = getSpreadsheetSafe();
  
  // 1. Buat / Ambil Sheet 'Laporan_Kegiatan'
  let sheetLaporan = ss.getSheetByName('Laporan_Kegiatan');
  const OFFICIAL_HEADERS = [
    'ID Laporan',
    'Timestamp',
    'Hari / Tanggal',
    'Nama Pegawai',
    'NPP',
    'Jabatan',
    'Unit Kerja',
    'Seksi',
    'Atasan Langsung',
    'Direktur Umum',
    'Rincian Kegiatan (JSON)',
    'Foto Time Mark URL',
    'Status Approval',
    'Catatan Atasan'
  ];

  if (!sheetLaporan) {
    sheetLaporan = ss.insertSheet('Laporan_Kegiatan');
  }
  
  // Format & Perbaiki Header jika belum 14 kolom
  const headerRange = sheetLaporan.getRange(1, 1, 1, OFFICIAL_HEADERS.length);
  headerRange.setValues([OFFICIAL_HEADERS]);
  headerRange.setBackground('#165DFF');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  sheetLaporan.setFrozenRows(1);

  // Perbaiki otomatis struktur data jika ada yang tergeser
  perbaikiStrukturSemuaData();
  
  // 2. Buat / Ambil Sheet 'Master_Organisasi'
  let sheetOrg = ss.getSheetByName('Master_Organisasi');
  if (!sheetOrg) {
    sheetOrg = ss.insertSheet('Master_Organisasi');
    const headersOrg = ['Unit Kerja / Bagian', 'Seksi / Jabatan'];
    sheetOrg.appendRow(headersOrg);
    
    const masterData = [
      // UMUM DAN KEPEGAWAIAN
      ['UMUM DAN KEPEGAWAIAN', 'KASIE. MANAJEMEN RISIKO'],
      ['UMUM DAN KEPEGAWAIAN', 'KASIE. PENDAYAGUNAAN PEGAWAI'],
      ['UMUM DAN KEPEGAWAIAN', 'KASIE. TATA USAHA DAN PDE'],
      ['UMUM DAN KEPEGAWAIAN', 'KASIE. KESELAMATAN DAN KESEHATAN KERJA'],
      
      // SPI
      ['SPI', 'KASIE. PENGAWASAN TEKNIK & OPERASIONAL'],
      ['SPI', 'KASIE. PENGAWASAN KEUANGAN & ASET'],
      
      // SEKPER
      ['SEKPER', 'KASIE. HUKUM'],
      ['SEKPER', 'KASIE. HUBUNGAN MASYARAKAT'],
      ['SEKPER', 'KASIE. HUBUNGAN LANGGANAN'],
      ['SEKPER', 'KASIE. PENELITIAN DAN PENGEMBANGAN'],
      ['SEKPER', 'KASIE. RUMAH TANGGA DAN KEPROTOKOLERAN'],
      
      // PERLENGKAPAN
      ['PERLENGKAPAN', 'KASIE. ANALISA KEBUTUHAN DAN PENGADAAN'],
      ['PERLENGKAPAN', 'KASIE. INVENTARISASI ASSET'],
      ['PERLENGKAPAN', 'KASIE. PERGUDANGAN'],
      
      // ANGGARAN DAN PERBENDAHARAAN
      ['ANGGARAN DAN PERBENDAHARAAN', 'KASIE. ANGGARAN'],
      ['ANGGARAN DAN PERBENDAHARAAN', 'KASIE. PERBENDAHARAAN'],
      
      // VERIFIKASI DAN AKUNTANSI
      ['VERIFIKASI DAN AKUNTANSI', 'KASIE. VERIFIKASI'],
      ['VERIFIKASI DAN AKUNTANSI', 'KASIE. AKUNTANSI DAN PELAPORAN'],
      ['VERIFIKASI DAN AKUNTANSI', 'KASIE. PAJAK'],
      
      // PERENCANAAN TEKNIK
      ['PERENCANAAN TEKNIK', 'KASIE. PERENCANAAN & PEMETAAN'],
      ['PERENCANAAN TEKNIK', 'KASIE. PENGAWASAN TEKNIK'],
      
      // DISTRIBUSI DAN KEHILANGAN AIR
      ['DISTRIBUSI DAN KEHILANGAN AIR', 'KASIE. KEBOCORAN AIR DAN PELAYANAN SOSIAL'],
      ['DISTRIBUSI DAN KEHILANGAN AIR', 'KASIE. PEMELIHARAAN'],
      
      // PRODUKSI
      ['PRODUKSI', 'KASIE. IPA I'],
      ['PRODUKSI', 'KASIE. IPA II'],
      ['PRODUKSI', 'KASIE. IPA III'],
      ['PRODUKSI', 'KASIE. IPA IV'],
      ['PRODUKSI', 'KASIE. IPA V'],
      ['PRODUKSI', 'KASIE. LABORATORIUM'],
      ['PRODUKSI', 'KASIE. AIR BAKU'],
      
      // WILAYAH 1
      ['WILAYAH 1', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 1', 'KASIE. PELAYANAN PELANGGAN WP'],
      ['WILAYAH 1', 'KASIE. TEKNIK WP'],
      ['WILAYAH 1', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      
      // WILAYAH 2
      ['WILAYAH 2', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 2', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 2', 'KASIE. TEKNIK WP'],
      ['WILAYAH 2', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      
      // WILAYAH 3
      ['WILAYAH 3', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 3', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 3', 'KASIE. TEKNIK WP'],
      ['WILAYAH 3', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      
      // WILAYAH 4
      ['WILAYAH 4', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 4', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 4', 'KASIE. TEKNIK WP'],
      ['WILAYAH 4', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      
      // WILAYAH 5
      ['WILAYAH 5', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 5', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 5', 'KASIE. TEKNIK WP'],
      ['WILAYAH 5', 'KASIE. BACA METER DAN PENAGIHAN WP'],
      
      // WILAYAH 6
      ['WILAYAH 6', 'SEKRETARIS WILAYAH PELAYANAN'],
      ['WILAYAH 6', 'KASIE. PELAYANAN PELANGGAN'],
      ['WILAYAH 6', 'KASIE. TEKNIK WP'],
      ['WILAYAH 6', 'KASIE. BACA METER DAN PENAGIHAN WP']
    ];
    
    sheetOrg.getRange(2, 1, masterData.length, 2).setValues(masterData);
    
    const orgHeader = sheetOrg.getRange(1, 1, 1, 2);
    orgHeader.setBackground('#0E4BD9');
    orgHeader.setFontColor('#FFFFFF');
    orgHeader.setFontWeight('bold');
    sheetOrg.setFrozenRows(1);
  }
  
  // 3. Buat / Ambil Sheet 'Master_Pegawai' (Referensi)
  let sheetPegawai = ss.getSheetByName('Master_Pegawai');
  if (!sheetPegawai) {
    sheetPegawai = ss.insertSheet('Master_Pegawai');
    const headersPeg = ['NPP', 'Nama Pegawai', 'Unit Kerja', 'Jabatan'];
    sheetPegawai.appendRow(headersPeg);
    
    const contohPegawai = [
      ['100124', 'Ahmad Rusdi, S.T.', 'SEKPER', 'KASIE. PENELITIAN DAN PENGEMBANGAN'],
      ['100125', 'Nurhasanah, S.Sos.', 'SEKPER', 'KASIE. HUBUNGAN MASYARAKAT'],
      ['100126', 'Ir. Bambang Wijaya', 'PRODUKSI', 'KASIE. IPA I'],
      ['100127', 'Faisal Karim, S.E.', 'UMUM DAN KEPEGAWAIAN', 'KASIE. TATA USAHA DAN PDE']
    ];
    sheetPegawai.getRange(2, 1, contohPegawai.length, 4).setValues(contohPegawai);
    
    const pegHeader = sheetPegawai.getRange(1, 1, 1, 4);
    pegHeader.setBackground('#30B22D');
    pegHeader.setFontColor('#FFFFFF');
    pegHeader.setFontWeight('bold');
    sheetPegawai.setFrozenRows(1);
  }
  
  // 4. Buat / Ambil Sheet 'Master_Admin' (Pengaturan PIN Admin)
  let sheetAdmin = ss.getSheetByName('Master_Admin');
  if (!sheetAdmin) {
    sheetAdmin = ss.insertSheet('Master_Admin');
    const headersAdmin = ['Kunci Pengaturan', 'Nilai', 'Keterangan', 'Terakhir Diubah'];
    sheetAdmin.appendRow(headersAdmin);
    
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'dd/MM/yyyy HH:mm:ss');
    const adminData = [
      ['PIN_ADMIN', '123456', 'PIN Rahasia untuk Akses Dashboard & Riwayat Laporan', nowStr]
    ];
    sheetAdmin.getRange(2, 1, adminData.length, 4).setValues(adminData);
    
    const adminHeader = sheetAdmin.getRange(1, 1, 1, 4);
    adminHeader.setBackground('#8B5CF6');
    adminHeader.setFontColor('#FFFFFF');
    adminHeader.setFontWeight('bold');
    sheetAdmin.setFrozenRows(1);
  }
  
  // 5. Inisialisasi Sheet Tab Khusus Per-Bagian / Unit Kerja
  const units = [
    'UMUM DAN KEPEGAWAIAN', 'SPI', 'SEKPER', 'PERLENGKAPAN',
    'ANGGARAN DAN PERBENDAHARAAN', 'VERIFIKASI DAN AKUNTANSI',
    'PERENCANAAN TEKNIK', 'DISTRIBUSI DAN KEHILANGAN AIR',
    'PRODUKSI', 'WILAYAH 1', 'WILAYAH 2', 'WILAYAH 3',
    'WILAYAH 4', 'WILAYAH 5', 'WILAYAH 6'
  ];
  
  const headersUnit = [
    'ID Laporan', 'Timestamp', 'Hari / Tanggal', 'Nama Pegawai', 'NPP',
    'Unit Kerja', 'Seksi / Jabatan', 'Atasan Langsung', 'Direktur Umum',
    'Rincian Kegiatan (JSON)', 'Foto Time Mark URL', 'Status Approval', 'Catatan Atasan'
  ];
  
  units.forEach(unitName => {
    let uSheet = ss.getSheetByName(unitName);
    if (!uSheet) {
      uSheet = ss.insertSheet(unitName);
      uSheet.appendRow(headersUnit);
      const uHeaderRange = uSheet.getRange(1, 1, 1, headersUnit.length);
      uHeaderRange.setBackground('#165DFF').setFontColor('#FFFFFF').setFontWeight('bold');
      uSheet.setFrozenRows(1);
    }
  });
  
  // 5. Buat Folder Utama & Folder Unit Kerja di Google Drive
  const rootFolder = getOrCreateFotoFolder();
  units.forEach(unitName => {
    getOrCreateFotoFolder(unitName);
  });
  
  Logger.log('Inisialisasi Sistem Berhasil Selesai!');
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    try {
      SpreadsheetApp.getUi().alert('Inisialisasi Sistem Berhasil Selesai! Sheet tab per-bagian dan folder Google Drive telah siap digunakan.');
    } catch (e) {}
  }
}

/**
 * Mencari atau membuat folder penyimpanan foto Time Mark di Drive (Bertingkat: Root -> Unit -> Pegawai)
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
