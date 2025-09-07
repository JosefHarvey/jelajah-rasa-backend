const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // format: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }

    // pastikan ada userId di payload
    req.user = {
      userId: payload.userId ?? payload.id, // dukung payload dengan "id" atau "userId"
      email: payload.email,
      role: payload.role,
    };

    if (!req.user.userId) {
      return res.status(403).json({ message: 'Token tidak berisi identitas pengguna yang valid.' });
    }

    next();
  });
};

module.exports = authenticateToken;
