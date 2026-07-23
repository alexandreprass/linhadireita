import Link from "next/link";
import { SOURCES } from "@/lib/sources";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-red-600 to-orange-500 text-sm font-bold text-white">
              LD
            </span>
            <div>
              <p className="font-bold text-white">LINHA DIREITA</p>
              <p className="text-xs text-zinc-500">Conteúdo reescrito · não copiado</p>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
            Portal automatizado com reescrita original via Grok (xAI). Sempre citamos a fonte e
            oferecemos o link da reportagem original.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Fontes</h4>
          <ul className="space-y-2 text-sm text-zinc-300">
            {SOURCES.map((s) => (
              <li key={s.id}>
                <a href={s.website} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Portal</h4>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li><Link href="/" className="hover:text-white">Últimas</Link></li>
            <li><Link href="/busca" className="hover:text-white">Buscar</Link></li>
            <li><Link href="/sobre" className="hover:text-white">Sobre</Link></li>
            <li><Link href="/admin" className="hover:text-white">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-xs text-zinc-500">
          <span>© {new Date().getFullYear()} Linha Direita</span>
          <span>Powered by Grok · xAI</span>
        </div>
      </div>
    </footer>
  );
}
