"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/patient-form";
import { updatePatient } from "@/lib/actions";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import type { Patient } from "@/types";

export function EditPatientModal({
  patient,
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onDataUpdate,
}: {
  patient: Patient;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDataUpdate?: () => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const router = useRouter();
  const { handlePatientSuccess } = useAutoRefresh();

  const handleSuccess = () => {
    setOpen(false);
    handlePatientSuccess(patient.id);
    onDataUpdate?.();
  };

  // Limpiar estados cuando se cierra el modal
  const handleModalClose = (open: boolean) => {
    setOpen(open);
  };

  const updatePatientWithId = updatePatient.bind(null, patient.id);

  const initialData = {
    nombres: patient.nombres ?? "",
    apellidos: patient.apellidos ?? "",
    fechaNacimiento: (() => {
      const dateField = patient.fechaNacimiento;
      if (!dateField || dateField === 'N/A') return '';
      try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateField)) {
          return dateField;
        }
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateField)) {
          const [day, month, year] = dateField.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        const date = new Date(dateField);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    })(),
    telefonoPrincipal: patient.telefonoPrincipal ?? "",
    telefonoAlternativo: patient.telefonoAlternativo ?? "",
    email: patient.email ?? "",
    direccion: patient.direccion ?? "",
    sexo: patient.sexo ?? undefined,
    estadoCivil: patient.estadoCivil ?? "",
    ocupacion: patient.ocupacion ?? "",
    escolaridad: patient.escolaridad ?? "",
    nombrePadre: patient.nombrePadre ?? "",
    nombreMadre: patient.nombreMadre ?? "",
    telefonoPadre: patient.telefonoPadre ?? "",
    telefonoMadre: patient.telefonoMadre ?? "",
    esMenor: patient.esMenor ? "true" : "",
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Datos del Paciente</DialogTitle>
          <DialogDescription>
            Actualice la información del paciente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PatientForm
            action={updatePatientWithId}
            initialData={initialData}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}