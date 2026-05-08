// src/middleware/validate.js
// Fungsi helper untuk validasi input request body

const { createError } = require('./errorHandler');

/**
 * Validasi field wajib ada di req.body
 * Contoh: validateRequired(['nama', 'email', 'password'])
 */
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(
      (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
    );

    if (missing.length > 0) {
      return next(createError(400, `Field wajib tidak boleh kosong: ${missing.join(', ')}`));
    }
    next();
  };
};

/**
 * Validasi nilai enum
 * Contoh: validateEnum('paket', ['short', 'medium', 'long'])
 */
const validateEnum = (field, allowedValues) => {
  return (req, res, next) => {
    if (req.body[field] && !allowedValues.includes(req.body[field])) {
      return next(
        createError(400, `Nilai '${field}' tidak valid. Harus salah satu dari: ${allowedValues.join(', ')}`)
      );
    }
    next();
  };
};

/**
 * Validasi format tanggal YYYY-MM-DD
 */
const validateDate = (field) => {
  return (req, res, next) => {
    const val = req.body[field];
    if (val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return next(createError(400, `Format '${field}' harus YYYY-MM-DD. Contoh: 2024-08-17`));
    }
    next();
  };
};

/**
 * Validasi format waktu HH:MM
 */
const validateTime = (field) => {
  return (req, res, next) => {
    const val = req.body[field];
    if (val && !/^\d{2}:\d{2}$/.test(val)) {
      return next(createError(400, `Format '${field}' harus HH:MM. Contoh: 08:00`));
    }
    next();
  };
};

module.exports = { validateRequired, validateEnum, validateDate, validateTime };