"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User, Calendar, FileText, ChevronRight, Home, Users, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatientForm } from "@/components/patient-form";
import { AppointmentForm } from "@/components/appointment-form";
import { Hc1Form } from "@/components/hc1-form";
import { Hc2Form } from "@/components/hc2-form";
import { addPatient, addCita, saveHc1Odontologo, saveHc2, getPatientById, updatePatient, addEmptyHistorial, type FormState } from "@/lib/actions";
import type { PatientFormData } from "@/components/patient-form";

type WorkflowStep = "patient" | "hc1" | "hc2" | "appointment" | "completed";

interface StepData {
  patientId?: string;
  appointmentId?: string;
  historyId?: string;
}

interface SequentialWorkflowProps {
  onComplete?: () => void;
  onClose?: () => void;
}

const steps = [
  {
    id: "patient" as const,
    title: "Registro de Paciente",
    description: "Registre los datos del nuevo paciente",
    icon: User,
  },
  {
    id: "hc1" as const,
    title: "Revisión de Datos (HC1)",
    description: "Revise los datos del paciente",
    icon: FileText,
  },
  {
    id: "hc2" as const,
    title: "Antecedentes Personales (HC2)",
    description: "Registre los antecedentes del paciente",
    icon: FileText,
  },
  {
    id: "appointment" as const,
    title: "Programar Cita",
    description: "Programe una cita para el paciente",
    icon: Calendar,
  },
];

