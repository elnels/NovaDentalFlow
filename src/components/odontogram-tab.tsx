"use client";

import React, { useState, useEffect } from "react";
import { Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { getPatientById, saveHc6 } from "@/lib/actions";
import type { Tooth } from "@/lib/odontograma/types";
import type { FormState } from "@/lib/actions";

interface OdontogramTabProps {
  patientId: string;
  onDataUpdate: () => Promise<void>;
}

export function OdontogramTab({ patientId, onDataUpdate }: OdontogramTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teeth, setTeeth] = useState<Tooth[]>(initialPermanentTeeth);
  const [temporaryTeeth, setTemporaryTeeth] = useState<Tooth[]>(initialTemporaryTeeth);
  const [showTemporaryTeeth, setShowTemporaryTeeth] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);

  useEffect(() => {
    getPatientById(patientId).then((res) => {
      if (res) {
        const odontograma = res.clinicalHistory?.[0]?.odontograma as
          | { permanentTeeth?: Tooth[]; temporaryTeeth?: Tooth[] }
          | null;
        if (odontograma?.permanentTeeth) {
          setTeeth(odontograma.permanentTeeth);
        }
        if (odontograma?.temporaryTeeth) {
          setTemporaryTeeth(odontograma.temporaryTeeth);
        }
      }
    });
  }, [patientId]);

  const updateTooth = (toothId: number, updates: Partial<Tooth>) => {
    const tooth = [...teeth, ...temporaryTeeth].find((t) => t.id === toothId);
    if (tooth?.isTemporary) {
      setTemporaryTeeth((prev) =>
        prev.map((t) => (t.id === toothId ? { ...t, ...updates } : t))
      );
    } else {
      setTeeth((prev) =>
        prev.map((t) => (t.id === toothId ? { ...t, ...updates } : t))
      );
    }
    setSelectedTooth((prev) =>
      prev && prev.id === toothId ? { ...prev, ...updates } : prev
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("patientId", patientId);
      formData.set(
        "hc6Data",
        JSON.stringify({ teeth, temporaryTeeth })
      );
      const result = await saveHc6(
        { message: "", success: false },
        formData
      );
      if (result.success) {
        await onDataUpdate();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Odontograma
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="mb-6 grid grid-cols-1 lg:grid-cols-[1100px_1fr] gap-4">
             <div className="border rounded-lg p-4">
              <Odontogram
                teeth={teeth}
                temporaryTeeth={temporaryTeeth}
                showTemporaryTeeth={showTemporaryTeeth}
                onToggleTemporaryTeeth={setShowTemporaryTeeth}
                selectedTooth={selectedTooth}
                onToothClick={(t) => setSelectedTooth(t)}
                isDarkMode={false}
              />
            </div>
            <div>
              {selectedTooth ? (
                <div className="border rounded-lg overflow-hidden h-full">
                  <FloatingToothDetailsCard
                    tooth={selectedTooth}
                    onUpdateTooth={updateTooth}
                    onClose={() => setSelectedTooth(null)}
                    isDarkMode={false}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-6 h-full flex items-center justify-center min-h-[300px]">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-2">Selecciona un diente</p>
                    <p className="text-sm max-w-xs mx-auto">
                      Haz clic en cualquier diente del odontograma para ver sus detalles y herramientas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <ColorLegend theme="light" />
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
