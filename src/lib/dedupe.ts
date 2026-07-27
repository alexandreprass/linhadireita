/**
 * Anti-repetição de notícias:
 * - link original já visto (qualquer data)
 * - título/assunto similar às matérias das últimas 24 horas
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

const HOURS_24_MS = 24 * 60 * 60 * 1000;

/**
 * Verifica se a pauta já foi coberta.
 * - Link: nunca republica o mesmo link (histórico completo)
 * - Título/assunto: bloqueia se similar a notícia das últimas 24h
 */
export async function isDuplicateNews(opts: {
  originalLink?: string | null;
  originalTitle?: string | null;
  title?: string | null;
  threshold?: number;
  hoursWindow?: number;
}): Promise<DedupeHit> {
  const threshold = opts.threshold ?? 0.5;
  const hoursWindow = opts.hoursWindow ?? 24;

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

  const since = new Date(Date.now() - hoursWindow * 60 * 60 * 1000);

  const candidates = await prisma.article.findMany({
    where: {
      status: "published",
      OR: [
        { publishedAt: { gte: since } },
        { createdAt: { gte: since } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 200,
    select: { title: true, originalTitle: true, slug: true, publishedAt: true },
  });

  const incoming = [opts.title, opts.originalTitle].filter(Boolean).map(String);

  for (const cand of candidates) {
    const existing = [cand.title, cand.originalTitle].filter(Boolean).map(String);
    for (const a of incoming) {
      for (const b of existing) {
        if (normalizeText(a) === normalizeText(b) && normalizeText(a).length > 10) {
          return {
            duplicate: true,
            reason: `título idêntico (últimas ${hoursWindow}h)`,
            matchedTitle: cand.title,
          };
        }
        const sim = tokenSimilarity(a, b);
        if (sim >= threshold) {
          return {
            duplicate: true,
            reason: `assunto similar nas últimas ${hoursWindow}h (${Math.round(sim * 100)}%)`,
            matchedTitle: cand.title,
          };
        }
      }
    }
  }

  // Também evita reprocessar o mesmo título se SeenLink não pegou (edge case)
  void HOURS_24_MS;

  return { duplicate: false, reason: "" };
}
