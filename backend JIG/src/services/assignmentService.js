// src/services/assignmentService.js
// ============================================================
// UPGRADE: assignSimple dengan validasi bentrok waktu
// ============================================================

const db = require('../config/database');
const { createError } = require('../middleware/errorHandler');

// ─────────────────────────────────────────────────────────────
// HELPER: Logika deteksi overlap waktu
// ─────────────────────────────────────────────────────────────
//
// Dua rentang waktu [A_mulai, A_selesai] dan [B_mulai, B_selesai]
// dikatakan BENTROK jika:
//
//   A_mulai < B_selesai  AND  A_selesai > B_mulai
//
// Contoh:
//   Booking baru:    08:00 ──────── 12:00
//   Booking lain:         09:00 ──────── 13:00   → BENTROK ✗
//   Booking lain:                   12:00 ──── ?  → AMAN ✓ (tepat setelah kita selesai)
//
// ─────────────────────────────────────────────────────────────

/**
 * Cari mobil yang TERSEDIA dan TIDAK BENTROK waktu dengan booking yang diberikan.
 *
 * @param {string} tanggal    Format: "YYYY-MM-DD"
 * @param {string} jamMulai   Format: "HH:MM:SS" (dari database)
 * @param {string} jamSelesai Format: "HH:MM:SS" (dari database)
 * @returns {Array} Daftar mobil yang bisa dipakai
 */
const cariMobilTersedia = async (tanggal, jamMulai, jamSelesai) => {
  const [rows] = await db.query(
    `
    SELECT c.id, c.nama_grup, c.plat_nomor, c.is_external
    FROM cars c
    WHERE
      -- Syarat 1: Status mobil harus available
      c.status = 'available'

      -- Syarat 2: Mobil ini TIDAK sedang dipakai di waktu yang bentrok
      AND c.id NOT IN (
        SELECT a.car_id
        FROM assignments a
        JOIN bookings b ON a.booking_id = b.id
        WHERE
          b.tanggal = ?                  -- tanggal yang sama
          AND b.status NOT IN ('cancel', 'selesai')  -- booking aktif saja
          AND b.jam_mulai  < ?           -- booking lain mulai SEBELUM kita selesai
          AND b.jam_selesai > ?          -- booking lain belum selesai SAAT kita mulai
      )
    ORDER BY c.is_external ASC, c.id ASC
    LIMIT 1
    `,
    [tanggal, jamSelesai, jamMulai]
  );

  return rows;
};

/**
 * Cari driver yang TERSEDIA dan TIDAK BENTROK waktu dengan booking yang diberikan.
 * Logika identik dengan cariMobilTersedia, tapi untuk tabel drivers.
 *
 * @param {string} tanggal
 * @param {string} jamMulai
 * @param {string} jamSelesai
 * @returns {Array} Daftar driver yang bisa bertugas
 */
const cariDriverTersedia = async (tanggal, jamMulai, jamSelesai) => {
  const [rows] = await db.query(
    `
    SELECT d.id AS driver_id, u.nama, u.email, d.no_hp
    FROM drivers d
    JOIN users u ON d.user_id = u.id
    WHERE
      -- Syarat 1: Driver harus available
      d.status = 'available'

      -- Syarat 2: Driver tidak sedang bertugas di waktu yang bentrok
      AND d.id NOT IN (
        SELECT a.driver_id
        FROM assignments a
        JOIN bookings b ON a.booking_id = b.id
        WHERE
          b.tanggal = ?
          AND b.status NOT IN ('cancel', 'selesai')
          AND b.jam_mulai  < ?    -- booking lain mulai sebelum kita selesai
          AND b.jam_selesai > ?   -- booking lain belum selesai saat kita mulai
      )
    ORDER BY d.id ASC
    LIMIT 1
    `,
    [tanggal, jamSelesai, jamMulai]
  );

  return rows;
};

// ─────────────────────────────────────────────────────────────
// MAIN FUNCTION: assignSimple (versi upgrade dengan anti-double-booking)
// ─────────────────────────────────────────────────────────────

