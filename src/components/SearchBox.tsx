"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = q.trim();
    if (!value) {
      router.push("/busca");
      return;
    }
    router.push(`/busca?q=${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar notícias..."
        className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        aria-label="Buscar notícias"
      />
      <button
        type="submit"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-zinc-300 transition hover:bg-white/15 hover:text-white"
        aria-label="Buscar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}
