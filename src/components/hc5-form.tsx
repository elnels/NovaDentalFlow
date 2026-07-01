"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FormState } from "@/lib/actions";
import { getPatientById } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

interface OclusionField {
  lineaMedia: { valor: string; notas: string };
  planosTerminales: { derecho: string; izquierdo: string };
  espaciosTerminales: { presente: boolean; ubicacion: string };
  claseAngle: { derecho: string; izquierdo: string };
  mordidaCruzada: { presente: boolean; ubicacion: string };
  traslapeHorizontal: { presente: boolean; mm: string };
  traslapeVertical: { presente: boolean; mm: string };
  bordeABorde: boolean;
  mordidaAbierta: boolean;
  habitosNocivos: { presente: boolean; cual: string };
}

interface ExploracionBucal {
  tejidosBlandos: string;
  oclusion: OclusionField;
}

function defaultData(): ExploracionBucal {
  return {
    tejidosBlandos: "",
    oclusion: {
      lineaMedia: { valor: "", notas: "" },
      planosTerminales: { derecho: "", izquierdo: "" },
      espaciosTerminales: { presente: false, ubicacion: "" },
      claseAngle: { derecho: "", izquierdo: "" },
      mordidaCruzada: { presente: false, ubicacion: "" },
      traslapeHorizontal: { presente: false, mm: "" },
      traslapeVertical: { presente: false, mm: "" },
      bordeABorde: false,
      mordidaAbierta: false,
      habitosNocivos: { presente: false, cual: "" },
    },
  };
}

interface Hc5FormProps {
  patientId: string;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  onSuccess: () => void;
  onBack?: () => void;
}

function SiNoRadio({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <RadioGroup value={value ? "si" : "no"} onValueChange={(v) => onChange(v === "si")} className="flex gap-6">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="si" />
        <Label className="text-sm font-normal">Sí</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="no" />
        <Label className="text-sm font-normal">No</Label>
      </div>
    </RadioGroup>
  );
}

function OclusionFieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 items-start py-3 border-b last:border-b-0">
      <Label className="text-sm font-medium pt-2">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

