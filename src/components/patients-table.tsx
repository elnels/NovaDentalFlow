"use client";

import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import Link from "next/link";
import { Search, Calendar, Clock, User, Phone, Mail, X, UserPlus, RefreshCw, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getPacientesWithAppointments } from '@/lib/api';

import type { Patient } from "@/types";
import { SequentialWorkflow } from "@/components/sequential-workflow";

// Función de debounce para optimizar la búsqueda
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
}

interface PatientsTableProps {
  onPatientSelect?: (patient: Patient) => void;
  patients?: Patient[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onPatientAdded?: () => void;
  onBack?: () => void;
}

export function PatientsTable({ 
  onPatientSelect, 
  patients: externalPatients, 
  isLoading: externalIsLoading = false,
  onRefresh,
  onPatientAdded,
  onBack
}: PatientsTableProps) {
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [itemsPerPage] = useState(20); // Mostrar 20 pacientes por página
  
  // Estados para manejar datos internos
  const [internalPatients, setInternalPatients] = useState<Patient[]>([]);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Función para cargar pacientes internamente
  const loadInternalPatients = useCallback(async () => {
    if (externalPatients) return; // No cargar si hay datos externos
    
    setInternalIsLoading(true);
    setError(null);
    try {
      const data = await getPacientesWithAppointments();
      setInternalPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pacientes');
    } finally {
      setInternalIsLoading(false);
    }
  }, [externalPatients]);
  
  // Cargar datos al montar si no hay datos externos
  useEffect(() => {
    if (!externalPatients) {
      loadInternalPatients();
    }
  }, [externalPatients, loadInternalPatients]);
  
  // Determinar qué datos y estado usar
  const patients = externalPatients || internalPatients;
  const isLoading = externalIsLoading || internalIsLoading;

  // Función de búsqueda con debounce
  const debouncedSearch = useMemo(() => 
    debounce((query: string, patientsList: Patient[]) => {
      if (!query.trim()) {
        setFilteredPatients(patientsList);
        return;
      }

      const searchTerm = query.toLowerCase();
      const filtered = patientsList.filter(patient => {
        const fullName = `${patient.nombres || ''} ${patient.apellidos || ''}`.toLowerCase();
        const phone = String(patient.telefonoPrincipal || '').toLowerCase();
        const email = String(patient.email || '').toLowerCase();
        const patientId = String(patient.id || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               phone.includes(searchTerm) || 
               email.includes(searchTerm) ||
               patientId.includes(searchTerm);
      });
      
      setFilteredPatients(filtered);
    }, 300),
  []);

  // Los datos se manejan automáticamente por el hook useDataCache

  // Ejecutar búsqueda cuando cambie la query o la lista de pacientes
  useEffect(() => {
    if (patients) {
      debouncedSearch(searchQuery, patients);
      setCurrentPage(1); // Reset página cuando se busca
    }
  }, [searchQuery, patients, debouncedSearch]);

  // Calcular pacientes paginados
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPatients.slice(startIndex, endIndex);
  }, [filteredPatients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleWorkflowComplete = useCallback(() => {
    setShowWorkflow(false);
    // Recargar la lista de pacientes después de registrar uno nuevo
    if (onPatientAdded) {
      onPatientAdded();
    } else {
      loadInternalPatients();
    }
  }, [onPatientAdded, loadInternalPatients]);
  
  const handleRefreshClick = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else {
      loadInternalPatients();
    }
  }, [onRefresh, loadInternalPatients]);



  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-4 text-muted-foreground">Cargando pacientes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Lista de Pacientes
            </div>
            <div className="flex items-center gap-2">
              {onBack && (
                <Button 
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Volver
                </Button>
              )}
              <Button 
                onClick={handleRefreshClick}
                variant="outline" 
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <Button 
                onClick={() => setShowWorkflow(true)}
                variant="default" 
                size="sm"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" />
                Registrar Nuevo Paciente
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, teléfono, email, ID paciente..."
              className="pl-10 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6" 
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-muted-foreground">
              {filteredPatients.length} de {patients?.length || 0} pacientes
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pacientes */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading && !patients ? (
            <div className="text-center p-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div>
                  <p className="text-lg font-medium text-gray-700">Cargando pacientes...</p>
                  <p className="text-sm text-gray-500 mt-1">Obteniendo datos del servidor</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center p-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar los datos</h3>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <Button 
                  onClick={handleRefreshClick}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center p-12">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchQuery ? 'Sin resultados' : 'No hay pacientes'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery 
                    ? 'No se encontraron pacientes que coincidan con la búsqueda.' 
                    : 'Aún no hay pacientes registrados en el sistema.'}
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => setShowWorkflow(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrar Primer Paciente
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700 py-4">Paciente</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4">Contacto</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4">Próxima Cita</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4">Estado</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPatients.map((patient, index) => (
                    <PatientRow 
                      key={patient.id} 
                      patient={patient} 
                    />
                  ))}
                </TableBody>
              </Table>
              
