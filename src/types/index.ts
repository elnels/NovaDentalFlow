export interface Patient {
  id: string;
  dni?: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  telefonoPrincipal: string;
  telefonoAlternativo?: string;
  email: string;
  direccion?: string;
  sexo?: 'Masculino' | 'Femenino' | 'Otro';
  estadoCivil?: string;
  ocupacion?: string;
  escolaridad?: string;
  nombrePadre?: string;
  nombreMadre?: string;
  telefonoPadre?: string;
  telefonoMadre?: string;
  esMenor?: boolean;
  fechaRegistro: string;
  estado: 'Activo' | 'Inactivo';
  historialClinico: ClinicalHistory[];
  citas: Appointment[];
  proximaCita?: Appointment;
  fechaProximaCita?: string;
  horaProximaCita?: string;
  motivoProximaCita?: string;
}

export interface ClinicalHistory {
  id: string;
  fechaHistorial?: string;
  fechaTratamiento?: string;
  appointmentId: string;
  patientId: string;
  diagnostico: string;
  tratamiento: string;
  prescripciones: string;
  notas: string;
  costoTratamiento: string;
  estadoPago: string;
  telefonoContacto?: string;
  motivoConsulta?: string;
  antecedentesPersonales?: string;
  idDoctor?: string;
  procedureLineItems?: ProcedureLineItem[];
  cancelled?: boolean;
  cancelReason?: string;
}

export interface ProcedureCatalog {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  defaultPrice: number;
  isActive: boolean;
}

export interface ProcedureLineItem {
  id: string;
  clinicalHistoryId: string;
  procedureCatalogId: string;
  procedureCatalog?: ProcedureCatalog;
  toothId?: number;
  quantity: number;
  fee: number;
  discount: number;
  notes?: string;
}

export interface Appointment {
  id: string;
  fechaCita: string;
  horaInicio: string;
  horaFin: string;
  motivoCita: string;
  idDoctor: string;
  notasCita: string;
  estadoCita: 'Programada' | 'Confirmada' | 'En Proceso' | 'Completada' | 'Cancelada';
}