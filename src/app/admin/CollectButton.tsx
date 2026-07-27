"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const OPTIONS = [1, 2, 3, 5, 8, 10, 15, 20, 30, 50];

export function CollectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [msg, setMsg] = useState("");
  const [qty, setQty] = useState(5);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    // Se já houver coleta ao abrir a página, mostra estado
    void (async () => {
      try {
        const res = await fetch("/api/admin/articles?status=1");
        const data = await res.json();
        if (data.collect?.running) {
          setLoading(true);
          setMsg(
            data.collect.cancelRequested
              ? "Parando coleta…"
              : "Coleta em andamento…"
          );
          startPolling();
        }
      } catch {
        /* ignore */
      }
    })();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/articles?status=1");
        const data = await res.json();
        const c = data.collect;
        if (!c?.running) {
          stopPolling();
          setLoading(false);
          setStopping(false);
          const last = c?.lastResult;
          setMsg(
            last?.message
              ? last.cancelled
                ? `Parada: ${last.message}`
                : last.message
              : "Coleta finalizada."
          );
          router.refresh();
          return;
        }
        setMsg(
          c.cancelRequested
            ? "Parando… aguardando a notícia atual terminar."
            : "Coleta em andamento…"
        );
      } catch {
        /* ignore */
      }
    }, 2000);
  }

  async function collect() {
    setLoading(true);
    setStopping(false);
    setMsg(`Iniciando coleta de até ${qty} notícia(s)…`);
    try {
      const res = await fetch(`/api/admin/articles?max=${qty}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok && res.status !== 409) {
        setMsg(data.message || "Falha ao iniciar coleta");
        setLoading(false);
        return;
      }
      setMsg(data.message || "Coleta iniciada…");
      startPolling();
    } catch (err) {
      setMsg(String(err));
      setLoading(false);
    }
  }

  async function stopCollect() {
    setStopping(true);
    setMsg("Solicitando parada…");
    try {
      const res = await fetch("/api/admin/collect/stop", { method: "POST" });
      const data = await res.json();
      setMsg(data.message || "Parada solicitada");
      if (!data.collect?.running) {
        setLoading(false);
        setStopping(false);
        stopPolling();
        router.refresh();
      }
    } catch (err) {
      setMsg(String(err));
      setStopping(false);
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
        {loading ? (
          <button
            type="button"
            onClick={stopCollect}
            disabled={stopping}
            className="rounded-full border border-red-500/40 bg-red-600/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-600/30 disabled:opacity-60"
          >
            {stopping ? "Parando..." : "Parar coleta"}
          </button>
        ) : null}
      </div>
      {msg ? <span className="max-w-sm text-right text-[11px] text-zinc-500">{msg}</span> : null}
    </div>
  );
}
