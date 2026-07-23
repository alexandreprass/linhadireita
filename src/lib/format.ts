import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatRelative(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}
