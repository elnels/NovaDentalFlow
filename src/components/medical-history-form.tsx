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

const medicalHistorySchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  appointmentId: z.string().optional().or(z.literal("")),
  fechaHistorial: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválida"),
  diagnostico: z.string().min(1, "El diagnóstico es requerido"),
  tratamiento: z.string().min(1, "El tratamiento realizado es requerido"),
  prescripciones: z.string().optional(),
  notas: z.string().optional(),
  estadoPago: z.enum(["Pendiente", "Pagado", "Parcial"], {
    required_error: "El estado de pago es requerido",
  }),
  telefonoContacto: z.string().optional().or(z.literal("")),
  motivoConsulta: z.string().optional().or(z.literal("")),
  antecedentesPersonales: z.string().optional().or(z.literal("")),
  procedureLineItems: z.string().optional(),
});

type MedicalHistoryFormData = z.infer<typeof medicalHistorySchema>;

interface MedicalHistoryFormProps {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  initialData?: Partial<MedicalHistoryFormData>;
  onSuccess: (result: FormState) => void;
  onCancel?: () => void;
  patientId: string;
  appointmentId?: string;
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
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 animate-pulse"></div>
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="animate-pulse">Guardando historial...</span>
          </div>
        </>
      ) : (
        <span className="relative">Guardar Historial Clínico</span>
      )}
    </Button>
  );
}

export function MedicalHistoryForm({ action, initialData, onSuccess, onCancel, patientId, appointmentId }: MedicalHistoryFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [state, setState] = useState<FormState>({ message: "", success: false });

    const clearErrorState = () => {
        setState({ message: "", success: false });
    };

    const form = useForm<MedicalHistoryFormData>({
        resolver: zodResolver(medicalHistorySchema),
        defaultValues: {
            patientId: patientId,
            appointmentId: appointmentId || "",
            fechaHistorial: initialData?.fechaHistorial || new Date().toISOString().split('T')[0],
            diagnostico: initialData?.diagnostico || "",
            tratamiento: initialData?.tratamiento || "",
            prescripciones: initialData?.prescripciones || "",
            notas: initialData?.notas || "",
            estadoPago: initialData?.estadoPago || "Pendiente",
            telefonoContacto: initialData?.telefonoContacto || "",
            motivoConsulta: initialData?.motivoConsulta || "",
            antecedentesPersonales: initialData?.antecedentesPersonales || "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                patientId: patientId,
                appointmentId: appointmentId || "",
                fechaHistorial: initialData.fechaHistorial || new Date().toISOString().split('T')[0],
                diagnostico: initialData.diagnostico || "",
                tratamiento: initialData.tratamiento || "",
                prescripciones: initialData.prescripciones || "",
                notas: initialData.notas || "",
                estadoPago: initialData.estadoPago || "Pendiente",
                telefonoContacto: initialData.telefonoContacto || "",
                motivoConsulta: initialData.motivoConsulta || "",
                antecedentesPersonales: initialData.antecedentesPersonales || "",
            });
            clearErrorState();
        }
    }, [initialData, patientId, appointmentId, form]);

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({
                    title: "Éxito",
                    description: state.message,
                });
                onSuccess(state);
                form.reset();
                clearErrorState();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: state.message || "Por favor, corrija los errores.",
                });
            }
        }
        if(state.errors) {
            Object.entries(state.errors).forEach(([key, value]) => {
                if(value) {
                   form.setError(key as keyof MedicalHistoryFormData, { type: "manual", message: value });
                }
            })
        }
    }, [state, toast, onSuccess, form]);

    const onSubmit = async (values: MedicalHistoryFormData) => {
        setIsLoading(true);
        const formData = new FormData();
        for (const key in values) {
          const value = values[key as keyof MedicalHistoryFormData];
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
                            Guardando historial...
                        </div>
                    </div>
                )}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <input type="hidden" {...form.register("patientId")} />
                    {appointmentId && <input type="hidden" {...form.register("appointmentId")} />}
                    
                    <FormField
                        control={form.control}
                        name="fechaHistorial"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha del Historial</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="diagnostico"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Diagnóstico</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Describa el diagnóstico del paciente..."
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
                        name="tratamiento"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tratamiento Realizado</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Describa el tratamiento realizado..."
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
                        name="prescripciones"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prescripciones (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Medicamentos prescritos, dosis, etc..."
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
                        name="telefonoContacto"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono de Contacto</FormLabel>
                                <FormControl>
                                    <Input placeholder="Número de teléfono de contacto..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="motivoConsulta"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Motivo de Consulta</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Describa el motivo de la consulta..."
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
                        name="antecedentesPersonales"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Antecedentes Personales</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Antecedentes médicos del paciente..."
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
                        name="estadoPago"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado del Pago</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione el estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                                        <SelectItem value="Pagado">Pagado</SelectItem>
                                        <SelectItem value="Parcial">Parcial</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notas"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Observaciones adicionales, recomendaciones, etc..."
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex gap-2 justify-end">
                        <SubmitButton isLoading={isLoading} />
                    </div>
                </form>
            </div>
        </Form>
    );
}