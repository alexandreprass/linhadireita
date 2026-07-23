"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CollectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function collect() {
    setLoading(true);
    setMsg("Coletando… pode levar alguns minutos.");
    try {
      const res = await fetch("/api/admin/articles?max=2", { method: "POST" });
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
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={collect}
        disabled={loading}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
      >
        {loading ? "Coletando..." : "Coletar agora"}
      </button>
      {msg ? <span className="max-w-xs text-right text-[11px] text-zinc-500">{msg}</span> : null}
    </div>
  );
}
