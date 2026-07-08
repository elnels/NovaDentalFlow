'use client';

import Link from "next/link";
import {
  ChevronLeft,
  RefreshCw,
  UserPlus
} from "lucide-react";
import { useEffect, useState, useCallback, use } from "react";

import { getPacienteById } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DeletePatientDialog } from "@/components/delete-patient-dialog";
import { SequentialWorkflow } from "@/components/sequential-workflow";
import { HistorialView } from "@/components/historial-view";
import { CitasView } from "@/components/citas-view";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ClinicalDetailsView } from "@/components/clinical-details-view";
import { OdontogramTab } from "@/components/odontogram-tab";
import { PacienteView } from "@/components/paciente-view";

// Componente de celda editable


export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const { toast } = useToast();

  const loadPatient = useCallback(async (showLoading = true) => {
    if (!id) return;
    if (showLoading) setLoading(true);
    try {
      const patientData = await getPacienteById(id);
      if (!patientData) {
        setPatient(null);
      } else {
        setPatient(patientData);
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      setPatient(null);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadPatient(true);
  }, [id, loadPatient]);

  const handleDataUpdate = useCallback(async () => {
    if (id && !syncing) {
      setSyncing(true);
      try {
        await loadPatient(false);
      } catch (error) {
        toast({ 
          variant: "destructive", 
          title: "Error de actualización", 
          description: "No se pudieron actualizar los datos." 
        });
      } finally {
        setSyncing(false);
      }
    }
  }, [id, loadPatient, syncing, toast]);
  
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-lg text-gray-600 animate-pulse">Cargando perfil del paciente...</p>
      </div>
    );
  }
  
  if (!patient && !loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Paciente no encontrado</h1>
          <p className="text-gray-600 mb-6">No se pudo cargar la información del paciente con ID: {id}</p>
          <Button asChild>
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowWorkflow(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              <UserPlus className="h-4 w-4" />
              Registrar Paciente
            </Button>
            <DeletePatientDialog patientId={patient.id} onDataUpdate={handleDataUpdate} />
          </div>
        </div>
      </header>

      <main className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensaje informativo sobre actualización de datos */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <RefreshCw className="h-4 w-4" />
            <span>Los datos se actualizan automáticamente después de agregar nuevos registros médicos o citas.</span>
          </div>
        </div>
        
        <Tabs defaultValue="paciente" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="paciente">Paciente</TabsTrigger>
                <TabsTrigger value="historial">Historial de Tratamientos</TabsTrigger>
                <TabsTrigger value="citas">Citas</TabsTrigger>
                <TabsTrigger value="ficha-clinica">Historia Clínica</TabsTrigger>
                <TabsTrigger value="odontograma">Odontograma</TabsTrigger>
              </TabsList>
              <TabsContent value="paciente" className="mt-4">
                <PacienteView
                  patient={patient}
                  onDataUpdate={handleDataUpdate}
                />
              </TabsContent>
              <TabsContent value="historial" className="mt-4">
                <HistorialView
                  data={patient.historialClinico || []}
                  patientId={patient.id}
                  onDataUpdate={handleDataUpdate}
                  initialMotivoConsulta={patient.clinicalDetails?.motivoConsulta}
                />
              </TabsContent>
              <TabsContent value="citas" className="mt-4">
                <CitasView
                  data={patient.citas || []}
                  patientId={patient.id}
                  onDataUpdate={handleDataUpdate}
                />
              </TabsContent>
              <TabsContent value="ficha-clinica" className="mt-4">
                <ClinicalDetailsView
                  patientId={patient.id}
                  clinicalDetails={patient.clinicalDetails}
                  familyConditions={patient.familyConditions}
                  createdAt={patient.historialClinico?.[0]?.fechaHistorial}
                  onDataUpdate={handleDataUpdate}
                />
              </TabsContent>
              <TabsContent value="odontograma" className="mt-4">
                <OdontogramTab
                  patientId={patient.id}
                  onDataUpdate={handleDataUpdate}
                />
              </TabsContent>
            </Tabs>
      </main>
      
      {showWorkflow && (
         <SequentialWorkflow
           onClose={() => setShowWorkflow(false)}
           onComplete={() => {
             setShowWorkflow(false);
             handleDataUpdate();
           }}
         />
       )}
    </div>
  );
}