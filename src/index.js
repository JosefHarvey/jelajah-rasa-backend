const express = require('express');
const cors = require('cors');

// Impor semua file rute Anda
const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const regionRoutes = require('./routes/region.routes.js'); 
const foodRoutes = require('./routes/food.routes.js');
const suggestionRoutes = require('./routes/suggestion.routes.js');
const restaurantRoutes = require('./routes/restaurant.routes.js'); 

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rute dasar
app.get('/', (req, res) => {
    res.send('API Jelajah Rasa Siap Digunakan!');
});

// Gunakan semua rute yang sudah diimpor
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/regions', regionRoutes); 
app.use('/api/foods', foodRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/restaurants', restaurantRoutes); 

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});