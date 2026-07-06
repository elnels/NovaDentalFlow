'use client';

import Link from "next/link";
import {
  ChevronLeft,
  User,
  Cake,
  Phone,
  Mail,
  Home,
  FileText,
  Calendar,
  ClipboardList,
  Venus,
  Mars,
  Smartphone,
  CheckCircle2,
  XCircle,
  FileClock,
  RefreshCw,
  UserPlus
} from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState, useCallback, use } from "react";


import { getPacienteById } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EditOptionsMenu } from "@/components/edit-options-menu";
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

function getAge(dateString: string) {
  try {
    return differenceInYears(new Date(), parseISO(dateString));
  } catch (error) {
    return "N/A";
  }
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) {
    return (
        <div className="flex items-start">
            <Icon className="h-5 w-5 text-muted-foreground mt-1 mr-3 flex-shrink-0" />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value || "No especificado"}</p>
            </div>
        </div>
    );
}

function GenderIcon({ gender }: { gender: string }) {
    if (gender === 'Masculino') return <Mars className="h-5 w-5 text-blue-500" />;
    if (gender === 'Femenino') return <Venus className="h-5 w-5 text-pink-500" />;
    return null;
}

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

  const loadPatient = useCallback(async (forceRefresh = false) => {
    if (!id) return;
    setLoading(true);
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
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadPatient();
  }, [id, loadPatient]);

  const handleDataUpdate = useCallback(async () => {
    if (id && !syncing) {
      setSyncing(true);
      try {
        await loadPatient(true);
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
            <EditOptionsMenu patient={patient} onDataUpdate={handleDataUpdate} />
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
        
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${patient.nombres}+${patient.apellidos}&background=random&size=128`} />
                  <AvatarFallback className="text-3xl">
                    {patient.nombres?.[0]}
                    {patient.apellidos?.[0]}
                  </AvatarFallback>
                </Avatar>
                 <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{`${patient.nombres} ${patient.apellidos}`}</CardTitle>
                    <GenderIcon gender={patient.sexo} />
                 </div>
                 <div className="flex items-center gap-2 text-sm mt-2">
                    {patient.estado === 'Activo' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className={patient.estado === 'Activo' ? 'text-green-600' : 'text-red-600'}>
                        {patient.estado}
                    </span>
                 </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <InfoItem icon={Cake} label="Fecha de Nacimiento" value={`${format(parseISO(patient.fechaNacimiento), "d 'de' MMMM 'de' yyyy", { locale: es })} (${getAge(patient.fechaNacimiento)} años)`} />
                  <InfoItem icon={Phone} label="Teléfono Principal" value={patient.telefonoPrincipal} />
                  <InfoItem icon={Smartphone} label="Teléfono Alternativo" value={patient.telefonoAlternativo} />
                  <InfoItem icon={Mail} label="Email" value={patient.email} />
                  <InfoItem icon={Home} label="Dirección" value={patient.direccion || "No registrada"} />
                  {patient.nombrePadre && <InfoItem icon={User} label="Nombre del Padre" value={patient.nombrePadre} />}
                  {patient.telefonoPadre && <InfoItem icon={Phone} label="Teléfono del Padre" value={patient.telefonoPadre} />}
                  {patient.nombreMadre && <InfoItem icon={User} label="Nombre de la Madre" value={patient.nombreMadre} />}
                  {patient.telefonoMadre && <InfoItem icon={Phone} label="Teléfono de la Madre" value={patient.telefonoMadre} />}
                  <InfoItem icon={FileClock} label="Fecha de Registro" value={format(parseISO(patient.fechaRegistro), "dd/MM/yyyy", { locale: es })} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="paciente" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="paciente">Paciente</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
                <TabsTrigger value="citas">Citas</TabsTrigger>
                <TabsTrigger value="ficha-clinica">Ficha Clínica</TabsTrigger>
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
          </div>
        </div>
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