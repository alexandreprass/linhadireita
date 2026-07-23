import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { isBlockedContent } from "@/lib/filter";
import { generateNewsImage } from "@/lib/grok";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { normalizeCategory } from "@/lib/categories";
import { isDuplicateNews } from "@/lib/dedupe";
import { pruneOldArticles } from "@/lib/retention";

/**
 * Publicação manual de notícia pelo admin.
 * Opcionalmente gera imagem com Grok Imagine.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const lead = String(body.lead || "").trim();
  const content = String(body.body || "").trim();
  let category = String(body.category || "politica").trim().toLowerCase();
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).toLowerCase().trim()).filter(Boolean)
    : String(body.tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
  let imageUrl = body.imageUrl ? String(body.imageUrl) : null;
  const generateImage = body.generateImage !== false;
  const featured = Boolean(body.featured);

  if (!title || !content) {
    return NextResponse.json({ error: "Título e corpo são obrigatórios" }, { status: 400 });
  }

  const blocked = isBlockedContent(title, lead, content);
  if (blocked.blocked) {
    return NextResponse.json({ error: blocked.reason }, { status: 400 });
  }

  const dup = await isDuplicateNews({ title, originalTitle: title });
  if (dup.duplicate) {
    return NextResponse.json(
      { error: `Notícia repetida: ${dup.reason}${dup.matchedTitle ? ` — “${dup.matchedTitle}”` : ""}` },
      { status: 409 }
    );
  }

  category = normalizeCategory(category);

  if (generateImage && !imageUrl) {
    imageUrl = await generateNewsImage({ title, lead, category });
  }

  if (featured) {
    await prisma.article.updateMany({ where: { featured: true }, data: { featured: false } });
  }

  const slug = uniqueSlug(title, `manual-${Date.now()}-${title}`);
  const article = await prisma.article.create({
    data: {
      slug,
      title,
      lead,
      body: content,
      category,
      tags: JSON.stringify(tags),
      imageUrl,
      sourceId: "manual",
      sourceName: "Linha Direita",
      rewriteModel: "manual",
      featured,
      status: "published",
      isManual: true,
      publishedAt: new Date(),
    },
  });

  await pruneOldArticles();

  return NextResponse.json({ ok: true, article });
}
