const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/articles/:articleId/reviews
// body: { rating (1-5), comment? }
exports.createArticleReview = async (req, res) => {
  const articleId = Number(req.params.articleId);
  const userId = req.user?.userId;
  const { rating, comment } = req.body;

  if (!articleId) return res.status(400).json({ message: 'Param articleId tidak valid' });
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'rating wajib 1–5' });

  // cek artikel ada
  const art = await prisma.article.findUnique({ where: { id: articleId } });
  if (!art) return res.status(404).json({ message: 'Artikel tidak ditemukan' });

  try {
    const created = await prisma.review.create({
      data: { articleId, userId, rating, comment: comment ?? null }
    });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Anda sudah memberi ulasan pada artikel ini. Gunakan endpoint edit.',
        editEndpoint: `/api/articles/${articleId}/reviews/me`
      });
    }
    res.status(500).json({ message: 'Gagal menyimpan ulasan', error: error.message });
  }
};

// PUT /api/articles/:articleId/reviews/me
// body: { rating?, comment? }
exports.updateMyArticleReview = async (req, res) => {
  const articleId = Number(req.params.articleId);
  const userId = req.user?.userId;
  const { rating, comment } = req.body;

  if (!articleId) return res.status(400).json({ message: 'Param articleId tidak valid' });
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const existing = await prisma.review.findUnique({
    where: { articleId_userId: { articleId, userId } }
  });

  if (!existing) return res.status(404).json({ message: 'Review belum ada, gunakan endpoint create.' });

  const updated = await prisma.review.update({
    where: { articleId_userId: { articleId, userId } },
    data: {
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment })
    }
  });

  res.json(updated);
};

// GET /api/articles/:articleId/reviews
exports.listArticleReviews = async (req, res) => {
  const articleId = Number(req.params.articleId);
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 10)));

  try {
    const [total, data] = await Promise.all([
      prisma.review.count({ where: { articleId } }),
      prisma.review.findMany({
        where: { articleId },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);
    res.json({ data, meta: { total, page, pageSize } });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil ulasan', error: error.message });
  }
};

// GET /api/articles/:articleId/reviews/average
exports.getArticleAverage = async (req, res) => {
  const articleId = Number(req.params.articleId);
  try {
    const agg = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
      where: { articleId }
    });
    res.json({
      articleId,
      count: agg._count._all,
      average: agg._count._all ? Number(agg._avg.rating.toFixed(2)) : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghitung rata-rata', error: error.message });
  }
};
