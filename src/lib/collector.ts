/**
 * Pipeline de coleta:
 * RSS → foco editorial → filtro Lula/PT → reescrita Grok → imagem → publica
 * Limite: 2 notícias novas por hora (MAX_REWRITE_PER_CYCLE / rate limit).
 */

import Parser from "rss-parser";
import { prisma } from "./db";
import { isBlockedContent, isOnTopic } from "./filter";
import {
  generateNewsImage,
  GrokError,
  RejectedContentError,
  rewriteArticle,
  type RawArticle,
} from "./grok";
import { normalizeCategory } from "./categories";
import { isDuplicateNews } from "./dedupe";
import { pruneOldArticles } from "./retention";
import { uniqueSlug } from "./slug";
import { SOURCES } from "./sources";

/** Máximo de notícias automáticas por ciclo e por hora. */
export const MAX_NEWS_PER_HOUR = Number(process.env.MAX_REWRITE_PER_CYCLE || 2);

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; LinhaDireita/1.0; +https://linhadireita.com)",
  },
});

export type CollectStats = {
  ok: boolean;
  message: string;
  fetched: number;
  skippedSeen: number;
  skippedBlocked: number;
  skippedOffTopic: number;
  skippedRateLimit: number;
  skippedDuplicate: number;
  pruned: number;
  saved: number;
  imagesOk: number;
  errors: string[];
  articles: { id: string; slug: string; title: string }[];
};

let running = false;

export function isCollectRunning() {
  return running;
}

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function guessCategory(title: string, summary: string, link: string): string {
  const blob = `${title} ${summary} ${link}`.toLowerCase();
  const rules: [string, string[]][] = [
    ["eleicoes", ["eleic", "urna", "tse", "candidato", "campanha"]],
    ["stf", ["stf", "supremo", "moraes"]],
    ["congresso", ["congresso", "senado", "camara", "deputado", "senador", "pec "]],
    ["eua", ["eua", "trump", "estados unidos", "casa branca", "washington"]],
    ["seguranca", ["policia", "crime", "trafico", "seguranca", "tiroteio", "faccao", "pcc"]],
    ["economia", ["vorcaro", "banco master", "banco central", "juros", "mercado", "banc"]],
    ["politica", ["politic", "governo", "bolsonaro", "planalto", "ministro"]],
    ["brasil", ["brasil", "brasilia", "estado"]],
  ];
  for (const [cat, keys] of rules) {
    if (keys.some((k) => blob.includes(k))) return cat;
  }
  return "politica";
}

/** Quantas notícias automáticas já saíram na última hora. */
async function autoPublishedInLastHour(): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.article.count({
    where: {
      isManual: false,
      status: "published",
      createdAt: { gte: since },
    },
  });
}

function extractImage(item: Parser.Item): string | null {
  const anyItem = item as Parser.Item & {
    enclosure?: { url?: string; type?: string };
    "media:content"?: { $?: { url?: string } };
    "media:thumbnail"?: { $?: { url?: string } };
  };
  if (anyItem.enclosure?.url && (anyItem.enclosure.type || "").startsWith("image")) {
    return anyItem.enclosure.url;
  }
  const media = anyItem["media:content"]?.$?.url || anyItem["media:thumbnail"]?.$?.url;
  if (media) return media;
  const html = item.content || item.contentSnippet || item.summary || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || null;
}

/** Baixa trechos de parágrafos da matéria original (base factual). */
async function fetchArticleContext(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LinhaDireita/1.0)" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripHtml(m[1]))
      .filter((t) => t.length >= 40)
      .filter((t) => !/^(clique aqui|veja também|veja tambem|saiba mais|leia)/i.test(t))
      .slice(0, 12);
    return paras.join("\n");
  } catch {
    return "";
  }
}

async function collectRawFromRss(maxPerFeed = 12): Promise<RawArticle[]> {
  const out: RawArticle[] = [];
  const seen = new Set<string>();

  for (const source of SOURCES) {
    for (const feedUrl of source.feeds) {
      try {
        console.log(`[collector] Lendo ${source.name}: ${feedUrl}`);
        const feed = await parser.parseURL(feedUrl);
        for (const item of (feed.items || []).slice(0, maxPerFeed)) {
          const link = (item.link || "").split("#")[0].trim();
          const title = stripHtml(item.title || "");
          if (!link || !title || seen.has(link)) continue;
          seen.add(link);

          const summary = stripHtml(item.contentSnippet || item.summary || item.content || "").slice(
            0,
            1200
          );
          out.push({
            originalTitle: title,
            originalSummary: summary,
            originalLink: link,
            sourceId: source.id,
            sourceName: source.name,
            imageUrl: extractImage(item),
            publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
            categoryHint: guessCategory(title, summary, link),
          });
        }
      } catch (err) {
        console.error(`[collector] Falha feed ${feedUrl}:`, err);
      }
    }
  }

  out.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
  return out;
}

