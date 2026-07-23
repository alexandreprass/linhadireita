/** Categorias do portal (foco político / segurança / EUA). Sem esporte. */
export const CATEGORIES = [
  { slug: "politica", label: "Política" },
  { slug: "eleicoes", label: "Eleições" },
  { slug: "seguranca", label: "Segurança" },
  { slug: "stf", label: "STF" },
  { slug: "congresso", label: "Congresso" },
  { slug: "eua", label: "EUA" },
  { slug: "economia", label: "Economia" },
  { slug: "brasil", label: "Brasil" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function isValidCategory(slug: string): boolean {
  return CATEGORIES.some((c) => c.slug === slug);
}

/** Normaliza categoria vinda da IA para uma das válidas. */
export function normalizeCategory(slug: string): CategorySlug {
  const s = (slug || "").toLowerCase().trim();
  if (isValidCategory(s)) return s as CategorySlug;
  const map: Record<string, CategorySlug> = {
    mundo: "eua",
    geral: "politica",
    tecnologia: "politica",
    saude: "brasil",
    cultura: "brasil",
    esporte: "politica",
  };
  return map[s] || "politica";
}
