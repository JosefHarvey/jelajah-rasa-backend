const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk menambah komentar baru
const addComment = async (req, res) => {
    const foodId = parseInt(req.params.foodId);
    const userId = req.user.userId;
    const { content } = req.body;

    try {
        const newComment = await prisma.comment.create({
            data: { content, userId, foodId },
        });
        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah komentar", error: error.message });
    }
};

// Fungsi untuk mencari makanan
const searchFoods = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: "Query pencarian tidak boleh kosong." });
    }

    try {
        const foods = await prisma.food.findMany({
            where: {
                name: {
                    contains: q,
                    mode: 'insensitive',
                },
            },
        });
        res.status(200).json(foods);
    } catch (error) {
        res.status(500).json({ message: "Gagal melakukan pencarian", error: error.message });
    }
};

// Fungsi untuk menambah/mengupdate rating
const addRating = async (req, res) => {
    const foodId = parseInt(req.params.foodId);
    const userId = req.user.userId;
    const { value } = req.body;

    try {
        const newRating = await prisma.rating.upsert({
            where: { userId_foodId: { userId, foodId } },
            update: { value },
            create: { value, userId, foodId },
        });
        res.status(201).json(newRating);
    } catch (error) {
        res.status(500).json({ message: "Gagal memberi rating", error: error.message });
    }
};

// Fungsi untuk mengambil detail makanan
const getFoodById = async (req, res) => {
    try {
        const { id } = req.params;

        const food = await prisma.food.findUnique({
            where: { 
                id: parseInt(id)
            },
            include: {
                region: true,
                comments: {     
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: { 
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                ratings: true,
                restaurants: {
                    include: {
                        restaurant: true
                    }
                }
            }
        });

        if (!food) { 
            return res.status(404).json({ message: "Makanan tidak ditemukan" }); 
        }

        let averageRating = 0;
        if (food.ratings.length > 0) {
            const totalRating = food.ratings.reduce((acc, rating) => acc + rating.value, 0);
            averageRating = totalRating / food.ratings.length;
        }

        const responseData = { 
            ...food, 
            averageRating: parseFloat(averageRating.toFixed(1))
        };

        res.status(200).json(responseData);

    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data makanan", error: error.message });
    }
};

const getAllFoodPins = async (req, res) => {
    try {
        const foods = await prisma.food.findMany({
            // Hanya pilih data yang dibutuhkan untuk pin peta
            select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
            }
        });
        res.status(200).json(foods);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data pin peta", error: error.message });
    }
};


module.exports = {
    addComment,
    addRating,
    searchFoods,
    getFoodById,
    getAllFoodPins, 
};