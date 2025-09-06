const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
                        restaurant: {
                            
                            select: {
                                name: true,
                                region: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
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

// Fungsi untuk pin peta
const getAllFoodPins = async (req, res) => {
    try {
        const foods = await prisma.food.findMany({
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

// Fungsi untuk menambah review (rating + komentar)
const addReview = async (req, res) => {
    const foodId = parseInt(req.params.foodId);
    const userId = req.user.userId;
    const { value, content } = req.body;

    if (!value || value < 1 || value > 5) {
        return res.status(400).json({ message: "Rating (value) wajib diisi dengan angka 1-5." });
    }
    
    try {
        const [newRating, newComment] = await prisma.$transaction([
            prisma.rating.upsert({
                where: { userId_foodId: { userId, foodId } },
                update: { value },
                create: { value, userId, foodId },
            }),
            
            content ? prisma.comment.create({
                data: { content, userId, foodId },
            }) : Promise.resolve(null)
        ]);

        res.status(201).json({ 
            message: "Penilaian berhasil dikirim!",
            rating: newRating,
            comment: newComment 
        });

    } catch (error) {
        res.status(500).json({ message: "Gagal mengirim penilaian", error: error.message });
    }
};

module.exports = {
    searchFoods,
    getFoodById,
    getAllFoodPins,
    addReview,
};

