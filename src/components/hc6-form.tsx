"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { formatTodayDate } from "@/lib/formatDate";
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
import { getPatientById } from "@/lib/actions";
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
  const [temporaryTeeth, setTemporaryTeeth] = useState<Tooth[]>(initialTemporaryTeeth);
  const [showTemporaryTeeth, setShowTemporaryTeeth] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState<number | null>(null);

  useEffect(() => {
    getPatientById(patientId).then((res) => {
      if (res) {
        setPatientName(`${res.nombres} ${res.apellidos}`);
        if (res.fechaNacimiento) {
          const birth = new Date(res.fechaNacimiento);
          const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          setPatientAge(age);
        }
        const odontograma = res.clinicalHistory?.[0]?.odontograma as { permanentTeeth?: Tooth[]; temporaryTeeth?: Tooth[] } | null;
        if (odontograma?.permanentTeeth) {
          setTeeth(odontograma.permanentTeeth);
        }
        if (odontograma?.temporaryTeeth) {
          setTemporaryTeeth(odontograma.temporaryTeeth);
        }
        if (res.esMenor) setShowTemporaryTeeth(true);
      }
    });
  }, [patientId]);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      formData.set(
        "hc6Data",
        JSON.stringify({
          teeth,
          temporaryTeeth,
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

  const today = formatTodayDate();

  return (
    <Card className="!bg-[rgb(30,30,30)] border-gray-700 text-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Odontograma y Diagnóstico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-3 bg-gray-800/50 rounded-md space-y-1">
          <p className="text-sm text-gray-100">
            <span className="font-semibold">Fecha:</span> {today}
          </p>
          {patientName && (
            <p className="text-sm text-gray-100">
              <span className="font-semibold">Nombre:</span> {patientName}
            </p>
          )}
          {patientAge !== null && (
            <p className="text-sm text-gray-100">
              <span className="font-semibold">Edad:</span> {patientAge} años
            </p>
          )}
        </div>

        <form action={handleSubmit}>
          <input type="hidden" name="patientId" value={patientId} />

          <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 border border-gray-700 rounded-lg p-4 bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-100">Odontograma</h3>

              </div>
              <Odontogram
                teeth={teeth}
                temporaryTeeth={temporaryTeeth}
                showTemporaryTeeth={showTemporaryTeeth}
                onToggleTemporaryTeeth={setShowTemporaryTeeth}
                selectedTooth={selectedTooth}
                onToothClick={(t) => setSelectedTooth(t)}
                isDarkMode={true}
              />
            </div>
            <div className="lg:col-span-1">
              {selectedTooth ? (
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900 h-full">
                  <FloatingToothDetailsCard
                    tooth={selectedTooth}
                    onUpdateTooth={updateTooth}
                    onClose={() => setSelectedTooth(null)}
                    isDarkMode={true}
                  />
                </div>
              ) : (
                <div className="border border-gray-700 rounded-lg p-6 h-full flex items-center justify-center bg-gray-900 min-h-[300px]">
                  <div className="text-center text-gray-400">
                    <p className="text-lg font-medium mb-2">Selecciona un diente</p>
                    <p className="text-sm max-w-xs mx-auto">Haz clic en cualquier diente del odontograma para ver sus detalles y herramientas</p>
                  </div>
                </div>
              )}
            </div>
            </div>

          <div className="mb-4">
            <ColorLegend theme="dark" />
          </div>

          <div className="flex gap-4 pt-2 mt-8">
              {onBack && (
                <Button type="button" variant="default" onClick={onBack} disabled={isLoading} className="flex-1">
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
