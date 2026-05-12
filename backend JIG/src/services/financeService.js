// src/services/financeService.js

const db = require('../config/database');

const getAllFinances = async () => {
  const [rows] = await db.query(
    `SELECT
       f.id,
       f.booking_id,
       b.nama_customer,
       b.paket,
       b.tanggal,
       b.status,
       f.harga_deal,
       f.dp,
       f.fee_driver,
       f.biaya_tambahan,
       f.sisa
     FROM finances f
     JOIN bookings b ON f.booking_id = b.id
     ORDER BY b.tanggal DESC, f.id DESC`
  );

  return rows;
};

module.exports = { getAllFinances };
