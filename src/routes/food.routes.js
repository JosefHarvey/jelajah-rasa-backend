const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller.js');
const authenticateToken = require('../middlewares/auth.middleware.js');

// Rute untuk menambah komentar ke makanan tertentu. Perlu login.
// POST /api/foods/1/comments
router.post('/:foodId/comments', authenticateToken, foodController.addComment);

// Rute untuk memberi rating ke makanan tertentu. Perlu login.
// POST /api/foods/1/ratings
router.post('/:foodId/ratings', authenticateToken, foodController.addRating);

// Rute untuk mendapatkan detail satu makanan berdasarkan ID
// GET /api/foods/1
router.get('/:id', foodController.getFoodById);


module.exports = router;