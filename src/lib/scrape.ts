/**
 * Extrai título, resumo, imagem e parágrafos de uma URL de notícia.
 */

export type ScrapedArticle = {
  url: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  body: string;
  sourceName: string;
};

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, property: string): string {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return stripHtml(m[1]);
  }
  return "";
}

function absoluteUrl(base: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative;
  }
}

function hostnameLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "fonte";
  }
}

export async function scrapeArticleUrl(url: string): Promise<ScrapedArticle> {
  const cleaned = url.trim().split("#")[0];
  if (!/^https?:\/\//i.test(cleaned)) {
    throw new Error("Informe uma URL válida começando com http:// ou https://");
  }

  const res = await fetch(cleaned, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(25000),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Não foi possível abrir o link (HTTP ${res.status})`);
  }

  const html = await res.text();
  const finalUrl = res.url || cleaned;

  const ogTitle = metaContent(html, "og:title");
  const twitterTitle = metaContent(html, "twitter:title");
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "";

  const title =
    ogTitle ||
    twitterTitle ||
    stripHtml(h1) ||
    stripHtml(titleTag).split("|")[0].split("-")[0].trim();

  if (!title || title.length < 8) {
    throw new Error("Não encontrei o título da matéria nesta página");
  }

  const summary =
    metaContent(html, "og:description") ||
    metaContent(html, "description") ||
    metaContent(html, "twitter:description") ||
    "";

  let imageUrl =
    metaContent(html, "og:image") ||
    metaContent(html, "twitter:image") ||
    metaContent(html, "twitter:image:src") ||
    "";

  if (!imageUrl) {
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1] && !imgMatch[1].includes("data:")) {
      imageUrl = imgMatch[1];
    }
  }

  if (imageUrl) {
    imageUrl = absoluteUrl(finalUrl, imageUrl);
  }

  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripHtml(m[1]))
    .filter((t) => t.length >= 40)
    .filter(
      (t) =>
        !/^(clique aqui|veja também|veja tambem|saiba mais|leia|compartilh|assine|newsletter)/i.test(
          t
        )
    )
    .slice(0, 16);

  const body = paragraphs.join("\n\n");
  if (!body && !summary) {
    throw new Error("Não consegui extrair o texto da matéria. Tente outro link.");
  }

  return {
    url: finalUrl,
    title: title.slice(0, 300),
    summary: (summary || paragraphs[0] || "").slice(0, 1200),
    imageUrl: imageUrl || null,
    body: body || summary,
    sourceName: hostnameLabel(finalUrl),
  };
}
