export interface BrandingConfig {
  clinicName: string;
  clinicAddress: string | null;
  clinicLogoUrl: string | null;
  clinicLogoBase64: string | null;
}

export interface PatientPrintData {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string | null;
  fechaNacimiento: string | null;
  sexo: string | null;
  telefonoPrincipal: string | null;
  telefonoAlternativo: string | null;
  email: string | null;
  direccion: string | null;
  estadoCivil: string | null;
  ocupacion: string | null;
  escolaridad: string | null;
  nombrePadre: string | null;
  nombreMadre: string | null;
}

export interface Hc1Data {
  nombreOdontologo: string | null;
}

export interface Hc2Data {
  motivoConsulta: string | null;
  antecedentesPersonales: { name: string; presents: boolean; edad: string }[];
}

export interface Hc3Condition {
  conditionName: string;
  hasCondition: boolean;
  tipo: string | null;
  relatives: string | null;
}

export interface Hc4Data {
  bajoTratamientoMedico: boolean;
  motivo: string | null;
  tomaMedicamentos: boolean;
  cualesMedicamentos: string | null;
  embarazada: boolean | null;
  transfusiones: boolean;
  sangradoExcesivo: boolean;
  sangradoTiempo: string | null;
  cirugias: boolean;
  cirugiasDetalle: string | null;
  vacunasCompletas: boolean;
  alergicoMedicamentos: boolean;
  alergicoCual: string | null;
  consumeSustancias: boolean;
  cualesSustancias: string | null;
  frecuenciaSustancias: string | null;
  higieneBucal: boolean;
  frecuenciaHigiene: string | null;
}

export interface Hc5Oclusion {
  lineaMedia?: { valor?: string; notas?: string };
  planosTerminales?: { derecho?: string; izquierdo?: string };
  espaciosTerminales?: { presente?: boolean; ubicacion?: string };
  claseAngle?: { derecho?: string; izquierdo?: string };
  mordidaCruzada?: { presente?: boolean; ubicacion?: string };
  traslapeHorizontal?: { presente?: boolean; mm?: string };
  traslapeVertical?: { presente?: boolean; mm?: string };
  bordeABorde?: boolean;
  mordidaAbierta?: boolean;
  habitosNocivos?: { presente?: boolean; cual?: string };
}

export interface Hc5Data {
  tejidosBlandos: string | null;
  oclusion: Hc5Oclusion | null;
}

export interface HistoriaClinicaPrintData {
  patient: PatientPrintData;
  hc1: Hc1Data;
  hc2: Hc2Data;
  hc3: Hc3Condition[];
  hc4: Hc4Data;
  hc5: Hc5Data;
  createdAt: string | null;
  printDate: string;
  branding: BrandingConfig;
}
