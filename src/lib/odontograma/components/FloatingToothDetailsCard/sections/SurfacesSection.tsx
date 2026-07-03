import React from 'react';
import type { ToothStatus } from '@/lib/odontograma/types';

type ToothSurface = 'oclusal' | 'vestibular' | 'lingual' | 'mesial' | 'distal';

interface SurfacesSectionProps {
  surfaces?: Partial<Record<ToothSurface, ToothStatus>>;
  selectedTool: ToothStatus;
  onSurfaceUpdate: (surface: ToothSurface, status: ToothStatus) => void;
  onWholeToothUpdate: () => void;
}

const surfaceColors: Record<string, string> = {
  healthy: '#10b981',
  caries: '#ef4444',
  filled: '#3b82f6',
  crown: '#f59e0b',
  root_canal: '#8b5cf6',
  implant: '#6366f1',
  extracted: '#6b7280',
  fracture: '#f97316',
  bridge: '#8b5cf6',
  extraction_indicated: '#dc2626',
};

const statusName: Record<string, string> = {
  healthy: 'Sano', caries: 'Caries', filled: 'Obturado',
  crown: 'Corona', root_canal: 'Endodoncia', implant: 'Implante',
  extracted: 'Extraído', fracture: 'Fractura', bridge: 'Puente',
  extraction_indicated: 'Extracción indicada',
};

export const SurfacesSection: React.FC<SurfacesSectionProps> = ({
  surfaces = {},
  selectedTool,
  onSurfaceUpdate,
  onWholeToothUpdate
}) => {
  const getSurfaceColor = (surface: ToothSurface): string => {
    const status = surfaces[surface] || 'healthy';
    return surfaceColors[status] || '#10b981';
  };

  const handleSurfaceClick = (surface: ToothSurface) => {
    onSurfaceUpdate(surface, selectedTool);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-medium text-gray-400 mb-4">
          Haz clic en cada superficie para aplicar:
          <span className="ml-1 font-semibold" style={{ color: surfaceColors[selectedTool] }}>
            {statusName[selectedTool]}
          </span>
        </h4>

        <div className="relative mb-4">
          <svg width="200" height="200" viewBox="0 0 200 200" className="border border-gray-700 rounded-lg bg-gray-800">
            <rect x="60" y="20" width="80" height="30" rx="8" fill={getSurfaceColor('vestibular')} stroke="#4b5563" strokeWidth="2" className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleSurfaceClick('vestibular')} />
            <text x="100" y="40" textAnchor="middle" fontSize="12" fill="white" className="pointer-events-none">Vestibular</text>

            <rect x="20" y="60" width="30" height="80" rx="8" fill={getSurfaceColor('mesial')} stroke="#4b5563" strokeWidth="2" className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleSurfaceClick('mesial')} />
            <text x="35" y="105" textAnchor="middle" fontSize="10" fill="white" className="pointer-events-none">Mesial</text>

            <rect x="60" y="60" width="80" height="80" rx="12" fill={getSurfaceColor('oclusal')} stroke="#4b5563" strokeWidth="2" className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleSurfaceClick('oclusal')} />
            <text x="100" y="105" textAnchor="middle" fontSize="14" fill="white" className="pointer-events-none font-semibold">Oclusal</text>

            <rect x="150" y="60" width="30" height="80" rx="8" fill={getSurfaceColor('distal')} stroke="#4b5563" strokeWidth="2" className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleSurfaceClick('distal')} />
            <text x="165" y="105" textAnchor="middle" fontSize="10" fill="white" className="pointer-events-none">Distal</text>

            <rect x="60" y="150" width="80" height="30" rx="8" fill={getSurfaceColor('lingual')} stroke="#4b5563" strokeWidth="2" className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleSurfaceClick('lingual')} />
            <text x="100" y="170" textAnchor="middle" fontSize="12" fill="white" className="pointer-events-none">Lingual</text>
          </svg>
        </div>

        <button type="button" onClick={onWholeToothUpdate} className="inline-flex items-center justify-center rounded-md bg-cyan-500 px-8 py-2 text-sm font-medium text-white shadow hover:bg-cyan-500/90 transition-colors">
          Aplicar a todo el diente
        </button>
      </div>
    </div>
  );
};
