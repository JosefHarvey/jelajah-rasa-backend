const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller.js');
const authenticateToken = require('../middlewares/auth.middleware.js');

// Rute ini harus diletakkan SEBELUM '/:id'
// GET /api/foods/search?q=sate
router.get('/search', foodController.searchFoods);

// Rute untuk mendapatkan detail satu makanan berdasarkan ID
// GET /api/foods/1
router.get('/:id', foodController.getFoodById);

// Rute untuk menambah komentar ke makanan tertentu. Perlu login.
// POST /api/foods/1/comments
router.post('/:foodId/comments', authenticateToken, foodController.addComment);

// Rute untuk memberi rating ke makanan tertentu. Perlu login.
// POST /api/foods/1/ratings
router.post('/:foodId/ratings', authenticateToken, foodController.addRating);


module.exports = router;