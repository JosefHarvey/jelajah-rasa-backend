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

// menyertakan rating di setiap komentar
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
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                ratings: true, // Ambil semua rating untuk perhitungan
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

        // Gabungkan rating ke dalam setiap komentar
        const commentsWithRatings = food.comments.map(comment => {
            // Cari rating yang cocok dari user yang sama
            const userRating = food.ratings.find(rating => rating.userId === comment.userId);
            return {
                ...comment,
                ratingValue: userRating ? userRating.value : null // Tambahkan ratingValue
            };
        });

        // Hitung rata-rata rating
        let averageRating = 0;
        if (food.ratings.length > 0) {
            const totalRating = food.ratings.reduce((acc, rating) => acc + rating.value, 0);
            averageRating = totalRating / food.ratings.length;
        }

        const responseData = { 
            ...food, 
            comments: commentsWithRatings,
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

// --- FUNGSI UNTUK MAKANAN UNGGULAN
const getFeaturedFoods = async (req, res) => {
    try {
        const allFoodIds = await prisma.food.findMany({
            select: { id: true }
        });

        // Acak urutan ID dan ambil maksimal 3
        const shuffledIds = allFoodIds.sort(() => 0.5 - Math.random());
        const selectedIds = shuffledIds.slice(0, 3).map(f => f.id);

        const featuredFoods = await prisma.food.findMany({
            where: {
                id: { in: selectedIds }
            },
            include: {
                region: {
                    select: { name: true }
                }
            }
        });

        res.status(200).json(featuredFoods);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil makanan unggulan", error: error.message });
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
    getFeaturedFoods, 
    addReview,
};

