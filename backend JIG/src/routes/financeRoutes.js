// src/routes/financeRoutes.js

const express = require('express');
const router = express.Router();
const { getFinances } = require('../controllers/financeController');
const { authenticate, authorizeRole } = require('../middleware/auth');

// Semua endpoint finance membutuhkan login sebagai admin
//router.use(authenticate, authorizeRole('admin'));

router.get('/', getFinances);

module.exports = router;
