const express = require('express');
const cors = require('cors');

// Routes yang sudah ada
const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const regionRoutes = require('./routes/region.routes.js');
const foodRoutes = require('./routes/food.routes.js');
const suggestionRoutes = require('./routes/suggestion.routes.js');
const restaurantRoutes = require('./routes/restaurant.routes.js');

// Routes baru
const articleRoutes = require('./routes/article.routes.js');
const reviewRoutes = require('./routes/review.routes.js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware umum
app.use(cors());
app.use(express.json());

// Rute dasar
app.get('/', (_req, res) => res.send('API Jelajah Rasa Siap Digunakan!'));
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Mount baru
app.use('/api/articles', articleRoutes); // CRUD artikel
app.use('/api', reviewRoutes);           // Review artikel (/articles/:articleId/reviews)

// Jalankan server
app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
