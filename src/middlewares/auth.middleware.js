const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Ambil token dari header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    // Jika tidak ada token, tolak akses
    if (token == null) {
        return res.status(401).json({ message: "Akses ditolak. Token tidak tersedia." });
    }

    // Verifikasi token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        // Jika token tidak valid (error), tolak akses
        if (err) {
            return res.status(403).json({ message: "Token tidak valid." });
        }

        // Jika token valid, simpan informasi user di request
        // agar bisa digunakan oleh controller selanjutnya
        req.user = user;

        next();
    });
};

module.exports = authenticateToken; 