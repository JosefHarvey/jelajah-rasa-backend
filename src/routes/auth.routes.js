const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller.js');

// Rute registrasi yang sudah ada
router.post('/register', authController.register);

// Rute baru untuk Login
router.post('/login', authController.login);

module.exports = router;