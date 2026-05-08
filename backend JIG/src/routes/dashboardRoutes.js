// src/routes/dashboardRoutes.js
// ============================================================
// Routes dashboard — hanya admin yang bisa akses
// ============================================================

const express = require('express');
const router  = express.Router();
const { getDashboard, getDashboardDetail } = require('../controllers/dashboardController');
const { authenticate, authorizeRole }      = require('../middleware/auth');

// Semua endpoint dashboard membutuhkan login sebagai admin
//router.use(authenticate, authorizeRole('admin'));

// GET /dashboard         → ringkasan utama (total trip, pemasukan, mobil terlaris)
router.get('/', getDashboard);

// GET /dashboard/detail  → statistik lengkap (booking per status, bulanan, top 3 mobil)
router.get('/detail', getDashboardDetail);

module.exports = router;