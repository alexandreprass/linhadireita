import { CATEGORY_SLUGS } from "./categories";
import { prisma } from "./db";

export function parseTags(tags: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(tags || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function getFeaturedArticle() {
  const featured = await prisma.article.findFirst({
    where: { status: "published", featured: true },
    orderBy: { publishedAt: "desc" },
  });
  if (featured) return featured;

  // Sempre há destaque: pega a mais recente
  return prisma.article.findFirst({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
  });
}

/**
 * Principais: 1 notícia mais recente de cada categoria.
 */
export async function getLatestPerCategory(excludeIds: string[] = []) {
  const rows = await Promise.all(
    CATEGORY_SLUGS.map((category) =>
      prisma.article.findFirst({
        where: {
          status: "published",
          category,
          ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
        },
        orderBy: { publishedAt: "desc" },
      })
    )
  );
  return rows.filter((r): r is NonNullable<typeof r> => Boolean(r));
}

/**
 * Mais notícias: aleatórias publicadas nas últimas 24h.
 * Se não houver o bastante, completa com as mais recentes fora do conjunto excluído.
 */
export async function getRandomLast24Hours(opts: {
  take: number;
  excludeIds?: string[];
}) {
  const take = opts.take;
  const excludeIds = opts.excludeIds || [];
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const last24 = await prisma.article.findMany({
    where: {
      status: "published",
      publishedAt: { gte: since },
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  let pool = shuffle(last24);

  if (pool.length < take) {
    const more = await prisma.article.findMany({
      where: {
        status: "published",
        id: {
          notIn: [...excludeIds, ...pool.map((p) => p.id)],
        },
      },
      orderBy: { publishedAt: "desc" },
      take: take - pool.length + 10,
    });
    pool = [...pool, ...shuffle(more)];
  }

  return pool.slice(0, take);
}

export async function listPublished(opts: {
  category?: string;
  sourceId?: string;
  q?: string;
  excludeId?: string;
  excludeIds?: string[];
  take?: number;
  skip?: number;
}) {
  const take = opts.take ?? 12;
  const skip = opts.skip ?? 0;
  const where: Record<string, unknown> = { status: "published" };
  if (opts.category) where.category = opts.category;
  if (opts.sourceId) where.sourceId = opts.sourceId;

  const notIds = [
    ...(opts.excludeId ? [opts.excludeId] : []),
    ...(opts.excludeIds || []),
  ];
  if (notIds.length === 1) where.id = { not: notIds[0] };
  else if (notIds.length > 1) where.id = { notIn: notIds };

  if (opts.q?.trim()) {
    const q = opts.q.trim();
    where.OR = [
      { title: { contains: q } },
      { lead: { contains: q } },
      { body: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take,
      skip,
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total };
}

export async function getBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, status: "published" },
  });
}

export async function relatedArticles(article: {
  id: string;
  category: string;
  sourceId: string | null;
}) {
  return prisma.article.findMany({
    where: {
      status: "published",
      id: { not: article.id },
      OR: [
        { category: article.category },
        ...(article.sourceId ? [{ sourceId: article.sourceId }] : []),
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 4,
  });
}
