const express = require('express');
const router = express.Router();
const regionController = require('../controllers/region.controller.js');

// Rute untuk mendapatkan semua regions
// GET /api/regions
router.get('/', regionController.getAllRegions);

// Rute untuk mendapatkan satu region berdasarkan ID
// GET /api/regions/1
router.get('/:id', regionController.getRegionById);

module.exports = router;