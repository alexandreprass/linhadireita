import type { Metadata } from "next";
import Link from "next/link";
import { SOURCES } from "@/lib/sources";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Como funciona o portal LINHA DIREITA: coleta, filtro editorial, reescrita Grok e imagens.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-red-400">Transparência</p>
      <h1 className="font-serif text-3xl text-white md:text-4xl">Como o LINHA DIREITA funciona</h1>
      <p className="mt-4 text-lg leading-relaxed text-zinc-400">
        Portal automatizado que monitora grandes veículos brasileiros, reescreve as matérias com a API
        Grok e gera imagens ilustrativas com Grok Imagine.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          ["01", "Coleta RSS", "A cada 30–60 min lê feeds de Jovem Pan, Revista Oeste, Gazeta do Povo, CNN Brasil e Metrópoles."],
          ["02", "Filtro editorial", "Descarta pautas sobre Lula, PT e figuras ligadas. Nunca publicamos esse conteúdo."],
          ["03", "Reescrita Grok", "Gera título, lead e corpo 100% originais em português jornalístico."],
          ["04", "Imagem + publish", "Grok Imagine cria ilustração; a matéria é publicada automaticamente com destaque."],
        ].map(([n, t, d]) => (
          <div key={n} className="rounded-2xl border border-white/10 bg-[#141820] p-5">
            <span className="text-xs font-bold tracking-widest text-red-400">{n}</span>
            <h3 className="mt-2 font-semibold text-white">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{d}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-serif text-2xl text-white">Regras editoriais</h2>
      <ul className="mt-4 space-y-3 text-sm text-zinc-400">
        <li className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <strong className="text-white">Bloqueio total</strong> — sem notícias sobre Lula, PT ou aliados.
        </li>
        <li className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <strong className="text-white">Bolsonaro / Flávio</strong> — tom favorável (positivo, defensivo ou enaltecedor).
        </li>
        <li className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <strong className="text-white">Texto original</strong> — reescrita jornalística, sem copiar a fonte.
        </li>
      </ul>

      <h2 className="mt-10 font-serif text-2xl text-white">Fontes</h2>
      <ul className="mt-4 space-y-2">
        {SOURCES.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <div>
              <p className="font-medium text-white">{s.name}</p>
              <a href={s.website} className="text-xs text-red-400" target="_blank" rel="noopener noreferrer">
                {s.website}
              </a>
            </div>
          </li>
        ))}
      </ul>

      <Link href="/admin" className="mt-8 inline-flex rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500">
        Painel admin
      </Link>
    </div>
  );
}
