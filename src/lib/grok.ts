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

/**
 * Detecta pessoas/instituições no texto para a imagem ser fiel ao artigo
 * (ex.: Trump na foto quando a notícia é sobre Trump).
 */
function extractVisualSubjects(text: string): {
  people: string[];
  places: string[];
  sceneHints: string[];
} {
  const blob = (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const peopleRules: [RegExp, string][] = [
    [/\btrump\b|\bdonald trump\b/, "Donald Trump (recognizable likeness, US President, suit, blond hair)"],
    [/\bjair bolsonaro\b|\bbolsonaro\b(?!\s*flavio)/, "Jair Bolsonaro (recognizable likeness, Brazilian politician)"],
    [/\bflavio bolsonaro\b|\bflávio bolsonaro\b/, "Flávio Bolsonaro (recognizable likeness, Brazilian senator)"],
    [/\bmichele bolsonaro\b|\bmichele\b/, "Michelle Bolsonaro"],
    [/\belon musk\b|\bmusk\b/, "Elon Musk (recognizable likeness)"],
    [/\bpablo marcal\b|\bpablo marçal\b/, "Pablo Marçal"],
    [/\bvorcaro\b/, "Daniel Vorcaro (Brazilian banker)"],
    [/\bmoraes\b|\balexandre de moraes\b/, "Alexandre de Moraes (Brazilian Supreme Court justice, STF)"],
    [/\bgilmar\b/, "Gilmar Mendes (STF justice)"],
    [/\bbiden\b/, "Joe Biden"],
    [/\bvance\b/, "JD Vance"],
    [/\bnetanyahu\b/, "Benjamin Netanyahu"],
    [/\bputin\b/, "Vladimir Putin"],
    [/\bzelensky\b|\bzelenski\b/, "Volodymyr Zelensky"],
    [/\bxavier\b/, "Cláudio Xavier or relevant Brazilian public figure if context fits"],
  ];

  const placeRules: [RegExp, string][] = [
    [/\bstf\b|\bsupremo\b/, "Supreme Federal Court building in Brasília (STF), modern glass facade"],
    [/\bcongresso\b|\bsenado\b|\bcamara\b|\bcâmara\b/, "National Congress of Brazil in Brasília, twin towers and dome"],
    [/\bplanalto\b/, "Palácio do Planalto in Brasília"],
    [/\bcasa branca\b|\bwhite house\b/, "White House exterior, Washington DC"],
    [/\beua\b|\bestados unidos\b|\bwashington\b/, "United States political setting, Washington DC"],
    [/\bbrasilia\b|\bbrasília\b/, "Brasília, Brazil monumental architecture"],
    [/\bwall street\b|\bbanco master\b|\bbolsa\b/, "modern bank headquarters / financial district exterior"],
    [/\bpolicia\b|\bsegurança\b|\bseguranca\b/, "Brazilian police operation or security forces scene"],
  ];

  const sceneRules: [RegExp, string][] = [
    [/\beleic|\burna\b|\btse\b|\bcampanha\b/, "election campaign rally or voting scene"],
    [/\bprisao\b|\bprisão\b|\bpreso\b|\bcadeia\b/, "courthouse steps / justice system scene (no gore)"],
    [/\bmanifest|\bprotesto\b|\bato\b/, "large political rally or street demonstration"],
    [/\bguerra\b|\bataque\b|\bmissil\b/, "international conflict news photo style (no graphic violence)"],
    [/\beconomia\b|\binfla|\bjuros\b|\bdolar\b|\bdólar\b/, "economic news visual: trading floor or government finance building"],
  ];

  const people: string[] = [];
  for (const [re, label] of peopleRules) {
    if (re.test(blob) && !people.includes(label)) people.push(label);
  }

  const places: string[] = [];
  for (const [re, label] of placeRules) {
    if (re.test(blob) && !places.includes(label)) places.push(label);
  }

  const sceneHints: string[] = [];
  for (const [re, label] of sceneRules) {
    if (re.test(blob) && !sceneHints.includes(label)) sceneHints.push(label);
  }

  return { people, places, sceneHints };
}

/** Monta prompt detalhado para a imagem parecer o assunto real do artigo. */
export function buildNewsImagePrompt(opts: {
  title: string;
  lead?: string;
  category?: string;
  originalTitle?: string;
  tags?: string[];
}): string {
  const fullText = [opts.title, opts.lead, opts.originalTitle, ...(opts.tags || [])]
    .filter(Boolean)
    .join(" ");
  const { people, places, sceneHints } = extractVisualSubjects(fullText);

  const mustShow: string[] = [];
  if (people.length) {
    mustShow.push(
      `MUST clearly depict these real public figures as the main visual focus (accurate recognizable appearance): ${people.join("; ")}.`
    );
  }
  if (places.length) {
    mustShow.push(`Setting / landmark must match: ${places.join("; ")}.`);
  }
  if (sceneHints.length) {
    mustShow.push(`Scene type: ${sceneHints.join("; ")}.`);
  }
  if (!people.length && !places.length) {
    mustShow.push(
      `Invent a concrete photorealistic news scene that literally illustrates the headline, not a generic abstract image. Headline: "${opts.title}".`
    );
  }

  return [
    "Ultra-realistic photojournalism news photograph for a major newspaper website.",
    "Looks like an Associated Press / Reuters press photo shot on a full-frame DSLR, 85mm lens, natural light.",
    `Headline to illustrate EXACTLY: ${opts.title}.`,
    opts.lead ? `Article summary (use for scene details): ${opts.lead.slice(0, 280)}.` : "",
    opts.originalTitle && opts.originalTitle !== opts.title
      ? `Original headline context: ${opts.originalTitle.slice(0, 160)}.`
      : "",
    `Category: ${opts.category || "politica"}.`,
    ...mustShow,
    people.length
      ? "The named person(s) must be clearly visible in the frame (face recognizable), not a silhouette, not a tiny figure in the background."
      : "",
    "Composition: single strong subject, editorial framing, 16:9 horizontal, shallow depth of field optional.",
    "True-to-life skin tones and clothing; authentic location; no fantasy, no surreal elements.",
    "Style: documentary realism only — NOT illustration, NOT cartoon, NOT 3D render, NOT AI-art look, NOT stock-photo fake smiles.",
    "CRITICAL: ZERO text in the image — no captions, no logos, no watermarks, no banners, no site name, no words, no letters, no numbers as overlay.",
    "Do not write 'Linha Direita' or any brand on the photo.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Gera imagem ilustrativa com Grok Imagine. Retorna URL ou null. */
export async function generateNewsImage(opts: {
  title: string;
  lead?: string;
  category?: string;
  originalTitle?: string;
  tags?: string[];
}): Promise<string | null> {
  const key = apiKey();
  if (!key) {
    console.warn("[grok] XAI_API_KEY ausente — pulando imagem");
    return null;
  }

  const prompt = buildNewsImagePrompt(opts);
  console.log("[grok] prompt imagem:", prompt.slice(0, 280) + "…");

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
