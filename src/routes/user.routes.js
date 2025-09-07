// src/routes/user.routes.js
const router = require('express').Router();
const authenticateToken = require('../middlewares/auth.middleware.js');
const userController = require('../controllers/user.controller.js');

router.get('/me', authenticateToken, userController.getMyProfile);
router.put('/me', authenticateToken, userController.updateMyProfile);
router.get('/me/reviews', authenticateToken, userController.getMyReviews);

module.exports = router;
