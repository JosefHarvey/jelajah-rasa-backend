const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk mengambil SEMUA regions
const getAllRegions = async (req, res) => {
    try {
        const regions = await prisma.region.findMany();
        res.status(200).json(regions);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data regions", error: error.message });
    }
};

// Fungsi untuk mengambil SATU region berdasarkan ID, TERMASUK makanannya
const getRegionById = async (req, res) => {
    const { id } = req.params;
    try {
        const region = await prisma.region.findUnique({
            where: { id: parseInt(id) },
            include: {
                foods: true, // Sertakan semua data makanan yang berhubungan
            },
        });

        if (!region) {
            return res.status(404).json({ message: "Region tidak ditemukan" });
        }
        res.status(200).json(region);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data region", error: error.message });
    }
};

module.exports = {
    getAllRegions,
    getRegionById,
};