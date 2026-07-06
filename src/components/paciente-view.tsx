"use client";

import { parseISO, differenceInYears } from "date-fns";
import { formatDateDisplay } from "@/lib/formatDate";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditPatientModal } from "@/components/edit-patient-modal";

function getAge(dateString: string) {
  try {
    return differenceInYears(new Date(), parseISO(dateString));
  } catch {
    return null;
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 py-2 border-b last:border-b-0 text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground">{value ?? <span className="italic text-muted-foreground">Sin información</span>}</span>
    </div>
  );
}

interface PacienteViewProps {
  patient: any;
  onDataUpdate: () => Promise<void>;
}

export function PacienteView({ patient, onDataUpdate }: PacienteViewProps) {
  const age = patient.fechaNacimiento ? getAge(patient.fechaNacimiento) : null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg">Información del Paciente</CardTitle>
          <EditPatientModal patient={patient} onDataUpdate={onDataUpdate}>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          </EditPatientModal>
        </CardHeader>
        <CardContent>
          <InfoRow
            label="Nombres"
            value={patient.nombres}
          />
          <InfoRow
            label="Apellidos"
            value={patient.apellidos}
          />
          <InfoRow
            label="Fecha de Nacimiento"
            value={
              patient.fechaNacimiento
                ? `${formatDateDisplay(patient.fechaNacimiento)}${age !== null ? ` (${age} años)` : ""}`
                : undefined
            }
          />
          <InfoRow
            label="Sexo"
            value={patient.sexo}
          />
          <InfoRow
            label="Estado Civil"
            value={patient.estadoCivil}
          />
          <InfoRow
            label="Ocupación"
            value={patient.ocupacion}
          />
          <InfoRow
            label="Escolaridad"
            value={patient.escolaridad}
          />
          <InfoRow
            label="Teléfono Principal"
            value={patient.telefonoPrincipal}
          />
          <InfoRow
            label="Teléfono Alternativo"
            value={patient.telefonoAlternativo}
          />
          <InfoRow
            label="Email"
            value={patient.email}
          />
          <InfoRow
            label="Dirección"
            value={patient.direccion}
          />
          <InfoRow
            label="Estado"
            value={
              <Badge variant="outline" className={patient.estado === "Activo" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                {patient.estado}
              </Badge>
            }
          />
          {patient.esMenor && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Datos del Tutor</p>
              {patient.nombrePadre && <InfoRow label="Nombre del Padre" value={patient.nombrePadre} />}
              {patient.telefonoPadre && <InfoRow label="Teléfono del Padre" value={patient.telefonoPadre} />}
              {patient.nombreMadre && <InfoRow label="Nombre de la Madre" value={patient.nombreMadre} />}
              {patient.telefonoMadre && <InfoRow label="Teléfono de la Madre" value={patient.telefonoMadre} />}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
