import React, { useState, useEffect } from 'react';
import { X, Activity, FileText, Syringe, Check, AlertCircle, CircleDot, Crown, Plus, Zap, AlertTriangle, Link, AlertOctagon, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Tooth, ToothStatus, ToothProcedure } from '@/lib/odontograma/types';
import { SurfacesSection } from './sections/SurfacesSection';
import './FloatingToothDetailsCard.css';

interface FloatingToothDetailsCardProps {
  tooth: Tooth;
  onUpdateTooth: (toothId: number, updates: Partial<Tooth>) => void;
  onClose: () => void;
  isDarkMode?: boolean;
}

type TabType = 'estado' | 'notas' | 'historial';
type ToothSurface = 'oclusal' | 'vestibular' | 'lingual' | 'mesial' | 'distal';

const statusOptions = [
  { id: 'healthy' as ToothStatus, name: 'Sano', icon: Check, color: '#10b981' },
  { id: 'caries' as ToothStatus, name: 'Caries', icon: AlertCircle, color: '#ef4444' },
  { id: 'filled' as ToothStatus, name: 'Obturado', icon: CircleDot, color: '#3b82f6' },
  { id: 'crown' as ToothStatus, name: 'Corona', icon: Crown, color: '#f59e0b' },
  { id: 'root_canal' as ToothStatus, name: 'Endodoncia', icon: Zap, color: '#ec4899' },
  { id: 'implant' as ToothStatus, name: 'Implante', icon: Plus, color: '#8b5cf6' },
  { id: 'extracted' as ToothStatus, name: 'Extraído', icon: X, color: '#6b7280' },
  { id: 'fracture' as ToothStatus, name: 'Fractura', icon: AlertTriangle, color: '#f97316' },
  { id: 'bridge' as ToothStatus, name: 'Puente', icon: Link, color: '#6366f1' },
  { id: 'extraction_indicated' as ToothStatus, name: 'Extracción indicada', icon: AlertOctagon, color: '#dc2626' },
  { id: 'not_erupted' as ToothStatus, name: 'No erupcionado', icon: HelpCircle, color: '#14b8a6' },
];

