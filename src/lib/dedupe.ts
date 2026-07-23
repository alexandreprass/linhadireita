/**
 * Anti-repetição de notícias:
 * - link original já visto (SeenLink / originalLink)
 * - título muito parecido com matérias recentes
 */

import { prisma } from "./db";

const STOPWORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "de", "da", "do", "das", "dos", "e", "em", "no", "na",
  "nos", "nas", "por", "para", "com", "sem", "que", "se", "ao", "aos", "à", "às", "ou",
  "the", "and", "of", "in", "on", "to", "for", "is", "are", "was", "sobre", "apos",
  "após", "diz", "dizem", "veja", "como", "mais", "ja", "já", "nao", "não", "ser",
]);

export function normalizeText(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function significantTokens(text: string): Set<string> {
  const tokens = normalizeText(text)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return new Set(tokens);
}

/** Similaridade Jaccard entre conjuntos de tokens (0–1). */
export function tokenSimilarity(a: string, b: string): number {
  const sa = significantTokens(a);
  const sb = significantTokens(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) {
    if (sb.has(t)) inter += 1;
  }
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export type DedupeHit = {
  duplicate: boolean;
  reason: string;
  matchedTitle?: string;
};

/**
 * Verifica se a pauta já foi coberta (link, título original ou reescrito).
 * threshold ~0.55 evita "mesmo assunto" com título levemente diferente.
 */
export async function isDuplicateNews(opts: {
  originalLink?: string | null;
  originalTitle?: string | null;
  title?: string | null;
  threshold?: number;
  lookback?: number;
}): Promise<DedupeHit> {
  const threshold = opts.threshold ?? 0.55;
  const lookback = opts.lookback ?? 120;

  const link = (opts.originalLink || "").trim();
  if (link) {
    const seen =
      (await prisma.seenLink.findUnique({ where: { link } })) ||
      (await prisma.article.findFirst({
        where: { originalLink: link, status: { not: "deleted" } },
      }));
    if (seen) {
      return { duplicate: true, reason: "link já utilizado" };
    }
  }

  const candidates = await prisma.article.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: lookback,
    select: { title: true, originalTitle: true, slug: true },
  });

  const incoming = [opts.title, opts.originalTitle].filter(Boolean).map(String);

  for (const cand of candidates) {
    const existing = [cand.title, cand.originalTitle].filter(Boolean).map(String);
    for (const a of incoming) {
      for (const b of existing) {
        // Match quase idêntico
        if (normalizeText(a) === normalizeText(b) && normalizeText(a).length > 10) {
          return {
            duplicate: true,
            reason: "título idêntico",
            matchedTitle: cand.title,
          };
        }
        const sim = tokenSimilarity(a, b);
        if (sim >= threshold) {
          return {
            duplicate: true,
            reason: `assunto similar (${Math.round(sim * 100)}%)`,
            matchedTitle: cand.title,
          };
        }
      }
    }
  }

  return { duplicate: false, reason: "" };
}
