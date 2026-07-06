"use client";

import { useState } from "react";
import { Pencil, CheckCircle2, XCircle, User, HeartPulse, Search, Stethoscope, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Hc1Form } from "@/components/hc1-form";
import { Hc2Form } from "@/components/hc2-form";
import { Hc3Form } from "@/components/hc3-form";
import { Hc4Form } from "@/components/hc4-form";
import { Hc5Form } from "@/components/hc5-form";
import {
  saveHc1Odontologo,
  saveHc2,
  saveHc3,
  saveHc4,
  saveHc5,
} from "@/lib/actions";

interface ClinicalDetailsViewProps {
  patientId: string;
  clinicalDetails: any;
  familyConditions: any[];
  onDataUpdate: () => Promise<void>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 py-2 border-b last:border-b-0 text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ElementType;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function YesNoBadge({ value }: { value: boolean | null | undefined }) {
  if (value) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Sí
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <XCircle className="h-3 w-3 mr-1" />
      No
    </Badge>
  );
}

export function ClinicalDetailsView({
  patientId,
  clinicalDetails,
  familyConditions,
  onDataUpdate,
}: ClinicalDetailsViewProps) {
  const [openHc1, setOpenHc1] = useState(false);
  const [openHc2, setOpenHc2] = useState(false);
  const [openHc3, setOpenHc3] = useState(false);
  const [openHc4, setOpenHc4] = useState(false);
  const [openHc5, setOpenHc5] = useState(false);

  const closeAndRefresh = async (setter: (v: boolean) => void) => {
    setter(false);
    await onDataUpdate();
  };

  let hc2Conditions: { name: string; presents: boolean; edad: string }[] = [];
  try {
    if (clinicalDetails?.antecedentesPersonales) {
      const parsed =
        typeof clinicalDetails.antecedentesPersonales === "string"
          ? JSON.parse(clinicalDetails.antecedentesPersonales)
          : clinicalDetails.antecedentesPersonales;
      if (Array.isArray(parsed)) hc2Conditions = parsed;
    }
  } catch {}

  let hc5Data: { tejidosBlandos?: string; oclusion?: any } = {};
  try {
    if (clinicalDetails?.observacionesHc5) {
      hc5Data =
        typeof clinicalDetails.observacionesHc5 === "string"
          ? JSON.parse(clinicalDetails.observacionesHc5)
          : clinicalDetails.observacionesHc5;
    }
  } catch {}

  const activeHc2Conditions = hc2Conditions.filter((c) => c.presents);
  const ALL_HC3_CONDITIONS = [
    "Diabetes",
    "Hipertensión Arterial",
    "Cáncer",
    "Cardiópatas",
    "Nefrópatas",
    "Malformaciones",
    "Otros",
  ];

  return (
    <div className="space-y-6">
      {/* HC1 — Odontólogo */}
      <SectionCard title="Odontólogo" icon={User} onEdit={() => setOpenHc1(true)}>
        <InfoRow
          label="Nombre del Odontólogo"
          value={clinicalDetails?.nombreOdontologo || "No registrado"}
        />
      </SectionCard>

      {/* HC2 — Antecedentes Personales */}
      <SectionCard title="Antecedentes Personales" icon={Stethoscope} onEdit={() => setOpenHc2(true)}>
        <InfoRow
          label="Motivo de Consulta"
          value={clinicalDetails?.motivoConsulta || "No registrado"}
        />
        <div className="py-2 border-b last:border-b-0 text-sm">
          <span className="text-muted-foreground font-medium">Condiciones Presentes</span>
          <div className="mt-1">
            {activeHc2Conditions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activeHc2Conditions.map((c) => (
                  <Badge key={c.name} variant="secondary" className="text-xs">
                    {c.name}
                    {c.edad ? ` (${c.edad} años)` : ""}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">Ninguna condición registrada</span>
            )}
          </div>
        </div>
      </SectionCard>

      {/* HC3 — Heredo-Familiares */}
      <SectionCard title="Antecedentes Heredo-Familiares" icon={HeartPulse} onEdit={() => setOpenHc3(true)}>
        <div className="divide-y text-sm">
          {ALL_HC3_CONDITIONS.map((conditionName) => {
            const saved = (familyConditions || []).find((fc: any) => fc.conditionName === conditionName);
            const hasCondition = saved?.hasCondition ?? false;
            return (
              <div key={conditionName}>
                <InfoRow label={conditionName} value={<YesNoBadge value={hasCondition} />} />
                {hasCondition && saved?.relatives && (
                  <InfoRow label="¿Quién?" value={saved.relatives as string} />
                )}
                {hasCondition && saved?.tipo && (conditionName === "Cáncer" || conditionName === "Malformaciones") && (
                  <InfoRow label="Tipo" value={saved.tipo as string} />
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* HC4 — No Patológicos */}
      <SectionCard title="Antecedentes Personales No Patológicos" icon={AlertCircle} onEdit={() => setOpenHc4(true)}>
        {clinicalDetails ? (
          <div className="divide-y text-sm">
            <InfoRow label="¿Bajo tratamiento médico?" value={<YesNoBadge value={clinicalDetails.bajoTratamientoMedico} />} />
            {clinicalDetails.bajoTratamientoMedico && clinicalDetails.motivo && (
              <InfoRow label="Motivo" value={clinicalDetails.motivo} />
            )}
            <InfoRow label="¿Toma medicamentos?" value={<YesNoBadge value={clinicalDetails.tomaMedicamentos} />} />
            {clinicalDetails.tomaMedicamentos && clinicalDetails.cualesMedicamentos && (
              <InfoRow label="¿Cuáles?" value={clinicalDetails.cualesMedicamentos} />
            )}
            {clinicalDetails.embarazada !== undefined && clinicalDetails.embarazada !== null && (
              <InfoRow label="¿Embarazada?" value={<YesNoBadge value={clinicalDetails.embarazada} />} />
            )}
            <InfoRow label="¿Transfusiones?" value={<YesNoBadge value={clinicalDetails.transfusiones} />} />
            <InfoRow label="¿Sangrado excesivo?" value={<YesNoBadge value={clinicalDetails.sangradoExcesivo} />} />
            <InfoRow label="¿Cirugías?" value={<YesNoBadge value={clinicalDetails.cirugias} />} />
            {clinicalDetails.cirugias && clinicalDetails.cirugiasDetalle && (
              <InfoRow label="Detalle cirugías" value={clinicalDetails.cirugiasDetalle} />
            )}
            <InfoRow label="¿Vacunas completas?" value={<YesNoBadge value={clinicalDetails.vacunasCompletas} />} />
            <InfoRow label="¿Alérgico a medicamentos?" value={<YesNoBadge value={clinicalDetails.alergicoMedicamentos} />} />
            {clinicalDetails.alergicoMedicamentos && clinicalDetails.alergicoCual && (
              <InfoRow label="¿Cuál?" value={clinicalDetails.alergicoCual} />
            )}
            <InfoRow label="¿Consume sustancias?" value={<YesNoBadge value={clinicalDetails.consumeSustancias} />} />
            {clinicalDetails.consumeSustancias && (
              <>
                {clinicalDetails.cualesSustancias && (
                  <InfoRow label="¿Cuáles?" value={clinicalDetails.cualesSustancias} />
                )}
                {clinicalDetails.frecuenciaSustancias && (
                  <InfoRow label="Frecuencia" value={clinicalDetails.frecuenciaSustancias} />
                )}
              </>
            )}
            <InfoRow label="¿Higiene bucal?" value={<YesNoBadge value={clinicalDetails.higieneBucal} />} />
            {clinicalDetails.higieneBucal && clinicalDetails.frecuenciaHigiene && (
              <InfoRow label="Frecuencia" value={clinicalDetails.frecuenciaHigiene} />
            )}
          </div>
        ) : (
          <EmptyState message="Sin datos no patológicos registrados" />
        )}
      </SectionCard>

      {/* HC5 — Exploración Bucal */}
      <SectionCard title="Exploración Bucal" icon={Search} onEdit={() => setOpenHc5(true)}>
        {hc5Data.tejidosBlandos || hc5Data.oclusion ? (
          <div className="divide-y text-sm">
            <InfoRow label="Tejidos Blandos" value={hc5Data.tejidosBlandos || "Sin datos"} />
            {hc5Data.oclusion && (
              <>
                <div className="py-2 text-sm font-medium text-muted-foreground">Oclusión</div>
                <InfoRow
                  label="Línea Media"
                  value={
                    hc5Data.oclusion.lineaMedia?.valor
                      ? `${hc5Data.oclusion.lineaMedia.valor}${hc5Data.oclusion.lineaMedia.notas ? ` — ${hc5Data.oclusion.lineaMedia.notas}` : ""}`
                      : "No especificado"
                  }
                />
                <InfoRow label="Plano Terminal Derecho" value={hc5Data.oclusion.planosTerminales?.derecho || "No especificado"} />
                <InfoRow label="Plano Terminal Izquierdo" value={hc5Data.oclusion.planosTerminales?.izquierdo || "No especificado"} />
                <InfoRow label="Espacios Terminales" value={<YesNoBadge value={hc5Data.oclusion.espaciosTerminales?.presente ?? null} />} />
                {hc5Data.oclusion.espaciosTerminales?.presente && hc5Data.oclusion.espaciosTerminales?.ubicacion && (
                  <InfoRow label="Ubicación Espacios" value={hc5Data.oclusion.espaciosTerminales.ubicacion} />
                )}
                <InfoRow label="Clase Angle Derecho" value={hc5Data.oclusion.claseAngle?.derecho || "No especificado"} />
                <InfoRow label="Clase Angle Izquierdo" value={hc5Data.oclusion.claseAngle?.izquierdo || "No especificado"} />
                <InfoRow label="Mordida Cruzada" value={<YesNoBadge value={hc5Data.oclusion.mordidaCruzada?.presente ?? null} />} />
                {hc5Data.oclusion.mordidaCruzada?.presente && hc5Data.oclusion.mordidaCruzada?.ubicacion && (
                  <InfoRow label="Ubicación" value={hc5Data.oclusion.mordidaCruzada.ubicacion} />
                )}
                <InfoRow label="Traslape Horizontal" value={<YesNoBadge value={hc5Data.oclusion.traslapeHorizontal?.presente ?? null} />} />
                {hc5Data.oclusion.traslapeHorizontal?.presente && (
                  <InfoRow label="Medida Horizontal" value={hc5Data.oclusion.traslapeHorizontal.mm ? `${hc5Data.oclusion.traslapeHorizontal.mm} mm` : "No especificado"} />
                )}
                <InfoRow label="Traslape Vertical" value={<YesNoBadge value={hc5Data.oclusion.traslapeVertical?.presente ?? null} />} />
                {hc5Data.oclusion.traslapeVertical?.presente && (
                  <InfoRow label="Medida Vertical" value={hc5Data.oclusion.traslapeVertical.mm ? `${hc5Data.oclusion.traslapeVertical.mm} mm` : "No especificado"} />
                )}
                <InfoRow label="Borde a Borde" value={<YesNoBadge value={hc5Data.oclusion.bordeABorde ?? null} />} />
                <InfoRow label="Mordida Abierta" value={<YesNoBadge value={hc5Data.oclusion.mordidaAbierta ?? null} />} />
                <InfoRow label="Hábitos Nocivos" value={<YesNoBadge value={hc5Data.oclusion.habitosNocivos?.presente ?? null} />} />
                {hc5Data.oclusion.habitosNocivos?.presente && hc5Data.oclusion.habitosNocivos?.cual && (
                  <InfoRow label="¿Cuál?" value={hc5Data.oclusion.habitosNocivos.cual} />
                )}
              </>
            )}
          </div>
        ) : (
          <EmptyState message="Sin exploración bucal registrada" />
        )}
      </SectionCard>

      {/* Dialogs */}
      <Dialog open={openHc1} onOpenChange={setOpenHc1}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar HC1 — Odontólogo</DialogTitle>
          </DialogHeader>
          <Hc1Form
            patientId={patientId}
            action={saveHc1Odontologo}
            onBack={() => setOpenHc1(false)}
            onSuccess={() => closeAndRefresh(setOpenHc1)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openHc2} onOpenChange={setOpenHc2}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar HC2 — Antecedentes Personales</DialogTitle>
          </DialogHeader>
          <Hc2Form
            patientId={patientId}
            action={saveHc2}
            onBack={() => setOpenHc2(false)}
            onSuccess={() => closeAndRefresh(setOpenHc2)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openHc3} onOpenChange={setOpenHc3}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar HC3 — Heredo-Familiares</DialogTitle>
          </DialogHeader>
          <Hc3Form
            patientId={patientId}
            action={saveHc3}
            onBack={() => setOpenHc3(false)}
            onSuccess={() => closeAndRefresh(setOpenHc3)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openHc4} onOpenChange={setOpenHc4}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar HC4 — No Patológicos</DialogTitle>
          </DialogHeader>
          <Hc4Form
            patientId={patientId}
            action={saveHc4}
            onBack={() => setOpenHc4(false)}
            onSuccess={() => closeAndRefresh(setOpenHc4)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openHc5} onOpenChange={setOpenHc5}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar HC5 — Exploración Bucal</DialogTitle>
          </DialogHeader>
          <Hc5Form
            patientId={patientId}
            action={saveHc5}
            onBack={() => setOpenHc5(false)}
            onSuccess={() => closeAndRefresh(setOpenHc5)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
