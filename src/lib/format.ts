import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const BR_TZ = "America/Sao_Paulo";

/** Data/hora no fuso de Brasília (pt-BR). */
export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BR_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** Só a data em Brasília: YYYY-MM-DD */
export function brasiliaDateKey(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** True se a data for o dia atual em Brasília. */
export function isTodayBrasilia(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return false;
  return brasiliaDateKey(d) === brasiliaDateKey(new Date());
}

export function formatRelative(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}