/**
 * Assign mobil & driver secara otomatis ke booking.
 * Memilih mobil & driver yang tersedia DAN tidak bentrok waktu.
 *
 * Alur kerja:
 *   1. Ambil detail booking (tanggal, jam_mulai, jam_selesai)
 *   2. Cari mobil yang tidak bentrok → error jika tidak ada
 *   3. Cari driver yang tidak bentrok → error jika tidak ada
 *   4. Simpan ke tabel assignments
 *   5. Update status mobil & driver menjadi 'on_trip'
 *   6. Return data assignment lengkap
 *
 * @param {number} bookingId - ID booking yang akan di-assign
 * @returns {Object} Data assignment lengkap
 */
const assignSimple = async (bookingId) => {

  // ── LANGKAH 1: Ambil detail booking ──────────────────────────────────────────
  const [bookingRows] = await db.query(
    `SELECT id, nama_customer, tanggal, jam_mulai, jam_selesai, durasi_jam, status
     FROM bookings
     WHERE id = ?`,
    [bookingId]
  );

  if (bookingRows.length === 0) {
    throw createError(404, `Booking #${bookingId} tidak ditemukan.`);
  }

  const booking = bookingRows[0];

  // Booking cancel tidak boleh di-assign
  if (booking.status === 'cancel') {
    throw createError(400, `Booking #${bookingId} sudah di-cancel. Tidak bisa di-assign.`);
  }

  // Cegah double assignment pada booking yang sama
  const [existingAssignment] = await db.query(
    'SELECT id FROM assignments WHERE booking_id = ?',
    [bookingId]
  );
  if (existingAssignment.length > 0) {
    throw createError(
      409,
      `Booking #${bookingId} sudah punya assignment. Gunakan PUT /assign/${bookingId} untuk mengubah.`
    );
  }

  const { tanggal, jam_mulai, jam_selesai, nama_customer, durasi_jam } = booking;

  // ── LANGKAH 2: Cari mobil yang tersedia & tidak bentrok ──────────────────────
  const mobilTersedia = await cariMobilTersedia(tanggal, jam_mulai, jam_selesai);

  if (mobilTersedia.length === 0) {
    throw createError(
      400,
      `Tidak ada mobil tersedia untuk booking "${nama_customer}" ` +
      `tanggal ${tanggal} jam ${jam_mulai}–${jam_selesai} (${durasi_jam} jam). ` +
      `Semua mobil sedang dipakai atau maintenance di rentang waktu ini.`
    );
  }

  const mobilDipilih = mobilTersedia[0]; // Prioritas: internal dulu, lalu eksternal

  // ── LANGKAH 3: Cari driver yang tersedia & tidak bentrok ─────────────────────
  const driverTersedia = await cariDriverTersedia(tanggal, jam_mulai, jam_selesai);

  if (driverTersedia.length === 0) {
    throw createError(
      400,
      `Tidak ada driver tersedia untuk booking "${nama_customer}" ` +
      `tanggal ${tanggal} jam ${jam_mulai}–${jam_selesai} (${durasi_jam} jam). ` +
      `Semua driver sedang bertugas atau off di rentang waktu ini.`
    );
  }

  const driverDipilih = driverTersedia[0];

  // ── LANGKAH 4: Simpan ke tabel assignments ───────────────────────────────────
  await db.query(
    `INSERT INTO assignments (booking_id, car_id, driver_id, catatan)
     VALUES (?, ?, ?, ?)`,
    [bookingId, mobilDipilih.id, driverDipilih.driver_id, 'Auto-assigned oleh sistem']
  );

  // ── LANGKAH 5: Update status mobil & driver ──────────────────────────────────
  await db.query('UPDATE cars    SET status = "on_trip" WHERE id = ?', [mobilDipilih.id]);
  await db.query('UPDATE drivers SET status = "on_trip" WHERE id = ?', [driverDipilih.driver_id]);

  // ── LANGKAH 6: Return response lengkap ───────────────────────────────────────
  return {
    booking_id:    bookingId,
    nama_customer,
    tanggal,
    jam_mulai,
    jam_selesai,
    durasi_jam,
    mobil: {
      id:          mobilDipilih.id,
      nama_grup:   mobilDipilih.nama_grup,
      plat_nomor:  mobilDipilih.plat_nomor,
      is_external: mobilDipilih.is_external,
    },
    driver: {
      id:    driverDipilih.driver_id,
      nama:  driverDipilih.nama,
      no_hp: driverDipilih.no_hp,
    },
    assigned_at: new Date().toISOString(),
  };
};

