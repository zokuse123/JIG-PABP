// src/services/driverService.js
const db = require('../config/database');
const { createError } = require('../middleware/errorHandler');
 
const getAllDrivers = async (status) => {
  let sql = `SELECT d.id, d.no_hp, d.status, u.nama, u.email
             FROM drivers d JOIN users u ON d.user_id = u.id`;
  const params = [];
  if (status) { sql += ' WHERE d.status = ?'; params.push(status); }
  sql += ' ORDER BY u.nama';
  const [rows] = await db.query(sql, params);
  return rows;
};
 
const getDriverById = async (id) => {
  const [rows] = await db.query(
    'SELECT d.id, d.no_hp, d.status, d.user_id, u.nama, u.email FROM drivers d JOIN users u ON d.user_id = u.id WHERE d.id = ?',
    [id]
  );
  if (rows.length === 0) throw createError(404, `Driver ID ${id} tidak ditemukan.`);
  return rows[0];
};
 
const updateDriverStatus = async (id, status) => {
  const validStatus = ['available', 'on_trip', 'off'];
  if (!validStatus.includes(status)) throw createError(400, `Status driver tidak valid. Pilihan: ${validStatus.join(', ')}`);
  await getDriverById(id);
  await db.query('UPDATE drivers SET status = ? WHERE id = ?', [status, id]);
  return getDriverById(id);
};
 
// Riwayat trip driver
const getDriverTrips = async (driverId) => {
  const [rows] = await db.query(
    `SELECT b.id, b.nama_customer, b.paket, b.tanggal, b.jam_mulai, b.jam_selesai,
            b.status, f.harga_deal, f.fee_driver
     FROM assignments a
     JOIN bookings b ON a.booking_id = b.id
     LEFT JOIN finances f ON b.id = f.booking_id
     WHERE a.driver_id = ?
     ORDER BY b.tanggal DESC`,
    [driverId]
  );
  return rows;
};
 
module.exports = { getAllDrivers, getDriverById, updateDriverStatus, getDriverTrips };