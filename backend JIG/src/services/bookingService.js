// src/services/bookingService.js
// Logika bisnis CRUD booking

const db = require('../config/database');
const { createError } = require('../middleware/errorHandler');

const PAKET_DURASI = { short: 2, medium: 4, long: 6 };
const VALID_STATUS = ['pending', 'dp_paid', 'ongoing', 'selesai', 'cancel', 'menunggu'];

const normalizeTime = (value) => String(value || '').slice(0, 5);

const hitungJamSelesai = (jamMulai, durasi) => {
  const [h, m] = normalizeTime(jamMulai).split(':').map(Number);
  const totalMenit = h * 60 + m + durasi * 60;
  const hh = String(Math.floor(totalMenit / 60) % 24).padStart(2, '0');
  const mm = String(totalMenit % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

const assertBookingTime = (paket, jamMulai) => {
  if (!PAKET_DURASI[paket]) {
    throw createError(400, 'Paket tidak valid. Pilihan: short, medium, long');
  }
  if (!/^\d{2}:\d{2}$/.test(normalizeTime(jamMulai))) {
    throw createError(400, 'Jam mulai wajib diisi dengan format HH:MM.');
  }
};

const normalizeStatus = (status, fallback = 'pending') => {
  const nextStatus = status || fallback;
  if (!VALID_STATUS.includes(nextStatus)) {
    throw createError(400, `Status tidak valid. Pilihan: ${VALID_STATUS.join(', ')}`);
  }
  return nextStatus;
};

const upsertFinance = async (bookingId, data = {}) => {
  const financeFields = ['harga_deal', 'dp', 'fee_driver', 'biaya_tambahan', 'biaya_external'];
  const hasFinanceData = financeFields.some((field) => data[field] !== undefined);
  if (!hasFinanceData) return;

  const values = {
    harga_deal: data.harga_deal !== undefined ? Number(data.harga_deal) || 0 : null,
    dp: data.dp !== undefined ? Number(data.dp) || 0 : null,
    fee_driver: data.fee_driver !== undefined ? Number(data.fee_driver) || 0 : null,
    biaya_tambahan: data.biaya_tambahan !== undefined ? Number(data.biaya_tambahan) || 0 : null,
    biaya_external: data.biaya_external !== undefined ? Number(data.biaya_external) || 0 : null,
  };

  const [existing] = await db.query('SELECT id FROM finances WHERE booking_id = ? LIMIT 1', [bookingId]);
  if (existing.length > 0) {
    await db.query(
      `UPDATE finances SET
         harga_deal = COALESCE(?, harga_deal),
         dp = COALESCE(?, dp),
         fee_driver = COALESCE(?, fee_driver),
         biaya_tambahan = COALESCE(?, biaya_tambahan),
         biaya_external = COALESCE(?, biaya_external)
       WHERE booking_id = ?`,
      [values.harga_deal, values.dp, values.fee_driver, values.biaya_tambahan, values.biaya_external, bookingId]
    );
    return;
  }

  await db.query(
    `INSERT INTO finances
      (booking_id, harga_deal, dp, fee_driver, biaya_tambahan, biaya_external)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      bookingId,
      values.harga_deal || 0,
      values.dp || 0,
      values.fee_driver || 0,
      values.biaya_tambahan || 0,
      values.biaya_external || 0,
    ]
  );
};

const syncAssignedResourceStatus = async (bookingId, status) => {
  const [rows] = await db.query(
    'SELECT car_id, driver_id FROM assignments WHERE booking_id = ? LIMIT 1',
    [bookingId]
  );
  if (rows.length === 0) return;

  const nextStatus = status === 'ongoing'
    ? 'on_trip'
    : ['selesai', 'cancel', 'pending', 'dp_paid', 'menunggu'].includes(status)
      ? 'available'
      : null;
  if (!nextStatus) return;

  await Promise.all([
    db.query('UPDATE cars SET status = ? WHERE id = ?', [nextStatus, rows[0].car_id]),
    db.query('UPDATE drivers SET status = ? WHERE id = ?', [nextStatus, rows[0].driver_id]),
  ]);
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
            u.nama     AS nama_driver,
            f.harga_deal, f.dp, f.sisa, f.fee_driver,
            f.biaya_tambahan, f.biaya_external, f.profit
     FROM bookings b
     LEFT JOIN assignments a ON b.id = a.booking_id
     LEFT JOIN cars         c ON a.car_id = c.id
     LEFT JOIN drivers      d ON a.driver_id = d.id
     LEFT JOIN users        u ON d.user_id = u.id
     LEFT JOIN finances     f ON b.id = f.booking_id
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
  assertBookingTime(paket, jam_mulai);
  const jam_selesai = hitungJamSelesai(jam_mulai, durasi);
  const status = normalizeStatus(data.status);

  const [result] = await db.query(
    `INSERT INTO bookings
      (nama_customer, no_hp_customer, paket, tanggal, jam_mulai, jam_selesai,
       durasi_jam, jumlah_orang, catatan, status, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')`,
    [nama_customer, no_hp_customer || null, paket, tanggal, jam_mulai, jam_selesai,
     durasi, jumlah_orang || 1, catatan || null, status]
  );

  await upsertFinance(result.insertId, data);
  return getBookingById(result.insertId);
};

/** Update data booking */
const updateBooking = async (id, data) => {
  const booking = await getBookingById(id);

  const paket       = data.paket || booking.paket;
  const jam_mulai   = data.jam_mulai || booking.jam_mulai;
  const durasi      = PAKET_DURASI[paket];
  assertBookingTime(paket, jam_mulai);
  const jam_selesai = hitungJamSelesai(jam_mulai, durasi);
  const status      = normalizeStatus(data.status, booking.status);

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
      status,
      id,
    ]
  );

  await upsertFinance(id, data);
  await syncAssignedResourceStatus(id, status);
  return getBookingById(id);
};

/** Ubah status booking saja */
const updateStatus = async (id, status) => {
  const nextStatus = normalizeStatus(status);

  await getBookingById(id); // pastikan ada
  await db.query('UPDATE bookings SET status = ? WHERE id = ?', [nextStatus, id]);
  await syncAssignedResourceStatus(id, nextStatus);
  return getBookingById(id);
};

/** Hapus booking */
const deleteBooking = async (id) => {
  const booking = await getBookingById(id); // pastikan ada
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    if (booking.car_id) await conn.query('UPDATE cars SET status = "available" WHERE id = ?', [booking.car_id]);
    if (booking.driver_id) await conn.query('UPDATE drivers SET status = "available" WHERE id = ?', [booking.driver_id]);
    await conn.query('DELETE FROM finances WHERE booking_id = ?', [id]);
    await conn.query('DELETE FROM assignments WHERE booking_id = ?', [id]);
    await conn.query('DELETE FROM bookings WHERE id = ?', [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

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
