import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Conheça o portal LINHA DIREITA.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#009c3b]">Sobre</p>
      <h1 className="font-serif text-3xl text-white md:text-4xl">LINHA DIREITA</h1>
      <p className="mt-4 text-lg leading-relaxed text-zinc-400">
        Portal de notícias com cobertura de política, segurança, eleições, Congresso, STF e EUA.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-white">Assuntos</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/categoria/${c.slug}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 hover:border-[#ffdf00]/40 hover:text-[#ffdf00]"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
