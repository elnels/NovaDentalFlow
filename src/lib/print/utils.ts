const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatDateSpanish(dateStr: string | null | undefined): string {
  if (!dateStr) return "No disponible";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "No disponible";
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTimeSpanish(dateStr: string | null | undefined): string {
  if (!dateStr) return "No disponible";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "No disponible";
  const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${time}`;
}

export function calculateAge(birthDateStr: string | null | undefined): string {
  if (!birthDateStr) return "No disponible";
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return "No disponible";
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  return `${years} años`;
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "Sin fecha";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Sin fecha";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function parseHc2Conditions(raw: unknown): { name: string; presents: boolean; edad: string }[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseHc5Data(raw: unknown): { tejidosBlandos: string | null; oclusion: Record<string, unknown> | null } {
  if (!raw) return { tejidosBlandos: null, oclusion: null };
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      tejidosBlandos: parsed?.tejidosBlandos || null,
      oclusion: parsed?.oclusion || null,
    };
  } catch {
    return { tejidosBlandos: null, oclusion: null };
  }
}
