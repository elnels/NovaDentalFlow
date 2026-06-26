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
} from "@/components/ui/select"
import type { FormState } from "@/lib/actions";
import type { PatientFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";


const patientSchema = z.object({
  DNI: z.string().optional().or(z.literal("")),
  Nombres: z.string().min(1, "El nombre es requerido").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  Apellidos: z.string().min(1, "El apellido es requerido").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras"),
  Fecha_Nacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
  Telefono_Principal: z.string().min(7, "El teléfono principal es requerido"),
  Telefono_Alternativo: z.string().optional().or(z.literal("")),
  Email: z.string().email("Email inválido"),
  Direccion: z.string().min(5, "La dirección es requerida"),
  Genero: z.enum(["Masculino", "Femenino"], {
    required_error: "Debe seleccionar un género",
    invalid_type_error: "Debe seleccionar un género válido"
  }),
});


interface PatientFormProps {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  initialData?: Partial<PatientFormData>;
  onSuccess: (patientId?: string) => void;
}

// El botón de envío con animación mejorada
function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <Button 
      type="submit" 
      disabled={isLoading} 
      className="w-full relative overflow-hidden transition-all duration-300 hover:scale-105"
    >
      {isLoading ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"></div>
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="animate-pulse">Guardando paciente...</span>
          </div>
        </>
      ) : (
        <span className="relative">Guardar Paciente</span>
      )}
    </Button>
  );
}

export function PatientForm({ action, initialData, onSuccess }: PatientFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<FormState>({ message: "", success: false });

  // Función para limpiar el estado de error
  const clearErrorState = () => {
    setState({ message: "", success: false });
  };

  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialData || {
      DNI: "",
      Nombres: "",
      Apellidos: "",
      Fecha_Nacimiento: "",
      Telefono_Principal: "",
      Telefono_Alternativo: "",
      Email: "",
      Direccion: "",
      Genero: undefined,
    },
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Éxito",
          description: state.message,
        });
        onSuccess(state.patientId);
        form.reset();
        clearErrorState();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: state.message || "Por favor, corrija los errores en el formulario.",
        });
      }
    }
    if(state.errors) {
        Object.entries(state.errors).forEach(([key, value]) => {
            if(value) {
               form.setError(key as keyof PatientFormData, { type: "manual", message: value });
            }
        })
    }
  }, [state, toast, onSuccess, form]);


  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await action(state, formData);
      setState(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      {/* ===== CAMBIO AQUÍ: Contenedor relativo para el overlay de carga ===== */}
      <div className="relative">
        {/* ===== CAMBIO AQUÍ: Overlay de carga mejorado ===== */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <p className="mt-4 text-lg text-gray-600 animate-pulse">Guardando paciente...</p>
            <div className="mt-2 flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
        <form action={handleSubmit} className="space-y-4">
            {/* ... Tu formulario sigue igual desde aquí ... */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="Nombres"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombres</FormLabel>
                    <FormControl>
                    <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="Apellidos"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl>
                    <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>
            <FormField
            control={form.control}
            name="DNI"
            render={({ field }) => (
                <FormItem>
                <FormLabel>DNI</FormLabel>
                <FormControl>
                    <Input placeholder="12345678A" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="Fecha_Nacimiento"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="Genero"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Género</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione el género" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="Genero" value={field.value || ""} />
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="Telefono_Principal"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Teléfono Principal</FormLabel>
                    <FormControl>
                    <Input placeholder="+51 987654321" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="Telefono_Alternativo"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Teléfono Alternativo (Opcional)</FormLabel>
                    <FormControl>
                    <Input placeholder="+51 123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>
            <FormField
                control={form.control}
                name="Email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                    <Input type="email" placeholder="juan.perez@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
            control={form.control}
            name="Direccion"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                    <Input placeholder="Av. Siempre Viva 123" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <SubmitButton isLoading={isLoading} />
        </form>
      </div>
    </Form>
  );
}