"use client";

import { useState, useEffect } from "react";
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
import { addHistorial, updateHistorial, getPatientById } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { FormState } from "@/lib/actions";

const historialSchema = z.object({
  patientId: z.string().min(1),
  fechaHistorial: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  appointmentId: z.string().optional(),
  diagnostico: z.string().optional(),
  tratamiento: z.string().optional(),
  prescripciones: z.string().optional(),
  notas: z.string().optional(),
  costoTratamiento: z.string().optional(),
  estadoPago: z.enum(["Pendiente", "Pagado", "Parcial", "Cancelado"]),
  telefonoContacto: z.string().optional(),
  motivoConsulta: z.string().optional(),
  antecedentesPersonales: z.string().optional(),
});

type HistorialFormData = z.infer<typeof historialSchema>;

interface HistorialFormProps {
  patientId: string;
  initialData?: Partial<HistorialFormData>;
  recordId?: string;
  mode: "create" | "edit";
  onSuccess: () => void;
  onBack: () => void;
}

const estadosPago = [
  { value: "Pendiente", label: "Pendiente" },
  { value: "Pagado", label: "Pagado" },
  { value: "Parcial", label: "Parcial" },
  { value: "Cancelado", label: "Cancelado" },
];

export function HistorialForm({
  patientId,
  initialData,
  recordId,
  mode,
  onSuccess,
  onBack,
}: HistorialFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCitas, setAvailableCitas] = useState<
    { id: string; fechaCita: string; motivoCita: string }[]
  >([]);

  useEffect(() => {
    getPatientById(patientId).then((res: any) => {
      if (res?.appointments) setAvailableCitas(res.appointments);
    });
  }, [patientId]);

  const form = useForm<HistorialFormData>({
    resolver: zodResolver(historialSchema),
    defaultValues: {
      patientId,
      fechaHistorial: initialData?.fechaHistorial || "",
      appointmentId: initialData?.appointmentId || "",
      diagnostico: initialData?.diagnostico || "",
      tratamiento: initialData?.tratamiento || "",
      prescripciones: initialData?.prescripciones || "",
      notas: initialData?.notas || "",
      costoTratamiento: initialData?.costoTratamiento || "",
      estadoPago: (initialData?.estadoPago as "Pendiente" | "Pagado" | "Parcial" | "Cancelado") || "Pendiente",
      telefonoContacto: initialData?.telefonoContacto || "",
      motivoConsulta: initialData?.motivoConsulta || "",
      antecedentesPersonales: initialData?.antecedentesPersonales || "",
    },
  });

  const handleSubmit = async (data: HistorialFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        const v = key === "appointmentId" && value === "__none__" ? "" : value;
        formData.set(key, v ?? "");
      });

      const state: FormState = { message: "", success: false };
      const result =
        mode === "create"
          ? await addHistorial(state, formData)
          : recordId
            ? await updateHistorial(recordId, state, formData)
            : { message: "Error: ID no encontrado", success: false };

      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        onSuccess();
      } else {
        if (result.errors) {
          Object.entries(result.errors).forEach(([key, value]) => {
            if (value) {
              form.setError(key as keyof HistorialFormData, {
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
            name="fechaHistorial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha del Tratamiento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="appointmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cita Asociada</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin cita asociada" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Sin cita asociada</SelectItem>
                    {availableCitas.map((cita) => (
                      <SelectItem key={cita.id} value={cita.id}>
                        {cita.fechaCita instanceof Date ? cita.fechaCita.toLocaleDateString("es") : cita.fechaCita?.split("T")[0]} - {cita.motivoCita}
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
          name="diagnostico"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diagnóstico</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
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
                <Textarea rows={2} {...field} />
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
              <FormLabel>Prescripciones</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones Adicionales</FormLabel>
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
            name="costoTratamiento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo del Tratamiento</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {estadosPago.map((estado) => (
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telefonoContacto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono de Contacto</FormLabel>
                <FormControl>
                  <Input placeholder="+51 987654321" {...field} />
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
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="antecedentesPersonales"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Antecedentes Personales</FormLabel>
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
            {mode === "create" ? "Agregar Registro" : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
