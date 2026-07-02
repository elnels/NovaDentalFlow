import React, { useState, useEffect } from 'react';
import { X, Activity, FileText, Syringe, Check, AlertCircle, CircleDot, Crown, Plus, Zap, AlertTriangle, Link, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Tooth, ToothStatus } from '@/lib/odontograma/types';
import { SurfacesSection } from './sections/SurfacesSection';
import './FloatingToothDetailsCard.css';

interface FloatingToothDetailsCardProps {
  tooth: Tooth;
  onUpdateTooth: (toothId: number, updates: Partial<Tooth>) => void;
  onClose: () => void;
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
];

export const FloatingToothDetailsCard: React.FC<FloatingToothDetailsCardProps> = ({ 
  tooth, 
  onUpdateTooth, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('estado');
  const [selectedTool, setSelectedTool] = useState<ToothStatus>(tooth.status);
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setSelectedTool(tooth.status);
  }, [tooth.status]);

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
    onUpdateTooth(tooth.id, { status });
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

  const tabs = [
    { id: 'estado' as TabType, label: 'Estado', icon: Activity },
    { id: 'notas' as TabType, label: 'Notas', icon: FileText },
    { id: 'historial' as TabType, label: 'Historial', icon: Syringe },
  ];

  const hasNotes = tooth.notes && tooth.notes.trim().length > 0;
  const procedureCount = tooth.procedures?.length || 0;

  return (
    <div className="h-full bg-background flex flex-col border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold text-sm ${hasUnsavedChanges ? 'save-success' : ''}`}>
              {tooth.clinicalId || tooth.id}
            </div>
            {hasNotes && <div className="has-notes-indicator" />}
            {procedureCount > 0 && (
              <div className="procedure-count">{procedureCount}</div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {getToothTypeName(tooth.position)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {getQuadrantName(tooth.quadrant)} • Posición {tooth.position}
            </p>
            {tooth.isTemporary && (
              <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning mt-1">
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
      <div className="p-4 border-b border-border bg-muted/50">
        <div className="flex bg-background rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Selecciona un estado:</h4>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((status) => {
                  const Icon = status.icon;
                  const isSelected = selectedTool === status.id;
                  return (
                    <button
                      key={status.id}
                      onClick={() => handleStatusChange(status.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'shadow-sm' 
                          : 'border-border hover:border-accent/50 hover:bg-muted'
                      }`}
                      style={isSelected ? {
                        backgroundColor: status.color,
                        borderColor: status.color,
                        color: 'white'
                      } : {}}
                    >
                      <Icon className="w-5 h-5" style={{ color: isSelected ? 'white' : status.color }} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-foreground'}`}>
                        {status.name}
                      </span>
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
            <h4 className="text-sm font-medium text-muted-foreground">Notas del diente</h4>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Agregar notas sobre este diente..."
              value={tooth.notes || ''}
              onChange={(e) => onUpdateTooth(tooth.id, { notes: e.target.value })}
            />
          </div>
        )}
        
        {activeTab === 'historial' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Procedimientos</h4>
            {tooth.procedures && tooth.procedures.length > 0 ? (
              tooth.procedures.map((proc) => (
                <div key={proc.id} className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-foreground">{proc.type}</p>
                  <p className="text-xs text-muted-foreground">{proc.date}</p>
                  {proc.description && (
                    <p className="text-xs text-muted-foreground mt-1">{proc.description}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No hay procedimientos registrados</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
