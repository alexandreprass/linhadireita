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
  const { items } = await listPublished({
    take: 12,
    excludeId: featured?.id,
  });

  // Feed lateral: mais recentes (inclui destaque no topo da lista se existir)
  const feedPool = [
    ...(featured ? [featured] : []),
    ...items.filter((a) => a.id !== featured?.id),
  ].slice(0, 10);

  const gridItems = items.slice(0, 9);

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

      {featured ? <FeaturedHero article={featured} /> : <EmptyState />}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          {gridItems.length > 0 ? (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                    Mais notícias
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">Cobertura completa do dia</p>
                </div>
                <Link
                  href="/busca"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-[#7dffb0] transition hover:border-[#ffdf00]/30 hover:text-[#ffdf00]"
                >
                  Buscar →
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {gridItems.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </>
          ) : featured ? null : (
            <EmptyState />
          )}
        </section>

        <div className="lg:pt-1">
          <RecentFeed articles={feedPool} title="Feed ao vivo" subtitle="Notícias recentes" />
        </div>
      </div>
    </div>
  );
}
