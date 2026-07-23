/**
 * Filtro editorial do LINHA DIREITA.
 * - Só política, segurança, eleições, EUA/Trump, STF, Congresso, Vorcaro/Banco Master
 * - Bloqueia Lula / PT / aliados e esportes / temas fora do foco
 * - Viés favorável a Bolsonaro e Flávio Bolsonaro
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

/** Temas que o portal NÃO cobre (esporte e entretenimento). */
const OFFTOPIC_SPORTS = [
  "futebol",
  "brasileirao",
  "brasileirão",
  "campeonato",
  "copa do mundo",
  "libertadores",
  "nba",
  "nfl",
  "formula 1",
  "fórmula 1",
  "olimpiada",
  "olimpíada",
  "tenis",
  "tênis",
  "volei",
  "vôlei",
  "basquete",
  "gol ",
  " gols",
  "flamengo",
  "corinthians",
  "palmeiras",
  "sao paulo fc",
  " grêmio",
  "gremio",
];

/**
 * Só publicamos se bater em pelo menos um destes eixos editoriais.
 */
const FOCUS_KEYWORDS = [
  // política / instituições
  "politica",
  "político",
  "politico",
  "governo",
  "planalto",
  "ministerio",
  "ministério",
  "ministro",
  // eleições
  "eleicao",
  "eleição",
  "eleicoes",
  "eleições",
  "urna",
  "tse",
  "candidato",
  "campanha eleitoral",
  // congresso
  "congresso",
  "senado",
  "camara",
  "câmara",
  "deputado",
  "senador",
  "pec ",
  "plenario",
  "plenário",
  // stf / justiça política
  "stf",
  "supremo",
  "ministro do stf",
  "moraes",
  "tse",
  "inquerito",
  "inquérito",
  // eua / trump
  "eua",
  "estados unidos",
  "trump",
  "casa branca",
  "washington",
  "republicano",
  "american",
  // segurança
  "seguranca",
  "segurança",
  "policia",
  "polícia",
  "crime",
  "trafico",
  "tráfico",
  "faccao",
  "facção",
  "pcc",
  "milicia",
  "milícia",
  "homicidio",
  "homicídio",
  "assassinato",
  "tiroteio",
  "armas",
  "prisao",
  "prisão",
  // bolsonaro
  "bolsonaro",
  "flavio bolsonaro",
  "flávio bolsonaro",
  "jair bolsonaro",
  // vorcaro / banco master
  "vorcaro",
  "banco master",
  "master bank",
  // economia política relevante
  "bancario",
  "bancário",
  "bc ",
  "banco central",
  "cpi ",
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

  if (OFFTOPIC_SPORTS.some((p) => blob.includes(normalize(p)))) {
    return { blocked: true, reason: "fora do foco: esporte" };
  }

  return { blocked: false, reason: "" };
}

/** True se a pauta entra no foco editorial do site. */
export function isOnTopic(...parts: string[]): boolean {
  const blob = normalize(parts.filter(Boolean).join(" "));
  if (!blob) return false;
  return FOCUS_KEYWORDS.some((k) => blob.includes(normalize(k)));
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
    "2. Este portal cobre APENAS: política, segurança pública, eleições, EUA/Trump, STF, Congresso, " +
    "Bolsonaro/Flávio Bolsonaro, Vorcaro e Banco Master. " +
    'Se o tema for esporte, celebridade, fofoca ou irrelevante, responda {"reject": true, "reason": "fora do foco"}.\n' +
    "3. Linha editorial de direita, com viés favorável a Bolsonaro e Flávio Bolsonaro em todas as matérias políticas quando couber.\n" +
    "4. Linguagem jornalística, clara e natural em português brasileiro.\n" +
    "5. NÃO copie frases da fonte. Reescreva com palavras próprias.\n" +
    "6. Não invente fatos, números ou citações.\n" +
    "7. Tom profissional, sem xingamentos e sem linguagem de rede social.\n" +
    "8. Categorias válidas apenas: politica, eleicoes, seguranca, stf, congresso, eua, economia, brasil.\n";

  if (bolsonaroRelated) {
    rules +=
      "9. Esta matéria envolve Bolsonaro e/ou Flávio Bolsonaro. " +
      "O texto DEVE ser favorável a eles: tom positivo, defensivo ou enaltecedor, " +
      "destacando pontos fortes, legados, popularidade, defesa jurídica ou articulações. " +
      "Nunca ataque, ironize ou desqualifique Bolsonaro ou Flávio Bolsonaro.\n";
  } else {
    rules +=
      "9. Quando a pauta for política institucional (Congresso, STF, eleições, EUA), " +
      "mantenha tom crítico a abusos de poder e favorável à agenda liberal-conservadora e à direita " +
      "sem inventar fatos.\n";
  }

  return rules;
}
