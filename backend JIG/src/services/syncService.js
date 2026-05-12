// src/services/syncService.js
// Sinkronisasi booking dari Google Forms (Google Sheets) ke MySQL

const db = require('../config/database');
const { getGoogleSheetsClient } = require('../config/googleSheets');

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID || '1wo0zPphVuCsbTZatpMHHDv4fUf-z8fkjMX6solGP0xw';
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "'Form Responses 1'!A1:H";

const PAKET_DURASI = { short: 2, medium: 4, long: 6 };

const normalizeHeader = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizePaket = (value) => {
  const paket = String(value || '').toLowerCase().trim();
  if (paket.includes('short')) return 'short';
  if (paket.includes('medium')) return 'medium';
  if (paket.includes('long')) return 'long';
  return paket;
};

const parseTanggal = (value) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
};

const parseJam = (value) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const hitungJamSelesai = (jamMulai, durasi) => {
  const [h, m] = jamMulai.split(':').map(Number);
  const totalMenit = h * 60 + m + durasi * 60;
  const hh = String(Math.floor(totalMenit / 60) % 24).padStart(2, '0');
  const mm = String(totalMenit % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

const toRowObject = (headers, row) =>
  headers.reduce((acc, header, index) => {
    acc[normalizeHeader(header)] = row[index] || '';
    return acc;
  }, {});

const mapSheetRowToBooking = (rowObject, rowNumber) => {
  const namaCustomer = rowObject['nama customer'];
  const noHpCustomer = rowObject['nomor hp'];
  const paket = normalizePaket(rowObject['paket wisata']);
  const tanggal = parseTanggal(rowObject['tanggal trip']);
  const jamMulai = parseJam(rowObject['jam mulai']);
  const jumlahOrang = parseInt(rowObject['jumlah orang'], 10) || 1;
  const catatanTambahan = rowObject['catatan tambahan'] || null;
  const durasi = PAKET_DURASI[paket];

  if (!namaCustomer || !paket || !tanggal || !jamMulai || !durasi) {
    return {
      error: 'Data wajib tidak lengkap atau paket/tanggal/jam tidak valid',
      raw: rowObject,
    };
  }

  return {
    data: {
      nama_customer: namaCustomer.trim(),
      no_hp_customer: noHpCustomer ? noHpCustomer.trim() : null,
      paket,
      tanggal,
      jam_mulai: jamMulai,
      jam_selesai: hitungJamSelesai(jamMulai, durasi),
      durasi_jam: durasi,
      jumlah_orang: jumlahOrang,
      catatan: catatanTambahan,
      status: 'pending',
      source: 'google_sheets',
      sheets_row_id: String(rowNumber),
    },
  };
};

const findDuplicateBooking = async (booking) => {
  const [rows] = await db.query(
    `SELECT id, sheets_row_id FROM bookings
     WHERE source = 'google_sheets'
       AND (
         sheets_row_id = ?
         OR (
           nama_customer = ?
           AND COALESCE(no_hp_customer, '') = COALESCE(?, '')
           AND tanggal = ?
           AND jam_mulai = ?
         )
       )
     LIMIT 1`,
    [
      booking.sheets_row_id,
      booking.nama_customer,
      booking.no_hp_customer,
      booking.tanggal,
      booking.jam_mulai,
    ]
  );

  return rows[0] || null;
};

const insertBooking = async (booking) => {
  const [result] = await db.query(
    `INSERT INTO bookings
      (nama_customer, no_hp_customer, paket, tanggal, jam_mulai, jam_selesai,
       durasi_jam, jumlah_orang, catatan, status, source, sheets_row_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      booking.nama_customer,
      booking.no_hp_customer,
      booking.paket,
      booking.tanggal,
      booking.jam_mulai,
      booking.jam_selesai,
      booking.durasi_jam,
      booking.jumlah_orang,
      booking.catatan,
      booking.status,
      booking.source,
      booking.sheets_row_id,
    ]
  );

  return result.insertId;
};

const syncBookingsFromSheets = async () => {
  console.log(`[sync-bookings] Mulai sync range ${SHEET_RANGE}`);

  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_RANGE,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) {
    console.log('[sync-bookings] Spreadsheet kosong atau hanya header.');
    return { count: 0, inserted: 0, skipped: 0, invalid: 0, updated: 0, data: [] };
  }

  const [headers, ...dataRows] = rows;
  const insertedBookings = [];
  let skipped = 0;
  let invalid = 0;
  let updated = 0;

  for (const [index, row] of dataRows.entries()) {
    const rowNumber = index + 2;
    const mapped = mapSheetRowToBooking(toRowObject(headers, row), rowNumber);

    if (mapped.error) {
      invalid += 1;
      console.warn(`[sync-bookings] Skip row ${rowNumber}: ${mapped.error}`);
      continue;
    }

    const booking = mapped.data;
    const duplicate = await findDuplicateBooking(booking);
    if (duplicate) {
      if (!duplicate.sheets_row_id) {
        await db.query('UPDATE bookings SET sheets_row_id = ? WHERE id = ?', [
          booking.sheets_row_id,
          duplicate.id,
        ]);
        updated += 1;
      }
      skipped += 1;
      console.log(`[sync-bookings] Duplicate row ${rowNumber}: ${booking.nama_customer}`);
      continue;
    }

    const id = await insertBooking(booking);
    insertedBookings.push({ id, ...booking });
    console.log(`[sync-bookings] Inserted booking #${id}: ${booking.nama_customer}`);
  }

  return {
    count: insertedBookings.length,
    inserted: insertedBookings.length,
    skipped,
    invalid,
    updated,
    data: insertedBookings,
  };
};

module.exports = { syncBookingsFromSheets };
