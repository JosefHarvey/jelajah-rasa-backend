// src/controllers/region.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/* =========================
   Helpers
   ========================= */

// hitung rata-rata rating per Food (via tabel Rating) langsung di DB
async function getFoodsWithAverageForRegion(regionId) {
  // ambil food milik region + agregasi rating
  const foods = await prisma.food.findMany({
    where: { regionId },
    select: {
      id: true,
      name: true,
      intro: true,
      body: true,
      imageUrl: true,
      cityName: true,
      historyAndMeaning: true,
      cookingMethod: true,
      quickFacts: true,
      latitude: true,
      longitude: true,
      influencerComment: true,
      commentSource: true,
      articleId: true,
      // ambil count & avg rating tanpa mengirim seluruh rows rating
      ratings: {
        select: { value: true }
      }
    }
  });

  return foods.map(f => {
    const count = f.ratings.length;
    const sum = count ? f.ratings.reduce((a, r) => a + r.value, 0) : 0;
    const avg = count ? Number((sum / count).toFixed(2)) : null;
    const { ratings, ...rest } = f;
    return { ...rest, averageRating: avg, ratingsCount: count };
  });
}

/* =========================
   Controllers
   ========================= */

// GET /api/regions
// ?q=... (opsional) — cari by name
// ?withProfile=true — sertakan field profileContent/profileImageUrl/slug
const getAllRegions = async (req, res) => {
  try {
    const { q, withProfile } = req.query;

    const regions = await prisma.region.findMany({
      where: q
        ? { name: { contains: q, mode: 'insensitive' } }
        : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        cuisine_characteristics: true,
        ...(withProfile === 'true' && {
          profileContent: true,
          profileImageUrl: true,
          slug: true
        })
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json(regions);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data regions', error: error.message });
  }
};

// GET /api/regions/:id
// Menyertakan foods + average rating per food
// Opsional: ?include=restaurants,articles,profile (comma separated)
const getRegionById = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Param id tidak valid' });

  try {
    // parse include flags
    const includeSet = new Set((req.query.include || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean));

    const base = await prisma.region.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        cuisine_characteristics: true,
        ...(includeSet.has('profile') && {
          profileContent: true,
          profileImageUrl: true,
          slug: true
        })
      }
    });

    if (!base) return res.status(404).json({ message: 'Region tidak ditemukan' });

    // foods + avg rating
    const foods = await getFoodsWithAverageForRegion(id);

    // optional: restaurants
    let restaurants = undefined;
    if (includeSet.has('restaurants')) {
      restaurants = await prisma.restaurant.findMany({
        where: { regionId: id },
        select: {
          id: true, name: true, address: true, googleMapsLink: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // optional: articles (termasuk REGION_PROFILE jika ada)
    let articles = undefined;
    if (includeSet.has('articles')) {
      articles = await prisma.article.findMany({
        where: { regionId: id },
        select: {
          id: true, title: true, slug: true, type: true, coverImageUrl: true, publishedAt: true
        },
        orderBy: [{ type: 'asc' }, { publishedAt: 'desc' }]
      });
    }

    res.status(200).json({
      ...base,
      foods,
      ...(restaurants && { restaurants }),
      ...(articles && { articles })
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data region', error: error.message });
  }
};

// PUT /api/regions/:id/profile
// body: { profileContent, profileImageUrl, slug? }
const updateRegionProfile = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Param id tidak valid' });

  try {
    const { profileContent, profileImageUrl, slug } = req.body;

    const updated = await prisma.region.update({
      where: { id },
      data: {
        ...(profileContent !== undefined && { profileContent }),
        ...(profileImageUrl !== undefined && { profileImageUrl }),
        ...(slug !== undefined && { slug })
      },
      select: {
        id: true, name: true, profileContent: true, profileImageUrl: true, slug: true
      }
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') { // unique constraint (mis. slug)
      return res.status(409).json({ message: 'Slug sudah digunakan' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Region tidak ditemukan' });
    }
    res.status(500).json({ message: 'Gagal memperbarui profil region', error: error.message });
  }
};

// GET /api/regions/:id/top-dishes?limit=4
// Ambil “Wajib Dicoba” dari rata-rata rating Food
const getTopDishes = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Param id tidak valid' });
  const limit = Math.min(Number(req.query.limit || 4), 50);

  try {
    // ambil foods dgn avg rating (computed in JS; data rating minimal)
    const foods = await getFoodsWithAverageForRegion(id);

    // sort by avg desc, lalu by ratingsCount desc, lalu name asc
    foods.sort((a, b) => {
      const aAvg = a.averageRating ?? -1;
      const bAvg = b.averageRating ?? -1;
      if (bAvg !== aAvg) return bAvg - aAvg;
      if ((b.ratingsCount || 0) !== (a.ratingsCount || 0)) return (b.ratingsCount || 0) - (a.ratingsCount || 0);
      return a.name.localeCompare(b.name);
    });

    res.json({ data: foods.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil top dishes', error: error.message });
  }
};

// GET /api/regions/:id/restaurants?limit=20
const getRegionRestaurants = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Param id tidak valid' });
  const limit = Math.min(Number(req.query.limit || 20), 100);

  try {
    const data = await prisma.restaurant.findMany({
      where: { regionId: id },
      select: { id: true, name: true, address: true, googleMapsLink: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil daftar restoran', error: error.message });
  }
};

module.exports = {
  getAllRegions,
  getRegionById,
  updateRegionProfile,
  getTopDishes,
  getRegionRestaurants,
};
