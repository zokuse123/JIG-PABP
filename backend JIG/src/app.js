require('dotenv').config()

const express = require('express')
const cors    = require('cors')
const app     = express()

const db = require('./config/database')

// ── Services (cara lama, tetap dipakai) ─────────────────────
const carService        = require('./services/carService')
const driverService     = require('./services/driverService')
const bookingService    = require('./services/bookingService')
const assignmentService = require('./services/assignmentService')
const syncService       = require('./services/syncService')

// ── Routes modular (cara baru, untuk fitur dashboard) ────────
const dashboardRoutes = require('./routes/dashboardRoutes')
const assignmentRoutes = require('./routes/assignmentRoutes')
const financeRoutes = require('./routes/financeRoutes')
const mobileRoutes = require('./routes/mobileRoutes')

app.use(cors())
app.use(express.json())

/* =========================
   ROOT
========================= */
app.get('/', (req, res) => {
  res.send('JIG Backend jalan 🚀')
})

/* =========================
   TEST DATABASE
========================= */
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS hasil')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* =========================
   BOOKINGS
========================= */
app.get('/bookings', async (req, res) => {
  try {
    const data = await bookingService.getAllBookings(req.query)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/bookings', async (req, res) => {
  try {
    const result = await bookingService.createBooking(req.body)
    res.json({ message: 'Booking berhasil', data: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/bookings/:id', async (req, res) => {
  try {
    const result = await bookingService.updateBooking(req.params.id, req.body)
    res.json({ message: 'Booking berhasil diperbarui', data: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Alias PATCH supaya frontend yang kirim PATCH tidak terkena 404.
app.patch('/bookings/:id', async (req, res) => {
  try {
    const result = await bookingService.updateBooking(req.params.id, req.body)
    res.json({ message: 'Booking berhasil diperbarui', data: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/sync-bookings', async (req, res) => {
  try {
    const result = await syncService.syncBookingsFromSheets()
    res.json({
      message: 'Sync booking dari Google Sheets selesai',
      ...result,
    })
  } catch (err) {
    console.error('[sync-bookings] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* =========================
   CARS
========================= */
app.get('/cars', async (req, res) => {
  try {
    const data = await carService.getAllCars()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/cars/:id', async (req, res) => {
  try {
    const result = await carService.updateCar(req.params.id, req.body)
    res.json({ message: 'Mobil berhasil diperbarui', data: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Alias PATCH supaya frontend yang kirim PATCH tidak terkena 404.
app.patch('/cars/:id', async (req, res) => {
  try {
    const result = await carService.updateCar(req.params.id, req.body)
    res.json({ message: 'Mobil berhasil diperbarui', data: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* =========================
   DRIVERS
========================= */
app.get('/drivers', async (req, res) => {
  try {
    const data = await driverService.getAllDrivers()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* =========================
   DASHBOARD  ← TAMBAHAN BARU
========================= */
app.use('/dashboard', dashboardRoutes)
app.use('/finances', financeRoutes)
app.use('/mobile', mobileRoutes)
/* =========================
   ASSIGNMENTS (MODULAR)
========================= */
app.use('/assignments', assignmentRoutes)
// Mengaktifkan:
//   GET /dashboard        → ringkasan (total trip, pemasukan, mobil terlaris)
//   GET /dashboard/detail → statistik lengkap

/* =========================
   START SERVER
========================= */
app.listen(process.env.PORT || 3000, () => {
  console.log('Server jalan di http://localhost:3000')
})
