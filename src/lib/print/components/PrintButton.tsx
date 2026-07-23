"use client";

import { useState, useCallback } from "react";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getPacienteById } from "@/lib/api";
import { buildPrintData } from "../build-data";
import type { HistoriaClinicaPrintData } from "../types";
import dynamic from "next/dynamic";

const PrintPreviewDialog = dynamic(
  () => import("./PrintPreviewDialog").then((mod) => mod.PrintPreviewDialog),
  { ssr: false, loading: () => null }
);

interface PrintButtonProps {
  patientId: string;
  patientData: {
    clinicalDetails: any;
    familyConditions: any[];
    createdAt?: string;
  };
}

export function PrintButton({ patientId, patientData }: PrintButtonProps) {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [printData, setPrintData] = useState<HistoriaClinicaPrintData | null>(null);
  const { toast } = useToast();

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const patient = await getPacienteById(patientId);
      if (!patient) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el paciente." });
        return;
      }
      const data = buildPrintData(patient, patientData);
      setPrintData(data);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Print error:", err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar la impresión." });
    } finally {
      setLoading(false);
    }
  }, [patientId, patientData, toast]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Printer className="h-3.5 w-3.5" />
        )}
        Imprimir Historia Clínica
      </Button>

      {printData && (
        <PrintPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          printData={printData}
        />
      )}
    </>
  );
}
