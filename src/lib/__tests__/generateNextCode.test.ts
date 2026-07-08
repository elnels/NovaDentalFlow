import { describe, it, expect } from "vitest";

const categoryToPrefix: Record<string, string> = {
  Consulta: "CON",
  Preventiva: "PREV",
  Restauradora: "REST",
  Endodoncia: "END",
  Cirugía: "CIR",
  Periodoncia: "PERIO",
  Ortodoncia: "ORT",
  Prótesis: "PROT",
  Radiología: "RADIO",
  Estética: "EST",
};

function generateNextCode(
  category: string,
  existing: { code: string }[]
): string {
  const prefix = categoryToPrefix[category];
  if (!prefix) return "";
  const maxNum = existing
    .filter((p) => p.code.startsWith(prefix + "-"))
    .reduce((max, p) => {
      const num = parseInt(p.code.split("-")[1], 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
}

describe("generateNextCode", () => {
  it("returns empty string for unknown category", () => {
    expect(generateNextCode("Unknown", [])).toBe("");
  });

  it("returns PREFIX-001 when no existing codes", () => {
    expect(generateNextCode("Consulta", [])).toBe("CON-001");
  });

  it("returns next sequential number for existing codes", () => {
    const existing = [
      { code: "CON-001" },
      { code: "CON-002" },
      { code: "CON-003" },
    ];
    expect(generateNextCode("Consulta", existing)).toBe("CON-004");
  });

  it("handles gaps in sequence", () => {
    const existing = [
      { code: "CON-001" },
      { code: "CON-005" },
    ];
    expect(generateNextCode("Consulta", existing)).toBe("CON-006");
  });

  it("does not interfere between different prefixes", () => {
    const existing = [
      { code: "CON-005" },
      { code: "CIR-001" },
    ];
    expect(generateNextCode("Cirugía", existing)).toBe("CIR-002");
  });

  it("pads to 3 digits", () => {
    const existing = Array.from({ length: 999 }, (_, i) => ({
      code: `CON-${String(i + 1).padStart(3, "0")}`,
    }));
    expect(generateNextCode("Consulta", existing)).toBe("CON-1000");
  });
});
