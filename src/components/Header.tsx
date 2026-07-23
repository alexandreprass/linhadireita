import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SearchBox } from "./SearchBox";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b14]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Linha Direita"
            width={160}
            height={56}
            className="h-12 w-auto object-contain md:h-14"
            priority
          />
        </Link>

        <nav className="ml-2 hidden flex-1 items-center gap-1 lg:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="rounded-full px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-[#ffdf00]"
            >
              {c.label}
            </Link>
          ))}
          <Link
            href="/busca"
            className="rounded-full px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-[#ffdf00]"
          >
            Busca
          </Link>
        </nav>

        <div className="ml-auto w-full sm:w-auto sm:min-w-[240px]">
          <SearchBox />
        </div>
      </div>

      <div className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2 scrollbar-none lg:hidden">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="shrink-0 rounded-full border border-[#009c3b]/30 bg-[#009c3b]/10 px-3 py-1 text-xs font-medium text-zinc-200"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
