"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addHistorial, updateHistorial, getPatientById } from "@/lib/actions";
import { formatDateDisplay } from "@/lib/formatDate";
import { ProcedurePicker } from "@/components/procedure-picker";
import { useToast } from "@/hooks/use-toast";
import type { FormState } from "@/lib/actions";
import type { ProcedureCatalog } from "@/types";

interface LineItemInput {
  id: string;
  procedureCatalogId: string;
  procedureName: string;
  fee: string;
  discount: string;
  quantity: string;
  notes: string;
}

const historialSchema = z.object({
  patientId: z.string().min(1),
  fechaHistorial: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  appointmentId: z.string().optional(),
  diagnostico: z.string().optional(),
  tratamiento: z.string().optional(),
  prescripciones: z.string().optional(),
  notas: z.string().optional(),
  estadoPago: z.enum(["Pendiente", "Pagado", "Parcial", "Cancelado"]),
  telefonoContacto: z.string().optional(),
  motivoConsulta: z.string().optional(),
  antecedentesPersonales: z.string().optional(),
  procedureLineItems: z.string().optional(),
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

function computeTotal(items: LineItemInput[]): number {
  return items.reduce((sum, item) => {
    const fee = parseFloat(item.fee) || 0;
    const disc = parseFloat(item.discount) || 0;
    const qty = parseInt(item.quantity) || 1;
    return sum + (fee - disc) * qty;
  }, 0);
}

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
  const [lineItems, setLineItems] = useState<LineItemInput[]>([]);

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
      estadoPago: (initialData?.estadoPago as "Pendiente" | "Pagado" | "Parcial" | "Cancelado") || "Pendiente",
      telefonoContacto: initialData?.telefonoContacto || "",
      motivoConsulta: initialData?.motivoConsulta || "",
      antecedentesPersonales: initialData?.antecedentesPersonales || "",
    },
  });

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), procedureCatalogId: "", procedureName: "", fee: "", discount: "0", quantity: "1", notes: "" },
    ]);
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateLineItem = useCallback((id: string, updates: Partial<LineItemInput>) => {
    setLineItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const handleProcedureSelect = useCallback((id: string, proc: ProcedureCatalog) => {
    updateLineItem(id, {
      procedureCatalogId: proc.id,
      procedureName: `${proc.code} — ${proc.name}`,
      fee: String(proc.defaultPrice),
    });
  }, [updateLineItem]);

  const total = computeTotal(lineItems);

  const handleSubmit = async (data: HistorialFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        const v = key === "appointmentId" && value === "__none__" ? "" : value;
        if (key !== "procedureLineItems") {
          formData.set(key, v ?? "");
        }
      });
      formData.set("procedureLineItems", JSON.stringify(lineItems));

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
                        {cita.fechaCita instanceof Date ? cita.fechaCita.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : formatDateDisplay(cita.fechaCita)} - {cita.motivoCita}
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base font-semibold">Procedimientos</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          </div>
          {lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No hay procedimientos agregados. Use el botón &quot;Agregar&quot; para añadir uno.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Procedimiento</TableHead>
                    <TableHead className="w-[80px]">Cant.</TableHead>
                    <TableHead className="w-[100px]">Honorarios</TableHead>
                    <TableHead className="w-[80px]">Desc.</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <ProcedurePicker
                          value={item.procedureCatalogId}
                          onChange={(procId, proc) => handleProcedureSelect(item.id, proc)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, { quantity: e.target.value })}
                          className="h-8 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.fee}
                          onChange={(e) => updateLineItem(item.id, { fee: e.target.value })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateLineItem(item.id, { discount: e.target.value })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end px-4 py-2 border-t bg-muted/30">
                <span className="text-sm font-semibold">
                  Total: ${total.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
