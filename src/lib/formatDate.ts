import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "-";
  return format(parseISO(dateStr), "dd/MM/yyyy", { locale: es });
}

export function formatTodayDate(): string {
  return format(new Date(), "dd/MM/yyyy", { locale: es });
}

export function formatTimeDisplay(date: Date): string {
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
