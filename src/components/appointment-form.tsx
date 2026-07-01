"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  fechaCita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Debe proporcionar una fecha válida."),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Debe proporcionar una hora de inicio válida."),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Debe proporcionar una hora de fin válida."),
  motivoCita: z.string().min(1, "El motivo de la cita es requerido"),
  estadoCita: z.enum(["Programada", "Confirmada", "En Proceso", "Completada", "Cancelada"], {
    required_error: "Debe seleccionar un estado",
  }),
  notasCita: z.string().optional().or(z.literal("")),
  idDoctor: z.string().min(1, "El ID del doctor es requerido"),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  initialData?: Partial<AppointmentFormData>;
  onSuccess: (result: FormState) => void; // <-- Cambio aquí
  patientId: string;
  onBack?: () => void;
}

function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <Button 
      type="submit" 
      disabled={isLoading} 
      className="w-full relative overflow-hidden transition-all duration-300 hover:scale-105"
    >
      {isLoading ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 animate-pulse"></div>
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="animate-pulse">Guardando cita...</span>
          </div>
        </>
      ) : (
        <span className="relative">Guardar Cita</span>
      )}
    </Button>
  );
}

export function AppointmentForm({ action, initialData, onSuccess, patientId, onBack }: AppointmentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<FormState>({ message: "", success: false });

  // Función para limpiar el estado de error
  const clearErrorState = () => {
    setState({ message: "", success: false });
  };

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: initialData?.patientId || patientId || "",
      fechaCita: initialData?.fechaCita || "",
      horaInicio: initialData?.horaInicio || "",
      horaFin: initialData?.horaFin || "",
      motivoCita: initialData?.motivoCita || "",
      estadoCita: initialData?.estadoCita || "Programada",
      notasCita: initialData?.notasCita || "",
        idDoctor: initialData?.idDoctor || "Dra Elsa Hernandez",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        patientId: initialData?.patientId || patientId || "",
        fechaCita: initialData?.fechaCita || "",
        horaInicio: initialData?.horaInicio || "",
        horaFin: initialData?.horaFin || "",
        motivoCita: initialData?.motivoCita || "",
        estadoCita: initialData?.estadoCita || "Programada",
        notasCita: initialData?.notasCita || "",
      idDoctor: initialData?.idDoctor || "Dra Elsa Hernandez",
      });
      // Limpiar errores cuando se cargan nuevos datos iniciales
      clearErrorState();
    }
  }, [initialData, patientId, form]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Éxito",
          description: state.message,
        });
        // CAMBIO AQUÍ: Llamar a onSuccess con el objeto de estado completo
        onSuccess(state);
        // No reseteamos el formulario para que el usuario vea los datos que ingresó
        clearErrorState();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: state.message || "Por favor, corrija los errores.",
        });
      }
    }
    if (state.errors) {
      Object.entries(state.errors).forEach(([key, value]) => {
        if (value) {
          form.setError(key as keyof AppointmentFormData, {
            type: "manual",
            message: value,
          });
        }
      });
    }
  }, [state, toast, onSuccess, form]);
  
  const onSubmit = async (values: AppointmentFormData) => {
    setIsLoading(true);
    const formData = new FormData();
    for (const key in values) {
      const value = values[key as keyof AppointmentFormData];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    }

    try {
      const result = await action(state, formData);
      setState(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Guardando cita...
            </div>
          </div>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("patientId")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fechaCita"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de la Cita</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="horaInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de Inicio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="horaFin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de Fin</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="estadoCita"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de la Cita</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Programada">Programada</SelectItem>
                      <SelectItem value="Confirmada">Confirmada</SelectItem>
                      <SelectItem value="En Proceso">En Proceso</SelectItem>
                      <SelectItem value="Completada">Completada</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="motivoCita"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo de la Cita</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe el motivo de la cita..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notasCita"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Notas adicionales sobre la cita..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="idDoctor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nombre del doctor"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} className="flex-1">
                Regresar
              </Button>
            )}
            <div className="flex-1">
              <SubmitButton isLoading={isLoading} />
            </div>
          </div>
        </form>
      </div>
    </Form>
  );
}