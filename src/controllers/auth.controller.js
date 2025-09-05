const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- FUNGSI REGISTRASI YANG DIPERBARUI ---
const register = async (req, res) => {
    // 1. Ambil data baru: firstName, lastName, email, dan password
    const { firstName, lastName, email, password } = req.body;

    try {
        // 2. Hash password (tetap sama)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Buat user baru dengan kolom firstName dan lastName
        const newUser = await prisma.user.create({
            data: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: hashedPassword,
            },
        });

        // 4. Kirim respon sukses dengan data yang baru
        res.status(201).json({
            message: "User berhasil terdaftar!",
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
            },
        });

    } catch (error) {
        // 5. Penanganan error 
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Email sudah terdaftar." });
        }
        
        res.status(500).json({
            message: "Gagal mendaftarkan user",
            error: error.message,
        });
    }
};

// --- Fungsi Login Pengguna 
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        if (!user) {
            return res.status(404).json({ message: "Email atau Password salah" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Email atau Password salah" });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login berhasil!",
            token: token,
        });

    } catch (error) {
        res.status(500).json({
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

// Ekspor kedua fungsi
module.exports = {
    register,
    login,
};