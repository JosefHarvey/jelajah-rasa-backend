const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/* Utils */


function parseId(value) {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/*  LANDING: Featured Foods  */

// GET /api/foods/featured
const getFeaturedFoods = async (req, res) => {
  try {
    // Gunakan raw query Postgres untuk random yang efisien
    // Catatan: nama tabel mengikuti casing Prisma -> "Food", "Region"
    const rows = await prisma.$queryRawUnsafe(`
      SELECT f.id, f.name, f."imageUrl",
             r.name as region_name
      FROM "Food" f
      JOIN "Region" r ON r.id = f."regionId"
      ORDER BY RANDOM()
      LIMIT 3;
    `);

    // fallback kalau DB bukan Postgres (jarang di setup kamu)
    // -> bisa gunakan findMany dan shuffle, tapi kita keep simple dulu
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil makanan unggulan', error: error.message });
  }
};

/* MAP PINS */
// GET /api/foods/pins
const getAllFoodPins = async (req, res) => {
  try {
    const foods = await prisma.food.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      select: { id: true, name: true, latitude: true, longitude: true }
    });
    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pin peta', error: error.message });
  }
};

/* SEARCH */

// GET /api/foods/search?q=...
const searchFoods = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Query pencarian tidak boleh kosong.' });

  try {
    const foods = await prisma.food.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' }
      },
      select: {
        id: true, name: true, imageUrl: true,
        region: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Gagal melakukan pencarian', error: error.message });
  }
};

/* DETAIL FOOD + KOMENTAR & RATING */

// GET /api/foods/:id
const getFoodById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Param id tidak valid' });

    const food = await prisma.food.findUnique({
      where: { id },
      include: {
        region: true,
        // relasi restoran
        restaurants: {
          include: {
            restaurant: {
              select: {
                id: true, name: true, address: true,
                region: { select: { id: true, name: true } }
              }
            }
          }
        },
        // komentar beserta user ringkas
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, firstName: true, lastName: true } } }
        },
        // rating (untuk mapping user->rating)
        ratings: true,
        // artikel terkait (opsional)
        article: {
          select: { id: true, title: true, slug: true, coverImageUrl: true, publishedAt: true, type: true }
        }
      }
    });

    if (!food) return res.status(404).json({ message: 'Makanan tidak ditemukan' });

    // Gabungkan rating user ke setiap komentar
    const commentsWithRatings = food.comments.map((c) => {
      const ur = food.ratings.find(r => r.userId === c.userId);
      return { ...c, ratingValue: ur ? ur.value : null };
    });

    // Hitung average rating via aggregate (lebih efisien kalau dataset besar)
    const agg = await prisma.rating.aggregate({
      _avg: { value: true },
      _count: { _all: true },
      where: { foodId: id }
    });

    const averageRating = agg._count._all ? Number(agg._avg.value.toFixed(1)) : 0;

    // Rapikan response
    const { ratings, comments, ...rest } = food;
    const responseData = {
      ...rest,
      comments: commentsWithRatings,
      averageRating,
      ratingsCount: agg._count._all
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data makanan', error: error.message });
  }
};

/* REVIEW Food (Rating + Comment) */

// GET /api/foods/:foodId/my-review
const getMyReviewForFood = async (req, res) => {
  const foodId = parseId(req.params.foodId);
  const userId = req.user?.userId; // mengikuti middleware kamu
  if (!foodId) return res.status(400).json({ message: 'Param foodId tidak valid' });
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const [rating, comment] = await Promise.all([
      prisma.rating.findUnique({ where: { userId_foodId: { userId, foodId } } }),
      prisma.comment.findUnique({ where: { userId_foodId: { userId, foodId } } })
    ]);

    if (!rating && !comment) {
      return res.status(404).json({ message: 'Anda belum memberikan penilaian untuk makanan ini.' });
    }
    res.status(200).json({ rating, comment });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memeriksa penilaian', error: error.message });
  }
};

// POST /api/foods/:foodId/reviews
const createReview = async (req, res) => {
  const foodId = parseId(req.params.foodId);
  const userId = req.user?.userId;
  const { value, content } = req.body;

  if (!foodId) return res.status(400).json({ message: 'Param foodId tidak valid' });
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!value || value < 1 || value > 5) {
    return res.status(400).json({ message: 'Rating (value) wajib diisi dengan angka 1-5.' });
  }

  try {
    const [newRating, newComment] = await prisma.$transaction([
      prisma.rating.create({ data: { value, userId, foodId } }),
      content ? prisma.comment.create({ data: { content, userId, foodId } }) : Promise.resolve(null)
    ]);

    res.status(201).json({ message: 'Penilaian berhasil dikirim!', rating: newRating, comment: newComment });
  } catch (error) {
    if (error.code === 'P2002') {
      // unique(userId, foodId) sudah ada -> arahkan ke edit
      return res.status(409).json({
        message: 'Anda sudah pernah mereview makanan ini. Gunakan endpoint edit.',
        editEndpoint: `/api/foods/${foodId}/reviews`
      });
    }
    res.status(500).json({ message: 'Gagal mengirim penilaian', error: error.message });
  }
};

