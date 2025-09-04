const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk mendapatkan profil user yang sedang login
const getMyProfile = async (req, res) => {
    // Ambil user id dari token yang sudah diverifikasi oleh middleware
    const userId = req.user.userId;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            // Pilih kolom yang ingin ditampilkan (agar password tidak ikut terkirim)
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            }
        });

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data profil", error: error.message });
    }
};

module.exports = {
    getMyProfile,
};