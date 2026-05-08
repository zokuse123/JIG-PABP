// src/services/authService.js
// Logika bisnis untuk autentikasi

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/database');
const { createError } = require('../middleware/errorHandler');

/**
 * Login user (admin atau driver)
 * @param {string} email
 * @param {string} password
 * @returns {{ token, user }}
 */
const login = async (email, password) => {
  // 1. Cari user berdasarkan email
  const [rows] = await db.query(
    'SELECT id, nama, email, password, role, is_active FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    throw createError(401, 'Email atau password salah.');
  }

  const user = rows[0];

  // 2. Cek apakah akun aktif
  if (!user.is_active) {
    throw createError(403, 'Akun Anda telah dinonaktifkan. Hubungi admin.');
  }

  // 3. Verifikasi password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError(401, 'Email atau password salah.');
  }

  // 4. Generate JWT
  const payload = { id: user.id, email: user.email, role: user.role, nama: user.nama };
  const token   = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  // Jangan kembalikan password
  delete user.password;

  return { token, user };
};

/**
 * Register user baru (hanya admin yang bisa membuat akun driver)
 */
const register = async ({ nama, email, password, role, no_hp }) => {
  // Cek email duplikat
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw createError(409, 'Email sudah terdaftar.');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Simpan user
  const [result] = await db.query(
    'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
    [nama, email, hashedPassword, role || 'driver']
  );

  const userId = result.insertId;

  // Jika role driver, buat record di tabel drivers juga
  if (role === 'driver' || !role) {
    await db.query('INSERT INTO drivers (user_id, no_hp) VALUES (?, ?)', [userId, no_hp || null]);
  }

  return { id: userId, nama, email, role: role || 'driver' };
};

/**
 * Ubah password user
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) throw createError(404, 'User tidak ditemukan.');

  const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
  if (!isMatch) throw createError(401, 'Password lama tidak sesuai.');

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

  return { message: 'Password berhasil diubah.' };
};

module.exports = { login, register, changePassword };