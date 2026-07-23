/**
 * Integração com a API xAI / Grok (texto + imagens).
 * Base OpenAI-compatible: https://api.x.ai/v1
 */

import { normalizeCategory } from "./categories";
import { editorialSystemRules, isBlockedContent, isBolsonaroRelated } from "./filter";

const XAI_BASE = "https://api.x.ai/v1";

export class GrokError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrokError";
  }
}

export class RejectedContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RejectedContentError";
  }
}

function apiKey(): string {
  return (process.env.XAI_API_KEY || "").trim();
}

function textModel(): string {
  return process.env.GROK_MODEL || "grok-4.5";
}

function imageModel(): string {
  return process.env.GROK_IMAGE_MODEL || "grok-imagine-image";
}

function extractJson(content: string): Record<string, unknown> {
  let text = (content || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new GrokError("Resposta da IA não contém JSON válido");
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

export type RawArticle = {
  originalTitle: string;
  originalSummary: string;
  originalLink: string;
  sourceId: string;
  sourceName: string;
  imageUrl?: string | null;
  publishedAt?: Date;
  categoryHint?: string;
  articleContext?: string;
};

export type RewrittenArticle = {
  title: string;
  lead: string;
  body: string;
  category: string;
  tags: string[];
  rewriteModel: string;
  bolsonaroRelated: boolean;
};

/** Reescreve notícia com Grok, aplicando regras editoriais. */
export async function rewriteArticle(raw: RawArticle): Promise<RewrittenArticle> {
  const key = apiKey();
  if (!key) throw new GrokError("XAI_API_KEY não configurada");

  const bolsonaro = isBolsonaroRelated(
    raw.originalTitle,
    raw.originalSummary,
    raw.articleContext || ""
  );

  const system = [
    "Você é o editor-chefe do portal de notícias LINHA DIREITA.",
    "Linha editorial de direita, com viés favorável a Bolsonaro e Flávio Bolsonaro.",
    "Reescreva notícias de forma 100% ORIGINAL em português do Brasil.",
    editorialSystemRules(bolsonaro),
    "Formato:",
    "- Título (máx. 90 caracteres), sem clickbait enganoso",
    "- Lead de 1–2 frases",
    "- Corpo com 3 a 6 parágrafos curtos",
    "- Uma categoria: politica, eleicoes, seguranca, stf, congresso, eua, economia, brasil",
    "- 3 a 6 tags em minúsculas",
    "Responda APENAS JSON:",
    '{"reject":false,"title":"...","lead":"...","body":"p1\\n\\np2","category":"politica","tags":["a","b"]}',
    'Se proibido ou fora do foco: {"reject":true,"reason":"..."}',
  ].join("\n");

  const user = [
    `Fonte: ${raw.sourceName}`,
    `Título original: ${raw.originalTitle}`,
    `Resumo: ${raw.originalSummary || "(sem resumo)"}`,
    `Categoria sugerida: ${raw.categoryHint || "geral"}`,
    `Envolve Bolsonaro/Flávio: ${bolsonaro ? "sim" : "não"}`,
    `Link (não cite no texto): ${raw.originalLink}`,
    "",
    "Trechos factuais da matéria:",
    (raw.articleContext || raw.originalSummary || "").slice(0, 4500),
    "",
    "Reescreva agora de forma jornalística e original.",
  ].join("\n");

  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: textModel(),
      temperature: 0.55,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new GrokError(`Grok HTTP ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    model?: string;
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content || "";
  const parsed = extractJson(content);

  if (parsed.reject === true) {
    throw new RejectedContentError(String(parsed.reason || "rejeitado pelas regras editoriais"));
  }

  const title = String(parsed.title || "").trim();
  const lead = String(parsed.lead || "").trim();
  let body = String(parsed.body || "").trim().replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  let category = String(parsed.category || raw.categoryHint || "politica").toLowerCase().trim();
  let tags = Array.isArray(parsed.tags)
    ? (parsed.tags as unknown[]).map((t) => String(t).toLowerCase().trim()).filter(Boolean)
    : [];

  if (!title || !body) throw new GrokError("IA devolveu título ou corpo vazio");

  const blocked = isBlockedContent(title, lead, body, tags.join(" "));
  if (blocked.blocked) throw new RejectedContentError(blocked.reason);

  category = normalizeCategory(category);
  if (bolsonaro) tags = Array.from(new Set([...tags, "bolsonaro"]));

  return {
    title: title.slice(0, 140),
    lead: lead.slice(0, 500),
    body,
    category,
    tags: tags.slice(0, 8),
    rewriteModel: data.model || textModel(),
    bolsonaroRelated: bolsonaro,
  };
}

/** Gera imagem ilustrativa com Grok Imagine. Retorna URL ou null. */
export async function generateNewsImage(opts: {
  title: string;
  lead?: string;
  category?: string;
}): Promise<string | null> {
  const key = apiKey();
  if (!key) {
    console.warn("[grok] XAI_API_KEY ausente — pulando imagem");
    return null;
  }

  // Só imagem realista do assunto — sem texto, logo ou nome do site
  const prompt = [
    "Photorealistic documentary news photograph, extremely realistic, looks like a real press photo taken with a DSLR camera.",
    `Subject matter (show the real-world scene related to this news only): ${opts.title}.`,
    opts.lead ? `Scene context: ${opts.lead.slice(0, 200)}.` : "",
    `News category: ${opts.category || "politica"}.`,
    "Natural lighting, authentic Brazilian or international setting as the topic requires,",
    "sharp detail, shallow depth of field when appropriate, professional photojournalism style,",
    "true-to-life colors, no CGI look, no illustration, no cartoon, no 3D render.",
    "CRITICAL: absolutely NO text, NO letters, NO words, NO numbers as overlay,",
    "NO watermarks, NO logos, NO brand names, NO site name, NO captions, NO banners,",
    "NO 'Linha Direita', NO writing of any kind on the image.",
    "Horizontal 16:9 composition suitable for a news article header.",
  ]
    .filter(Boolean)
    .join(" ");

  const res = await fetch(`${XAI_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel(),
      prompt,
      n: 1,
      response_format: "url",
      aspect_ratio: "16:9",
    }),
  });

  if (!res.ok) {
    console.error("[grok] imagem HTTP", res.status, (await res.text()).slice(0, 300));
    return null;
  }

  const data = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
  const item = data.data?.[0];
  if (item?.url) return item.url;
  if (item?.b64_json) return `data:image/jpeg;base64,${item.b64_json}`;
  return null;
}
