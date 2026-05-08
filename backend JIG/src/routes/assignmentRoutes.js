// src/routes/assignmentRoutes.js

const express = require('express');
const router  = express.Router();
const { autoAssign, manualAssign, finishTrip } = require('../controllers/assignmentController');
const { authenticate, authorizeRole } = require('../middleware/auth');

// Semua endpoint assignment butuh login sebagai admin
//router.use(authenticate, authorizeRole('admin'));

// POST /assign/:id          → Auto-assign (anti-double-booking)
router.post('/:id', autoAssign);

// POST /assignments/:id/manual    → Manual assign dengan validasi bentrok
router.post('/:id/manual', manualAssign);

// POST /assignments/:id/complete  → Selesaikan trip, kembalikan mobil & driver
router.post('/:id/complete', finishTrip);

module.exports = router;