// ─────────────────────────────────────────────────────────────
// BONUS: assignManual — admin pilih sendiri mobil & driver
// Validasi bentrok tetap berjalan, tapi spesifik per entitas
// ─────────────────────────────────────────────────────────────

/**
 * Assign manual: admin memilih sendiri car_id dan driver_id.
 * Validasi bentrok tetap berjalan — tetapi hanya dicek untuk
 * mobil/driver yang dipilih, bukan semua yang available.
 *
 * @param {number} bookingId
 * @param {number} carId
 * @param {number} driverId
 * @returns {Object}
 */
const assignManual = async (bookingId, carId, driverId) => {
  const [bookingRows] = await db.query(
    'SELECT id, nama_customer, tanggal, jam_mulai, jam_selesai, durasi_jam, status FROM bookings WHERE id = ?',
    [bookingId]
  );
  if (bookingRows.length === 0) throw createError(404, `Booking #${bookingId} tidak ditemukan.`);

  const booking = bookingRows[0];
  if (booking.status === 'cancel') throw createError(400, 'Booking sudah cancel.');

  const { tanggal, jam_mulai, jam_selesai } = booking;

  // Cek bentrok untuk mobil yang dipilih
  const [cekMobil] = await db.query(
    `SELECT b.id, b.jam_mulai, b.jam_selesai
     FROM assignments a
     JOIN bookings b ON a.booking_id = b.id
     WHERE a.car_id = ?
       AND a.booking_id != ?
       AND b.tanggal = ?
       AND b.status NOT IN ('cancel', 'selesai')
       AND b.jam_mulai  < ?
       AND b.jam_selesai > ?`,
    [carId, bookingId, tanggal, jam_selesai, jam_mulai]
  );

  if (cekMobil.length > 0) {
    const k = cekMobil[0];
    throw createError(
      409,
      `Mobil sudah dipakai di booking #${k.id} jam ${k.jam_mulai}–${k.jam_selesai}. ` +
      `Waktu ini bertabrakan dengan booking #${bookingId}.`
    );
  }

  // Cek bentrok untuk driver yang dipilih
  const [cekDriver] = await db.query(
    `SELECT b.id, b.jam_mulai, b.jam_selesai
     FROM assignments a
     JOIN bookings b ON a.booking_id = b.id
     WHERE a.driver_id = ?
       AND a.booking_id != ?
       AND b.tanggal = ?
       AND b.status NOT IN ('cancel', 'selesai')
       AND b.jam_mulai  < ?
       AND b.jam_selesai > ?`,
    [driverId, bookingId, tanggal, jam_selesai, jam_mulai]
  );

  if (cekDriver.length > 0) {
    const k = cekDriver[0];
    throw createError(
      409,
      `Driver sudah bertugas di booking #${k.id} jam ${k.jam_mulai}–${k.jam_selesai}. ` +
      `Waktu ini bertabrakan dengan booking #${bookingId}.`
    );
  }

  // Simpan / update assignment
  const [existing] = await db.query('SELECT id FROM assignments WHERE booking_id = ?', [bookingId]);

  if (existing.length > 0) {
    await db.query(
      'UPDATE assignments SET car_id = ?, driver_id = ? WHERE booking_id = ?',
      [carId, driverId, bookingId]
    );
  } else {
    await db.query(
      'INSERT INTO assignments (booking_id, car_id, driver_id) VALUES (?, ?, ?)',
      [bookingId, carId, driverId]
    );
  }

  await db.query('UPDATE cars    SET status = "on_trip" WHERE id = ?', [carId]);
  await db.query('UPDATE drivers SET status = "on_trip" WHERE id = ?', [driverId]);

  // Ambil data lengkap
  const [result] = await db.query(
    `SELECT a.booking_id, b.nama_customer, b.tanggal, b.jam_mulai, b.jam_selesai, b.durasi_jam,
            c.id AS car_id, c.nama_grup, c.plat_nomor, c.is_external,
            d.id AS driver_id, u.nama AS nama_driver, d.no_hp
     FROM assignments a
     JOIN bookings b ON a.booking_id = b.id
     JOIN cars     c ON a.car_id = c.id
     JOIN drivers  d ON a.driver_id = d.id
     JOIN users    u ON d.user_id = u.id
     WHERE a.booking_id = ?`,
    [bookingId]
  );

  return result[0];
};