/**
 * Executa um ciclo completo de coleta e publicação automática.
 */
export async function runCollectionCycle(maxRewrite?: number): Promise<CollectStats> {
  if (running) {
    return {
      ok: false,
      message: "Coleta já em andamento",
      fetched: 0,
      skippedSeen: 0,
      skippedBlocked: 0,
      skippedOffTopic: 0,
      skippedRateLimit: 0,
      skippedDuplicate: 0,
      pruned: 0,
      saved: 0,
      imagesOk: 0,
      errors: [],
      articles: [],
    };
  }

  running = true;
  const hourCap = MAX_NEWS_PER_HOUR;
  const alreadyThisHour = await autoPublishedInLastHour();
  const remainingHour = Math.max(0, hourCap - alreadyThisHour);
  const requested = maxRewrite ?? hourCap;
  const limit = Math.min(requested, remainingHour, hourCap);

  const job = await prisma.jobLog.create({
    data: { kind: "collect", status: "running" },
  });

  const stats: CollectStats = {
    ok: true,
    message: "",
    fetched: 0,
    skippedSeen: 0,
    skippedBlocked: 0,
    skippedOffTopic: 0,
    skippedRateLimit: 0,
    skippedDuplicate: 0,
    pruned: 0,
    saved: 0,
    imagesOk: 0,
    errors: [],
    articles: [],
  };

  try {
    if (limit <= 0) {
      stats.skippedRateLimit = 1;
      stats.message = `limite de ${hourCap} notícias/hora atingido (já publicadas nesta hora: ${alreadyThisHour})`;
      await prisma.jobLog.update({
        where: { id: job.id },
        data: { status: "ok", detail: stats.message, finishedAt: new Date() },
      });
      return stats;
    }

    const rawList = await collectRawFromRss();
    stats.fetched = rawList.length;

    let processed = 0;
    for (const raw of rawList) {
      if (processed >= limit) break;

      try {
        // Anti-repetição: link + título parecido com matérias recentes
        const dup = await isDuplicateNews({
          originalLink: raw.originalLink,
          originalTitle: raw.originalTitle,
        });
        if (dup.duplicate) {
          stats.skippedDuplicate += 1;
          stats.skippedSeen += 1;
          await prisma.seenLink.upsert({
            where: { link: raw.originalLink },
            create: { link: raw.originalLink },
            update: {},
          });
          console.log(`[collector] DUPLICADA: ${raw.originalTitle.slice(0, 60)} (${dup.reason})`);
          continue;
        }

        // Foco editorial (política, segurança, eleições, EUA, STF, Congresso, Vorcaro...)
        if (!isOnTopic(raw.originalTitle, raw.originalSummary, raw.originalLink)) {
          stats.skippedOffTopic += 1;
          await prisma.seenLink.upsert({
            where: { link: raw.originalLink },
            create: { link: raw.originalLink },
            update: {},
          });
          continue;
        }

        // Filtro Lula/PT / esporte
        const pre = isBlockedContent(raw.originalTitle, raw.originalSummary, raw.originalLink);
        if (pre.blocked) {
          stats.skippedBlocked += 1;
          await prisma.seenLink.upsert({
            where: { link: raw.originalLink },
            create: { link: raw.originalLink },
            update: {},
          });
          console.log(`[collector] BLOQUEADO: ${raw.originalTitle.slice(0, 70)}`);
          continue;
        }

        const context = await fetchArticleContext(raw.originalLink);
        if (!isOnTopic(raw.originalTitle, raw.originalSummary, context)) {
          stats.skippedOffTopic += 1;
          await prisma.seenLink.upsert({
            where: { link: raw.originalLink },
            create: { link: raw.originalLink },
            update: {},
          });
          continue;
        }

        const post = isBlockedContent(raw.originalTitle, raw.originalSummary, context);
        if (post.blocked) {
          stats.skippedBlocked += 1;
          await prisma.seenLink.upsert({
            where: { link: raw.originalLink },
            create: { link: raw.originalLink },
            update: {},
          });
          continue;
        }

        raw.articleContext = context;

        let rewritten;
        try {
          rewritten = await rewriteArticle(raw);
        } catch (err) {
          if (err instanceof RejectedContentError) {
            stats.skippedBlocked += 1;
            await prisma.seenLink.upsert({
              where: { link: raw.originalLink },
              create: { link: raw.originalLink },
              update: {},
            });
            console.log(`[collector] Rejeitado: ${err.message}`);
            continue;
          }
          throw err;
        }

        // Segunda checagem: título reescrito pode colidir com outra matéria
        const dupAfter = await isDuplicateNews({
          originalLink: raw.originalLink,
          originalTitle: raw.originalTitle,
          title: rewritten.title,
        });
        if (dupAfter.duplicate && dupAfter.reason !== "link já utilizado") {
          // link ainda não marcado se só o título bateu com outra pauta
          stats.skippedDuplicate += 1;
          await prisma.seenLink.upsert({
            where: { link: raw.originalLink },
            create: { link: raw.originalLink },
            update: {},
          });
          console.log(
            `[collector] DUPLICADA pós-IA: ${rewritten.title.slice(0, 60)} (${dupAfter.reason})`
          );
          continue;
        }

        // Imagem Grok Imagine (fallback: feed)
        let imageUrl = raw.imageUrl || null;
        try {
          const generated = await generateNewsImage({
            title: rewritten.title,
            lead: rewritten.lead,
            category: rewritten.category,
          });
          if (generated) {
            imageUrl = generated;
            stats.imagesOk += 1;
          }
        } catch (imgErr) {
          stats.errors.push(`img: ${String(imgErr)}`);
        }

        const slug = uniqueSlug(rewritten.title, raw.originalLink);

        // Destaca a mais recente automaticamente
        await prisma.article.updateMany({
          where: { featured: true },
          data: { featured: false },
        });

        const article = await prisma.article.create({
          data: {
            slug,
            title: rewritten.title,
            lead: rewritten.lead,
            body: rewritten.body,
            category: normalizeCategory(rewritten.category || raw.categoryHint || "politica"),
            tags: JSON.stringify(rewritten.tags),
            imageUrl,
            sourceId: raw.sourceId,
            sourceName: raw.sourceName,
            originalTitle: raw.originalTitle,
            originalLink: raw.originalLink,
            originalSummary: raw.originalSummary,
            rewriteModel: rewritten.rewriteModel,
            featured: true,
            status: "published",
            isManual: false,
            publishedAt: raw.publishedAt || new Date(),
          },
        });

        await prisma.seenLink.upsert({
          where: { link: raw.originalLink },
          create: { link: raw.originalLink },
          update: {},
        });

        processed += 1;
        stats.saved += 1;
        stats.articles.push({ id: article.id, slug: article.slug, title: article.title });
        console.log(`[collector] PUBLICADO: ${article.title.slice(0, 80)}`);

        // Mantém no máximo 200 notícias (apaga as mais antigas)
        stats.pruned += await pruneOldArticles();
      } catch (err) {
        const msg = err instanceof GrokError ? err.message : String(err);
        stats.errors.push(`${raw.originalTitle}: ${msg}`);
        console.error("[collector] Erro artigo:", msg);
        // marca link para não travar o mesmo item
        try {
          await prisma.seenLink.upsert({
            where: { link: raw.originalLink },
            create: { link: raw.originalLink },
            update: {},
          });
        } catch {
          /* ignore */
        }
      }
    }

    // Limpeza final de retenção
    stats.pruned += await pruneOldArticles();

    stats.message =
      `fetched=${stats.fetched} saved=${stats.saved} blocked=${stats.skippedBlocked} ` +
      `offtopic=${stats.skippedOffTopic} dup=${stats.skippedDuplicate} skip=${stats.skippedSeen} ` +
      `imgs=${stats.imagesOk} pruned=${stats.pruned} limit=${limit}/h`;
    await prisma.jobLog.update({
      where: { id: job.id },
      data: { status: "ok", detail: stats.message, finishedAt: new Date() },
    });
    return stats;
  } catch (err) {
    stats.ok = false;
    stats.message = String(err);
    stats.errors.push(String(err));
    await prisma.jobLog.update({
      where: { id: job.id },
      data: { status: "error", detail: stats.message, finishedAt: new Date() },
    });
    return stats;
  } finally {
    running = false;
  }
}
