const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk menambah komentar baru (kode Anda yang sudah ada)
const addComment = async (req, res) => {
    const foodId = parseInt(req.params.foodId);
    const userId = req.user.userId; // Diambil dari token oleh middleware
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

// Fungsi untuk menambah/mengupdate rating (kode Anda yang sudah ada)
const addRating = async (req, res) => {
    const foodId = parseInt(req.params.foodId);
    const userId = req.user.userId;
    const { value } = req.body; // value harus angka 1-5

    try {
        // Prisma's upsert: jika sudah ada, update. Jika belum, buat baru.
        const newRating = await prisma.rating.upsert({
            where: { userId_foodId: { userId, foodId } }, // Cari berdasarkan kombinasi unik
            update: { value },
            create: { value, userId, foodId },
        });
        res.status(201).json(newRating);
    } catch (error) {
        res.status(500).json({ message: "Gagal memberi rating", error: error.message });
    }
};

// --- FUNGSI BARU UNTUK MENGAMBIL DETAIL MAKANAN ---
const getFoodById = async (req, res) => {
    try {
        // Ambil ID dari URL, contoh: /api/foods/1 -> id = "1"
        const { id } = req.params;

        // Cari satu data makanan berdasarkan ID
        const food = await prisma.food.findUnique({
            where: { 
                id: parseInt(id) // Ubah ID dari string menjadi angka
            },
            // Sertakan data dari tabel lain yang berhubungan
            include: {
                region: true, // Ambil data dari tabel Region
                comments: {     
                    orderBy: { createdAt: 'desc' }, // Urutkan komentar dari yang terbaru
                    include: {
                        user: { // Di setiap komentar, sertakan juga data user pembuatnya
                            select: { 
                                name: true // Tapi HANYA ambil nama user-nya saja
                            }
                        }
                    }
                },
                ratings: true, // Ambil semua data rating
            }
        });

        // Jika makanan tidak ditemukan, kirim pesan error 404
        if (!food) { 
            return res.status(404).json({ message: "Makanan tidak ditemukan" }); 
        }

        // Hitung rata-rata rating
        let averageRating = 0;
        if (food.ratings.length > 0) {
            const totalRating = food.ratings.reduce((acc, rating) => acc + rating.value, 0);
            averageRating = totalRating / food.ratings.length;
        }

        // Siapkan data final untuk dikirim sebagai respon
        const responseData = { 
            ...food, 
            averageRating: parseFloat(averageRating.toFixed(1)) // Bulatkan jadi 1 angka di belakang koma
        };

        // Kirim semua data gabungan sebagai respon sukses
        res.status(200).json(responseData);

    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data makanan", error: error.message });
    }
};


// --- PERBARUI BAGIAN INI ---
module.exports = {
    addComment,
    addRating,
    getFoodById, 
};