'use client';

import { notFound } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { getPacienteById } from "@/lib/api";
import {
  updatePatientField,
  updateAppointmentField,
  updateHistoryField,
  addCitaFromObject,
  addHistorialFromObject,
  deleteCita,
  deleteHistorial
} from "@/lib/actions";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
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
import CitasTable from "@/components/citas-table";
import HistorialTable from "@/components/historial-table";


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
  console.log('🚀 Componente PatientDetailPage iniciando');
  
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  console.log('🆔 ID del paciente:', id);
  console.log('📋 Params resueltos:', resolvedParams);
  console.log('🔧 Preparando para configurar useEffect...');
  
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Debug: Forzar que loading sea false después de 10 segundos
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('🚨 TIMEOUT: Forzando loading = false después de 10 segundos');
      setLoading(false);
    }, 10000);
    return () => clearTimeout(timeout);
  }, []);
  const [syncing, setSyncing] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const { refreshData, handlePatientSuccess } = useAutoRefresh();
  const { toast } = useToast();

  // Función para cargar datos del paciente
  const loadPatient = useCallback(async (forceRefresh = false) => {
    if (!id) {
      console.log('🛑 No hay ID');
      return;
    }
    
    console.log('🚀 Iniciando carga para ID:', id);
    setLoading(true);
    try {
      console.log('📡 Llamando a getPacienteById...');
      const patientData = await getPacienteById(id);
      console.log('📦 Datos recibidos:', patientData);
      console.log('📦 Tipo de datos:', typeof patientData);
      console.log('📦 Es null/undefined?:', patientData == null);
      
      if (!patientData) {
        console.log('❌ No hay datos del paciente');
        setPatient(null);
      } else {
        console.log('✅ Estableciendo datos del paciente');
        setPatient(patientData);
      }
    } catch (error) {
      console.error('❌ Error loading patient:', error);
      setPatient(null);
    } finally {
      console.log('🏁 Finalizando carga, setLoading(false)');
      setLoading(false);
    }
  }, [id]);

  // useEffect debe estar aquí, antes de cualquier return condicional
  useEffect(() => {
    console.log('🎯 useEffect EJECUTÁNDOSE con ID:', id);
    console.log('🎯 Tipo de ID:', typeof id);
    console.log('🎯 ID es truthy?:', !!id);
    if (id) {
      console.log('🎯 ID válido, llamando loadPatient');
      loadPatient();
    } else {
      console.log('🎯 ID no válido:', id);
    }
  }, [id, loadPatient]); // Dependiendo del ID y loadPatient

  // Función para actualizar un campo específico
  const updateField = useCallback(async (recordId: string, fieldName: string, newValue: string, recordType: 'history' | 'appointment') => {
    try {
      const result = await updatePatientField(
        recordId,
        fieldName,
        newValue,
        recordType
      );
      
      if (result.success) {
        setPatient((prev: any) => {
          if (!prev) return prev;
          
          const updated = { ...prev };
          if (recordType === 'history') {
            updated.historialClinico = updated.historialClinico?.map((item: any) => 
              item.id === recordId ? { ...item, [fieldName]: newValue } : item
            );
          } else {
            updated.citas = updated.citas?.map((item: any) => 
              item.id === recordId ? { ...item, [fieldName]: newValue } : item
            );
          }
          return updated;
        });
        
        toast({
          title: "Campo actualizado",
          description: "El cambio se ha guardado correctamente."
        });
      } else {
        throw new Error(result.message || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el cambio."
      });
      throw error;
    }
  }, [id, toast]);

  const handleDeleteCita = async (citaId: string) => {
    try {
      const result = await deleteCita(citaId);
      if (result.success) {
        toast({
          title: "Cita eliminada",
          description: "La cita se ha eliminado correctamente.",
        });
        handleDataUpdate();
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error deleting cita:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la cita",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHistorial = async (historialId: string) => {
    try {
      const result = await deleteHistorial(historialId);
      if (result.success) {
        toast({
          title: "Historial eliminado",
          description: "El historial se ha eliminado correctamente.",
        });
        handleDataUpdate();
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error deleting historial:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el historial",
        variant: "destructive",
      });
    }
  };

  const handleDataUpdate = useCallback(async () => {
    if (id && !syncing) {
      setSyncing(true);
      try {
        console.log('🔄 Actualizando datos para:', id);
        await loadPatient(true);
        console.log('✅ Datos actualizados correctamente');
      } catch (error) {
        console.error('❌ Error en actualización:', error);
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

  const handleAddCita = useCallback(async (citaData: any) => {
    try {
      const citaWithPatient = {
        patientId: id,
        ...citaData,
      };
      
      const result = await addCitaFromObject(citaWithPatient);
      if (result.success) {
        setPatient((prev: any) => {
          if (!prev) return prev;
          const newCita = {
            id: result.appointmentId || `CITA-${Date.now()}`,
            patientId: id,
            ...citaData,
          };
          return {
            ...prev,
            citas: [...(prev.citas || []), newCita]
          };
        });
        
        toast({
          title: "Cita agregada",
          description: "La cita se ha programado correctamente.",
        });
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error adding cita:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo agregar la cita",
        variant: "destructive",
      });
    }
  }, [id, toast]);

  const handleAddHistorial = useCallback(async (historialData: any) => {
    try {
      const historialWithPatient = {
        patientId: id,
        ...historialData,
      };
      
      const result = await addHistorialFromObject(historialWithPatient);
      if (result.success) {
        setPatient((prev: any) => {
          if (!prev) return prev;
          const newHistorial = {
            id: result.historyId || `HIST-${Date.now()}`,
            patientId: id,
            ...historialData,
          };
          return {
            ...prev,
            historialClinico: [...(prev.historialClinico || []), newHistorial]
          };
        });
        
        toast({
          title: "Historial agregado",
          description: "El registro médico ha sido agregado exitosamente.",
        });
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error adding historial:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo agregar el historial",
        variant: "destructive",
      });
    }
  }, [id, toast]);
  
  console.log('🔍 Estado actual - Loading:', loading, 'Patient:', !!patient);
  
  if (loading) {
    console.log('⏳ Mostrando pantalla de carga');
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

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensaje informativo sobre actualización de datos */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <RefreshCw className="h-4 w-4" />
            <span>Los datos se actualizan automáticamente después de agregar nuevos registros médicos o citas.</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <GenderIcon gender={patient.genero} />
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

          <div className="lg:col-span-2 space-y-8">
            <HistorialTable 
              data={patient.historialClinico || []} 
              onUpdateField={updateField}
              onDeleteHistorial={handleDeleteHistorial}
              onAddHistorial={handleAddHistorial}
              patientId={patient.id}
              availableCitas={patient.citas || []}
            />

            <CitasTable 
              data={patient.citas || []} 
              onUpdateField={updateField}
              onDeleteCita={handleDeleteCita}
              onAddCita={handleAddCita}
              patientId={patient.id}
            />
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