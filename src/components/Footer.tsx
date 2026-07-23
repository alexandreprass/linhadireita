import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <Link href="/" className="mb-4 inline-block">
            <Image
              src="/logo.png"
              alt="Linha Direita"
              width={180}
              height={64}
              className="h-14 w-auto object-contain"
            />
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
            Portal de notícias com cobertura de política, economia, Brasil e mundo.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Assuntos
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-zinc-300">
            {CATEGORIES.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link href={`/categoria/${c.slug}`} className="hover:text-[#ffdf00]">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-xs text-zinc-500">
          <span>© {new Date().getFullYear()} Linha Direita</span>
          <span className="text-zinc-600">Notícias com clareza</span>
        </div>
      </div>
    </footer>
  );
}
