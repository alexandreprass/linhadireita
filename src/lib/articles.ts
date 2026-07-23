import { prisma } from "./db";

export function parseTags(tags: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(tags || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
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

export async function listPublished(opts: {
  category?: string;
  sourceId?: string;
  q?: string;
  excludeId?: string;
  take?: number;
  skip?: number;
}) {
  const take = opts.take ?? 12;
  const skip = opts.skip ?? 0;
  const where: Record<string, unknown> = { status: "published" };
  if (opts.category) where.category = opts.category;
  if (opts.sourceId) where.sourceId = opts.sourceId;
  if (opts.excludeId) where.id = { not: opts.excludeId };
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
