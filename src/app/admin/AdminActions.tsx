"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminActions({ id, featured }: { id: string; featured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm("Apagar esta notícia?")) return;
    setBusy(true);
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  async function toggleFeatured() {
    setBusy(true);
    await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !featured }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={toggleFeatured}
        className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50"
      >
        {featured ? "Remover destaque" : "Destacar"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={del}
        className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        Apagar
      </button>
    </div>
  );
}
