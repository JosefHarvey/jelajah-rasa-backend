const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/* utils kecil */
const toNum = (v) => (v === undefined || v === null ? NaN : Number(v));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/*  GET /api/users/me */
const getMyProfile = async (req, res) => {
  const userId = toNum(req.user?.userId);
  if (!userId || Number.isNaN(userId)) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const includeReviews = String(req.query.include || '')
      .toLowerCase()
      .split(',')
      .includes('reviews');

    if (!includeReviews) {
      return res.status(200).json(user); // mode lama: hanya profil
    }

    // limit default 6 (untuk judul "6 PENILAIAN DARI ANDA")
    const limit = clamp(Number(req.query.limit || 6), 1, 50);

    // ambil rating milik user + info Food/Region + komentar milik user
    const ratings = await prisma.rating.findMany({
      where: { userId },
      include: {
        food: {
          select: {
            id: true, name: true, imageUrl: true, cityName: true,
            region: { select: { id: true, name: true } },
            comments: { where: { userId }, select: { id: true, content: true, createdAt: true } }
          }
        }
      },
      orderBy: { id: 'desc' } // urutkan terbaru (fallback karena Rating tak punya createdAt)
    });

    // bentuk payload card-friendly untuk FE
    let items = ratings.map(r => ({
      foodId: r.food.id,
      foodName: r.food.name,
      imageUrl: r.food.imageUrl,
      cityName: r.food.cityName,
      regionName: r.food.region?.name ?? null,
      userRating: r.value,
      userComment: r.food.comments[0]?.content ?? null,
      reviewedAt: r.food.comments[0]?.createdAt ?? null
    }));

    // sort by reviewedAt desc jika ada tanggal komentar
    items.sort((a, b) => {
      const ta = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
      const tb = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
      return tb - ta;
    });

    const reviewCount = items.length;
    items = items.slice(0, limit);

    // response gabungan (profil + ringkasan review)
    return res.status(200).json({
      ...user,
      reviews: items,
      reviewCount
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data profil', error: error.message });
  }
};

/* PUT /api/users/me*/
const updateMyProfile = async (req, res) => {
  const userId = toNum(req.user?.userId);
  if (!userId || Number.isNaN(userId)) return res.status(401).json({ message: 'Unauthorized' });

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
    return res.status(200).json({ message: 'Profil berhasil diperbarui', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui profil', error: error.message });
  }
};

/* GET /api/users/me/reviews  */
const getMyReviews = async (req, res) => {
  const userId = toNum(req.user?.userId);
  if (!userId || Number.isNaN(userId)) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const ratings = await prisma.rating.findMany({
      where: { userId },
      orderBy: { food: { name: 'asc' } },
      include: {
        food: {
          include: {
            comments: { where: { userId } }
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

    return res.status(200).json(reviews);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data penilaian', error: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyReviews, 
};
