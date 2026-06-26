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
import { MedicalHistoryForm } from "@/components/medical-history-form";
import { addPatient, addCita, addHistorial, addEmptyHistorial } from "@/lib/actions";

type WorkflowStep = "patient" | "appointment" | "history" | "completed";

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
    id: "history" as const,
    title: "Historial Clínico (Opcional)",
    description: "Complete el historial clínico o omítalo si lo desea",
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

  const handlePatientSuccess = (patientId?: string) => {
    if (patientId) {
      setStepData(prev => ({ ...prev, patientId }));
      setCompletedSteps(prev => new Set([...prev, "patient"]));
      setCurrentStep("history");
    }
  };

  const handleHistorySuccess = (result: FormState) => {
    if (result.success && result.historyId) {
      setStepData(prev => ({ ...prev, historyId: result.historyId }));
      setCompletedSteps(prev => new Set([...prev, "history"]));
      setCurrentStep("appointment");
    }
  };

  const handleSkipHistory = async () => {
    if (stepData.patientId) {
      try {
        const result = await addEmptyHistorial(stepData.patientId);
        if (result.success && result.historyId) {
          setStepData(prev => ({ ...prev, historyId: result.historyId }));
        }
        setCompletedSteps(prev => new Set([...prev, "history"]));
        setCurrentStep("appointment");
      } catch (error) {
        console.error('Error al crear historial vacío:', error);
        setCompletedSteps(prev => new Set([...prev, "history"]));
        setCurrentStep("appointment");
      }
    }
  };

  const handleAppointmentSuccess = (result: FormState) => {
    if (result.success && result.appointmentId) {
      setStepData(prev => ({ ...prev, appointmentId: result.appointmentId }));
      setCompletedSteps(prev => new Set([...prev, "appointment"]));
      setCurrentStep("completed");
    }
  };

  const handleReset = () => {
    setCurrentStep("patient");
    setCompletedSteps(new Set());
    setStepData({});
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
                  Registro de Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PatientForm action={addPatient} onSuccess={handlePatientSuccess} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === "history" && stepData.patientId && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Historial Clínico (Opcional)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Paciente ID: {stepData.patientId}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Puede completar el historial ahora o programar la cita más tarde.
                  </p>
                  <Button 
                    onClick={handleSkipHistory} 
                    variant="outline" 
                    className="w-full"
                  >
                    Omitir y Continuar a Cita
                  </Button>
                </div>
                <MedicalHistoryForm 
                  action={addHistorial} 
                  onSuccess={handleHistorySuccess}
                  patientId={stepData.patientId}
                />
              </CardContent>
            </Card>
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
                  {stepData.historyId 
                    ? "El paciente, historial clínico y cita han sido registrados exitosamente."
                    : "El paciente e historial clínico han sido registrados exitosamente. La cita puede programarse más tarde."
                  }
                </p>
                
                {/* Resumen de IDs */}
                <div className="bg-muted/30 rounded-lg p-4 mb-8">
                  <h3 className="font-semibold mb-3 text-foreground">Resumen del Registro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center justify-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <Badge variant="secondary">Paciente: {stepData.patientId}</Badge>
                    </div>
                    {stepData.historyId && (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <Badge variant="secondary">Historial: {stepData.historyId}</Badge>
                      </div>
                    )}
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
                  {!stepData.historyId && stepData.patientId && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800 text-sm mb-3">
                        💡 El historial clínico está pendiente de completar
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/pacientes/${stepData.patientId}`}>
                          Completar Historial Ahora
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