              {/* Paginación mejorada */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredPatients.length)} de {filteredPatients.length} pacientes
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="border-gray-300 text-gray-600 hover:bg-gray-100"
                      >
                        Primera
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="border-gray-300 text-gray-600 hover:bg-gray-100"
                      >
                        ← Anterior
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={currentPage === pageNum 
                                ? "bg-blue-600 text-white" 
                                : "border-gray-300 text-gray-600 hover:bg-gray-100"
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="border-gray-300 text-gray-600 hover:bg-gray-100"
                      >
                        Siguiente →
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="border-gray-300 text-gray-600 hover:bg-gray-100"
                      >
                        Última
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de registro de paciente */}
       {showWorkflow && (
         <SequentialWorkflow 
           onComplete={handleWorkflowComplete}
           onClose={() => setShowWorkflow(false)}
         />
       )}
    </div>
  );
}

// Componente memoizado para cada fila de paciente
const PatientRow = memo(({ patient }: { patient: Patient }) => {
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '-';
    // Evitar problemas de zona horaria parseando la fecha como local
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  const formatTime = useCallback((timeString: string) => {
    if (!timeString) return '-';
    return timeString;
  }, []);

  const getAvatarColor = useCallback((nombres: string, apellidos: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
      'bg-lime-500', 'bg-emerald-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500'
    ];
    const initials = `${nombres?.[0] || ''}${apellidos?.[0] || ''}`;
    const hash = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  const getAppointmentBadge = useCallback((patient: Patient) => {
    if (!patient.proximaCita || !patient.fechaProximaCita) {
      return (
        <Badge className="bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 font-medium shadow-sm">
          Sin citas
        </Badge>
      );
    }

    // Obtener fecha actual en zona horaria local
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
    
    // Parsear fecha de cita asegurando formato correcto
    let appointmentDateStr = patient.fechaProximaCita;
    if (appointmentDateStr.includes('/')) {
      // Convertir formato DD/MM/YYYY a YYYY-MM-DD
      const parts = appointmentDateStr.split('/');
      if (parts.length === 3) {
        appointmentDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    // Comparar fechas como strings para evitar problemas de zona horaria
    const diffDays = Math.floor((new Date(appointmentDateStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
    
    // Debug: mostrar las fechas para verificar
    console.log('Debug fechas:', {
      today: todayStr,
      appointmentDate: appointmentDateStr,
      fechaOriginal: patient.fechaProximaCita,
      diffDays
    });

    if (diffDays === 0) {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 px-3 py-1 font-bold shadow-lg animate-pulse">
          🔥 Hoy
        </Badge>
      );
    } else if (diffDays === 1) {
      return (
        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 px-3 py-1 font-semibold shadow-md">
          ⚡ Mañana
        </Badge>
      );
    } else if (diffDays <= 7) {
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-3 py-1 font-medium shadow-md">
          📅 {diffDays} días
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-3 py-1 font-medium shadow-sm">
          🗓️ {diffDays} días
        </Badge>
      );
    }
  }, []);

  return (
    <TableRow className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100">
      <TableCell className="py-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
            <AvatarFallback className={`${getAvatarColor(patient.nombres, patient.apellidos)} text-white font-bold text-lg`}>
              {patient.nombres?.[0]}{patient.apellidos?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">{`${patient.nombres} ${patient.apellidos}`}</p>
              <p className="text-sm text-gray-500 font-medium">ID: {patient.id}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-1 rounded-full">
            <Phone className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">{patient.telefonoPrincipal}</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1 rounded-full">
            <Mail className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800 truncate max-w-40">{patient.email}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        {patient.proximaCita && patient.fechaProximaCita ? (
          <div className="space-y-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="font-semibold text-purple-800">{formatDate(patient.fechaProximaCita)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-700">{formatTime(patient.horaProximaCita || '')}</span>
            </div>
            <p className="text-xs text-purple-600 bg-white px-2 py-1 rounded truncate max-w-36">
              {patient.motivoProximaCita || 'Sin motivo especificado'}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 font-medium">Sin citas programadas</p>
          </div>
        )}
      </TableCell>
      <TableCell className="py-4">
        <div className="flex justify-center">
          {getAppointmentBadge(patient)}
        </div>
      </TableCell>
      <TableCell className="py-4">
        <Link href={`/pacientes/${patient.id}`}>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            <User className="h-4 w-4 mr-1" />
            Ver Perfil
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
});

PatientRow.displayName = 'PatientRow';