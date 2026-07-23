/**
 * Filtro editorial obrigatório do LINHA DIREITA.
 * - Bloqueia Lula / PT / aliados
 * - Detecta pautas sobre Bolsonaro / Flávio (tom favorável na reescrita)
 */

function normalize(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const BLOCK_PHRASES = [
  "lula",
  "luiz inacio",
  "janja",
  "partido dos trabalhadores",
  "petista",
  "petismo",
  "gleisi",
  "haddad",
  "dilma",
  "rousseff",
  "alckmin",
  "rui costa",
  "paulo pimenta",
  "governo lula",
  "gestao lula",
];

const PT_PARTY_PATTERNS = [
  /\bdo pt\b/,
  /\bno pt\b/,
  /\bpelo pt\b/,
  /\bao pt\b/,
  /\bbancada do pt\b/,
  /\bdeputad\w* do pt\b/,
  /\bsenador\w* do pt\b/,
  /\bcandidato\w* do pt\b/,
  /\bfiliad\w* ao pt\b/,
  /\bpt nacional\b/,
  /\bgoverno (?:petista|do pt)\b/,
];

export function isBlockedContent(...parts: string[]): { blocked: boolean; reason: string } {
  const blob = normalize(parts.filter(Boolean).join(" "));
  if (!blob) return { blocked: false, reason: "" };

  for (const phrase of BLOCK_PHRASES) {
    if (blob.includes(phrase)) {
      return { blocked: true, reason: `conteúdo bloqueado: menção a "${phrase}"` };
    }
  }

  if (PT_PARTY_PATTERNS.some((p) => p.test(blob))) {
    return { blocked: true, reason: "conteúdo bloqueado: menção ao PT" };
  }

  return { blocked: false, reason: "" };
}

export function isBolsonaroRelated(...parts: string[]): boolean {
  const blob = normalize(parts.filter(Boolean).join(" "));
  return (
    /\bbolsonaro\b/.test(blob) ||
    /\bflavio bolsonaro\b/.test(blob) ||
    /\bjair\b.*\bbolsonaro\b/.test(blob)
  );
}

export function editorialSystemRules(bolsonaroRelated: boolean): string {
  let rules =
    "REGRAS EDITORIAIS OBRIGATÓRIAS DO PORTAL LINHA DIREITA:\n" +
    "1. NUNCA escreva sobre Lula, Janja, PT, Partido dos Trabalhadores, Haddad, Dilma, Alckmin, Gleisi ou qualquer pessoa/partido ligado a eles. " +
    'Se o material for sobre isso, responda JSON: {"reject": true, "reason": "..."}.\n' +
    "2. Linguagem jornalística, clara e natural em português brasileiro.\n" +
    "3. NÃO copie frases da fonte. Reescreva com palavras próprias.\n" +
    "4. Não invente fatos, números ou citações.\n" +
    "5. Tom profissional, sem xingamentos e sem linguagem de rede social.\n";

  if (bolsonaroRelated) {
    rules +=
      "6. Esta matéria envolve Bolsonaro e/ou Flávio Bolsonaro. " +
      "O texto DEVE ser favorável a eles: tom positivo, defensivo ou enaltecedor, " +
      "destacando pontos fortes, legados, popularidade ou articulações. " +
      "Nunca ataque, ironize ou desqualifique Bolsonaro ou Flávio Bolsonaro.\n";
  }

  return rules;
}
