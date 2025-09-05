const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk mengambil semua restoran berdasarkan daerah
const getRestaurantsByRegion = async (req, res) => {
    const { regionId } = req.params;
    try {
        const restaurants = await prisma.restaurant.findMany({
            where: { regionId: parseInt(regionId) },
        });
        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data restoran", error: error.message });
    }
};

module.exports = { 
    getRestaurantsByRegion,
};