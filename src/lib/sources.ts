/**
 * Fontes de notícias (RSS) monitoradas pelo LINHA DIREITA.
 */
export type NewsSource = {
  id: string;
  name: string;
  slug: string;
  color: string;
  website: string;
  feeds: string[];
};

export const SOURCES: NewsSource[] = [
  {
    id: "jovem_pan",
    name: "Jovem Pan News",
    slug: "jovem-pan",
    color: "#c8102e",
    website: "https://jovempan.com.br",
    feeds: ["https://jovempan.com.br/feed"],
  },
  {
    id: "revista_oeste",
    name: "Revista Oeste",
    slug: "revista-oeste",
    color: "#6c63ff",
    website: "https://revistaoeste.com",
    feeds: [
      "https://revistaoeste.com/feed/",
      "https://revistaoeste.com/politica/feed/",
      "https://revistaoeste.com/brasil/feed/",
    ],
  },
  {
    id: "gazeta_do_povo",
    name: "Gazeta do Povo",
    slug: "gazeta-do-povo",
    color: "#3d8bfd",
    website: "https://www.gazetadopovo.com.br",
    feeds: [
      "https://www.gazetadopovo.com.br/feed/rss/ultimas-noticias.xml",
      "https://www.gazetadopovo.com.br/feed/rss/republica.xml",
      "https://www.gazetadopovo.com.br/feed/rss/economia.xml",
    ],
  },
  {
    id: "cnn_brasil",
    name: "CNN Brasil",
    slug: "cnn-brasil",
    color: "#ff3b30",
    website: "https://www.cnnbrasil.com.br",
    feeds: ["https://www.cnnbrasil.com.br/feed"],
  },
  {
    id: "metropoles",
    name: "Metrópoles",
    slug: "metropoles",
    color: "#e85d04",
    website: "https://www.metropoles.com",
    feeds: [
      "https://www.metropoles.com/feed",
      "https://www.metropoles.com/brasil/feed",
      "https://www.metropoles.com/politica/feed",
      "https://www.metropoles.com/economia/feed",
      "https://www.metropoles.com/mundo/feed",
    ],
  },
];

export function getSourceById(id: string) {
  return SOURCES.find((s) => s.id === id);
}

export function getSourceBySlug(slug: string) {
  return SOURCES.find((s) => s.slug === slug);
}
