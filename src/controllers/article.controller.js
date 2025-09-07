const { PrismaClient, ArticleType } = require('@prisma/client');
const prisma = new PrismaClient();

function parseId(v) { const n = Number(v); return Number.isNaN(n) ? null : n; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureUniqueSlug(base) {
  let slug = slugify(base);
  if (!slug) slug = 'artikel';
  let i = 0;
  // cek unik
  while (true) {
    const exists = await prisma.article.findUnique({ where: { slug } });
    if (!exists) return slug;
    i += 1;
    slug = `${slugify(base)}-${i}`;
  }
}

// POST /api/articles
// body: { title, content, type?, regionId?, coverImageUrl?, publishedAt?, authorId? }
exports.create = async (req, res) => {
  try {
    const { title, content, type = 'STORY', regionId, coverImageUrl, publishedAt, authorId } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'title dan content wajib diisi' });

    if (!Object.values(ArticleType).includes(type)) {
      return res.status(400).json({ message: 'type tidak valid (STORY | REGION_PROFILE)' });
    }

    const slug = await ensureUniqueSlug(title);

    const created = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        type,
        regionId: regionId ? Number(regionId) : null,
        coverImageUrl: coverImageUrl ?? null,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        authorId: req.user?.userId ?? authorId ?? null
      },
      select: {
        id: true, title: true, slug: true, type: true, regionId: true, coverImageUrl: true, publishedAt: true
      }
    });

    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'regionId/authorId tidak valid' });
    }
    res.status(500).json({ message: 'Gagal membuat artikel', error: error.message });
  }
};

// GET /api/articles?regionId=&type=&q=&page=1&pageSize=10
exports.list = async (req, res) => {
  try {
    const regionId = req.query.regionId ? Number(req.query.regionId) : undefined;
    const type = req.query.type && Object.values(ArticleType).includes(req.query.type) ? req.query.type : undefined;
    const q = req.query.q || undefined;
    const page = clamp(Number(req.query.page || 1), 1, 1_000_000);
    const pageSize = clamp(Number(req.query.pageSize || 10), 1, 100);

    const where = {
      ...(regionId ? { regionId } : {}),
      ...(type ? { type } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {})
    };

    const [total, rows] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        select: {
          id: true, title: true, slug: true, type: true, coverImageUrl: true, publishedAt: true,
          region: { select: { id: true, name: true } }
        },
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({ data: rows, meta: { total, page, pageSize } });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil daftar artikel', error: error.message });
  }
};

// GET /api/articles/:id
exports.detail = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Param id tidak valid' });

    const row = await prisma.article.findUnique({
      where: { id },
      include: {
        region: { select: { id: true, name: true } },
        author: { select: { id: true, firstName: true, lastName: true } }
      }
    });
    if (!row) return res.status(404).json({ message: 'Artikel tidak ditemukan' });

    // average review artikel
    const agg = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
      where: { articleId: id }
    });

    res.json({
      ...row,
      reviewSummary: {
        count: agg._count._all,
        average: agg._count._all ? Number(agg._avg.rating.toFixed(2)) : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil detail artikel', error: error.message });
  }
};

// PUT /api/articles/:id
exports.update = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Param id tidak valid' });

    const { title, content, type, regionId, coverImageUrl, publishedAt } = req.body;

    // kalau title berubah → bisa generate slug baru (opsional). Di sini tidak otomatis ganti slug.
    const updated = await prisma.article.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(regionId !== undefined && { regionId: regionId ? Number(regionId) : null }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null })
      }
    }).catch(e => (e.code === 'P2025' ? null : Promise.reject(e)));

    if (!updated) return res.status(404).json({ message: 'Artikel tidak ditemukan' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui artikel', error: error.message });
  }
};
