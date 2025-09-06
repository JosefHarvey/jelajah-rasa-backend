const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller.js');
const authenticateToken = require('../middlewares/auth.middleware.js');

// RUTE SPESIFIK
router.get('/pins', foodController.getAllFoodPins);
router.get('/search', foodController.searchFoods);

// RUTE DINAMIS 
router.get('/:id', foodController.getFoodById);


// RUTE POST
router.post('/:foodId/comments', authenticateToken, foodController.addComment);
router.post('/:foodId/ratings', authenticateToken, foodController.addRating);

module.exports = router;