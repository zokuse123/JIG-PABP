// src/middleware/errorHandler.js
// Global error handler — tangkap semua error yang tidak tertangani

/**
 * Error Handler Middleware
 * Dipasang PALING AKHIR di app.js dengan 4 parameter (err, req, res, next)
 */
const errorHandler = (err, req, res, next) => {
  // Log error ke console (bisa diganti winston/logger di production)
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Tentukan status code
  const statusCode = err.statusCode || err.status || 500;

  // Response standar error
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.',
    // Hanya tampilkan stack trace di mode development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Handler untuk route yang tidak ditemukan (404)
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} tidak ditemukan.`,
  });
};

/**
 * Helper: buat error object dengan status code custom
 * Contoh: throw createError(400, 'Paket tidak valid')
 */
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, notFound, createError };