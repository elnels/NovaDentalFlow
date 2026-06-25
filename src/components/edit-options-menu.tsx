"use client";

import { useState } from "react";
import { Edit, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditPatientModal } from "@/components/edit-patient-modal";
import type { Patient } from "@/types";

interface EditOptionsMenuProps {
  patient: Patient;
  onDataUpdate?: () => void;
}

export function EditOptionsMenu({ patient, onDataUpdate }: EditOptionsMenuProps) {
  const [showPatientModal, setShowPatientModal] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setShowPatientModal(true)}>
        <Edit className="mr-2 h-4 w-4" />
        Editar Datos del Paciente
      </Button>

      {/* Modal para editar datos del paciente */}
      <EditPatientModal 
        patient={patient} 
        open={showPatientModal} 
        onOpenChange={setShowPatientModal}
        onDataUpdate={onDataUpdate}
      >
        <div />
      </EditPatientModal>
    </>
  );
}