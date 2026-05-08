// src/controllers/assignmentController.js
// Hubungkan route ke service, tangani request & response

const { assignSimple, assignManual, completeTrip } = require('../services/assignmentService');

/**
 * POST /assign/:id
 * Auto-assign mobil & driver yang tersedia (tanpa double booking)
 */
const autoAssign = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id);
    const result = await assignSimple(bookingId);

    res.status(201).json({
      success: true,
      message: `Booking #${bookingId} berhasil di-assign secara otomatis.`,
      data: result,
    });
  } catch (err) {
    next(err); // Lempar ke errorHandler middleware
  }
};

/**
 * POST /assign/:id/manual
 * Body: { car_id, driver_id }
 * Admin memilih sendiri mobil & driver — tetap ada validasi bentrok
 */
const manualAssign = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { car_id, driver_id } = req.body;

    if (!car_id || !driver_id) {
      return res.status(400).json({
        success: false,
        message: 'car_id dan driver_id wajib diisi.',
      });
    }

    const result = await assignManual(bookingId, car_id, driver_id);

    res.status(201).json({
      success: true,
      message: `Booking #${bookingId} berhasil di-assign secara manual.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /assignments/:id/complete
 * Selesaikan trip: ubah status booking → "selesai",
 * kembalikan mobil & driver → "available"
 */
const finishTrip = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id);
    const result    = await completeTrip(bookingId);

    res.status(200).json({
      success: true,
      message: result.message,
      data:    result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { autoAssign, manualAssign, finishTrip };