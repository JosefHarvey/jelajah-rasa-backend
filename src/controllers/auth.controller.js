const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- FUNGSI UNTUK REGISTRASI PENGGUNA BARU ---
const register = async (req, res) => {
    // 1. Ambil data nama, email, dan password dari body request
    const { name, email, password } = req.body;

    try {
        // 2. Hash (enkripsi) password sebelum disimpan untuk keamanan
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Buat user baru di database menggunakan Prisma
        const newUser = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword, // Simpan password yang sudah di-hash
            },
        });

        // 4. Kirim respon sukses (201 Created)
        res.status(201).json({
            message: "User berhasil terdaftar!",
            // Kirim kembali data user yang baru dibuat (tanpa password)
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
            },
        });

    } catch (error) {
        // 5. Jika terjadi error (misal: email sudah terdaftar), kirim respon error
        // Kode error P2002 dari Prisma menandakan 'unique constraint failed'
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Email sudah terdaftar." });
        }
        
        res.status(500).json({
            message: "Gagal mendaftarkan user",
            error: error.message,
        });
    }
};

// --- Fungsi untuk Login Pengguna ---
const login = async (req, res) => {
    try {
        // Ambil email dan password dari body request
        const { email, password } = req.body;

        // Cari user di database berdasarkan email
        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        // Jika user tidak ditemukan, kirim error
        if (!user) {
            return res.status(404).json({ message: "Email atau Password salah" });
        }

        // Bandingkan password yang dikirim dengan hash di database
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Jika password tidak valid, kirim error
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Email atau Password salah" });
        }

        // Jika password valid, buat JWT Token ("Tiket Masuk")
        const token = jwt.sign(
            { userId: user.id },      // Data yang ingin kita simpan di dalam tiket
            process.env.JWT_SECRET,   // Kunci rahasia dari file .env
            { expiresIn: '24h' }      // Tiket akan kadaluarsa dalam 24 jam
        );

        // Kirim tiket sebagai respon sukses
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

// Ekspor kedua fungsi agar bisa digunakan oleh router
module.exports = {
    register,
    login,
};