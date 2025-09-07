// src/controllers/user.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/users/me
const getMyProfile = async (req, res) => {
  const rawId = req.user?.userId;
  const userId = Number(rawId);
  if (!userId || Number.isNaN(userId)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data profil', error: error.message });
  }
};

// PUT /api/users/me
const updateMyProfile = async (req, res) => {
  const rawId = req.user?.userId;
  const userId = Number(rawId);
  if (!userId || Number.isNaN(userId)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { firstName, lastName } = req.body;
  if (firstName === undefined && lastName === undefined) {
    return res.status(400).json({ message: 'Tidak ada perubahan. Isi firstName atau lastName.' });
  }

  try {
    const data = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    }).catch(e => (e.code === 'P2025' ? null : Promise.reject(e)));

    if (!updatedUser) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.status(200).json({ message: 'Profil berhasil diperbarui', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui profil', error: error.message });
  }
};

// GET /api/users/me/reviews
const getMyReviews = async (req, res) => {
  const rawId = req.user?.userId;
  const userId = Number(rawId);
  if (!userId || Number.isNaN(userId)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const ratings = await prisma.rating.findMany({
      where: { userId },
      orderBy: { food: { name: 'asc' } },
      include: {
        food: {
          include: {
            comments: { where: { userId } } // unique([userId, foodId]) => maksimal 1
          }
        }
      }
    });

    const reviews = ratings.map(rating => ({
      foodId: rating.food.id,
      foodName: rating.food.name,
      userRating: rating.value,
      userComment: rating.food.comments.length > 0 ? rating.food.comments[0].content : null
    }));

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data penilaian', error: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyReviews,
};
