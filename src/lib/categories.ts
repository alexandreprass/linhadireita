/** Categorias exibidas no menu e filtros. */
export const CATEGORIES = [
  { slug: "politica", label: "Política" },
  { slug: "brasil", label: "Brasil" },
  { slug: "mundo", label: "Mundo" },
  { slug: "economia", label: "Economia" },
  { slug: "tecnologia", label: "Tecnologia" },
  { slug: "seguranca", label: "Segurança" },
  { slug: "saude", label: "Saúde" },
  { slug: "cultura", label: "Cultura" },
  { slug: "esporte", label: "Esporte" },
  { slug: "geral", label: "Geral" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function isValidCategory(slug: string): boolean {
  return CATEGORIES.some((c) => c.slug === slug);
}
