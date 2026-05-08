// src/controllers/dashboardController.js

// Import SEKALI di atas — beri alias berbeda agar tidak bentrok dengan nama fungsi controller
const {
  getDashboardData,
  getDashboardDetail: fetchDashboardDetail, // ← alias, hindari konflik nama
} = require('../services/dashboardService')

/**
 * GET /dashboard
 * Ringkasan: total trip, total pemasukan, mobil terlaris
 */
const getDashboard = async (req, res, next) => {
  try {
    const data = await getDashboardData()
    res.status(200).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /dashboard/detail
 * Statistik lengkap: booking per status, keuangan bulanan, top 3 mobil, status driver
 */
const getDashboardDetail = async (req, res, next) => {
  try {
    const data = await fetchDashboardDetail() // ← pakai alias, bukan require ulang
    res.status(200).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

module.exports = { getDashboard, getDashboardDetail }