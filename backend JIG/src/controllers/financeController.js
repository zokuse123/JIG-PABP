// src/controllers/financeController.js

const { getAllFinances } = require('../services/financeService');

const getFinances = async (req, res, next) => {
  try {
    const data = await getAllFinances();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFinances };
