/**
 * Retenção: mantém no máximo MAX_ARTICLES notícias publicadas.
 * Apaga as mais antigas (não manuais prioritárias? — apaga as mais antigas em geral,
 * mas tenta preservar a featured atual).
 */

import { prisma } from "./db";

export const MAX_ARTICLES = Number(process.env.MAX_ARTICLES || 200);

/**
 * Se houver mais de MAX_ARTICLES publicadas, remove as mais antigas.
 * @returns quantidade removida
 */
export async function pruneOldArticles(max = MAX_ARTICLES): Promise<number> {
  const limit = Math.max(50, max); // segurança mínima
  const total = await prisma.article.count({
    where: { status: "published" },
  });

  if (total <= limit) return 0;

  const excess = total - limit;

  // Busca as mais antigas (exceto a que está em destaque, se possível)
  const oldest = await prisma.article.findMany({
    where: {
      status: "published",
      featured: false,
    },
    orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
    take: excess,
    select: { id: true },
  });

  let ids = oldest.map((a) => a.id);

  // Se ainda faltar (todas featured ou poucas), pega qualquer mais antiga
  if (ids.length < excess) {
    const more = await prisma.article.findMany({
      where: {
        status: "published",
        id: { notIn: ids.length ? ids : ["__none__"] },
      },
      orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
      take: excess - ids.length,
      select: { id: true },
    });
    ids = ids.concat(more.map((a) => a.id));
  }

  if (ids.length === 0) return 0;

  // Soft-delete para não quebrar slugs antigos de uma vez; home só mostra published
  const result = await prisma.article.updateMany({
    where: { id: { in: ids } },
    data: { status: "deleted", featured: false },
  });

  console.log(
    `[retention] Removidas ${result.count} notícias antigas (limite ${limit}, total era ${total})`
  );

  // Limpa SeenLink muito antigos? opcional — mantemos links para não republicar o mesmo
  return result.count;
}
