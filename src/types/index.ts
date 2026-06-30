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
  genero: 'Masculino' | 'Femenino' | 'Otro';
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
  sexo?: 'Masculino' | 'Femenino' | '';
  estadoCivil?: string;
  ocupacion?: string;
  escolaridad?: string;
  nombrePadre?: string;
  nombreMadre?: string;
  telefonoContacto?: string;
  motivoConsulta?: string;
  antecedentesPersonales?: string;
  idDoctor?: string;
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