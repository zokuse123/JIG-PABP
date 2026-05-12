const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const statusToMobile = (status) => {
  if (status === 'selesai') return 'done';
  if (status === 'ongoing') return 'ongoing';
  return 'pending';
};

const statusToBackend = (status) => {
  if (status === 'done') return 'selesai';
  if (status === 'ongoing') return 'ongoing';
  if (status === 'pending') return 'pending';
  return null;
};

const formatTime = (value) => {
  if (!value) return '';
  return String(value).slice(0, 5);
};

const formatDate = (value) => {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const mapBooking = (row) => ({
  id: row.id,
  customer_name: row.nama_customer || '',
  package: row.paket || 'short',
  start_time: formatTime(row.jam_mulai),
  car_name: row.nama_mobil || '-',
  car_plate: row.plat_nomor || '-',
  status: statusToMobile(row.status),
  date: formatDate(row.tanggal),
});

const getCurrentDriverId = async (user) => {
  if (user.driver_id) return user.driver_id;

  const [rows] = await db.query(
    'SELECT id FROM drivers WHERE user_id = ? LIMIT 1',
    [user.id]
  );

  return rows[0]?.id;
};

const getAssignedTrips = async (req, res) => {
  try {
    const driverId = await getCurrentDriverId(req.user);

    if (!driverId) {
      return res.status(403).json({ message: 'Akun driver tidak ditemukan.' });
    }

    const { date } = req.query;
    const params = [driverId];
    let dateFilter = '';

    if (date) {
      dateFilter = ' AND b.tanggal = ?';
      params.push(date);
    }

    const [rows] = await db.query(
      `SELECT b.id, b.nama_customer, b.paket, b.tanggal, b.jam_mulai, b.status,
              c.nama_grup AS nama_mobil, c.plat_nomor
       FROM assignments a
       JOIN bookings b ON a.booking_id = b.id
       LEFT JOIN cars c ON a.car_id = c.id
       WHERE a.driver_id = ?
         AND b.status NOT IN ('cancel')
         ${dateFilter}
       ORDER BY b.tanggal ASC, b.jam_mulai ASC`,
      params
    );

    res.json({ data: rows.map(mapBooking) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Nomor HP dan password wajib diisi.' });
    }

    const [rows] = await db.query(
      `SELECT d.id AS driver_id, d.no_hp, d.status AS driver_status,
              u.id AS user_id, u.nama, u.email, u.password, u.role, u.is_active
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE d.no_hp = ?
       LIMIT 1`,
      [phone]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Nomor HP atau password salah.' });
    }

    const driver = rows[0];
    const passwordHash = driver.password || '';
    const passwordOk = passwordHash.startsWith('$2')
      ? await bcrypt.compare(password, passwordHash)
      : password === passwordHash;

    if (!driver.is_active || !passwordOk) {
      return res.status(401).json({ message: 'Nomor HP atau password salah.' });
    }

    const token = jwt.sign(
      {
        id: driver.user_id,
        driver_id: driver.driver_id,
        role: 'driver',
        nama: driver.nama,
      },
      process.env.JWT_SECRET || 'rahasia',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      driver: {
        id: driver.driver_id,
        name: driver.nama,
        phone: driver.no_hp,
        token,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/trips', authenticate, getAssignedTrips);
router.get('/bookings', authenticate, getAssignedTrips);

const updateTripStatus = async (req, res) => {
  try {
    const backendStatus = statusToBackend(req.body.status);

    if (!backendStatus) {
      return res.status(400).json({ message: 'Status tidak valid.' });
    }

    const driverId = await getCurrentDriverId(req.user);

    if (!driverId) {
      return res.status(403).json({ message: 'Akun driver tidak ditemukan.' });
    }

    const [assignments] = await db.query(
      'SELECT car_id, driver_id FROM assignments WHERE booking_id = ? AND driver_id = ?',
      [req.params.id, driverId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ message: 'Trip tidak ditemukan untuk driver ini.' });
    }

    await db.query('UPDATE bookings SET status = ? WHERE id = ?', [backendStatus, req.params.id]);

    const { car_id, driver_id } = assignments[0];
    if (backendStatus === 'ongoing') {
      await Promise.all([
        db.query('UPDATE cars SET status = "on_trip" WHERE id = ?', [car_id]),
        db.query('UPDATE drivers SET status = "on_trip" WHERE id = ?', [driver_id]),
      ]);
    }

    if (backendStatus === 'selesai') {
      await Promise.all([
        db.query('UPDATE cars SET status = "available" WHERE id = ?', [car_id]),
        db.query('UPDATE drivers SET status = "available" WHERE id = ?', [driver_id]),
      ]);
    }

    const [rows] = await db.query(
      `SELECT b.id, b.nama_customer, b.paket, b.tanggal, b.jam_mulai, b.status,
              c.nama_grup AS nama_mobil, c.plat_nomor
       FROM bookings b
       LEFT JOIN assignments a ON b.id = a.booking_id
       LEFT JOIN cars c ON a.car_id = c.id
       WHERE b.id = ?
       LIMIT 1`,
      [req.params.id]
    );

    res.json({ data: mapBooking(rows[0]) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.put('/trip/:id/status', authenticate, updateTripStatus);
router.put('/booking/:id/status', authenticate, updateTripStatus);

module.exports = router;
