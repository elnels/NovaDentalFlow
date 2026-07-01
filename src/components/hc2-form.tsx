"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Stethoscope } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

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

function defaultConditions(): ConditionState[] {
  return DEFAULT_CONDITIONS.map((name) => ({
    name,
    presents: false,
    edad: "",
    detalle: "",
  }));
}

interface Hc2FormProps {
  patientId: string;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  onSuccess: () => void;
}

export function Hc2Form({ patientId, action, onSuccess }: Hc2FormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [nombreOdontologo, setNombreOdontologo] = useState("Dra Elsa Hernández");
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [otherCondition, setOtherCondition] = useState("");
  const [conditions, setConditions] = useState<ConditionState[]>(defaultConditions);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPatientById(patientId);
        if (res?.clinicalDetails) {
          const cd = res.clinicalDetails;
          if (cd.nombreOdontologo) setNombreOdontologo(cd.nombreOdontologo);
          if (cd.motivoConsulta) setMotivoConsulta(cd.motivoConsulta);
          if (Array.isArray(cd.antecedentesPersonales)) {
            const saved = cd.antecedentesPersonales as ConditionState[];
            setConditions((prev) => {
              const merged = prev.map((c) => {
                const found = saved.find((s) => s.name === c.name);
                return found ? { ...c, presents: found.presents || false, edad: found.edad || "", detalle: found.detalle || "" } : c;
              });
              const custom = saved.filter((s) => !DEFAULT_CONDITIONS.includes(s.name));
              custom.forEach((c) => {
                if (!merged.find((m) => m.name === c.name)) {
                  merged.push(c);
                }
              });
              return merged;
            });
            const custom = saved.filter((s) => !DEFAULT_CONDITIONS.includes(s.name));
            if (custom.length > 0) {
              setOtherCondition(custom[0].name.replace("Otro: ", ""));
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
        filtered.push({ name: `Otro: ${value.trim()}`, presents: false, edad: "", detalle: "" });
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
      const result = await action({ message: "", success: false }, formData);
      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Error al guardar.",
        });
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

        <form ref={formRef} action={handleSubmit} className="space-y-6">
          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="antecedentesPersonales" value={JSON.stringify(conditions)} />

          <div>
            <label className="text-sm font-medium">Nombre del Odontólogo</label>
            <Input
              name="nombreOdontologo"
              value={nombreOdontologo}
              onChange={(e) => setNombreOdontologo(e.target.value)}
              placeholder="Dra Elsa Hernández"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Motivo de Consulta</label>
            <Textarea
              name="motivoConsulta"
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
            <Input
              value={otherCondition}
              onChange={(e) => handleOtherConditionChange(e.target.value)}
              placeholder="Ej: Covid 19"
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Guardando..." : "Continuar a Cita"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
