const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller.js');

// Endpoint untuk mendapatkan restoran berdasarkan ID daerah
// Contoh: GET /api/restaurants/by-region/1
router.get('/by-region/:regionId', restaurantController.getRestaurantsByRegion);

module.exports = router;