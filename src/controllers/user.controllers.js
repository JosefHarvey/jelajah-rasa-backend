const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk mendapatkan profil user yang sedang login
const getMyProfile = async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                createdAt: true,
            }
        });
        res.status(200).json(user);
    } catch (error) { 
        res.status(500).json({ message: "Gagal mengambil data profil", error: error.message });
    }
};

const updateMyProfile = async (req, res) => {
    const userId = req.user.userId;
    // Ambil data baru dari body request
    const { firstName, lastName } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: firstName,
                lastName: lastName,
            },
            select: { // memilih data yang ingin dikirim kembali
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            }
        });
        res.status(200).json({ message: "Profil berhasil diperbarui", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui profil", error: error.message });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile,
};