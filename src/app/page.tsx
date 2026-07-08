"use client";

/*
 * DentalFlow - Sistema de Gestión Dental
 * Desarrollado por BillCodex - https://www.billcodex.com/
 * Copyright © 2024-${new Date().getFullYear()} BillCodex. Todos los derechos reservados.
 * Este software está protegido por derechos de autor.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Activity, AlertCircle, RefreshCw, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PatientsTable } from "@/components/patients-table";
import { SequentialWorkflow } from "@/components/sequential-workflow";
import { CalendarEmbed } from "@/components/calendar-embed";
import { getPacientesWithAppointments } from "@/lib/api";
import type { Patient } from "@/types";
import { formatTimeDisplay } from "@/lib/formatDate";

export default function HomePage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Función para cargar datos
  const loadPatients = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setIsLoading(true);
      }
      setError(null);
      
      const data = await getPacientesWithAppointments();
      setPatients(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(errorMessage);
      console.error('Error loading patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPatients();
  }, []);

  // Función para refrescar datos
  const handleRefresh = () => {
    loadPatients(false); // No mostrar loading completo, solo el botón
  };

  // Función para manejar el cierre del workflow
  const handleWorkflowClose = () => {
    setShowWorkflow(false);
    // Recargar datos después de registrar un paciente
    loadPatients(false);
  };

  const ToothIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.25 22 10 20l-1.15-3.35a2 2 0 0 0-3.2-1.15L2 14.75l2-4.5 4.5-1.55a2 2 0 0 1 2.5 0L15.25 10l2 4.5-3.65.75a2 2 0 0 0-3.2 1.15L9.25 19Z" />
      <path d="m19 12 1.8-3.95a1.2 1.2 0 0 0-.5-1.6l-2.6-1.45a1.2 1.2 0 0 0-1.6.5L14 8" />
      <path d="m5 12-1.8-3.95a1.2 1.2 0 0 1 .5-1.6l2.6-1.45a1.2 1.2 0 0 1 1.6.5L10 8" />
      <path d="M14 8s-1-3-2-3-2 3-2 3" />
      <path d="M12 22v-3" />
    </svg>
  );

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center text-center min-h-[80vh]"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-6xl mx-auto border border-blue-100">
              <img 
                  src="/DentalFlow.png" 
                  alt="DentalFlow Logo" 
                  className="w-32 h-32 mb-8 mx-auto object-contain"
                />
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent">NOVA</span>
                <span className="bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">DENTE</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Sistema integral de gestión dental. Administre pacientes, citas y historiales médicos de manera eficiente.
              </p>
              
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{patients.length}</div>
                  <div className="text-sm text-blue-600">Pacientes Registrados</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="text-2xl font-bold text-green-600">
                    <Activity className="w-6 h-6 inline" />
                  </div>
                  <div className="text-sm text-green-600">Sistema Activo</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">
                    {lastUpdated ? formatTimeDisplay(lastUpdated) : '--:--'}
                  </div>
                  <div className="text-sm text-purple-600">Última Actualización</div>
                </div>
              </div>

              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => setIsExpanded(true)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-5 w-5" />
                      Gestionar Pacientes
                    </>
                  )}
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setShowWorkflow(true)}
                  className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Registrar Paciente
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setShowCalendar(true)}
                  className="border-2 border-green-200 text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200"
                >
                  <CalendarDays className="mr-2 h-5 w-5" />
                  Calendario
                </Button>

                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = "/catalogo-procedimientos"}
                  className="border-2 border-purple-200 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200"
                >
                  <Activity className="mr-2 h-5 w-5" />
                  Catálogo de Procedimientos
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-7xl mx-auto flex-1"
          >
            {error ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-red-700 mb-2">Error al cargar los datos</h3>
                  <p className="text-red-600 mb-6">{error}</p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={() => loadPatients()}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reintentar
                    </Button>
                    <Button 
                      onClick={() => setIsExpanded(false)}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Volver al inicio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PatientsTable 
              patients={patients}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onPatientAdded={() => loadPatients(false)}
              onBack={() => setIsExpanded(false)}
            />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      
      {showWorkflow && (
        <SequentialWorkflow 
          onClose={handleWorkflowClose}
        />
      )}
      
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowCalendar(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end p-4 pb-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalendar(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cerrar
                </Button>
              </div>
              <div className="px-6 pb-6">
                <CalendarEmbed />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
