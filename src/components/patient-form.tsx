"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";

type PatientFormData = z.infer<typeof patientSchema>;

const patientSchema = z.object({
  nombres: z.string().min(1, "El nombre es requerido").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  apellidos: z.string().min(1, "El apellido es requerido").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras"),
  fechaNacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
  telefonoPrincipal: z.string().min(7, "El teléfono principal es requerido"),
  telefonoAlternativo: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido"),
  direccion: z.string().optional().or(z.literal("")),
  sexo: z.enum(["Masculino", "Femenino", "Otro"]).optional(),
  estadoCivil: z.string().optional().or(z.literal("")),
  ocupacion: z.string().optional().or(z.literal("")),
  escolaridad: z.string().optional().or(z.literal("")),
  nombrePadre: z.string().optional().or(z.literal("")),
  nombreMadre: z.string().optional().or(z.literal("")),
  telefonoPadre: z.string().optional().or(z.literal("")),
  telefonoMadre: z.string().optional().or(z.literal("")),
  esMenor: z.string().optional(),
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
  const [esMenorEdad, setEsMenorEdad] = useState(
    initialData?.esMenor === true || initialData?.esMenor === "true"
  );

  // Función para limpiar el estado de error
  const clearErrorState = () => {
    setState({ message: "", success: false });
  };

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialData || {
      nombres: "",
      apellidos: "",
      fechaNacimiento: "",
      telefonoPrincipal: "",
      telefonoAlternativo: "",
      email: "",
      direccion: "",
      sexo: undefined,
      estadoCivil: "",
      ocupacion: "",
      escolaridad: "",
      nombrePadre: "",
      nombreMadre: "",
      telefonoPadre: "",
      telefonoMadre: "",
      esMenor: "",
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
                name="nombres"
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
                name="apellidos"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="fechaNacimiento"
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
                name="sexo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione el sexo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="sexo" value={field.value || ""} />
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="estadoCivil"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Estado Civil</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione estado civil" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Soltero/a">Soltero/a</SelectItem>
                        <SelectItem value="Casado/a">Casado/a</SelectItem>
                        <SelectItem value="Divorciado/a">Divorciado/a</SelectItem>
                        <SelectItem value="Viudo/a">Viudo/a</SelectItem>
                        <SelectItem value="Unión Libre">Unión Libre</SelectItem>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="estadoCivil" value={field.value || ""} />
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="ocupacion"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Ocupación</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Ingeniero" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="escolaridad"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Escolaridad</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Universitaria" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="telefonoPrincipal"
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
                name="telefonoAlternativo"
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
                name="email"
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
            name="direccion"
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
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="esMenorEdad"
                  checked={esMenorEdad}
                  onCheckedChange={(checked) => setEsMenorEdad(checked === true)}
                />
                <label htmlFor="esMenorEdad" className="text-sm font-medium cursor-pointer select-none">
                  Si es menor de Edad
                </label>
                <input type="hidden" name="esMenor" value={esMenorEdad ? "true" : ""} />
              </div>
              {esMenorEdad && (
                <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                  <FormField
                    control={form.control}
                    name="nombrePadre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Padre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del padre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefonoPadre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono del Padre</FormLabel>
                        <FormControl>
                          <Input placeholder="+51 987654321" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nombreMadre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Madre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la madre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefonoMadre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de la Madre</FormLabel>
                        <FormControl>
                          <Input placeholder="+51 987654321" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            <SubmitButton isLoading={isLoading} />
        </form>
      </div>
    </Form>
  );
}