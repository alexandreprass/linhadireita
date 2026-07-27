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
import {
  createRewriteJob,
  getRewriteJob,
  updateRewriteJob,
} from "@/lib/rewriteJobs";
import { scrapeArticleUrl } from "@/lib/scrape";
import { uniqueSlug } from "@/lib/slug";

// Plataformas que respeitam (Vercel etc.). No Render o timeout do proxy ainda existe,
// por isso o trabalho roda em background e o cliente faz poll.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * GET ?jobId=... → status do job
 * POST { url, useSameImage, featured } → inicia job e retorna jobId na hora
 */
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jobId = req.nextUrl.searchParams.get("jobId") || "";
  if (!jobId) {
    return NextResponse.json({ error: "jobId obrigatório" }, { status: 400 });
  }
  const job = getRewriteJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job não encontrado ou expirado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, job });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido no pedido" }, { status: 400 });
  }

  const url = String(body.url || "").trim();
  const useSameImage = body.useSameImage !== false;
  const featured = Boolean(body.featured);

  if (!url) {
    return NextResponse.json({ error: "Cole o link da notícia" }, { status: 400 });
  }

  const job = createRewriteJob();
  updateRewriteJob(job.id, { message: "Lendo a matéria…" });

  // Processa em background — resposta imediata evita timeout vazio
  void processRewriteJob(job.id, url, useSameImage, featured).catch((err) => {
    console.error("[rewrite-url] background fatal", err);
    updateRewriteJob(job.id, {
      status: "error",
      error: err instanceof Error ? err.message : "Erro inesperado",
      message: "Falhou",
      finishedAt: Date.now(),
    });
  });

  return NextResponse.json({
    ok: true,
    started: true,
    jobId: job.id,
    message: "Reescrita iniciada. Acompanhe o status…",
  });
}

async function processRewriteJob(
  jobId: string,
  url: string,
  useSameImage: boolean,
  featured: boolean
) {
  try {
    updateRewriteJob(jobId, { message: "Extraindo texto e imagem da página…" });
    const scraped = await scrapeArticleUrl(url);

    const blocked = isBlockedContent(scraped.title, scraped.summary, scraped.body);
    if (blocked.blocked) {
      updateRewriteJob(jobId, {
        status: "error",
        error: blocked.reason,
        message: "Bloqueado pelas regras editoriais",
        finishedAt: Date.now(),
      });
      return;
    }

    updateRewriteJob(jobId, { message: "Checando duplicatas…" });
    const dup = await isDuplicateNews({
      originalLink: scraped.url,
      originalTitle: scraped.title,
    });
    if (dup.duplicate) {
      updateRewriteJob(jobId, {
        status: "error",
        error: `Notícia repetida: ${dup.reason}${
          dup.matchedTitle ? ` — “${dup.matchedTitle}”` : ""
        }`,
        message: "Duplicada",
        finishedAt: Date.now(),
      });
      return;
    }

    updateRewriteJob(jobId, { message: "Reescrevendo com a IA (Grok)…" });
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
    let usedOriginalImage = false;

    if (useSameImage && scraped.imageUrl) {
      imageUrl = scraped.imageUrl;
      usedOriginalImage = true;
      updateRewriteJob(jobId, { message: "Usando imagem original…" });
    } else {
      updateRewriteJob(jobId, { message: "Gerando imagem com a IA…" });
      imageUrl = await generateNewsImage({
        title: rewritten.title,
        lead: rewritten.lead,
        category,
        originalTitle: scraped.title,
        tags: rewritten.tags,
      });
      if (!imageUrl && scraped.imageUrl) {
        imageUrl = scraped.imageUrl;
        usedOriginalImage = true;
      }
    }

    if (featured) {
      await prisma.article.updateMany({
        where: { featured: true },
        data: { featured: false },
      });
    }

    updateRewriteJob(jobId, { message: "Publicando no site…" });
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

    updateRewriteJob(jobId, {
      status: "ok",
      message: `Publicada: “${article.title}”`,
      usedOriginalImage,
      article: { id: article.id, slug: article.slug, title: article.title },
      finishedAt: Date.now(),
    });
  } catch (err) {
    const msg =
      err instanceof RejectedContentError || err instanceof GrokError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Falha ao processar o link";
    console.error("[rewrite-url] job error", err);
    updateRewriteJob(jobId, {
      status: "error",
      error: msg,
      message: "Falhou",
      finishedAt: Date.now(),
    });
  }
}
