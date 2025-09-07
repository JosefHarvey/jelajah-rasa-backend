const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const review = require('../controllers/review.controller');

// Review Artikel
router.get('/articles/:articleId/reviews', review.listArticleReviews);
router.get('/articles/:articleId/reviews/average', review.getArticleAverage);
router.post('/articles/:articleId/reviews', auth, review.createArticleReview);
router.put('/articles/:articleId/reviews/me', auth, review.updateMyArticleReview);

module.exports = router;
