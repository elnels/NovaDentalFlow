"use client";

import React, { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Odontogram } from "@/lib/odontograma/components/Odontogram";
import { ColorLegend } from "@/lib/odontograma/components/ColorLegend";
import { FloatingToothDetailsCard } from "@/lib/odontograma/components/FloatingToothDetailsCard";
import { initialPermanentTeeth, initialTemporaryTeeth } from "@/lib/odontograma/data/dentalData";
import type { Tooth } from "@/lib/odontograma/types";
import type { FormState } from "@/lib/actions";

interface Hc6FormProps {
  patientId: string;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  onSuccess: () => void;
  onBack?: () => void;
}

export function Hc6Form({ patientId, action, onSuccess, onBack }: Hc6FormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teeth, setTeeth] = useState<Tooth[]>(initialPermanentTeeth);
  const [temporaryTeeth] = useState<Tooth[]>(initialTemporaryTeeth);
  const [showTemporaryTeeth, setShowTemporaryTeeth] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [diagnosticoPresuncion, setDiagnosticoPresuncion] = useState("");
  const [estudiosAuxiliares, setEstudiosAuxiliares] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      formData.set(
        "hc6Data",
        JSON.stringify({
          teeth,
          temporaryTeeth,
          diagnosticoPresuncion,
          estudiosAuxiliares,
          observaciones,
        })
      );
      const result = await action({ message: "", success: false }, formData);
      if (result.success) {
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateTooth = (toothId: number, updates: Partial<Tooth>) => {
    setTeeth((prev) =>
      prev.map((t) => (t.id === toothId ? { ...t, ...updates } : t))
    );
  };

  const resetTeeth = () => {
    setTeeth(initialPermanentTeeth);
    setSelectedTooth(null);
  };

  const today = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Odontograma y Diagnóstico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-3 bg-muted/30 rounded-md">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Fecha:</span> {today}
          </p>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <input type="hidden" name="patientId" value={patientId} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 border rounded-lg p-4 bg-muted/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Odontograma</h3>
                <Button type="button" variant="outline" size="sm" onClick={resetTeeth}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Restablecer
                </Button>
              </div>
              <Odontogram
                teeth={teeth}
                temporaryTeeth={temporaryTeeth}
                showTemporaryTeeth={showTemporaryTeeth}
                onToggleTemporaryTeeth={setShowTemporaryTeeth}
                selectedTooth={selectedTooth}
                onToothClick={(t) => setSelectedTooth(t)}
              />
              <div className="mt-4">
                <ColorLegend />
              </div>
            </div>
            <div className="lg:col-span-1">
              {selectedTooth ? (
                <div className="border rounded-lg overflow-hidden bg-muted/10 h-full">
                  <FloatingToothDetailsCard
                    tooth={selectedTooth}
                    onUpdateTooth={updateTooth}
                    onClose={() => setSelectedTooth(null)}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-6 h-full flex items-center justify-center bg-muted/10 min-h-[300px]">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-2">Selecciona un diente</p>
                    <p className="text-sm max-w-xs mx-auto">Haz clic en cualquier diente del odontograma para ver sus detalles y herramientas</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Diagnóstico de Presunción</Label>
            <Textarea
              value={diagnosticoPresuncion}
              onChange={(e) => setDiagnosticoPresuncion(e.target.value)}
              placeholder="Diagnóstico presuntivo..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Estudios Auxiliares</Label>
            <Textarea
              value={estudiosAuxiliares}
              onChange={(e) => setEstudiosAuxiliares(e.target.value)}
              placeholder="Estudios auxiliares solicitados..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Observaciones</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas y observaciones..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-2">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} className="flex-1">
                Regresar
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Guardando..." : "Continuar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
