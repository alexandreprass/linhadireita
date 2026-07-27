import { ArticleCard } from "@/components/ArticleCard";
import { CategoryChips } from "@/components/CategoryChips";
import { EmptyState } from "@/components/EmptyState";
import { FeaturedHero } from "@/components/FeaturedHero";
import { RecentFeed } from "@/components/RecentFeed";
import {
  getFeaturedArticle,
  getLatestPerCategory,
  getRandomLast24Hours,
  listPublished,
} from "@/lib/articles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedArticle();
  const excludeFeatured = featured ? [featured.id] : [];

  // Principais: 1 mais recente de cada categoria
  const principais = await getLatestPerCategory(excludeFeatured);
  const excludePrincipais = [...excludeFeatured, ...principais.map((a) => a.id)];

  // Mais notícias: aleatórias das últimas 24h (15 = 5 col × 3 linhas)
  const moreNews = await getRandomLast24Hours({
    take: 15,
    excludeIds: excludePrincipais,
  });

  // Feed ao vivo
  const { items: feedItems } = await listPublished({
    take: 12,
    excludeIds: featured ? [featured.id] : [],
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#009c3b]">
            <span className="live-pulse" />
            Em tempo real
          </p>
          <h1 className="font-serif text-3xl tracking-tight text-white md:text-4xl lg:text-[2.75rem]">
            O que está acontecendo agora
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400 md:text-base">
            Política, segurança, eleições, Congresso, STF e EUA — horário de Brasília.
          </p>
        </div>
        <CategoryChips />
      </div>

      {/* TOPO: Destaque + Feed ao vivo */}
      {featured ? (
        <div className="mb-10 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <FeaturedHero article={featured} besideFeed />
          <div className="feed-scroll min-h-0 lg:max-h-[560px]">
            <RecentFeed
              articles={feedItems.slice(0, 10)}
              title="Feed ao vivo"
              subtitle="Atualizações recentes"
            />
          </div>
        </div>
      ) : (
        <div className="mb-10">
          <EmptyState />
        </div>
      )}

      {/* PRINCIPAIS: 1 de cada categoria */}
      {principais.length > 0 ? (
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                Principais
              </h2>
              <p className="mt-1 text-sm text-zinc-400">Uma destaque por categoria</p>
            </div>
            <Link
              href="/busca"
              className="text-sm font-medium text-[#7dffb0] transition hover:text-[#ffdf00]"
            >
              Buscar →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {principais.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ) : null}

      {/* MAIS NOTÍCIAS: aleatórias últimas 24h — 5 col × 3 linhas */}
      {moreNews.length > 0 ? (
        <section>
          <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-serif text-2xl tracking-tight text-white md:text-3xl">
                Mais notícias
              </h2>
              <p className="mt-1 text-sm text-zinc-500">Seleção das últimas 24 horas</p>
            </div>
            <Link
              href="/busca"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:border-[#009c3b]/40 hover:text-white"
            >
              Ver todas
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {moreNews.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
