const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // 1. Ambil token dari header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formatnya: "Bearer TOKEN"

    // 2. Jika tidak ada token, tolak akses
    if (token == null) {
        return res.status(401).json({ message: "Akses ditolak. Token tidak tersedia." });
    }

    // 3. Verifikasi token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        // Jika token tidak valid (error), tolak akses
        if (err) {
            return res.status(403).json({ message: "Token tidak valid." });
        }

        // Jika token valid, simpan informasi user di request
        // agar bisa digunakan oleh controller selanjutnya
        req.user = user;

        // Lanjutkan ke proses selanjutnya (controller)
        next();
    });
};

module.exports = authenticateToken; 