"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ArrowLeft, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getProcedureCatalog } from "@/lib/api";
import {
  addProcedureCatalogItem,
  updateProcedureCatalogItem,
  deleteProcedureCatalogItem,
} from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { ProcedureCatalog } from "@/types";
import type { FormState } from "@/lib/actions";

const procedureSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  defaultPrice: z.string().min(1, "El precio es requerido"),
});

type ProcedureFormData = z.infer<typeof procedureSchema>;

export default function CatalogoProcedimientosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [procedures, setProcedures] = useState<ProcedureCatalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcedureCatalog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProcedures = useCallback(async () => {
    try {
      const data = await getProcedureCatalog();
      setProcedures(data);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los procedimientos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  const filteredProcedures = procedures.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const handleCreate = async (data: ProcedureFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => formData.set(key, value ?? ""));
      const state: FormState = { message: "", success: false };
      const result = await addProcedureCatalogItem(state, formData);
      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        setOpenCreate(false);
        loadProcedures();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: ProcedureFormData) => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => formData.set(key, value ?? ""));
      formData.set("isActive", String(editingItem.isActive));
      const state: FormState = { message: "", success: false };
      const result = await updateProcedureCatalogItem(editingItem.id, state, formData);
      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        setEditingItem(null);
        loadProcedures();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar este procedimiento?")) return;
    const result = await deleteProcedureCatalogItem(id);
    if (result.success) {
      toast({ title: "Eliminado", description: result.message });
      loadProcedures();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Catálogo de Procedimientos</h1>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Procedimiento
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcedures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? "No se encontraron procedimientos."
                        : "No hay procedimientos en el catálogo. Agregue el primero."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProcedures.map((proc) => (
                    <TableRow key={proc.id}>
                      <TableCell className="font-mono text-sm">{proc.code}</TableCell>
                      <TableCell className="font-medium">{proc.name}</TableCell>
                      <TableCell>
                        {proc.category ? (
                          <Badge variant="outline">{proc.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Number(proc.defaultPrice).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={proc.isActive ? "default" : "secondary"}>
                          {proc.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingItem(proc)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(proc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Procedimiento</DialogTitle>
          </DialogHeader>
          <ProcedureForm
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            onCancel={() => setOpenCreate(false)}
            existingProcedures={procedures}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Procedimiento</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ProcedureForm
              initialData={{
                code: editingItem.code,
                name: editingItem.name,
                description: editingItem.description || "",
                category: editingItem.category || "",
                defaultPrice: String(editingItem.defaultPrice),
              }}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
              onCancel={() => setEditingItem(null)}
              existingProcedures={procedures}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const categoryToPrefix: Record<string, string> = {
  Consulta: "CON",
  Preventiva: "PREV",
  Restauradora: "REST",
  Endodoncia: "END",
  Cirugía: "CIR",
  Periodoncia: "PERIO",
  Ortodoncia: "ORT",
  Prótesis: "PROT",
  Radiología: "RADIO",
  Estética: "EST",
};

function generateNextCode(category: string, existing: ProcedureCatalog[]): string {
  const prefix = categoryToPrefix[category];
  if (!prefix) return "";
  const maxNum = existing
    .filter((p) => p.code.startsWith(prefix + "-"))
    .reduce((max, p) => {
      const num = parseInt(p.code.split("-")[1], 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
}

function ProcedureForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  existingProcedures,
}: {
  initialData?: ProcedureFormData;
  onSubmit: (data: ProcedureFormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  existingProcedures: ProcedureCatalog[];
}) {
  const form = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: initialData || {
      code: "",
      name: "",
      description: "",
      category: "",
      defaultPrice: "",
    },
  });

  const watchedCategory = form.watch("category");
  const isCreate = !initialData;

  useEffect(() => {
    if (!isCreate) return;
    const generated = generateNextCode(watchedCategory, existingProcedures);
    if (generated) {
      form.setValue("code", generated);
    }
  }, [watchedCategory, isCreate, existingProcedures, form]);

  const categories = [
    "Consulta",
    "Preventiva",
    "Restauradora",
    "Endodoncia",
    "Cirugía",
    "Periodoncia",
    "Ortodoncia",
    "Prótesis",
    "Radiología",
    "Estética",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="CONS-001" readOnly={isCreate} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Procedimiento</FormLabel>
              <FormControl>
                <Input placeholder="Profilaxis (Limpieza Dental)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio por Defecto</FormLabel>
              <FormControl>
                <Input type="number" placeholder="500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Guardar Cambios" : "Agregar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
