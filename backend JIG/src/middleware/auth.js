// src/middleware/auth.js
// Middleware untuk verifikasi JWT dan cek role

const jwt = require('jsonwebtoken');

/**
 * Verifikasi token JWT dari header Authorization
 * Header format: "Bearer <token>"
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, nama }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau sudah kadaluarsa.',
    });
  }
};

/**
 * Hanya izinkan role tertentu
 * Contoh penggunaan: authorizeRole('admin')
 *                    authorizeRole('admin', 'driver')
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Hanya ${roles.join(' atau ')} yang diizinkan.`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorizeRole };