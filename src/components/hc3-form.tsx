"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { getFamilyConditions } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const QUIEN_OPTIONS = [
  "Padre",
  "Madre",
  "Abuelo paterno",
  "Abuelo materno",
  "Ambos padres",
  "Ambos abuelos",
];

interface ConditionEntry {
  conditionName: string;
  hasCondition: boolean;
  quien: string;
  tipo: string;
}

const DEFAULT_CONDITIONS: ConditionEntry[] = [
  { conditionName: "Diabetes", hasCondition: false, quien: "", tipo: "" },
  { conditionName: "Hipertensión Arterial", hasCondition: false, quien: "", tipo: "" },
  { conditionName: "Cáncer", hasCondition: false, quien: "", tipo: "" },
  { conditionName: "Cardiópatas", hasCondition: false, quien: "", tipo: "" },
  { conditionName: "Nefrópatas", hasCondition: false, quien: "", tipo: "" },
  { conditionName: "Malformaciones", hasCondition: false, quien: "", tipo: "" },
  { conditionName: "Otros", hasCondition: false, quien: "", tipo: "" },
];

interface Hc3FormProps {
  patientId: string;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  onSuccess: () => void;
  onBack?: () => void;
}

export function Hc3Form({ patientId, action, onSuccess, onBack }: Hc3FormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [conditions, setConditions] = useState<ConditionEntry[]>(DEFAULT_CONDITIONS);
  const [otrosText, setOtrosText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const saved = await getFamilyConditions(patientId);
        if (saved.length > 0) {
          setConditions((prev) => {
            const merged = prev.map((c) => {
              const found = saved.find((s) => s.conditionName === c.conditionName);
              if (found) {
                return {
                  ...c,
                  hasCondition: found.hasCondition,
                  quien: (found.relatives as string) || "",
                  tipo: found.tipo || "",
                };
              }
              return c;
            });
            const otros = saved.find((s) => s.conditionName === "Otros");
            if (otros?.relatives) {
              setOtrosText(otros.relatives as string);
            }
            return merged;
          });
        }
      } catch (e) {
        console.error("Error fetching family conditions:", e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [patientId]);

  const handleToggle = useCallback((index: number) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], hasCondition: !next[index].hasCondition };
      return next;
    });
  }, []);

  const handleQuienChange = useCallback((index: number, value: string) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quien: value };
      return next;
    });
  }, []);

  const handleTipoChange = useCallback((index: number, value: string) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], tipo: value };
      return next;
    });
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const serialized = conditions.map((c) => {
        if (c.conditionName === "Otros" && otrosText.trim()) {
          return { ...c, quien: otrosText.trim() };
        }
        return c;
      });
      formData.set("conditions", JSON.stringify(serialized));
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

  const today = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
          Antecedentes Heredo-Familiares
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

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 font-medium">Condición</th>
                  <th className="text-center p-3 font-medium w-20">Sí/No</th>
                  <th className="text-left p-3 font-medium">¿Quién?</th>
                  <th className="text-left p-3 font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {conditions.map((condition, index) => (
                  <tr key={condition.conditionName} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="p-3">
                      <span className="text-sm font-medium">{condition.conditionName}</span>
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={condition.hasCondition}
                        onCheckedChange={() => handleToggle(index)}
                      />
                    </td>
                    <td className="p-3">
                      {condition.hasCondition && (
                        condition.conditionName === "Malformaciones" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : condition.conditionName === "Otros" ? (
                          <Input
                            value={otrosText}
                            onChange={(e) => setOtrosText(e.target.value)}
                            placeholder="Especifique..."
                            className="h-8 text-xs"
                          />
                        ) : (
                          <Select
                            value={condition.quien}
                            onValueChange={(v) => handleQuienChange(index, v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {QUIEN_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )
                      )}
                    </td>
                    <td className="p-3">
                      {condition.hasCondition && (condition.conditionName === "Cáncer" || condition.conditionName === "Malformaciones") && (
                        <Input
                          value={condition.tipo}
                          onChange={(e) => handleTipoChange(index, e.target.value)}
                          placeholder="Especifique..."
                          className="h-8 text-xs"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4">
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
