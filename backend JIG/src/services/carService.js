// src/services/carService.js
const db = require('../config/database');
const { createError } = require('../middleware/errorHandler');

const getAllCars = async (status) => {
  let sql = 'SELECT * FROM cars';
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY nama_grup';
  const [rows] = await db.query(sql, params);
  return rows;
};

const getCarById = async (id) => {
  const [rows] = await db.query('SELECT * FROM cars WHERE id = ?', [id]);
  if (rows.length === 0) throw createError(404, `Mobil ID ${id} tidak ditemukan.`);
  return rows[0];
};

const createCar = async ({ nama_grup, plat_nomor, is_external }) => {
  const [result] = await db.query(
    'INSERT INTO cars (nama_grup, plat_nomor, is_external) VALUES (?, ?, ?)',
    [nama_grup, plat_nomor || null, is_external || false]
  );
  return getCarById(result.insertId);
};

const updateCar = async (id, data) => {
  await getCarById(id);
  const { nama_grup, plat_nomor, is_external, status } = data;
  await db.query(
    'UPDATE cars SET nama_grup = COALESCE(?, nama_grup), plat_nomor = COALESCE(?, plat_nomor), is_external = COALESCE(?, is_external), status = COALESCE(?, status) WHERE id = ?',
    [nama_grup || null, plat_nomor || null, is_external ?? null, status || null, id]
  );
  return getCarById(id);
};

const deleteCar = async (id) => {
  await getCarById(id);
  await db.query('DELETE FROM cars WHERE id = ?', [id]);
  return { message: `Mobil ID ${id} berhasil dihapus.` };
};

module.exports = { getAllCars, getCarById, createCar, updateCar, deleteCar };