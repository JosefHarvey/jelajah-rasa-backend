const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestion.controller.js');

// POST /api/suggestions
router.post('/', suggestionController.createSuggestion);

module.exports = router;