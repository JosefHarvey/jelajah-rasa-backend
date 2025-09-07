const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const article = require('../controllers/article.controller');

// Artikel
router.get('/', article.list);                 // GET /api/articles
router.get('/:id', article.detail);            // GET /api/articles/:id
router.post('/', auth, article.create);        // POST /api/articles
router.put('/:id', auth, article.update);      // PUT /api/articles/:id

module.exports = router;
