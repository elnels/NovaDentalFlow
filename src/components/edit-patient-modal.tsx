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
    handlePatientSuccess(patient.ID_Paciente, 'update');
    onDataUpdate?.();
  };

  // Limpiar estados cuando se cierra el modal
  const handleModalClose = (open: boolean) => {
    setOpen(open);
  };

  const updatePatientWithId = updatePatient.bind(null, patient.ID_Paciente);

  const initialData = {
    nombres: patient.Nombres,
    apellidos: patient.Apellidos,
    fechaNacimiento: (() => {
      const dateField = patient.Fecha_Nacimiento;
      if (!dateField || dateField === 'N/A') return '';
      try {
        // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateField)) {
          return dateField;
        }
        // Si está en formato DD/MM/YYYY, convertirlo
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateField)) {
          const [day, month, year] = dateField.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Intentar parsear como fecha ISO
        const date = new Date(dateField);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    })(),
    telefonoPrincipal: patient.Telefono_Principal,
    telefonoAlternativo: patient.Telefono_Alternativo,
    email: patient.Email,
    direccion: patient.Direccion,
    genero: patient.Genero,
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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