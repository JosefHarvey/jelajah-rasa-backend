const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller.js');
const authenticateToken = require('../middlewares/auth.middleware.js');

/* RUTE PUBLIK (TANPA LOGIN)
   Base path ini diasumsikan dimount di /api/foods */

// -- Rute List foods (filter & paging)
// GET /api/foods?regionId=&q=&page=1&pageSize=12&sort=recent|rating
router.get('/', foodController.listFoods);

// Rute spesifik 
router.get('/featured', foodController.getFeaturedFoods);    // GET /api/foods/featured
router.get('/pins', foodController.getAllFoodPins);          // GET /api/foods/pins
router.get('/search', foodController.searchFoods);           // GET /api/foods/search?q=...

// Detail food 
// GET /api/foods/:id
router.get('/:id', foodController.getFoodById);

/* RUTE PROTEKSI (BUTUH LOGIN) */

// Referensi Kuliner Lokal (create & update)
router.post('/', authenticateToken, foodController.createFood);          // POST /api/foods
router.put('/:id', authenticateToken, foodController.updateFood);        // PUT /api/foods/:id

// Review Food (rating + comment)
router.get('/:foodId/reviews/me', authenticateToken, foodController.getMyReviewForFood); // GET /api/foods/:foodId/reviews/me
router.post('/:foodId/reviews', authenticateToken, foodController.createReview);         // POST /api/foods/:foodId/reviews
router.put('/:foodId/reviews', authenticateToken, foodController.updateReview);          // PUT /api/foods/:foodId/reviews

module.exports = router;
