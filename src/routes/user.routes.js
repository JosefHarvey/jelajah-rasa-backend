const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controllers.js');

//middleware
const authenticateToken = require('../middlewares/auth.middleware.js');


router.get('/me', authenticateToken, userController.getMyProfile);
// RUTE UNTUK UPDATE
router.put('/me', authenticateToken, userController.updateMyProfile);

module.exports = router;