// ─────────────────────────────────────────────────────────────
// completeTrip — selesaikan perjalanan & kembalikan status
// ─────────────────────────────────────────────────────────────

/**
 * Menyelesaikan trip yang sedang berjalan.
 *
 * Yang dilakukan:
 *   1. Cek assignment ada → 404 jika tidak
 *   2. Cek booking statusnya "ongoing" → 400 jika sudah selesai/cancel
 *   3. Update bookings.status  → "selesai"
 *   4. Update cars.status      → "available"  (mobil kembali bisa dipakai)
 *   5. Update drivers.status   → "available"  (driver kembali bisa bertugas)
 *
 * Flow status lengkap:
 *   pending → dp_paid → ongoing → [completeTrip] → selesai
 *                                                    ↓
 *                                       mobil & driver → available
 *
 * @param {number} bookingId
 * @returns {{ message, booking_id, car_id, driver_id, nama_customer, tanggal }}
 */
const completeTrip = async (bookingId) => {

  // ── 1. Ambil assignment & booking sekaligus (1 query, lebih efisien) ─────────
  const [rows] = await db.query(
    `SELECT
       a.booking_id,
       a.car_id,
       a.driver_id,
       b.nama_customer,
       b.tanggal,
       b.jam_mulai,
       b.jam_selesai,
       b.status AS booking_status
     FROM assignments a
     JOIN bookings b ON a.booking_id = b.id
     WHERE a.booking_id = ?`,
    [bookingId]
  );

  // ── 2. Validasi: assignment harus ada ────────────────────────────────────────
  if (rows.length === 0) {
    throw createError(
      404,
      `Booking #${bookingId} tidak ditemukan atau belum memiliki assignment.`
    );
  }

  const { car_id, driver_id, nama_customer, tanggal,
          jam_mulai, jam_selesai, booking_status } = rows[0];

  // ── 3. Validasi: booking tidak boleh sudah selesai atau di-cancel ─────────────
  if (booking_status === 'selesai') {
    throw createError(400, `Booking #${bookingId} sudah selesai sebelumnya.`);
  }
  if (booking_status === 'cancel') {
    throw createError(400, `Booking #${bookingId} sudah di-cancel. Tidak bisa diselesaikan.`);
  }

  // ── 4. Update ketiga tabel sekaligus (paralel, lebih cepat) ──────────────────
  await Promise.all([
    db.query(
      `UPDATE bookings SET status = 'selesai' WHERE id = ?`,
      [bookingId]
    ),
    db.query(
      `UPDATE cars SET status = 'available' WHERE id = ?`,
      [car_id]
    ),
    db.query(
      `UPDATE drivers SET status = 'available' WHERE id = ?`,
      [driver_id]
    ),
    
  ]);

  // ── 5. Return ringkasan hasil ─────────────────────────────────────────────────
  return {
    message:       'Trip berhasil diselesaikan.',
    booking_id:    bookingId,
    car_id,
    driver_id,
    nama_customer,
    tanggal,
    jam_mulai,
    jam_selesai,
    status_baru:   'selesai',
    completed_at:  new Date().toISOString(),
  };
  // =========================
// AUTO KEUANGAN
// =========================

// mapping harga berdasarkan paket (simple version)
const hargaMap = {
  short: 800000,
  medium: 1500000,
  long: 2000000
};

// ambil data booking
const [bookingRows] = await db.query(
  'SELECT paket FROM bookings WHERE id = ?',
  [bookingId]
);

const paket = bookingRows[0].paket;
const harga_deal = hargaMap[paket] || 1000000;

// fee driver (contoh tetap dulu)
const fee_driver = 300000;

await db.query(`
  INSERT INTO finances 
  (booking_id, harga_deal, dp, fee_driver, biaya_tambahan, biaya_external)
  VALUES (?, ?, ?, ?, ?, ?)
`, [
  bookingId,
  harga_deal,
  0,
  fee_driver,
  0,
  0
]);

};

module.exports = { assignSimple, assignManual, completeTrip };