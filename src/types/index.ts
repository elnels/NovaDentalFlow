export interface Patient {
  ID_Paciente: string;
  DNI?: string;
  Nombres: string;
  Apellidos: string;
  Fecha_Nacimiento: string;
  Telefono_Principal: string;
  Telefono_Alternativo?: string;
  Email: string;
  Direccion?: string;
  Genero: 'Masculino' | 'Femenino' | 'Otro';
  Fecha_Registro: string;
  Estado: 'Activo' | 'Inactivo';
  Historial_Clinico: ClinicalHistory[];
  Citas: Appointment[];
  // Campos adicionales para tabla de pacientes con citas
  proximaCita?: Appointment;
  fechaProximaCita?: string;
  horaProximaCita?: string;
  motivoProximaCita?: string;
}

export interface ClinicalHistory {
  ID_Historial: string;
  Fecha_Historial?: string;
  Fecha_Tratamiento?: string;
  ID_Cita: string;
  ID_Paciente: string;
  Diagnostico: string;
  Tratamiento_Realizado: string;
  Prescripciones: string;
  Notas_Adicionales: string;
  Costo_Tratamiento: string;
  Estado_Pago: string;
  Sexo?: 'Masculino' | 'Femenino' | '';
  Estado_Civil?: string;
  Ocupacion?: string;
  Escolaridad?: string;
  Nombre_Padre?: string;
  Nombre_Madre?: string;
  Telefono_Contacto?: string;
  Motivo_Consulta?: string;
  Antecedentes_Personales?: string;
  ID_Doctor?: string;
}

export interface Appointment {
  ID_Cita: string;
  Fecha_Cita: string;
  Hora_Inicio: string;
  Hora_Fin: string;
  Motivo_Cita: string;
  ID_Doctor: string;
  Notas_Cita: string;
  Estado_Cita: 'Programada' | 'Confirmada' | 'En Proceso' | 'Completada' | 'Cancelada';
}

// For form validation and server actions
export type PatientFormData = Omit<Patient, "ID_Paciente" | "Historial_Clinico" | "Citas" | "Fecha_Registro" | "Estado" | "Edad">;