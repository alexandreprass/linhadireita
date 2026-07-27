"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const OPTIONS = [1, 2, 3, 5, 8, 10, 15, 20, 30, 50];

export function CollectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [qty, setQty] = useState(5);

  async function collect() {
    setLoading(true);
    setMsg(`Coletando até ${qty} notícia(s)… pode levar alguns minutos.`);
    try {
      const res = await fetch(`/api/admin/articles?max=${qty}`, { method: "POST" });
      const data = await res.json();
      setMsg(data.message || JSON.stringify(data));
      router.refresh();
    } catch (err) {
      setMsg(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          Quantidade
          <select
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white outline-none focus:border-[#009c3b]/50"
          >
            {OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "notícia" : "notícias"}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={collect}
          disabled={loading}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
        >
          {loading ? "Coletando..." : "Coletar agora"}
        </button>
      </div>
      {msg ? <span className="max-w-sm text-right text-[11px] text-zinc-500">{msg}</span> : null}
    </div>
  );
}
