import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Palette } from 'lucide-react';

interface ColorLegendItem {
  status: string;
  label: string;
  color: string;
}

const legendItems: ColorLegendItem[] = [
  { status: 'healthy', label: 'Sano', color: '#10b981' },
  { status: 'caries', label: 'Caries', color: '#ef4444' },
  { status: 'filled', label: 'Obturado', color: '#3b82f6' },
  { status: 'crown', label: 'Corona', color: '#f59e0b' },
  { status: 'root_canal', label: 'Endodoncia', color: '#ec4899' },
  { status: 'implant', label: 'Implante', color: '#8b5cf6' },
  { status: 'extracted', label: 'Extraído', color: '#6b7280' },
  { status: 'fracture', label: 'Fractura', color: '#f97316' },
  { status: 'bridge', label: 'Puente', color: '#6366f1' },
  { status: 'extraction_indicated', label: 'Extracción indicada', color: '#dc2626' },
];

export const ColorLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-background border border-border rounded-lg">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          Leyenda de estados dentales
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-3">
          {legendItems.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
