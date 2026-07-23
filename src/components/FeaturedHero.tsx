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
    <section className="mb-10">
      <Link
        href={`/noticia/${article.slug}`}
        className="group grid overflow-hidden rounded-3xl border border-white/10 bg-[#141820] shadow-2xl shadow-black/40 transition hover:border-white/20 md:grid-cols-2"
      >
        <div className="relative min-h-[260px] bg-zinc-900 md:min-h-[380px]">
          {article.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-zinc-900 to-black" />
          )}
          <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
            Destaque
          </span>
        </div>
        <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-300">
              {categoryLabel(article.category)}
            </span>
            <span>{article.sourceName || "Linha Direita"}</span>
            <span>·</span>
            <time>{formatDate(article.publishedAt)}</time>
          </div>
          <h1 className="font-serif text-3xl leading-[1.1] tracking-tight text-white md:text-4xl lg:text-[2.6rem]">
            {article.title}
          </h1>
          {article.lead ? (
            <p className="max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">{article.lead}</p>
          ) : null}
          <span className="text-sm font-semibold text-red-400 transition group-hover:text-red-300">
            Ler matéria completa →
          </span>
        </div>
      </Link>
    </section>
  );
}
