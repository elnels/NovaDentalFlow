"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Patient } from "@/types";
import type { FormState } from "@/lib/actions";
import { getPatientById } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const odontologoSchema = z.object({
  nombreOdontologo: z.string().optional().or(z.literal("")),
});

type OdontologoFormData = z.infer<typeof odontologoSchema>;

interface Hc1FormProps {
  patientId: string;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  onSuccess: () => void;
}

export function Hc1Form({ patientId, action, onSuccess }: Hc1FormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await getPatientById(patientId);
        if (res) {
          const mapped: Patient = {
            id: res.id,
            nombres: res.nombres,
            apellidos: res.apellidos,
            fechaNacimiento: res.fechaNacimiento ? new Date(res.fechaNacimiento).toISOString().split("T")[0] : "",
            telefonoPrincipal: res.telefonoPrincipal || "",
            telefonoAlternativo: res.telefonoAlternativo || "",
            email: res.email || "",
            direccion: res.direccion || "",
            sexo: res.sexo || undefined,
            estadoCivil: res.estadoCivil || undefined,
            ocupacion: res.ocupacion || undefined,
            escolaridad: res.escolaridad || undefined,
            fechaRegistro: new Date(res.fechaRegistro).toISOString(),
            estado: res.estado as "Activo" | "Inactivo",
            historialClinico: res.clinicalHistory?.map((ch: any) => ({
              id: ch.id,
              appointmentId: ch.appointmentId || "",
              patientId: ch.patientId,
              diagnostico: ch.diagnostico || "",
              tratamiento: ch.tratamiento || "",
              prescripciones: ch.prescripciones || "",
              notas: ch.notas || "",
              costoTratamiento: ch.costoTratamiento?.toString() || "",
              estadoPago: ch.estadoPago || "",
              fechaHistorial: ch.fechaHistorial ? new Date(ch.fechaHistorial).toISOString().split("T")[0] : "",
              nombrePadre: ch.nombrePadre || undefined,
              nombreMadre: ch.nombreMadre || undefined,
              telefonoContacto: ch.telefonoContacto || undefined,
              motivoConsulta: ch.motivoConsulta || undefined,
              antecedentesPersonales: ch.antecedentesPersonales || undefined,
            })) || [],
            citas: res.appointments?.map((a: any) => ({
              id: a.id,
              fechaCita: a.fechaCita ? new Date(a.fechaCita).toISOString().split("T")[0] : "",
              horaInicio: a.horaInicio || "",
              horaFin: a.horaFin || "",
              motivoCita: a.motivoCita || "",
              idDoctor: a.idDoctor || "",
              notasCita: a.notasCita || "",
              estadoCita: a.estadoCita as any || "Programada",
            })) || [],
          };
          setPatient(mapped);
        }
      } catch (e) {
        console.error("Error fetching patient:", e);
      } finally {
        setLoadingPatient(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  const today = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const form = useForm<OdontologoFormData>({
    resolver: zodResolver(odontologoSchema),
    defaultValues: {
      nombreOdontologo: "Dra Elsa Hernández",
    },
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "No registrada";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await action({ message: "", success: false }, formData);
      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Error al guardar.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPatient) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No se pudieron cargar los datos del paciente.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Historial Clínico — Revisión de Datos (HC1)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-3 bg-muted/30 rounded-md">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Fecha:</span> {today}
          </p>
        </div>

        <Form {...form}>
          <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="patientId" value={patientId} />
            <FormField
              control={form.control}
              name="nombreOdontologo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Odontólogo</FormLabel>
                  <FormControl>
                    <Input placeholder="Dra Elsa Hernández" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Datos del Paciente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Nombre Completo</p>
                  <p className="font-medium">{patient.nombres} {patient.apellidos}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="font-medium">{formatDate(patient.fechaNacimiento)}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Domicilio</p>
                  <p className="font-medium">{patient.direccion || "No registrada"}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Teléfono Principal</p>
                  <p className="font-medium">{patient.telefonoPrincipal || "No registrado"}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Teléfono Alternativo</p>
                  <p className="font-medium">{patient.telefonoAlternativo || "No registrado"}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{patient.email || "No registrado"}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Sexo</p>
                  <p className="font-medium">{patient.sexo || "No especificado"}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Estado Civil</p>
                  <p className="font-medium">{patient.estadoCivil || "No especificado"}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Ocupación</p>
                  <p className="font-medium">{patient.ocupacion || "No especificada"}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">Escolaridad</p>
                  <p className="font-medium">{patient.escolaridad || "No especificada"}</p>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Guardando..." : "Continuar a Cita"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
