const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');

// 1. Impor penjaga keamanannya (middleware)
const authenticateToken = require('../middlewares/auth.middleware.js');

// 2. Tempatkan 'authenticateToken' SEBELUM 'userController.getMyProfile'
// Ini berarti, jalankan penjaga dulu, jika lolos, baru jalankan controller
router.get('/me', authenticateToken, userController.getMyProfile);

module.exports = router;