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
import { addPatient } from "@/lib/actions";

export function AddPatientModal({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const handleSuccess = (patientId?: string) => {
    onOpenChange(false);
    // We refresh the router regardless to show the new patient in searches.
    router.refresh(); 
    if (patientId) {
      router.push(`/pacientes/${patientId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
          <DialogDescription>
            Complete los campos para registrar un nuevo paciente en el sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PatientForm action={addPatient} onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}