// PUT /api/foods/:foodId/reviews
const updateReview = async (req, res) => {
  const foodId = parseId(req.params.foodId);
  const userId = req.user?.userId;
  const { value, content } = req.body;

  if (!foodId) return res.status(400).json({ message: 'Param foodId tidak valid' });
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!value || value < 1 || value > 5) {
    return res.status(400).json({ message: 'Rating (value) wajib diisi dengan angka 1-5.' });
  }

  try {
    const [updatedRating, updatedComment] = await prisma.$transaction([
      prisma.rating.update({
        where: { userId_foodId: { userId, foodId } },
        data: { value }
      }),
      content
        ? prisma.comment.upsert({
            where: { userId_foodId: { userId, foodId } },
            update: { content },
            create: { content, userId, foodId }
          })
        : Promise.resolve(null)
    ]);

    res.status(200).json({ message: 'Penilaian berhasil diperbarui!', rating: updatedRating, comment: updatedComment });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Review belum ada, gunakan endpoint create.' });
    }
    res.status(500).json({ message: 'Gagal memperbarui penilaian', error: error.message });
  }
};

/* REFERENSI KULINER LOKAL  */

// POST /api/foods
// body: { name, regionId, cityName?, intro?, body?, imageUrl?, articleId?, geo?:{lat,lng} }
const createFood = async (req, res) => {
  try {
    const {
      name, regionId, cityName, intro, body,
      imageUrl, articleId, geo
    } = req.body;

    if (!name || !regionId) {
      return res.status(400).json({ message: 'name dan regionId wajib diisi' });
    }

    const created = await prisma.food.create({
      data: {
        name,
        regionId: Number(regionId),
        cityName: cityName ?? null,
        intro: intro ?? null,
        body: body ?? null,
        imageUrl: imageUrl ?? null,
        articleId: articleId ? Number(articleId) : null,
        latitude: geo?.lat ?? null,
        longitude: geo?.lng ?? null
      }
    });

    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'regionId atau articleId tidak valid' });
    }
    res.status(500).json({ message: 'Gagal membuat data makanan', error: error.message });
  }
};

// GET /api/foods
// ?regionId=&q=&page=1&pageSize=12&sort=recent|rating
const listFoods = async (req, res) => {
  try {
    const regionId = req.query.regionId ? Number(req.query.regionId) : undefined;
    const q = req.query.q || undefined;
    const page = clamp(Number(req.query.page || 1), 1, 1000000);
    const pageSize = clamp(Number(req.query.pageSize || 12), 1, 100);
    const sort = (req.query.sort || 'recent').toString();

    const where = {
      ...(regionId ? { regionId } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {})
    };

    // Ambil data + aggregate rating per food
    const [total, rows] = await Promise.all([
      prisma.food.count({ where }),
      prisma.food.findMany({
        where,
        select: {
          id: true, name: true, imageUrl: true, cityName: true,
          intro: true, updatedAt: true,
          region: { select: { id: true, name: true } },
          ratings: { select: { value: true } }
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sort === 'recent' ? { updatedAt: 'desc' } : { name: 'asc' }
      })
    ]);

    // hitung avg rating di memori (hemat round-trip)
    const data = rows.map(r => {
      const count = r.ratings.length;
      const sum = count ? r.ratings.reduce((a, x) => a + x.value, 0) : 0;
      const avg = count ? Number((sum / count).toFixed(2)) : null;
      const { ratings, ...rest } = r;
      return { ...rest, averageRating: avg, ratingsCount: count };
    });

    // sort by rating jika diminta
    if (sort === 'rating') {
      data.sort((a, b) => {
        const aAvg = a.averageRating ?? -1;
        const bAvg = b.averageRating ?? -1;
        if (bAvg !== aAvg) return bAvg - aAvg;
        return (b.ratingsCount || 0) - (a.ratingsCount || 0);
      });
    }

    res.json({ data, meta: { total, page, pageSize } });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil daftar makanan', error: error.message });
  }
};

// PUT /api/foods/:id
// body: bisa subset dari field createFood
const updateFood = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Param id tidak valid' });

    const {
      name, regionId, cityName, intro, body,
      imageUrl, articleId, geo
    } = req.body;

    const updated = await prisma.food.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(regionId !== undefined && { regionId: Number(regionId) }),
        ...(cityName !== undefined && { cityName }),
        ...(intro !== undefined && { intro }),
        ...(body !== undefined && { body }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(articleId !== undefined && { articleId: articleId ? Number(articleId) : null }),
        ...(geo?.lat !== undefined && { latitude: geo.lat }),
        ...(geo?.lng !== undefined && { longitude: geo.lng })
      }
    }).catch((e) => {
      if (e.code === 'P2025') return null;
      throw e;
    });

    if (!updated) return res.status(404).json({ message: 'Data makanan tidak ditemukan' });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'regionId atau articleId tidak valid' });
    }
    res.status(500).json({ message: 'Gagal memperbarui data makanan', error: error.message });
  }
};

module.exports = {
  getFeaturedFoods,
  getAllFoodPins,
  searchFoods,
  getFoodById,
  getMyReviewForFood,
  createReview,
  updateReview,
  createFood,
  listFoods,
  updateFood,
};
