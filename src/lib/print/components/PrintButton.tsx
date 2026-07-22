"use client";

import { useState, useCallback } from "react";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getPacienteById } from "@/lib/api";
import { parseHc2Conditions, parseHc5Data } from "../utils";
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

function buildPrintData(patient: any, patientData: PrintButtonProps["patientData"]): HistoriaClinicaPrintData {
  return {
    patient: {
      id: patient.id,
      nombres: patient.nombres,
      apellidos: patient.apellidos,
      dni: patient.dni,
      fechaNacimiento: patient.fechaNacimiento,
      sexo: patient.sexo,
      telefonoPrincipal: patient.telefonoPrincipal,
      telefonoAlternativo: patient.telefonoAlternativo,
      email: patient.email,
      direccion: patient.direccion,
      estadoCivil: patient.estadoCivil,
      ocupacion: patient.ocupacion,
      escolaridad: patient.escolaridad,
      nombrePadre: patient.nombrePadre,
      nombreMadre: patient.nombreMadre,
    },
    hc1: {
      nombreOdontologo: patientData.clinicalDetails?.nombreOdontologo || null,
    },
    hc2: {
      motivoConsulta: patientData.clinicalDetails?.motivoConsulta || null,
      antecedentesPersonales: parseHc2Conditions(patientData.clinicalDetails?.antecedentesPersonales),
    },
    hc3: (patientData.familyConditions || []).map((fc: any) => ({
      conditionName: fc.conditionName,
      hasCondition: fc.hasCondition,
      tipo: fc.tipo || null,
      relatives: fc.relatives
        ? typeof fc.relatives === "string"
          ? fc.relatives
          : JSON.stringify(fc.relatives)
        : null,
    })),
    hc4: {
      bajoTratamientoMedico: patientData.clinicalDetails?.bajoTratamientoMedico ?? false,
      motivo: patientData.clinicalDetails?.motivo || null,
      tomaMedicamentos: patientData.clinicalDetails?.tomaMedicamentos ?? false,
      cualesMedicamentos: patientData.clinicalDetails?.cualesMedicamentos || null,
      embarazada: patientData.clinicalDetails?.embarazada ?? null,
      transfusiones: patientData.clinicalDetails?.transfusiones ?? false,
      sangradoExcesivo: patientData.clinicalDetails?.sangradoExcesivo ?? false,
      sangradoTiempo: patientData.clinicalDetails?.sangradoTiempo || null,
      cirugias: patientData.clinicalDetails?.cirugias ?? false,
      cirugiasDetalle: patientData.clinicalDetails?.cirugiasDetalle || null,
      vacunasCompletas: patientData.clinicalDetails?.vacunasCompletas ?? false,
      alergicoMedicamentos: patientData.clinicalDetails?.alergicoMedicamentos ?? false,
      alergicoCual: patientData.clinicalDetails?.alergicoCual || null,
      consumeSustancias: patientData.clinicalDetails?.consumeSustancias ?? false,
      cualesSustancias: patientData.clinicalDetails?.cualesSustancias || null,
      frecuenciaSustancias: patientData.clinicalDetails?.frecuenciaSustancias || null,
      higieneBucal: patientData.clinicalDetails?.higieneBucal ?? false,
      frecuenciaHigiene: patientData.clinicalDetails?.frecuenciaHigiene || null,
    },
    hc5: parseHc5Data(patientData.clinicalDetails?.observacionesHc5),
    createdAt: patientData.createdAt || null,
    printDate: new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    branding: {
      clinicName: process.env.NEXT_PUBLIC_CLINIC_NAME || "DentalFlow",
      clinicLogoUrl: process.env.NEXT_PUBLIC_CLINIC_LOGO_URL || null,
      clinicLogoBase64: null,
    },
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
