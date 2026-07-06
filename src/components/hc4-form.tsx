"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTodayDate } from "@/lib/formatDate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FormState } from "@/lib/actions";
import { getPatientById } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

interface Hc4Data {
  bajoTratamientoMedico: boolean;
  motivo: string;
  tomaMedicamentos: boolean;
  cualesMedicamentos: string;
  embarazada: boolean;
  fechaUltimaMenstruacion: string;
  transfusiones: boolean;
  sangradoExcesivo: boolean;
  sangradoTiempo: string;
  cirugias: boolean;
  cirugiasDetalle: string;
  vacunasCompletas: boolean;
  alergicoMedicamentos: boolean;
  alergicoCual: string;
  consumeSustancias: boolean;
  cualesSustancias: string;
  frecuenciaSustancias: string;
  higieneBucal: boolean;
  frecuenciaHigiene: string;
}

function defaultData(): Hc4Data {
  return {
    bajoTratamientoMedico: false,
    motivo: "",
    tomaMedicamentos: false,
    cualesMedicamentos: "",
    embarazada: false,
    fechaUltimaMenstruacion: "",
    transfusiones: false,
    sangradoExcesivo: false,
    sangradoTiempo: "",
    cirugias: false,
    cirugiasDetalle: "",
    vacunasCompletas: false,
    alergicoMedicamentos: false,
    alergicoCual: "",
    consumeSustancias: false,
    cualesSustancias: "",
    frecuenciaSustancias: "",
    higieneBucal: false,
    frecuenciaHigiene: "",
  };
}

interface QuestionDef {
  key: keyof Hc4Data;
  label: string;
  detailLabel?: string;
  detailKey?: keyof Hc4Data;
  detailPlaceholder?: string;
  detailType?: string;
  extraDetailKey?: keyof Hc4Data;
  extraDetailLabel?: string;
  extraDetailPlaceholder?: string;
  womenOnly?: boolean;
}

const QUESTIONS: QuestionDef[] = [
  {
    key: "bajoTratamientoMedico",
    label: "¿Actualmente está bajo tratamiento médico?",
    detailLabel: "Motivo",
    detailKey: "motivo",
    detailPlaceholder: "Describa el motivo...",
  },
  {
    key: "tomaMedicamentos",
    label: "¿Toma medicamentos regularmente?",
    detailLabel: "¿Cuáles?",
    detailKey: "cualesMedicamentos",
    detailPlaceholder: "Indique los medicamentos...",
  },
  {
    key: "embarazada",
    label: "Solo mujeres: ¿está embarazada?",
    womenOnly: true,
    detailLabel: "Fecha de última menstruación",
    detailKey: "fechaUltimaMenstruacion",
    detailPlaceholder: "DD/MM/AAAA",
    detailType: "date",
  },
  {
    key: "transfusiones",
    label: "¿Ha recibido transfusiones sanguíneas?",
  },
  {
    key: "sangradoExcesivo",
    label: "Al cortarse, ¿tarda mucho tiempo en parar de sangrar?",
    detailLabel: "¿Cuánto aproximadamente?",
    detailKey: "sangradoTiempo",
    detailPlaceholder: "Ej: 10 minutos...",
  },
  {
    key: "cirugias",
    label: "¿Le han realizado alguna cirugía?",
    detailLabel: "¿Cuál, a qué edad?",
    detailKey: "cirugiasDetalle",
    detailPlaceholder: "Ej: Apéndice, 15 años...",
  },
  {
    key: "vacunasCompletas",
    label: "¿Tiene su esquema de vacunas completo?",
  },
  {
    key: "alergicoMedicamentos",
    label: "¿Es alérgico a algún medicamento?",
    detailLabel: "¿Cuál?",
    detailKey: "alergicoCual",
    detailPlaceholder: "Indique el medicamento...",
  },
  {
    key: "consumeSustancias",
    label: "¿Consume alcohol, tabaco, mariguana, anfetaminas, otros?",
    detailLabel: "¿Cuáles?",
    detailKey: "cualesSustancias",
    detailPlaceholder: "Ej: alcohol, tabaco...",
    extraDetailLabel: "Frecuencia",
    extraDetailKey: "frecuenciaSustancias",
    extraDetailPlaceholder: "Ej: diario, semanal...",
  },
  {
    key: "higieneBucal",
    label: "¿Lleva a cabo algún procedimiento de higiene bucal?",
    detailLabel: "Frecuencia",
    detailKey: "frecuenciaHigiene",
    detailPlaceholder: "Ej: 3 veces al día...",
  },
];

