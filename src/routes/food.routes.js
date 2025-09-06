const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller.js');
const authenticateToken = require('../middlewares/auth.middleware.js');

// RUTE SPESIFIK
// Endpoint baru untuk makanan unggulan di landing page
// GET /api/foods/featured
router.get('/featured', foodController.getFeaturedFoods);

// Endpoint untuk mendapatkan semua pin makanan di peta
// GET /api/foods/pins
router.get('/pins', foodController.getAllFoodPins);

// Endpoint untuk fitur search bar
// GET /api/foods/search?q=sate
router.get('/search', foodController.searchFoods);


// RUTE DINAMIS 
// Endpoint untuk mendapatkan detail lengkap satu makanan
// GET /api/foods/1
router.get('/:id', foodController.getFoodById);


// RUTE POST 
// Endpoint yang sudah digabung untuk mengirim rating dan komentar
// POST /api/foods/1/reviews
router.post('/:foodId/reviews', authenticateToken, foodController.addReview);


module.exports = router;

