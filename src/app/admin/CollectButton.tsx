"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { readJsonSafe } from "@/lib/safeJson";

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
    void (async () => {
      try {
        const res = await fetch("/api/admin/articles?status=1");
        const data = await readJsonSafe<{ collect?: { running?: boolean; cancelRequested?: boolean } }>(res);
        if (data.collect?.running) {
          setLoading(true);
          setMsg(data.collect.cancelRequested ? "Parando…" : "Coletando…");
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
        const data = await readJsonSafe<{
          collect?: {
            running?: boolean;
            cancelRequested?: boolean;
            lastResult?: { message?: string; cancelled?: boolean };
          };
        }>(res);
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
        setMsg(c.cancelRequested ? "Parando…" : "Coletando…");
      } catch {
        /* ignore */
      }
    }, 2000);
  }

  async function collect() {
    setLoading(true);
    setMsg(`Iniciando até ${qty}…`);
    try {
      const res = await fetch(`/api/admin/articles?max=${qty}`, { method: "POST" });
      const data = await readJsonSafe<{ message?: string }>(res);
      if (!res.ok && res.status !== 409) {
        setMsg(data.message || "Falha ao iniciar");
        setLoading(false);
        return;
      }
      setMsg(data.message || "Coleta iniciada…");
      startPolling();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  async function stopAll() {
    setStopping(true);
    setMsg("Parando tudo…");
    try {
      const res = await fetch("/api/admin/collect/stop", { method: "POST" });
      const data = await readJsonSafe<{
        message?: string;
        collect?: { running?: boolean };
      }>(res);
      setMsg(data.message || "Parada enviada");
      if (!data.collect?.running) {
        setLoading(false);
        stopPolling();
        router.refresh();
      } else {
        startPolling();
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setStopping(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          Qtd
          <select
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white outline-none focus:border-[#009c3b]/50"
          >
            {OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
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
        {/* Mini botão redondo desligar — sempre ao lado de Coletar */}
        <button
          type="button"
          onClick={stopAll}
          disabled={stopping}
          title="Parar todas as coletas ativas"
          aria-label="Parar coleta"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-red-500/50 bg-red-600 text-white shadow-md shadow-red-900/40 transition hover:bg-red-500 disabled:opacity-50"
        >
          <PowerIcon />
        </button>
      </div>
      {msg ? <span className="max-w-sm text-right text-[11px] text-zinc-500">{msg}</span> : null}
    </div>
  );
}

function PowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 2v10" strokeLinecap="round" />
      <path d="M6.3 6.3a8 8 0 1 0 11.4 0" strokeLinecap="round" />
    </svg>
  );
}
