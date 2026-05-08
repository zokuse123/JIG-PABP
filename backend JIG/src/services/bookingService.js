// src/services/bookingService.js
// Logika bisnis CRUD booking

const db = require('../config/database');
const { createError } = require('../middleware/errorHandler');

const PAKET_DURASI = { short: 2, medium: 4, long: 6 };

const hitungJamSelesai = (jamMulai, durasi) => {
  const [h, m] = jamMulai.split(':').map(Number);
  const totalMenit = h * 60 + m + durasi * 60;
  const hh = String(Math.floor(totalMenit / 60) % 24).padStart(2, '0');
  const mm = String(totalMenit % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

/** Ambil semua booking dengan filter opsional */
const getAllBookings = async (query = {}) => {
  const { status, tanggal, page = 1, limit = 20 } = query;
  let where = 'WHERE 1=1';
  const params = [];

  if (status)  { where += ' AND b.status = ?';  params.push(status); }
  if (tanggal) { where += ' AND b.tanggal = ?'; params.push(tanggal); }

  const offset = (page - 1) * limit;

  const [rows] = await db.query(
    `SELECT b.*,
            a.car_id, a.driver_id,
            c.nama_grup AS nama_mobil,
            u.nama     AS nama_driver
     FROM bookings b
     LEFT JOIN assignments a ON b.id = a.booking_id
     LEFT JOIN cars         c ON a.car_id = c.id
     LEFT JOIN drivers      d ON a.driver_id = d.id
     LEFT JOIN users        u ON d.user_id = u.id
     ${where}
     ORDER BY b.tanggal DESC, b.jam_mulai ASC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM bookings b ${where}`,
    params
  );

  return {
    data: rows,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
  };
};

/** Ambil satu booking by ID */
const getBookingById = async (id) => {
  const [rows] = await db.query(
    `SELECT b.*,
            a.car_id, a.driver_id, a.catatan AS catatan_assignment,
            c.nama_grup AS nama_mobil, c.plat_nomor, c.is_external,
            u.nama      AS nama_driver,
            f.harga_deal, f.dp, f.sisa, f.fee_driver,
            f.biaya_tambahan, f.biaya_external, f.profit
     FROM bookings b
     LEFT JOIN assignments a ON b.id = a.booking_id
     LEFT JOIN cars         c ON a.car_id = c.id
     LEFT JOIN drivers      d ON a.driver_id = d.id
     LEFT JOIN users        u ON d.user_id = u.id
     LEFT JOIN finances     f ON b.id = f.booking_id
     WHERE b.id = ?`,
    [id]
  );

  if (rows.length === 0) throw createError(404, `Booking ID ${id} tidak ditemukan.`);
  return rows[0];
};

/** Buat booking baru (manual) */
const createBooking = async (data) => {
  const { nama_customer, no_hp_customer, paket, tanggal, jam_mulai, jumlah_orang, catatan } = data;

  const durasi     = PAKET_DURASI[paket];
  const jam_selesai = hitungJamSelesai(jam_mulai, durasi);

  const [result] = await db.query(
    `INSERT INTO bookings
      (nama_customer, no_hp_customer, paket, tanggal, jam_mulai, jam_selesai,
       durasi_jam, jumlah_orang, catatan, status, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'manual')`,
    [nama_customer, no_hp_customer || null, paket, tanggal, jam_mulai, jam_selesai,
     durasi, jumlah_orang || 1, catatan || null]
  );

  return getBookingById(result.insertId);
};

/** Update data booking */
const updateBooking = async (id, data) => {
  const booking = await getBookingById(id);

  const paket       = data.paket || booking.paket;
  const jam_mulai   = data.jam_mulai || booking.jam_mulai;
  const durasi      = PAKET_DURASI[paket];
  const jam_selesai = hitungJamSelesai(jam_mulai, durasi);

  await db.query(
    `UPDATE bookings SET
       nama_customer   = ?, no_hp_customer = ?, paket       = ?,
       tanggal         = ?, jam_mulai      = ?, jam_selesai = ?,
       durasi_jam      = ?, jumlah_orang   = ?, catatan     = ?,
       status          = ?
     WHERE id = ?`,
    [
      data.nama_customer   || booking.nama_customer,
      data.no_hp_customer  || booking.no_hp_customer,
      paket,
      data.tanggal         || booking.tanggal,
      jam_mulai, jam_selesai, durasi,
      data.jumlah_orang    || booking.jumlah_orang,
      data.catatan         !== undefined ? data.catatan : booking.catatan,
      data.status          || booking.status,
      id,
    ]
  );

  return getBookingById(id);
};

/** Ubah status booking saja */
const updateStatus = async (id, status) => {
  const validStatus = ['pending', 'dp_paid', 'ongoing', 'selesai', 'cancel', 'menunggu'];
  if (!validStatus.includes(status)) {
    throw createError(400, `Status tidak valid. Pilihan: ${validStatus.join(', ')}`);
  }

  await getBookingById(id); // pastikan ada
  await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
  return getBookingById(id);
};

/** Hapus booking */
const deleteBooking = async (id) => {
  await getBookingById(id); // pastikan ada
  await db.query('DELETE FROM bookings WHERE id = ?', [id]);
  return { message: `Booking ID ${id} berhasil dihapus.` };
};

module.exports = { 
  getAllBookings, 
  getBookingById, 
  createBooking, 
  updateBooking, 
  updateStatus, 
  deleteBooking,
};