// src/config/database.js
// Koneksi ke MySQL menggunakan mysql2 dengan connection pool

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'jig_db',
  waitForConnections: true,
  connectionLimit:    10,    // maksimal 10 koneksi paralel
  queueLimit:         0,
  timezone:           '+07:00', // WIB
});

// Test koneksi saat pertama kali dipanggil
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL terhubung ke:', process.env.DB_NAME || 'jig_db')
    conn.release();
  })
  .catch(err => {
    console.error('❌ Gagal konek MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;