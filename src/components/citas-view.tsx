"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Pencil,
  Plus,
  Trash2,
  User,
  MessageSquare,
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
import { formatDateDisplay } from "@/lib/formatDate";
import { useToast } from "@/hooks/use-toast";
import { CitasForm } from "@/components/citas-form";
import { deleteCita } from "@/lib/actions";
import type { Appointment } from "@/types";

interface CitasViewProps {
  data: Appointment[];
  onDataUpdate: () => Promise<void>;
  patientId: string;
}

const statusColors: Record<string, string> = {
  Programada: "bg-gray-100 text-gray-700 border-gray-200",
  Confirmada: "bg-blue-100 text-blue-700 border-blue-200",
  "En Proceso": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Completada: "bg-green-100 text-green-700 border-green-200",
  Cancelada: "bg-red-100 text-red-700 border-red-200",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 py-2 border-b last:border-b-0 text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground">{value || <span className="italic text-muted-foreground">Sin información</span>}</span>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
}: {
  appointment: Appointment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const formattedDate = (() => {
    try {
      return formatDateDisplay(appointment.fechaCita);
    } catch {
      return appointment.fechaCita;
    }
  })();

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
        <div className="mx-auto max-w-2xl">
          <InfoRow
            label="Horario"
            value={
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {appointment.horaInicio} - {appointment.horaFin}
              </span>
            }
          />
          <InfoRow label="Motivo" value={appointment.motivoCita} />
          <InfoRow
            label="Doctor"
            value={
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {appointment.idDoctor}
              </span>
            }
          />
          {appointment.notasCita && <InfoRow label="Observaciones" value={appointment.notasCita} />}
          <InfoRow
            label="Estado"
            value={
              <Badge
                variant="outline"
                className={statusColors[appointment.estadoCita] || ""}
              >
                {appointment.estadoCita}
              </Badge>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function CitasView({ data, onDataUpdate, patientId }: CitasViewProps) {
  const { toast } = useToast();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingCita, setEditingCita] = useState<Appointment | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta cita?")) return;
    try {
      const result = await deleteCita(id, patientId);
      if (result.success) {
        toast({ title: "Cita eliminada", description: "La cita se ha eliminado correctamente." });
        await onDataUpdate();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la cita.",
      });
    }
  };

  const closeAndRefresh = async () => {
    setOpenCreate(false);
    setEditingCita(null);
    await onDataUpdate();
  };

  if (!data || data.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No hay citas programadas
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Programe una nueva cita para este paciente.
            </p>
            <Button onClick={() => setOpenCreate(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Programar Primera Cita
            </Button>
          </CardContent>
        </Card>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Programar Nueva Cita</DialogTitle>
            </DialogHeader>
            <CitasForm
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
        <h3 className="text-lg font-semibold">Citas Programadas ({data.length})</h3>
        <Button onClick={() => setOpenCreate(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      <div className="space-y-4">
        {data.map((cita) => (
          <AppointmentCard
            key={cita.id}
            appointment={cita}
            onEdit={() => setEditingCita(cita)}
            onDelete={() => handleDelete(cita.id)}
          />
        ))}
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Programar Nueva Cita</DialogTitle>
          </DialogHeader>
          <CitasForm
            patientId={patientId}
            mode="create"
            onSuccess={closeAndRefresh}
            onBack={() => setOpenCreate(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingCita}
        onOpenChange={(open) => { if (!open) setEditingCita(null); }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
          </DialogHeader>
          {editingCita && (
            <CitasForm
              patientId={patientId}
              recordId={editingCita.id}
              mode="edit"
              initialData={{
                fechaCita: editingCita.fechaCita?.split("T")[0] ?? "",
                horaInicio: editingCita.horaInicio,
                horaFin: editingCita.horaFin,
                motivoCita: editingCita.motivoCita,
                estadoCita: editingCita.estadoCita,
                notasCita: editingCita.notasCita,
                idDoctor: editingCita.idDoctor,
              }}
              onSuccess={closeAndRefresh}
              onBack={() => setEditingCita(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
