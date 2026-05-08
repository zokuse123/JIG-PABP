// src/services/dashboardService.js
// ============================================================
// Dashboard JIG — Ringkasan operasional untuk tampilan admin
// ============================================================

const db = require('../config/database');

/**
 * Ambil semua data dashboard dalam SATU fungsi.
 * Menjalankan 3 query secara paralel (Promise.all) agar lebih cepat
 * dibanding menjalankan satu per satu secara berurutan.
 *
 * @returns {Object} { total_trip, total_pemasukan, mobil_terlaris }
 */
const getDashboardData = async () => {

  // ── Query 1: Total Trip ──────────────────────────────────────────────────────
  // Hitung semua baris di tabel assignments.
  // Setiap baris = satu trip yang sudah punya mobil & driver.
  const queryTotalTrip = db.query(
    `SELECT COUNT(*) AS total_trip
     FROM assignments`
  );

  // ── Query 2: Total Pemasukan ─────────────────────────────────────────────────
  // SUM harga_deal dari tabel finances.
  // COALESCE memastikan hasilnya 0 jika belum ada data (bukan NULL).
  const queryTotalPemasukan = db.query(
    `SELECT COALESCE(SUM(f.harga_deal), 0) AS total_pemasukan
     FROM finances f
     JOIN bookings b ON f.booking_id = b.id
     WHERE b.status = 'selesai'`
    // Hanya hitung pemasukan dari trip yang benar-benar selesai
  );

  // ── Query 3: Mobil Paling Sering Dipakai ────────────────────────────────────
  // GROUP BY car_id, hitung berapa kali tiap mobil muncul di assignments,
  // JOIN ke cars untuk ambil nama_grup, urutkan terbanyak di atas, ambil 1.
  const queryMobilTerlaris = db.query(
    `SELECT
       c.id          AS car_id,
       c.nama_grup,
       c.plat_nomor,
       c.is_external,
       COUNT(a.id)   AS total_pemakaian
     FROM assignments a
     JOIN cars c ON a.car_id = c.id
     GROUP BY a.car_id, c.id, c.nama_grup, c.plat_nomor, c.is_external
     ORDER BY total_pemakaian DESC
     LIMIT 1`
  );

  // ── Jalankan 3 query SERENTAK (paralel, bukan berurutan) ────────────────────
  // Promise.all menunggu ketiganya selesai sebelum melanjutkan.
  // Ini lebih efisien karena tidak perlu tunggu query 1 selesai baru jalankan query 2.
  const [
    [tripRows],
    [pemasukanRows],
    [mobilRows],
  ] = await Promise.all([queryTotalTrip, queryTotalPemasukan, queryMobilTerlaris]);

  // ── Susun hasil ─────────────────────────────────────────────────────────────
  const totalTrip       = tripRows[0].total_trip;
  const totalPemasukan  = parseFloat(pemasukanRows[0].total_pemasukan) || 0;

  // Jika belum ada assignment sama sekali, mobil_terlaris = null
  const mobilTerlaris = mobilRows.length > 0
    ? {
        car_id:          mobilRows[0].car_id,
        nama_grup:       mobilRows[0].nama_grup,
        plat_nomor:      mobilRows[0].plat_nomor,
        is_external:     mobilRows[0].is_external,
        total_pemakaian: mobilRows[0].total_pemakaian,
      }
    : null;

  return {
    total_trip:      totalTrip,
    total_pemasukan: totalPemasukan,
    mobil_terlaris:  mobilTerlaris,
  };
};

/**
 * BONUS: Statistik lebih lengkap untuk panel admin detail.
 * Bisa dipanggil dari endpoint /dashboard/detail jika dibutuhkan.
 *
 * Berisi:
 * - Booking per status (pending, dp_paid, ongoing, selesai, cancel, menunggu)
 * - Pemasukan bulan ini vs bulan lalu
 * - Top 3 mobil terbanyak dipakai
 * - Jumlah driver aktif
 */
const getDashboardDetail = async () => {

  const [
    [statusRows],
    [bulananRows],
    [top3MobilRows],
    [driverRows],
  ] = await Promise.all([

    // Booking dikelompokkan per status
    db.query(
      `SELECT status, COUNT(*) AS jumlah
       FROM bookings
       GROUP BY status
       ORDER BY FIELD(status, 'pending','menunggu','dp_paid','ongoing','selesai','cancel')`
    ),

    // Perbandingan pemasukan: bulan ini vs bulan lalu
    db.query(
      `SELECT
         COALESCE(SUM(CASE
           WHEN MONTH(b.tanggal) = MONTH(CURDATE())
            AND YEAR(b.tanggal)  = YEAR(CURDATE())
           THEN f.harga_deal ELSE 0
         END), 0) AS pemasukan_bulan_ini,

         COALESCE(SUM(CASE
           WHEN MONTH(b.tanggal) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            AND YEAR(b.tanggal)  = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
           THEN f.harga_deal ELSE 0
         END), 0) AS pemasukan_bulan_lalu
       FROM finances f
       JOIN bookings b ON f.booking_id = b.id
       WHERE b.status = 'selesai'`
    ),

    // Top 3 mobil terbanyak dipakai
    db.query(
      `SELECT
         c.id AS car_id,
         c.nama_grup,
         c.plat_nomor,
         c.is_external,
         COUNT(a.id) AS total_pemakaian
       FROM assignments a
       JOIN cars c ON a.car_id = c.id
       GROUP BY a.car_id, c.id, c.nama_grup, c.plat_nomor, c.is_external
       ORDER BY total_pemakaian DESC
       LIMIT 3`
    ),

    // Jumlah driver berdasarkan status
    db.query(
      `SELECT status, COUNT(*) AS jumlah
       FROM drivers
       GROUP BY status`
    ),
  ]);

  // Susun booking_per_status jadi object { pending: 3, selesai: 10, ... }
  const bookingPerStatus = {};
  statusRows.forEach(row => {
    bookingPerStatus[row.status] = row.jumlah;
  });

  // Susun driver_per_status jadi object { available: 2, on_trip: 1, off: 1 }
  const driverPerStatus = {};
  driverRows.forEach(row => {
    driverPerStatus[row.status] = row.jumlah;
  });

  // Hitung persentase kenaikan/penurunan pemasukan
  const bulanIni   = parseFloat(bulananRows[0].pemasukan_bulan_ini)  || 0;
  const bulanLalu  = parseFloat(bulananRows[0].pemasukan_bulan_lalu) || 0;
  const persentase = bulanLalu > 0
    ? (((bulanIni - bulanLalu) / bulanLalu) * 100).toFixed(1)
    : null; // null jika tidak ada data bulan lalu (tidak bisa hitung %)

  return {
    booking_per_status: bookingPerStatus,
    keuangan: {
      pemasukan_bulan_ini:  bulanIni,
      pemasukan_bulan_lalu: bulanLalu,
      persentase_perubahan: persentase ? `${persentase}%` : 'N/A',
      tren: persentase > 0 ? 'naik' : persentase < 0 ? 'turun' : 'sama',
    },
    top3_mobil:     top3MobilRows,
    driver_status:  driverPerStatus,
  };
};

module.exports = { getDashboardData, getDashboardDetail };