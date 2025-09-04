const express = require('express');
// 1. Import rute autentikasi yang baru kita buat
const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const foodRoutes = require('./routes/food.routes.js');
const suggestionRoutes = require('./routes/suggestion.routes.js');



const app = express();
const port = 3000;

// 2. Middleware PENTING agar Express bisa membaca body JSON dari request
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API Jelajah Rasa Siap Digunakan!');
});

// 3. Gunakan rute autentikasi dengan awalan /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/suggestions', suggestionRoutes);

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});