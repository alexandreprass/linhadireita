import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <div className="brasil-stripe opacity-80" />
      <div className="site-shell grid gap-10 py-12 md:grid-cols-2">
        <div>
          <Link href="/" className="mb-4 inline-block">
            <Image
              src="/logo.png"
              alt="Linha Direita"
              width={720}
              height={256}
              className="h-40 w-auto object-contain opacity-95 md:h-48"
            />
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
            Política, segurança, eleições, Congresso, STF e EUA — com clareza e cobertura em tempo
            real.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Assuntos
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-zinc-300">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/categoria/${c.slug}`} className="transition hover:text-[#ffdf00]">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="site-shell flex flex-wrap justify-between gap-2 py-4 text-xs text-zinc-500">
          <span>© {new Date().getFullYear()} Linha Direita</span>
          <span className="text-zinc-600">Horário de Brasília · Notícias com clareza</span>
        </div>
      </div>
    </footer>
  );
}