export const FloatingToothDetailsCard: React.FC<FloatingToothDetailsCardProps> = ({ 
  tooth, 
  onUpdateTooth, 
  onClose,
  isDarkMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('estado');
  const [selectedTool, setSelectedTool] = useState<ToothStatus>(tooth.status);
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localNotes, setLocalNotes] = useState(tooth.notes || '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [localTratamiento, setLocalTratamiento] = useState('');

  useEffect(() => {
    setSelectedTool(tooth.status);
  }, [tooth.status]);

  useEffect(() => {
    setLocalNotes('');
    setLocalTratamiento('');
    setNotesSaved(!!tooth.notes);
  }, [tooth.id]);

  const getToothTypeName = (position: number) => {
    if (position <= 2) return 'Incisivo';
    if (position === 3) return 'Canino';
    if (position <= 5) return 'Premolar';
    return 'Molar';
  };

  const getQuadrantName = (quadrant: number) => {
    const names: Record<number, string> = {
      1: 'Superior Derecho',
      2: 'Superior Izquierdo', 
      3: 'Inferior Izquierdo',
      4: 'Inferior Derecho'
    };
    return names[quadrant] || '';
  };

  const handleSurfaceClick = (surface: ToothSurface) => {
    setSelectedSurface(surface);
    const newSurfaces = {
      ...(tooth.surfaces || {}),
      [surface]: selectedTool
    };
    onUpdateTooth(tooth.id, { surfaces: newSurfaces });
  };

  const handleStatusChange = (status: ToothStatus) => {
    setSelectedTool(status);
    setHasUnsavedChanges(true);
    setTimeout(() => setHasUnsavedChanges(false), 1000);
  };

  const handleWholeToothUpdate = () => {
    onUpdateTooth(tooth.id, { 
      status: selectedTool,
      surfaces: {
        oclusal: selectedTool,
        vestibular: selectedTool,
        lingual: selectedTool,
        mesial: selectedTool,
        distal: selectedTool
      }
    });
    setHasUnsavedChanges(true);
    setTimeout(() => setHasUnsavedChanges(false), 1000);
  };

  const handleSaveNotes = () => {
    if (!localNotes.trim()) return;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}/${month}/${year}`;
    const newEntry = `${dateStr} - ${localNotes.trim()}`;
    const updatedNotes = tooth.notes ? tooth.notes + '\n' + newEntry : newEntry;
    onUpdateTooth(tooth.id, { notes: updatedNotes });
    setLocalNotes('');
    setNotesSaved(true);
  };

  const handleCancelNotes = () => {
    setLocalNotes(tooth.notes || '');
    setNotesSaved(false);
  };

  const handleSaveTratamiento = () => {
    if (!localTratamiento.trim()) return;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const newProc: ToothProcedure = {
      id: crypto.randomUUID(),
      type: localTratamiento.trim(),
      date: `${day}/${month}/${year}`,
    };
    const updatedProcedures = [...(tooth.procedures || []), newProc];
    onUpdateTooth(tooth.id, { procedures: updatedProcedures });
    setLocalTratamiento('');
  };

  const handleCancelTratamiento = () => {
    setLocalTratamiento('');
  };

  const tabs = [
    { id: 'estado' as TabType, label: 'Estado', icon: Activity },
    { id: 'notas' as TabType, label: 'Notas', icon: FileText },
    { id: 'historial' as TabType, label: 'Historial', icon: Syringe },
  ];

  const hasNotes = tooth.notes && tooth.notes.trim().length > 0;
  const procedureCount = tooth.procedures?.length || 0;

  return (
    <div className="h-full bg-gray-950 flex flex-col border-l border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm ${hasUnsavedChanges ? 'save-success' : ''}`}>
              {tooth.clinicalId || tooth.id}
            </div>
            {hasNotes && <div className="has-notes-indicator" />}
            {procedureCount > 0 && (
              <div className="procedure-count">{procedureCount}</div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">
              {getToothTypeName(tooth.position)}
            </h3>
            <p className="text-sm text-gray-400">
              {getQuadrantName(tooth.quadrant)} • Posición {tooth.position}
            </p>
            {tooth.isTemporary && (
              <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 mt-1">
                Diente temporal
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex bg-gray-900 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4 mr-2 inline" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'estado' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Selecciona un estado:</h4>
              <div className="grid grid-cols-4 gap-2">
                {statusOptions.map((status) => {
                  const Icon = status.icon;
                  const isSelected = selectedTool === status.id;
                  return (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => handleStatusChange(status.id)}
                        className={`flex flex-col items-center py-2 rounded-lg border transition-all duration-200 ${
                        isSelected 
                          ? 'text-white shadow-sm' 
                          : 'border-gray-600 hover:bg-gray-800 text-gray-300'
                      }`}
                      style={isSelected ? {
                        backgroundColor: status.color,
                        borderColor: status.color
                      } : {}}
                    >
                      <Icon className="w-4 h-4 mb-1" style={{ color: isSelected ? 'white' : status.color }} />
                      <span className="text-xs">{status.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <SurfacesSection
              surfaces={tooth.surfaces}
              selectedTool={selectedTool}
              onSurfaceUpdate={handleSurfaceClick}
              onWholeToothUpdate={handleWholeToothUpdate}
            />
          </div>
        )}
        
        {activeTab === 'notas' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-400">Notas del diente</h4>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Agregar notas sobre este diente..."
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveNotes}
                className="flex-1 inline-flex items-center justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-cyan-500/90 transition-colors"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={handleCancelNotes}
                className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 shadow hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
            {notesSaved && tooth.notes && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Historial de notas:</p>
                {tooth.notes.split('\n').map((entry, i) => {
                  const dateEnd = entry.indexOf(' - ');
                  const date = dateEnd > -1 ? entry.slice(0, dateEnd) : '';
                  const text = dateEnd > -1 ? entry.slice(dateEnd + 3) : entry;
                  return (
                    <div key={i} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-400">{date}</p>
                      <p className="text-sm text-gray-300 mt-0.5">{text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'historial' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-400">Tratamientos</h4>
            <input
              type="text"
              value={localTratamiento}
              onChange={(e) => setLocalTratamiento(e.target.value)}
              placeholder="Agregar tratamiento..."
              className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveTratamiento}
                className="flex-1 inline-flex items-center justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-cyan-500/90 transition-colors"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={handleCancelTratamiento}
                className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 shadow hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
            {tooth.procedures && tooth.procedures.length > 0 ? (
              tooth.procedures.map((proc) => (
                <div key={proc.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm font-medium text-gray-100">{proc.type}</p>
                  <p className="text-xs text-gray-400">{proc.date}</p>
                  {proc.description && (
                    <p className="text-xs text-gray-400 mt-1">{proc.description}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No hay tratamientos registrados</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
