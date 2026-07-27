"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const OPTIONS = [1, 2, 3, 5, 8, 10, 15, 20, 30, 50];

export function CollectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
            ? "Parando… aguardando a etapa atual terminar."
            : "Coleta em andamento…"
        );
      } catch {
        /* ignore */
      }
    }, 2000);
  }

  async function collect() {
    setLoading(true);
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
      setLoading(true);
      startPolling();
    } catch (err) {
      setMsg(String(err));
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

/** Botão sempre visível — para todos os processos de coleta ativos. */
export function StopCollectButton() {
  const router = useRouter();
  const [stopping, setStopping] = useState(false);
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/admin/articles?status=1");
        const data = await res.json();
        if (!alive) return;
        setActive(Boolean(data.collect?.running || data.collect?.cancelRequested));
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = setInterval(tick, 2500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  async function stopAll() {
    setStopping(true);
    setMsg("Parando todos os processos de coleta…");
    try {
      const res = await fetch("/api/admin/collect/stop", { method: "POST" });
      const data = await res.json();
      setMsg(data.message || "Parada enviada");
      setActive(Boolean(data.collect?.running));
      router.refresh();
    } catch (err) {
      setMsg(String(err));
    } finally {
      setStopping(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 sm:min-w-[220px]">
      <p className="text-xs font-bold uppercase tracking-wider text-red-300">Emergência</p>
      <button
        type="button"
        onClick={stopAll}
        disabled={stopping}
        className="rounded-full border border-red-500/50 bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 disabled:opacity-60"
      >
        {stopping ? "Parando tudo…" : "Parar coleta"}
      </button>
      <p className="text-[11px] leading-relaxed text-red-200/70">
        {active
          ? "Coleta ativa detectada — clique para interromper todos os processos."
          : "Sempre disponível. Encerra qualquer coleta em andamento no servidor."}
      </p>
      {msg ? <p className="text-[11px] text-red-200/90">{msg}</p> : null}
    </div>
  );
}
