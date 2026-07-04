"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { addCita, updateCita } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { FormState } from "@/lib/actions";

const citaSchema = z.object({
  patientId: z.string().min(1),
  fechaCita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido"),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:MM)"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:MM)"),
  motivoCita: z.string().min(1, "El motivo es requerido"),
  estadoCita: z.string().min(1, "El estado es requerido"),
  notasCita: z.string().optional(),
  idDoctor: z.string().min(1, "El doctor es requerido"),
});

type CitaFormData = z.infer<typeof citaSchema>;

interface CitasFormProps {
  patientId: string;
  initialData?: Partial<CitaFormData>;
  recordId?: string;
  mode: "create" | "edit";
  onSuccess: () => void;
  onBack: () => void;
}

const estadosCita = [
  { value: "Programada", label: "Programada" },
  { value: "Confirmada", label: "Confirmada" },
  { value: "En Proceso", label: "En Proceso" },
  { value: "Completada", label: "Completada" },
  { value: "Cancelada", label: "Cancelada" },
];

export function CitasForm({
  patientId,
  initialData,
  recordId,
  mode,
  onSuccess,
  onBack,
}: CitasFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CitaFormData>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      patientId,
      fechaCita: initialData?.fechaCita || "",
      horaInicio: initialData?.horaInicio || "",
      horaFin: initialData?.horaFin || "",
      motivoCita: initialData?.motivoCita || "",
      estadoCita: (initialData?.estadoCita as string) || "Programada",
      notasCita: initialData?.notasCita || "",
      idDoctor: initialData?.idDoctor || "Dra Elsa Hernandez",
    },
  });

  const handleSubmit = async (data: CitaFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.set(key, value || "");
      });

      const state: FormState = { message: "", success: false };
      const result =
        mode === "create"
          ? await addCita(state, formData)
          : recordId
            ? await updateCita(recordId, state, formData)
            : { message: "Error: ID no encontrado", success: false };

      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        onSuccess();
      } else {
        if (result.errors) {
          Object.entries(result.errors).forEach(([key, value]) => {
            if (value) {
              form.setError(key as keyof CitaFormData, {
                type: "manual",
                message: value,
              });
            }
          });
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Error al guardar.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="horaInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora Inicio</FormLabel>
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
                  <FormLabel>Hora Fin</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="motivoCita"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo de la Cita</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="idDoctor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Dra Elsa Hernandez">Dra Elsa Hernandez</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estadoCita"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {estadosCita.map((estado) => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notasCita"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Programar Cita" : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
