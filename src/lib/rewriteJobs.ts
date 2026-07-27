/**
 * Jobs em memória para reescrita por URL (evita timeout HTTP no Render).
 */

export type RewriteJobStatus = "running" | "ok" | "error";

export type RewriteJob = {
  id: string;
  status: RewriteJobStatus;
  message: string;
  error?: string;
  article?: {
    id: string;
    slug: string;
    title: string;
  };
  usedOriginalImage?: boolean;
  startedAt: number;
  finishedAt?: number;
};

const jobs = new Map<string, RewriteJob>();

// limpa jobs antigos (1h)
function gc() {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.startedAt < cutoff) jobs.delete(id);
  }
}

export function createRewriteJob(): RewriteJob {
  gc();
  const id = `rw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const job: RewriteJob = {
    id,
    status: "running",
    message: "Iniciando…",
    startedAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function getRewriteJob(id: string): RewriteJob | null {
  return jobs.get(id) || null;
}

export function updateRewriteJob(id: string, patch: Partial<RewriteJob>) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, patch);
  jobs.set(id, job);
}
