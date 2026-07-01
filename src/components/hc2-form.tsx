"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Stethoscope, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FormState } from "@/lib/actions";
import { getPatientById } from "@/lib/actions";

const DEFAULT_CONDITIONS = [
  "Anemia",
  "Artritis Reumatoide",
  "Asma",
  "Cáncer (¿en dónde?)",
  "Cirrosis",
  "Diabetes",
  "Discapacidad (física - neurológica - sensorial)",
  "Dolor de torácico - intolerancia al ejercicio",
  "Enfisema pulmonar",
  "Epilepsia",
  "Escarlatina",
  "Fiebre reumática",
  "Hemorragias espontáneas",
  "Hepatitis A",
  "Hepatitis B",
  "Hepatitis C",
  "Hipertensión arterial",
  "Infarto al corazón",
  "Lupus",
  "Mononucleosis infecciosa",
  "Obesidad",
  "Osteoporosis",
  "Enfermedades renales",
  "Paperas",
  "Pérdida de peso sin razón aparente",
  "Rubéola",
  "Sarampión",
  "Varicela",
  "VIH",
  "Otro: Covid 19",
];

interface ConditionState {
  name: string;
  presents: boolean;
  edad: string;
  detalle: string;
}

interface Hc2FormProps {
  patientId: string;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  onSuccess: () => void;
}

export function Hc2Form({ patientId, action, onSuccess }: Hc2FormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [nombreOdontologo, setNombreOdontologo] = useState("Dra Elsa Hernández");
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [otherCondition, setOtherCondition] = useState("");
  const [conditions, setConditions] = useState<ConditionState[]>(
    DEFAULT_CONDITIONS.map((name) => ({
      name,
      presents: false,
      edad: "",
      detalle: "",
    }))
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPatientById(patientId);
        if (res?.clinicalDetails) {
          const cd = res.clinicalDetails;
          if (cd.nombreOdontologo) setNombreOdontologo(cd.nombreOdontologo);
          if (cd.motivoConsulta) setMotivoConsulta(cd.motivoConsulta);
          if (Array.isArray(cd.antecedentesPersonales)) {
            setConditions((prev) =>
              prev.map((c) => {
                const saved = (cd.antecedentesPersonales as any[]).find(
                  (s: any) => s.name === c.name
                );
                if (saved) {
                  return { ...c, presents: saved.presents || false, edad: saved.edad || "", detalle: saved.detalle || "" };
                }
                if (c.name === "Otro: Covid 19" && (cd.antecedentesPersonales as any[]).some((s: any) => s.name !== "Otro: Covid 19" && !DEFAULT_CONDITIONS.includes(s.name))) {
                  return c;
                }
                return c;
              })
            );
            const savedOthers = (cd.antecedentesPersonales as any[]).filter(
              (s: any) => !DEFAULT_CONDITIONS.includes(s.name)
            );
            if (savedOthers.length > 0) {
              setOtherCondition(savedOthers[0].name.replace("Otro: ", ""));
              setConditions((prev) => {
                const filtered = prev.filter((c) => c.name !== "Otro: Covid 19");
                filtered.push({
                  name: `Otro: ${savedOthers[0].name.replace("Otro: ", "")}`,
                  presents: savedOthers[0].presents || false,
                  edad: savedOthers[0].edad || "",
                  detalle: savedOthers[0].detalle || "",
                });
                return filtered;
              });
            }
          }
        }
      } catch (e) {
        console.error("Error fetching patient data:", e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [patientId]);

  const handleConditionToggle = useCallback((index: number) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], presents: !next[index].presents };
      return next;
    });
  }, []);

  const handleEdadChange = useCallback((index: number, value: string) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], edad: value };
      return next;
    });
  }, []);

  const handleDetalleChange = useCallback((index: number, value: string) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], detalle: value };
      return next;
    });
  }, []);

  const handleOtherConditionChange = useCallback((value: string) => {
    setOtherCondition(value);
    setConditions((prev) => {
      const filtered = prev.filter((c) => !c.name.startsWith("Otro:"));
      if (value.trim()) {
        filtered.push({
          name: `Otro: ${value.trim()}`,
          presents: false,
          edad: "",
          detalle: "",
        });
      }
      return filtered;
    });
  }, []);

  const today = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      formData.set("patientId", patientId);
      formData.set("nombreOdontologo", nombreOdontologo);
      formData.set("motivoConsulta", motivoConsulta);
      formData.set("antecedentesPersonales", JSON.stringify(conditions));
      const result = await action({ message: "", success: false }, formData);
      if (result.success) {
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Antecedentes Personales (HC2)
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

          <div>
            <label className="text-sm font-medium">Nombre del Odontólogo</label>
            <Input
              value={nombreOdontologo}
              onChange={(e) => setNombreOdontologo(e.target.value)}
              placeholder="Dra Elsa Hernández"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Motivo de Consulta</label>
            <Textarea
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              placeholder="Describa el motivo de la consulta..."
              className="mt-1"
            />
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">Antecedentes Personales</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-3 font-medium">Condición</th>
                    <th className="text-center p-3 font-medium w-28">Presenta (Sí/No)</th>
                    <th className="text-center p-3 font-medium w-28">Edad</th>
                  </tr>
                </thead>
                <tbody>
                  {conditions.map((condition, index) => (
                    <tr key={condition.name} className="border-b last:border-b-0 hover:bg-muted/20">
                      <td className="p-3">
                        <span className="text-sm">{condition.name}</span>
                        {condition.name === "Cáncer (¿en dónde?)" && condition.presents && (
                          <Input
                            value={condition.detalle}
                            onChange={(e) => handleDetalleChange(index, e.target.value)}
                            placeholder="Especifique el tipo..."
                            className="mt-2 h-8 text-xs"
                          />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={condition.presents}
                          onCheckedChange={() => handleConditionToggle(index)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        {condition.presents && (
                          <Input
                            type="number"
                            value={condition.edad}
                            onChange={(e) => handleEdadChange(index, e.target.value)}
                            placeholder="Edad"
                            className="h-8 w-20 mx-auto text-xs"
                            min="0"
                            max="120"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Otra condición</label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={otherCondition}
                onChange={(e) => handleOtherConditionChange(e.target.value)}
                placeholder="Ej: Covid 19"
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Guardando..." : "Continuar a Cita"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