function StepIndicator({ currentStep, completedSteps }: { currentStep: WorkflowStep; completedSteps: Set<WorkflowStep> }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(step.id);
        const isCurrent = currentStep === step.id;
        const Icon = step.icon;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary text-primary bg-primary/10"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground max-w-24">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-5 w-5 text-muted-foreground mx-4 mt-[-2rem]" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function SequentialWorkflow({ onComplete, onClose }: SequentialWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("patient");
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());
  const [stepData, setStepData] = useState<StepData>({});
  const [patientEditData, setPatientEditData] = useState<Partial<PatientFormData> | undefined>(undefined);

  const handlePatientSuccess = (patientId?: string) => {
    if (patientId) {
      setStepData(prev => ({ ...prev, patientId }));
      setCompletedSteps(prev => new Set([...prev, "patient"]));
      setPatientEditData(undefined);
      setCurrentStep("hc1");
    }
  };

  const handlePatientEditSuccess = (patientId?: string) => {
    if (patientId) {
      setPatientEditData(undefined);
      setCurrentStep("hc1");
    }
  };

  const handleBackFromHc1 = async () => {
    if (!stepData.patientId) return;
    try {
      const res = await getPatientById(stepData.patientId);
      if (!res) return;
      const dateStr = res.fechaNacimiento instanceof Date
        ? res.fechaNacimiento.toISOString().split("T")[0]
        : String(res.fechaNacimiento).split("T")[0];
      const n = (v: string | null | undefined) => v ?? undefined;
      setPatientEditData({
        nombres: n(res.nombres),
        apellidos: n(res.apellidos),
        fechaNacimiento: dateStr,
        telefonoPrincipal: n(res.telefonoPrincipal),
        telefonoAlternativo: n(res.telefonoAlternativo),
        email: n(res.email),
        direccion: n(res.direccion),
        sexo: n(res.sexo),
        estadoCivil: n(res.estadoCivil),
        ocupacion: n(res.ocupacion),
        escolaridad: n(res.escolaridad),
        nombrePadre: n(res.nombrePadre),
        nombreMadre: n(res.nombreMadre),
        telefonoPadre: n(res.telefonoPadre),
        telefonoMadre: n(res.telefonoMadre),
        esMenor: res.esMenor ?? false,
      });
      setCurrentStep("patient");
    } catch (e) {
      console.error("Error fetching patient for edit:", e);
    }
  };

  const handleHc1Success = () => {
    setCompletedSteps(prev => new Set([...prev, "hc1"]));
    setCurrentStep("hc2");
  };

  const handleBackFromHc2 = () => {
    setCurrentStep("hc1");
  };

  const handleHc2Success = () => {
    setCompletedSteps(prev => new Set([...prev, "hc2"]));
    setCurrentStep("appointment");
  };

  const handleBackFromAppointment = () => {
    setCurrentStep("hc2");
  };

  const handleAppointmentSuccess = async (result: FormState) => {
    if (result.success && result.appointmentId) {
      setStepData(prev => ({ ...prev, appointmentId: result.appointmentId }));
      setCompletedSteps(prev => new Set([...prev, "appointment"]));
      setCurrentStep("completed");
      if (stepData.patientId) {
        await addEmptyHistorial(stepData.patientId, result.appointmentId);
      }
    }
  };

  const handleReset = () => {
    setCurrentStep("patient");
    setCompletedSteps(new Set());
    setStepData({});
    setPatientEditData(undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="max-w-4xl mx-auto p-6 bg-background rounded-lg shadow-lg max-h-[90vh] overflow-y-auto relative">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Flujo de Registro Completo
          </h1>
          <p className="text-muted-foreground">
            Complete el registro del paciente, programe su cita y registre el historial clínico
          </p>
        </div>

      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      <AnimatePresence mode="wait">
        {currentStep === "patient" && (
          <motion.div
            key="patient"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {patientEditData ? "Editar Datos del Paciente" : "Registro de Paciente"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientEditData ? (
                  <PatientForm action={updatePatient.bind(null, stepData.patientId!)} initialData={patientEditData} onSuccess={handlePatientEditSuccess} />
                ) : (
                  <PatientForm action={addPatient} onSuccess={handlePatientSuccess} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === "hc1" && stepData.patientId && (
          <motion.div
            key="hc1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Hc1Form
              patientId={stepData.patientId}
              action={saveHc1Odontologo}
              onSuccess={handleHc1Success}
              onBack={handleBackFromHc1}
            />
          </motion.div>
        )}

        {currentStep === "hc2" && stepData.patientId && (
          <motion.div
            key="hc2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Hc2Form
              patientId={stepData.patientId}
              action={saveHc2}
              onSuccess={handleHc2Success}
              onBack={handleBackFromHc2}
            />
          </motion.div>
        )}

        {currentStep === "appointment" && stepData.patientId && (
          <motion.div
            key="appointment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Programar Cita
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Paciente ID: {stepData.patientId}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <AppointmentForm 
                  action={addCita} 
                  onSuccess={handleAppointmentSuccess}
                  patientId={stepData.patientId}
                  onBack={handleBackFromAppointment}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === "completed" && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">
                  ¡Registro Completado Exitosamente!
                </h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  El paciente y la cita han sido registrados exitosamente.
                </p>
                
                {/* Resumen de IDs */}
                <div className="bg-muted/30 rounded-lg p-4 mb-8">
                  <h3 className="font-semibold mb-3 text-foreground">Resumen del Registro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <Badge variant="secondary">Paciente: {stepData.patientId}</Badge>
                    </div>
                    {stepData.appointmentId && (
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <Badge variant="secondary">Cita: {stepData.appointmentId}</Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones principales */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={handleReset} 
                      variant="default"
                      className="h-12 text-base"
                    >
                      <User className="mr-2 h-5 w-5" />
                      Registrar Otro Paciente
                    </Button>
                    {stepData.patientId && (
                      <Button asChild className="h-12 text-base">
                        <Link href={`/pacientes/${stepData.patientId}`}>
                          <FileText className="mr-2 h-5 w-5" />
                          Ver Perfil Completo
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Acciones adicionales */}
                  {!stepData.appointmentId && stepData.patientId && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800 text-sm mb-3">
                        💡 La cita está pendiente de programar
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/pacientes/${stepData.patientId}`}>
                          Programar Cita Ahora
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* Navegación adicional */}
                  <div className="flex flex-wrap gap-3 justify-center pt-6 border-t border-muted">
                    {stepData.patientId && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/pacientes/${stepData.patientId}`}>
                          <User className="mr-2 h-4 w-4" />
                          Ir al Perfil del Usuario
                        </Link>
                      </Button>
                    )}
                    <Button 
                      onClick={handleReset} 
                      variant="outline" 
                      size="sm"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Registrar Nuevo Paciente
                    </Button>
                    <Button 
                      onClick={() => {
                        if (onComplete) {
                          onComplete();
                        }
                        window.location.href = '/';
                      }}
                      variant="outline" 
                      size="sm"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Ver Lista de Pacientes
                    </Button>
                    <Button 
                      onClick={onClose} 
                      variant="ghost" 
                      size="sm"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cerrar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}