export function Hc5Form({ patientId, action, onSuccess, onBack }: Hc5FormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [data, setData] = useState<ExploracionBucal>(defaultData);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPatientById(patientId);
        if (res?.clinicalDetails?.observacionesHc5) {
          const parsed = JSON.parse(res.clinicalDetails.observacionesHc5);
          setData((prev) => deepMerge(prev, parsed));
        }
      } catch (e) {
        console.error("Error fetching HC5 data:", e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [patientId]);

  function deepMerge(base: any, override: any): any {
    const result = { ...base };
    for (const key of Object.keys(override)) {
      if (typeof override[key] === "object" && override[key] !== null && !Array.isArray(override[key])) {
        result[key] = deepMerge(base[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }
    return result;
  }

  const updateOclusion = (path: string, value: any) => {
    setData((prev) => {
      const next = { ...prev, oclusion: { ...prev.oclusion } };
      const keys = path.split(".");
      let obj: any = next.oclusion;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      formData.set("hc5Data", JSON.stringify(data));
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
          Exploración Bucal
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

          <div>
            <Label className="text-sm font-medium">Tejidos Blandos</Label>
            <Textarea
              value={data.tejidosBlandos}
              onChange={(e) => setData((prev) => ({ ...prev, tejidosBlandos: e.target.value }))}
              placeholder="Notas sobre tejidos blandos..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/10">
            <h3 className="font-semibold text-foreground mb-4">Oclusión</h3>

            <OclusionFieldRow label="Línea Media">
              <div className="flex gap-3 items-start">
                <Select
                  value={data.oclusion.lineaMedia.valor}
                  onValueChange={(v) => updateOclusion("lineaMedia.valor", v)}
                >
                  <SelectTrigger className="w-40 h-9 text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Desviada">Desviada</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={data.oclusion.lineaMedia.notas}
                  onChange={(e) => updateOclusion("lineaMedia.notas", e.target.value)}
                  placeholder="Notas"
                  className="flex-1 h-9 text-sm"
                />
              </div>
            </OclusionFieldRow>

            <OclusionFieldRow label="Planos Terminales Derecho">
              <Input
                value={data.oclusion.planosTerminales.derecho}
                onChange={(e) => updateOclusion("planosTerminales.derecho", e.target.value)}
                placeholder="Notas"
                className="h-9 text-sm"
              />
            </OclusionFieldRow>

            <OclusionFieldRow label="Planos Terminales Izquierdo">
              <Input
                value={data.oclusion.planosTerminales.izquierdo}
                onChange={(e) => updateOclusion("planosTerminales.izquierdo", e.target.value)}
                placeholder="Notas"
                className="h-9 text-sm"
              />
            </OclusionFieldRow>

            <OclusionFieldRow label="Espacios Terminales">
              <div className="space-y-3">
                <SiNoRadio
                  value={data.oclusion.espaciosTerminales.presente}
                  onChange={(v) => updateOclusion("espaciosTerminales.presente", v)}
                />
                {data.oclusion.espaciosTerminales.presente && (
                  <Select
                    value={data.oclusion.espaciosTerminales.ubicacion}
                    onValueChange={(v) => updateOclusion("espaciosTerminales.ubicacion", v)}
                  >
                    <SelectTrigger className="w-40 h-9 text-sm">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Superior">Superior</SelectItem>
                      <SelectItem value="Inferior">Inferior</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </OclusionFieldRow>

            <OclusionFieldRow label="Clase de Angle Derecho">
              <Input
                value={data.oclusion.claseAngle.derecho}
                onChange={(e) => updateOclusion("claseAngle.derecho", e.target.value)}
                placeholder="Notas"
                className="h-9 text-sm"
              />
            </OclusionFieldRow>

            <OclusionFieldRow label="Clase de Angle Izquierdo">
              <Input
                value={data.oclusion.claseAngle.izquierdo}
                onChange={(e) => updateOclusion("claseAngle.izquierdo", e.target.value)}
                placeholder="Notas"
                className="h-9 text-sm"
              />
            </OclusionFieldRow>

            <OclusionFieldRow label="Mordida Cruzada">
              <div className="space-y-3">
                <SiNoRadio
                  value={data.oclusion.mordidaCruzada.presente}
                  onChange={(v) => updateOclusion("mordidaCruzada.presente", v)}
                />
                {data.oclusion.mordidaCruzada.presente && (
                  <Select
                    value={data.oclusion.mordidaCruzada.ubicacion}
                    onValueChange={(v) => updateOclusion("mordidaCruzada.ubicacion", v)}
                  >
                    <SelectTrigger className="w-40 h-9 text-sm">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Superior">Superior</SelectItem>
                      <SelectItem value="Inferior">Inferior</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </OclusionFieldRow>

            <OclusionFieldRow label="Traslape Horizontal">
              <div className="space-y-3">
                <SiNoRadio
                  value={data.oclusion.traslapeHorizontal.presente}
                  onChange={(v) => updateOclusion("traslapeHorizontal.presente", v)}
                />
                {data.oclusion.traslapeHorizontal.presente && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={data.oclusion.traslapeHorizontal.mm}
                      onChange={(e) => updateOclusion("traslapeHorizontal.mm", e.target.value)}
                      placeholder="0.0"
                      className="w-24 h-9 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">mm</span>
                  </div>
                )}
              </div>
            </OclusionFieldRow>

            <OclusionFieldRow label="Traslape Vertical">
              <div className="space-y-3">
                <SiNoRadio
                  value={data.oclusion.traslapeVertical.presente}
                  onChange={(v) => updateOclusion("traslapeVertical.presente", v)}
                />
                {data.oclusion.traslapeVertical.presente && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={data.oclusion.traslapeVertical.mm}
                      onChange={(e) => updateOclusion("traslapeVertical.mm", e.target.value)}
                      placeholder="0.0"
                      className="w-24 h-9 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">mm</span>
                  </div>
                )}
              </div>
            </OclusionFieldRow>

            <OclusionFieldRow label="Borde a Borde">
              <SiNoRadio
                value={data.oclusion.bordeABorde}
                onChange={(v) => updateOclusion("bordeABorde", v)}
              />
            </OclusionFieldRow>

            <OclusionFieldRow label="Mordida Abierta">
              <SiNoRadio
                value={data.oclusion.mordidaAbierta}
                onChange={(v) => updateOclusion("mordidaAbierta", v)}
              />
            </OclusionFieldRow>

            <OclusionFieldRow label="Hábitos Nocivos">
              <div className="space-y-3">
                <SiNoRadio
                  value={data.oclusion.habitosNocivos.presente}
                  onChange={(v) => updateOclusion("habitosNocivos.presente", v)}
                />
                {data.oclusion.habitosNocivos.presente && (
                  <Input
                    value={data.oclusion.habitosNocivos.cual}
                    onChange={(e) => updateOclusion("habitosNocivos.cual", e.target.value)}
                    placeholder="¿Cuál?"
                    className="h-9 text-sm"
                  />
                )}
              </div>
            </OclusionFieldRow>
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
