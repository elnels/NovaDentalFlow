"use client";

import React from "react";

const CONDITIONS = [
  { left: "Anemia", right: "Hipertensión arterial" },
  { left: "Artritis reumatoide", right: "Infarto al corazón" },
  { left: "Asma", right: "Lupus" },
  { left: "Cáncer (¿en dónde?)", right: "Mononucleosis infecciosa" },
  { left: "Cirrosis", right: "Obesidad" },
  { left: "Diabetes", right: "Osteoporosis" },
  { left: "Discapacidad (física, neurológica, sensorial)", right: "Padecimientos renales" },
  { left: "Dolor torácico, intolerancia al ejercicio", right: "Parotiditis (paperas)" },
  { left: "Enfisema pulmonar", right: "Pérdida de peso, sin razón aparente" },
  { left: "Epilepsia", right: "Rubeola" },
  { left: "Escarlatina", right: "Sarampión" },
  { left: "Fiebre reumática", right: "Varicela" },
  { left: "Hemorragias espontáneas", right: "VIH" },
  { left: "Hepatitis A, B o C (¿cuál?)", right: "Otro: Covid 19" },
];

export interface AntecedenteItem {
  c: string;
  s: boolean;
  n: boolean;
  e: string;
}

export function createDefaultAntecedentes(): AntecedenteItem[] {
  const all: string[] = [];
  for (const row of CONDITIONS) {
    all.push(row.left, row.right);
  }
  return all.map((name) => ({ c: name, s: false, n: false, e: "" }));
}

export function parseAntecedentes(json: string): AntecedenteItem[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return createDefaultAntecedentes();
}

interface AntecedentesGridProps {
  value: AntecedenteItem[];
  onChange: (items: AntecedenteItem[]) => void;
}

export function AntecedentesGrid({ value, onChange }: AntecedentesGridProps) {
  const items = value.length === 0 ? createDefaultAntecedentes() : value;

  const updateItem = (index: number, partial: Partial<AntecedenteItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...partial };
    onChange(next);
  };

  const allNames: string[] = [];
  for (const row of CONDITIONS) {
    allNames.push(row.left, row.right);
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-2 border-b font-medium">Presenta o ha presentado:</th>
            <th className="text-center p-2 border-b font-medium w-12">Sí</th>
            <th className="text-center p-2 border-b font-medium w-12">No</th>
            <th className="text-center p-2 border-b font-medium w-16">Edad</th>
            <th className="text-left p-2 border-b font-medium">Presenta o ha presentado:</th>
            <th className="text-center p-2 border-b font-medium w-12">Sí</th>
            <th className="text-center p-2 border-b font-medium w-12">No</th>
            <th className="text-center p-2 border-b font-medium w-16">Edad</th>
          </tr>
        </thead>
        <tbody>
          {CONDITIONS.map((row, rowIdx) => {
            const leftIdx = rowIdx * 2;
            const rightIdx = rowIdx * 2 + 1;
            const leftItem = items[leftIdx] || { c: row.left, s: false, n: false, e: "" };
            const rightItem = items[rightIdx] || { c: row.right, s: false, n: false, e: "" };

            return (
              <tr key={rowIdx} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="p-2 text-sm">{row.left}</td>
                <td className="p-2 text-center">
                  <input
                    type="radio"
                    name={`left-sino-${rowIdx}`}
                    checked={leftItem.s}
                    onChange={() => updateItem(leftIdx, { s: true, n: false })}
                    className="h-4 w-4 text-blue-600"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="radio"
                    name={`left-sino-${rowIdx}`}
                    checked={leftItem.n}
                    onChange={() => updateItem(leftIdx, { s: false, n: true })}
                    className="h-4 w-4 text-blue-600"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={leftItem.e}
                    onChange={(e) => updateItem(leftIdx, { e: e.target.value })}
                    className="w-14 h-7 px-1 text-xs border rounded text-center"
                  />
                </td>
                <td className="p-2 text-sm">{row.right}</td>
                <td className="p-2 text-center">
                  <input
                    type="radio"
                    name={`right-sino-${rowIdx}`}
                    checked={rightItem.s}
                    onChange={() => updateItem(rightIdx, { s: true, n: false })}
                    className="h-4 w-4 text-blue-600"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="radio"
                    name={`right-sino-${rowIdx}`}
                    checked={rightItem.n}
                    onChange={() => updateItem(rightIdx, { s: false, n: true })}
                    className="h-4 w-4 text-blue-600"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={rightItem.e}
                    onChange={(e) => updateItem(rightIdx, { e: e.target.value })}
                    className="w-14 h-7 px-1 text-xs border rounded text-center"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