interface Hc4FormProps {
  patientId: string;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  onSuccess: () => void;
  onBack?: () => void;
}

export function Hc4Form({ patientId, action, onSuccess, onBack }: Hc4FormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [data, setData] = useState<Hc4Data>(defaultData);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPatientById(patientId);
        if (res?.clinicalDetails) {
          const cd = res.clinicalDetails;
          setData({
            bajoTratamientoMedico: cd.bajoTratamientoMedico ?? false,
            motivo: cd.motivo || "",
            tomaMedicamentos: cd.tomaMedicamentos ?? false,
            cualesMedicamentos: cd.cualesMedicamentos || "",
            embarazada: cd.embarazada ?? false,
            fechaUltimaMenstruacion: cd.fechaUltimaMenstruacion
              ? new Date(cd.fechaUltimaMenstruacion).toISOString().split("T")[0]
              : "",
            transfusiones: cd.transfusiones ?? false,
            sangradoExcesivo: cd.sangradoExcesivo ?? false,
            sangradoTiempo: cd.sangradoTiempo || "",
            cirugias: cd.cirugias ?? false,
            cirugiasDetalle: cd.cirugiasDetalle || "",
            vacunasCompletas: cd.vacunasCompletas ?? false,
            alergicoMedicamentos: cd.alergicoMedicamentos ?? false,
            alergicoCual: cd.alergicoCual || "",
            consumeSustancias: cd.consumeSustancias ?? false,
            cualesSustancias: cd.cualesSustancias || "",
            frecuenciaSustancias: cd.frecuenciaSustancias || "",
            higieneBucal: cd.higieneBucal ?? false,
            frecuenciaHigiene: cd.frecuenciaHigiene || "",
          });
        }
      } catch (e) {
        console.error("Error fetching patient data:", e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [patientId]);

  const setBool = (key: keyof Hc4Data, value: boolean) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const setStr = (key: keyof Hc4Data, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      formData.set("hc4Data", JSON.stringify(data));
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

  const today = formatTodayDate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5" />
          Antecedentes Personales No Patológicos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-3 bg-muted/30 rounded-md">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Fecha:</span> {today}
          </p>
        </div>

        <form ref={formRef} action={handleSubmit} className="space-y-8">
          <input type="hidden" name="patientId" value={patientId} />

          {QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-3 pb-6 border-b last:border-b-0">
              <p className="text-sm font-medium">{q.label}</p>
              <RadioGroup
                value={data[q.key] ? "si" : "no"}
                onValueChange={(v) => setBool(q.key, v === "si")}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="si" id={`${q.key}-si`} />
                  <Label htmlFor={`${q.key}-si`}>Sí</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id={`${q.key}-no`} />
                  <Label htmlFor={`${q.key}-no`}>No</Label>
                </div>
              </RadioGroup>

              {data[q.key] && q.detailKey && (
                <div className="ml-6 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">{q.detailLabel}</Label>
                    <Input
                      type={q.detailType || "text"}
                      value={(data[q.detailKey] as string) || ""}
                      onChange={(e) => setStr(q.detailKey!, e.target.value)}
                      placeholder={q.detailPlaceholder}
                      className="mt-1 h-9"
                    />
                  </div>
                  {q.extraDetailKey && (
                    <div>
                      <Label className="text-xs text-muted-foreground">{q.extraDetailLabel}</Label>
                      <Input
                        value={(data[q.extraDetailKey] as string) || ""}
                        onChange={(e) => setStr(q.extraDetailKey!, e.target.value)}
                        placeholder={q.extraDetailPlaceholder}
                        className="mt-1 h-9"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

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
