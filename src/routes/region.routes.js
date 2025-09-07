// src/routes/region.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const regionController = require('../controllers/region.controller.js');

// GET /api/regions
router.get('/', regionController.getAllRegions);

// GET /api/regions/:id
router.get('/:id', regionController.getRegionById);

// PUT /api/regions/:id/profile (update profil citarasa)
router.put('/:id/profile', auth, regionController.updateRegionProfile);

// GET /api/regions/:id/top-dishes (wajib dicoba)
router.get('/:id/top-dishes', regionController.getTopDishes);

// GET /api/regions/:id/restaurants (tempat makan wajib)
router.get('/:id/restaurants', regionController.getRegionRestaurants);

module.exports = router;
