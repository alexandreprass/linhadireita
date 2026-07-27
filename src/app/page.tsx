import { ArticleCard } from "@/components/ArticleCard";
import { CategoryChips } from "@/components/CategoryChips";
import { EmptyState } from "@/components/EmptyState";
import { FeaturedHero } from "@/components/FeaturedHero";
import { RecentFeed } from "@/components/RecentFeed";
import { getFeaturedArticle, listPublished } from "@/lib/articles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedArticle();

  // 6 (grade 3x2) + 15 (grade 5x3) = 21 além do destaque
  const { items } = await listPublished({
    take: 21,
    excludeId: featured?.id,
  });

  const midGrid = items.slice(0, 6); // 3 colunas × 2 linhas
  const moreNews = items.slice(6, 21); // 5 colunas × 3 linhas

  // Feed: recentes (destaque + demais), sem repetir demais no visual do feed
  const feedPool = [
    ...(featured ? [featured] : []),
    ...items,
  ].slice(0, 12);

  return (
    <div>
      {/* Cabeçalho */}
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

      {/* TOPO: Destaque + Feed ao vivo lado a lado */}
      {featured ? (
        <div className="mb-10 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <FeaturedHero article={featured} besideFeed />
          <div className="min-h-0 lg:max-h-[560px] lg:overflow-y-auto lg:overscroll-contain">
            <RecentFeed
              articles={feedPool.filter((a) => a.id !== featured.id).slice(0, 10)}
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

      {/* MEIO: 3 colunas × 2 linhas = 6 notícias */}
      {midGrid.length > 0 ? (
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
              Principais
            </h2>
            <Link
              href="/busca"
              className="text-sm font-medium text-[#7dffb0] transition hover:text-[#ffdf00]"
            >
              Buscar →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {midGrid.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ) : null}

      {/* BAIXO: MAIS NOTÍCIAS — 5 colunas × 3 linhas = 15 */}
      {moreNews.length > 0 ? (
        <section>
          <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-serif text-2xl tracking-tight text-white md:text-3xl">
                Mais notícias
              </h2>
              <p className="mt-1 text-sm text-zinc-500">Cobertura ampliada do dia</p>
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
