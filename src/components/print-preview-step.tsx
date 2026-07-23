"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPacienteById } from "@/lib/api";
import { buildPrintData } from "@/lib/print/build-data";
import type { HistoriaClinicaPrintData } from "@/lib/print/types";

interface PrintPreviewStepProps {
  patientId: string;
  onSuccess: () => void;
  onBack?: () => void;
}

function PDFPreviewFrame({ printData }: { printData: HistoriaClinicaPrintData }) {
  const [PreviewComponent, setPreviewComponent] = useState<any>(null);

  useState(() => {
    import("@react-pdf/renderer").then(({ BlobProvider }) => {
      import("@/lib/print/templates/HistoriaClinica").then(({ HistoriaClinicaTemplate }) => {
        setPreviewComponent(() => ({ data }: { data: HistoriaClinicaPrintData }) => (
          <BlobProvider document={<HistoriaClinicaTemplate data={data} />}>
            {({ url }: { url: string | null }) =>
              url ? (
                <iframe
                  src={url}
                  className="w-full h-full border-0"
                  style={{ minHeight: "600px" }}
                  title="Vista previa del PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )
            }
          </BlobProvider>
        ));
      });
    });
  });

  if (!PreviewComponent) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <PreviewComponent data={printData} />;
}

export function PrintPreviewStep({ patientId, onSuccess, onBack }: PrintPreviewStepProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printData, setPrintData] = useState<HistoriaClinicaPrintData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const patient = await getPacienteById(patientId) as any;
        if (cancelled) return;
        if (!patient) {
          setError("No se pudo cargar el paciente.");
          return;
        }
        const data = buildPrintData(patient, {
          clinicalDetails: patient.clinicalDetails || {},
          familyConditions: patient.familyConditions || [],
          createdAt: patient.historialClinico?.[0]?.fechaHistorial,
        });
        if (cancelled) return;
        setPrintData(data);
      } catch (err) {
        if (!cancelled) setError("Error al cargar los datos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [patientId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Vista Previa — Historia Clinica
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Revise la historia clinica antes de continuar con el odontograma.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={onBack}>
              Regresar
            </Button>
          </div>
        ) : printData ? (
          <>
            <div className="rounded-md border bg-gray-100 min-h-[500px] overflow-hidden">
              <PDFPreviewFrame printData={printData} />
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={onBack}>
                Regresar
              </Button>
              <Button onClick={onSuccess}>
                Continuar
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
