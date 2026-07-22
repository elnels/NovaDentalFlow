"use client";

import { useCallback, useState } from "react";
import { Download, Printer, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { HistoriaClinicaPrintData } from "../types";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printData: HistoriaClinicaPrintData;
}

export function PrintPreviewDialog({ open, onOpenChange, printData }: PrintPreviewDialogProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { HistoriaClinicaTemplate } = await import("../templates/HistoriaClinica");
      const blob = await pdf(<HistoriaClinicaTemplate data={printData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historia-clinica-${printData.patient.apellidos}-${printData.patient.nombres}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "PDF descargado", description: "El archivo se ha descargado correctamente." });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar el PDF." });
    } finally {
      setGenerating(false);
    }
  }, [printData, toast]);

  const handlePrint = useCallback(async () => {
    setGenerating(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { HistoriaClinicaTemplate } = await import("../templates/HistoriaClinica");
      const blob = await pdf(<HistoriaClinicaTemplate data={printData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      };
      toast({ title: "Impresión enviada", description: "Se abrió el diálogo de impresión." });
    } catch (err) {
      console.error("Print error:", err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo enviar a imprimir." });
    } finally {
      setGenerating(false);
    }
  }, [printData, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Imprimir Historia Clínica</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-md border bg-gray-100 min-h-[500px]">
          <PDFPreviewFrame printData={printData} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-1.5"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Descargar PDF
          </Button>
          <Button
            onClick={handlePrint}
            disabled={generating}
            className="flex items-center gap-1.5"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PDFPreviewFrame({ printData }: { printData: HistoriaClinicaPrintData }) {
  const [PreviewComponent, setPreviewComponent] = useState<any>(null);

  useState(() => {
    import("@react-pdf/renderer").then(({ BlobProvider }) => {
      import("../templates/HistoriaClinica").then(({ HistoriaClinicaTemplate }) => {
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
