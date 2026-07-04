"use client";

import { useState } from "react";
import {
  Calendar,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Stethoscope,
  Pill,
  MessageSquare,
  DollarSign,
  CreditCard,
  Phone,
  User,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { HistorialForm } from "@/components/historial-form";
import { deleteHistorial } from "@/lib/actions";
import type { ClinicalHistory } from "@/types";

interface HistorialViewProps {
  data: ClinicalHistory[];
  onDataUpdate: () => Promise<void>;
  patientId: string;
  availableCitas?: Array<{ id: string; fechaCita: string; motivoCita: string }>;
}

const paymentColors: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Pagado: "bg-green-100 text-green-700 border-green-200",
  Parcial: "bg-blue-100 text-blue-700 border-blue-200",
  Cancelado: "bg-red-100 text-red-700 border-red-200",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 py-2 border-b last:border-b-0 text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground">{value || <span className="italic text-muted-foreground">Sin información</span>}</span>
    </div>
  );
}

function RecordCard({
  record,
  onEdit,
  onDelete,
}: {
  record: ClinicalHistory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const displayDate = record.fechaHistorial || record.fechaTratamiento;
  const formattedDate = displayDate
    ? (() => {
        try {
          return format(parseISO(displayDate), "d 'de' MMMM 'de' yyyy", { locale: es });
        } catch {
          return displayDate;
        }
      })()
    : "Sin fecha";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formattedDate}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <InfoRow
          label="Diagnóstico"
          value={record.diagnostico}
        />
        <InfoRow
          label="Tratamiento"
          value={record.tratamiento}
        />
        <InfoRow
          label="Prescripciones"
          value={record.prescripciones}
        />
        <InfoRow
          label="Observaciones"
          value={record.notas}
        />
        <InfoRow
          label="Costo"
          value={
            record.costoTratamiento
              ? `$${parseFloat(record.costoTratamiento).toLocaleString()}`
              : undefined
          }
        />
        <InfoRow
          label="Estado de Pago"
          value={
            <Badge
              variant="outline"
              className={paymentColors[record.estadoPago] || ""}
            >
              {record.estadoPago}
            </Badge>
          }
        />
        {record.telefonoContacto && <InfoRow label="Teléfono de Contacto" value={record.telefonoContacto} />}
        {record.motivoConsulta && <InfoRow label="Motivo de Consulta" value={record.motivoConsulta} />}
        {record.antecedentesPersonales && (
          <InfoRow label="Antecedentes Personales" value={record.antecedentesPersonales} />
        )}
      </CardContent>
    </Card>
  );
}

export function HistorialView({
  data,
  onDataUpdate,
  patientId,
  availableCitas = [],
}: HistorialViewProps) {
  const { toast } = useToast();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClinicalHistory | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este registro del historial?")) return;
    try {
      const result = await deleteHistorial(id);
      if (result.success) {
        toast({ title: "Registro eliminado", description: "El registro se ha eliminado correctamente." });
        await onDataUpdate();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el registro.",
      });
    }
  };

  const closeAndRefresh = async () => {
    setOpenCreate(false);
    setEditingRecord(null);
    await onDataUpdate();
  };

  if (!data || data.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No hay registros en el historial clínico
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Puede agregar información del historial clínico cuando esté disponible.
            </p>
            <Button onClick={() => setOpenCreate(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Primer Registro
            </Button>
          </CardContent>
        </Card>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Registro al Historial</DialogTitle>
            </DialogHeader>
            <HistorialForm
              patientId={patientId}
              mode="create"
              onSuccess={closeAndRefresh}
              onBack={() => setOpenCreate(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Historial Clínico ({data.length})</h3>
        <Button onClick={() => setOpenCreate(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Registro
        </Button>
      </div>

      <div className="space-y-4">
        {data.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            onEdit={() => setEditingRecord(record)}
            onDelete={() => handleDelete(record.id)}
          />
        ))}
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Registro al Historial</DialogTitle>
          </DialogHeader>
          <HistorialForm
            patientId={patientId}
            mode="create"
            onSuccess={closeAndRefresh}
            onBack={() => setOpenCreate(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingRecord}
        onOpenChange={(open) => { if (!open) setEditingRecord(null); }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro del Historial</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <HistorialForm
              patientId={patientId}
              recordId={editingRecord.id}
              mode="edit"
              initialData={{
                fechaHistorial: (editingRecord.fechaHistorial ?? editingRecord.fechaTratamiento)?.split("T")[0] ?? "",
                appointmentId: editingRecord.appointmentId,
                diagnostico: editingRecord.diagnostico,
                tratamiento: editingRecord.tratamiento,
                prescripciones: editingRecord.prescripciones,
                notas: editingRecord.notas,
                costoTratamiento: editingRecord.costoTratamiento,
                estadoPago: editingRecord.estadoPago as "Pendiente" | "Pagado" | "Parcial" | "Cancelado",
                telefonoContacto: editingRecord.telefonoContacto,
                motivoConsulta: editingRecord.motivoConsulta,
                antecedentesPersonales: editingRecord.antecedentesPersonales,
              }}
              onSuccess={closeAndRefresh}
              onBack={() => setEditingRecord(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
