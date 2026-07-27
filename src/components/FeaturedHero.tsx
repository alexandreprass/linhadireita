import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { formatDate } from "@/lib/format";

type Props = {
  article: {
    slug: string;
    title: string;
    lead?: string | null;
    category: string;
    sourceName?: string | null;
    imageUrl?: string | null;
    publishedAt: Date | string;
  };
};

export function FeaturedHero({ article }: Props) {
  return (
    <section className="mb-8">
      <Link
        href={`/noticia/${article.slug}`}
        className="group glass-card relative grid overflow-hidden rounded-[1.75rem] transition duration-300 hover:-translate-y-0.5 md:grid-cols-2"
      >
        <div className="relative min-h-[280px] overflow-hidden bg-zinc-900 md:min-h-[400px]">
          {article.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#002776] via-[#0b1a12] to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/20" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#009c3b] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-green-900/40">
            <span className="live-pulse !bg-white !shadow-none" />
            Destaque
          </span>
        </div>
        <div className="relative flex flex-col justify-center gap-4 p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <span className="rounded-full border border-[#ffdf00]/30 bg-[#ffdf00]/10 px-2.5 py-0.5 text-xs font-semibold text-[#ffdf00]">
              {categoryLabel(article.category)}
            </span>
            <span className="text-zinc-500">Linha Direita</span>
            <span className="text-zinc-600">·</span>
            <time className="text-zinc-500">{formatDate(article.publishedAt)}</time>
          </div>
          <h1 className="font-serif text-3xl leading-[1.12] tracking-tight text-white md:text-4xl lg:text-[2.55rem]">
            {article.title}
          </h1>
          {article.lead ? (
            <p className="max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
              {article.lead}
            </p>
          ) : null}
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#009c3b]/30 bg-[#009c3b]/10 px-4 py-2 text-sm font-semibold text-[#7dffb0] transition group-hover:border-[#ffdf00]/40 group-hover:bg-[#ffdf00]/10 group-hover:text-[#ffdf00]">
            Ler matéria completa
            <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </section>
  );
}
