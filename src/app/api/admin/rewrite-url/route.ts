import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { normalizeCategory } from "@/lib/categories";
import { isDuplicateNews } from "@/lib/dedupe";
import { isBlockedContent } from "@/lib/filter";
import { prisma } from "@/lib/db";
import {
  generateNewsImage,
  GrokError,
  RejectedContentError,
  rewriteArticle,
} from "@/lib/grok";
import { pruneOldArticles } from "@/lib/retention";
import { scrapeArticleUrl } from "@/lib/scrape";
import { uniqueSlug } from "@/lib/slug";

/**
 * Admin cola um link de notícia → extrai conteúdo → reescreve com Grok → publica.
 * useSameImage: true = usa og:image da matéria; false = gera com Grok Imagine.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const url = String(body.url || "").trim();
  const useSameImage = body.useSameImage !== false; // padrão: usar mesma imagem
  const featured = Boolean(body.featured);

  if (!url) {
    return NextResponse.json({ error: "Cole o link da notícia" }, { status: 400 });
  }

  try {
    const scraped = await scrapeArticleUrl(url);

    const blocked = isBlockedContent(scraped.title, scraped.summary, scraped.body);
    if (blocked.blocked) {
      return NextResponse.json({ error: blocked.reason }, { status: 400 });
    }

    const dup = await isDuplicateNews({
      originalLink: scraped.url,
      originalTitle: scraped.title,
    });
    if (dup.duplicate) {
      return NextResponse.json(
        {
          error: `Notícia repetida: ${dup.reason}${
            dup.matchedTitle ? ` — “${dup.matchedTitle}”` : ""
          }`,
        },
        { status: 409 }
      );
    }

    const rewritten = await rewriteArticle({
      originalTitle: scraped.title,
      originalSummary: scraped.summary,
      originalLink: scraped.url,
      sourceId: "url_import",
      sourceName: scraped.sourceName,
      imageUrl: scraped.imageUrl,
      publishedAt: new Date(),
      categoryHint: "politica",
      articleContext: scraped.body,
    });

    const category = normalizeCategory(rewritten.category);

    let imageUrl: string | null = null;
    if (useSameImage && scraped.imageUrl) {
      imageUrl = scraped.imageUrl;
    } else {
      imageUrl = await generateNewsImage({
        title: rewritten.title,
        lead: rewritten.lead,
        category,
        originalTitle: scraped.title,
        tags: rewritten.tags,
      });
      // se IA falhar e existir imagem original, usa como fallback
      if (!imageUrl && scraped.imageUrl) {
        imageUrl = scraped.imageUrl;
      }
    }

    if (featured) {
      await prisma.article.updateMany({
        where: { featured: true },
        data: { featured: false },
      });
    }

    const slug = uniqueSlug(rewritten.title, scraped.url);
    const article = await prisma.article.create({
      data: {
        slug,
        title: rewritten.title,
        lead: rewritten.lead,
        body: rewritten.body,
        category,
        tags: JSON.stringify(rewritten.tags),
        imageUrl,
        sourceId: "url_import",
        sourceName: scraped.sourceName,
        originalTitle: scraped.title,
        originalLink: scraped.url,
        originalSummary: scraped.summary,
        rewriteModel: rewritten.rewriteModel,
        featured,
        status: "published",
        isManual: true,
        publishedAt: new Date(),
      },
    });

    await prisma.seenLink.upsert({
      where: { link: scraped.url },
      create: { link: scraped.url },
      update: {},
    });

    await pruneOldArticles();

    return NextResponse.json({
      ok: true,
      article,
      usedOriginalImage: Boolean(useSameImage && scraped.imageUrl),
      scrapedTitle: scraped.title,
    });
  } catch (err) {
    if (err instanceof RejectedContentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof GrokError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[rewrite-url]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao processar o link" },
      { status: 500 }
    );
  }
}
