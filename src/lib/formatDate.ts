import { format } from "date-fns";
import { es } from "date-fns/locale";

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("T")[0].split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return format(date, "dd/MM/yyyy", { locale: es });
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
