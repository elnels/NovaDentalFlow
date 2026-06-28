"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { PatientFormData } from "@/types";
import { syncCreateEvent, syncUpdateEvent, syncDeleteEvent } from "@/lib/calendar-api";

const patientSchema = z.object({
  DNI: z.string().optional().or(z.literal("")),
  Nombres: z.string().min(2, "El nombre es requerido"),
  Apellidos: z.string().min(2, "El apellido es requerido"),
  Fecha_Nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  Telefono_Principal: z.string().min(7, "El teléfono principal es requerido"),
  Telefono_Alternativo: z.string().optional(),
  Email: z.string().email("Email inválido"),
  Direccion: z.string().optional().or(z.literal("")),
  Genero: z.enum(["Masculino", "Femenino", "Otro"], { required_error: "El género es requerido"}),
});

const appointmentSchema = z.object({
  ID_Paciente: z.string().min(1, "El ID del paciente es requerido"),
  Fecha_Cita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  Hora_Inicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  Hora_Fin: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  Motivo_Cita: z.string().min(1, "El motivo de la cita es requerido"),
  Estado_Cita: z.enum(["Programada", "Confirmada", "En Proceso", "Completada", "Cancelada"], { required_error: "El estado es requerido"}),
  Notas_Cita: z.string().optional(),
  ID_Doctor: z.string().min(1, "El ID del doctor es requerido"),
});

const medicalHistorySchema = z.object({
  ID_Paciente: z.string().min(1, "El ID del paciente es requerido"),
  ID_Cita: z.string().optional().or(z.literal("")),
  Fecha_Historial: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  Diagnostico: z.string().optional().or(z.literal("")),
  Tratamiento_Realizado: z.string().optional().or(z.literal("")),
  Prescripciones: z.string().optional().or(z.literal("")),
  Notas_Adicionales: z.string().optional().or(z.literal("")),
  Costo_Tratamiento: z.string().optional().or(z.literal("")),
  Estado_Pago: z.enum(["Pendiente", "Pagado", "Parcial", "Cancelado"], { required_error: "El estado de pago es requerido"}),
  Sexo: z.enum(["Masculino", "Femenino"]).optional().or(z.literal("")),
  Estado_Civil: z.string().optional().or(z.literal("")),
  Ocupacion: z.string().optional().or(z.literal("")),
  Escolaridad: z.string().optional().or(z.literal("")),
  Nombre_Padre: z.string().optional().or(z.literal("")),
  Nombre_Madre: z.string().optional().or(z.literal("")),
  Telefono_Contacto: z.string().optional().or(z.literal("")),
  Motivo_Consulta: z.string().optional().or(z.literal("")),
  Antecedentes_Personales: z.string().optional().or(z.literal("")),
});

export type FormState = {
  message: string;
  errors?: Record<string, string>;
  success: boolean;
  patientId?: string;
  appointmentId?: string;
  historyId?: string;
};

export async function addPatient(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = patientSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as unknown as Record<keyof PatientFormData, string>,
      success: false,
    };
  }

  try {
    const patient = await prisma.patient.create({
      data: {
        dni: validatedFields.data.DNI || null,
        nombres: validatedFields.data.Nombres,
        apellidos: validatedFields.data.Apellidos,
        fechaNacimiento: new Date(validatedFields.data.Fecha_Nacimiento),
        telefonoPrincipal: validatedFields.data.Telefono_Principal,
        telefonoAlternativo: validatedFields.data.Telefono_Alternativo || null,
        email: validatedFields.data.Email,
        direccion: validatedFields.data.Direccion || null,
        genero: validatedFields.data.Genero,
      },
    });

    revalidatePath("/");
    return { message: "Paciente agregado con éxito.", success: true, patientId: patient.id };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function updatePatient(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = patientSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as unknown as Record<keyof PatientFormData, string>,
      success: false,
    };
  }

  try {
    await prisma.patient.update({
      where: { id },
      data: {
        dni: validatedFields.data.DNI || null,
        nombres: validatedFields.data.Nombres,
        apellidos: validatedFields.data.Apellidos,
        fechaNacimiento: new Date(validatedFields.data.Fecha_Nacimiento),
        telefonoPrincipal: validatedFields.data.Telefono_Principal,
        telefonoAlternativo: validatedFields.data.Telefono_Alternativo || null,
        email: validatedFields.data.Email,
        direccion: validatedFields.data.Direccion || null,
        genero: validatedFields.data.Genero,
      },
    });

    revalidatePath(`/pacientes/${id}`);
    revalidatePath("/");
    return { message: "Paciente actualizado con éxito.", success: true, patientId: id };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

type DeleteResult = { success: boolean; message: string };

export async function deletePatient(id: string): Promise<DeleteResult> {
  try {
    await prisma.patient.delete({ where: { id } });
    revalidatePath("/");
    return { success: true, message: "Paciente eliminado correctamente." };
  } catch (e) {
    return { success: false, message: `Error: ${(e as Error).message}` };
  }
}

export async function deletePaciente(id: string): Promise<DeleteResult> {
  try {
    await prisma.patient.delete({ where: { id } });
    revalidatePath("/");
    return { success: true, message: "Paciente eliminado correctamente." };
  } catch (e) {
    return { success: false, message: `Error: ${(e as Error).message}` };
  }
}

export async function addCita(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = appointmentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: validatedFields.data.ID_Paciente,
        fechaCita: new Date(validatedFields.data.Fecha_Cita),
        horaInicio: validatedFields.data.Hora_Inicio,
        horaFin: validatedFields.data.Hora_Fin,
        motivoCita: validatedFields.data.Motivo_Cita,
        idDoctor: validatedFields.data.ID_Doctor,
        notasCita: validatedFields.data.Notas_Cita || null,
        estadoCita: validatedFields.data.Estado_Cita,
      },
    });

    syncCreateEvent({
      ID_Cita: appointment.id,
      ...validatedFields.data,
    } as any).catch((err) => console.error("Calendar sync error:", err));

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
    return {
      message: "Cita programada correctamente.",
      success: true,
      appointmentId: appointment.id,
    };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function addCitaFromObject(citaData: any): Promise<FormState> {
  const validatedFields = appointmentSchema.safeParse(citaData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: validatedFields.data.ID_Paciente,
        fechaCita: new Date(validatedFields.data.Fecha_Cita),
        horaInicio: validatedFields.data.Hora_Inicio,
        horaFin: validatedFields.data.Hora_Fin,
        motivoCita: validatedFields.data.Motivo_Cita,
        idDoctor: validatedFields.data.ID_Doctor,
        notasCita: validatedFields.data.Notas_Cita || null,
        estadoCita: validatedFields.data.Estado_Cita,
      },
    });

    syncCreateEvent({
      ID_Cita: appointment.id,
      ...validatedFields.data,
    } as any).catch((err) => console.error("Calendar sync error:", err));

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
    return {
      message: "Cita programada correctamente.",
      success: true,
      appointmentId: appointment.id,
    };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function addHistorial(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = medicalHistorySchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    const history = await prisma.clinicalHistory.create({
      data: {
        patientId: validatedFields.data.ID_Paciente,
        appointmentId: validatedFields.data.ID_Cita || null,
        fechaHistorial: new Date(validatedFields.data.Fecha_Historial),
        diagnostico: validatedFields.data.Diagnostico || null,
        tratamiento: validatedFields.data.Tratamiento_Realizado || null,
        prescripciones: validatedFields.data.Prescripciones || null,
        notas: validatedFields.data.Notas_Adicionales || null,
        costoTratamiento: validatedFields.data.Costo_Tratamiento
          ? Number(validatedFields.data.Costo_Tratamiento)
          : null,
        estadoPago: validatedFields.data.Estado_Pago,
        sexo: validatedFields.data.Sexo || null,
        estadoCivil: validatedFields.data.Estado_Civil || null,
        ocupacion: validatedFields.data.Ocupacion || null,
        escolaridad: validatedFields.data.Escolaridad || null,
        nombrePadre: validatedFields.data.Nombre_Padre || null,
        nombreMadre: validatedFields.data.Nombre_Madre || null,
        telefonoContacto: validatedFields.data.Telefono_Contacto || null,
        motivoConsulta: validatedFields.data.Motivo_Consulta || null,
        antecedentesPersonales: validatedFields.data.Antecedentes_Personales || null,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
    return { message: "Historial clínico agregado con éxito.", success: true, historyId: history.id };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function addHistorialFromObject(historialData: any): Promise<FormState & { updatedData?: any }> {
  const validatedFields = medicalHistorySchema.safeParse(historialData);

  if (!validatedFields.success) {
    return {
      message: "Datos del historial inválidos.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    const history = await prisma.clinicalHistory.create({
      data: {
        patientId: validatedFields.data.ID_Paciente,
        appointmentId: validatedFields.data.ID_Cita || null,
        fechaHistorial: new Date(validatedFields.data.Fecha_Historial),
        diagnostico: validatedFields.data.Diagnostico || null,
        tratamiento: validatedFields.data.Tratamiento_Realizado || null,
        prescripciones: validatedFields.data.Prescripciones || null,
        notas: validatedFields.data.Notas_Adicionales || null,
        costoTratamiento: validatedFields.data.Costo_Tratamiento
          ? Number(validatedFields.data.Costo_Tratamiento)
          : null,
        estadoPago: validatedFields.data.Estado_Pago,
        sexo: validatedFields.data.Sexo || null,
        estadoCivil: validatedFields.data.Estado_Civil || null,
        ocupacion: validatedFields.data.Ocupacion || null,
        escolaridad: validatedFields.data.Escolaridad || null,
        nombrePadre: validatedFields.data.Nombre_Padre || null,
        nombreMadre: validatedFields.data.Nombre_Madre || null,
        telefonoContacto: validatedFields.data.Telefono_Contacto || null,
        motivoConsulta: validatedFields.data.Motivo_Consulta || null,
        antecedentesPersonales: validatedFields.data.Antecedentes_Personales || null,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
    return {
      message: "Historial clínico agregado correctamente.",
      success: true,
      historyId: history.id,
    };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function addEmptyHistorial(patientId: string, appointmentId?: string): Promise<FormState> {
  try {
    const history = await prisma.clinicalHistory.create({
      data: {
        patientId,
        appointmentId: appointmentId || null,
        diagnostico: "Pendiente de completar",
        tratamiento: "Pendiente de completar",
        notas: "Historial creado automáticamente - Pendiente de completar",
        estadoPago: "Pendiente",
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${patientId}`);
    return { message: "Historial clínico creado (pendiente de completar).", success: true, historyId: history.id };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function updateCita(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = appointmentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    await prisma.appointment.update({
      where: { id },
      data: {
        fechaCita: new Date(validatedFields.data.Fecha_Cita),
        horaInicio: validatedFields.data.Hora_Inicio,
        horaFin: validatedFields.data.Hora_Fin,
        motivoCita: validatedFields.data.Motivo_Cita,
        idDoctor: validatedFields.data.ID_Doctor,
        notasCita: validatedFields.data.Notas_Cita || null,
        estadoCita: validatedFields.data.Estado_Cita,
      },
    });

    syncUpdateEvent({
      ID_Cita: id,
      ...validatedFields.data,
    } as any).catch(() => {});

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
    return { message: "Cita actualizada con éxito.", success: true, appointmentId: id };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function deleteCita(id: string, patientId?: string): Promise<DeleteResult> {
  try {
    await prisma.appointment.delete({ where: { id } });

    syncDeleteEvent(id).catch(() => {});

    revalidatePath("/");
    if (patientId) revalidatePath(`/pacientes/${patientId}`);
    return { success: true, message: "Cita eliminada correctamente." };
  } catch (e) {
    return { success: false, message: `Error: ${(e as Error).message}` };
  }
}

const historyFieldMap: Record<string, string> = {
  Diagnostico: "diagnostico",
  Tratamiento_Realizado: "tratamiento",
  Prescripciones: "prescripciones",
  Notas_Adicionales: "notas",
  Costo_Tratamiento: "costoTratamiento",
  Estado_Pago: "estadoPago",
  Sexo: "sexo",
  Estado_Civil: "estadoCivil",
  Ocupacion: "ocupacion",
  Escolaridad: "escolaridad",
  Nombre_Padre: "nombrePadre",
  Nombre_Madre: "nombreMadre",
  Telefono_Contacto: "telefonoContacto",
  Motivo_Consulta: "motivoConsulta",
  Antecedentes_Personales: "antecedentesPersonales",
};

const appointmentFieldMap: Record<string, string> = {
  Fecha_Cita: "fechaCita",
  Hora_Inicio: "horaInicio",
  Hora_Fin: "horaFin",
  Motivo_Cita: "motivoCita",
  ID_Doctor: "idDoctor",
  Notas_Cita: "notasCita",
  Estado_Cita: "estadoCita",
};

export async function updatePatientField(
  recordId: string,
  fieldName: string,
  newValue: string,
  recordType: "history" | "appointment"
): Promise<{ success: boolean; message: string }> {
  try {
    if (recordType === "history") {
      const prismaField = historyFieldMap[fieldName];
      if (!prismaField) return { success: false, message: `Campo desconocido: ${fieldName}` };

      const updateData: any = {};
      updateData[prismaField] =
        fieldName === "Costo_Tratamiento"
          ? Number(newValue)
          : fieldName === "Telefono_Contacto"
            ? String(newValue)
            : newValue;

      await prisma.clinicalHistory.update({
        where: { id: recordId },
        data: updateData,
      });
    } else if (recordType === "appointment") {
      const prismaField = appointmentFieldMap[fieldName];
      if (!prismaField) return { success: false, message: `Campo desconocido: ${fieldName}` };

      const updateData: any = {};
      updateData[prismaField] =
        fieldName === "Fecha_Cita"
          ? new Date(newValue)
          : fieldName === "ID_Doctor"
            ? String(newValue)
            : newValue;

      await prisma.appointment.update({
        where: { id: recordId },
        data: updateData,
      });

      if (fieldName === "Estado_Cita") {
        const appointment = await prisma.appointment.findUnique({
          where: { id: recordId },
        });
        if (appointment) {
          syncUpdateEvent({
            ID_Cita: recordId,
            ID_Paciente: appointment.patientId,
            Fecha_Cita: appointment.fechaCita.toISOString().split("T")[0],
            Hora_Inicio: appointment.horaInicio || "",
            Hora_Fin: appointment.horaFin || "",
            Motivo_Cita: appointment.motivoCita || "",
            Estado_Cita: newValue,
          } as any).catch(() => {});
        }
      }
    }

    return { success: true, message: "Campo actualizado correctamente." };
  } catch (e) {
    return { success: false, message: `Error: ${(e as Error).message}` };
  }
}

export async function updateHistorial(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = medicalHistorySchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    await prisma.clinicalHistory.update({
      where: { id },
      data: {
        fechaHistorial: new Date(validatedFields.data.Fecha_Historial),
        diagnostico: validatedFields.data.Diagnostico || null,
        tratamiento: validatedFields.data.Tratamiento_Realizado || null,
        prescripciones: validatedFields.data.Prescripciones || null,
        notas: validatedFields.data.Notas_Adicionales || null,
        costoTratamiento: validatedFields.data.Costo_Tratamiento
          ? Number(validatedFields.data.Costo_Tratamiento)
          : null,
        estadoPago: validatedFields.data.Estado_Pago,
        sexo: validatedFields.data.Sexo || null,
        estadoCivil: validatedFields.data.Estado_Civil || null,
        ocupacion: validatedFields.data.Ocupacion || null,
        escolaridad: validatedFields.data.Escolaridad || null,
        nombrePadre: validatedFields.data.Nombre_Padre || null,
        nombreMadre: validatedFields.data.Nombre_Madre || null,
        telefonoContacto: validatedFields.data.Telefono_Contacto || null,
        motivoConsulta: validatedFields.data.Motivo_Consulta || null,
        antecedentesPersonales: validatedFields.data.Antecedentes_Personales || null,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
    return { message: "Historial clínico actualizado con éxito.", success: true, historyId: id };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function deleteHistorial(id: string): Promise<DeleteResult> {
  try {
    const history = await prisma.clinicalHistory.findUnique({
      where: { id },
      select: { patientId: true },
    });

    await prisma.clinicalHistory.delete({ where: { id } });

    revalidatePath("/");
    if (history?.patientId) revalidatePath(`/pacientes/${history.patientId}`);
    return { success: true, message: "Historial clínico eliminado correctamente." };
  } catch (e) {
    return { success: false, message: `Error: ${(e as Error).message}` };
  }
}

export async function updateAppointmentField(
  recordId: string,
  fieldName: string,
  newValue: string
): Promise<{ success: boolean; message: string }> {
  return updatePatientField(recordId, fieldName, newValue, "appointment");
}

export async function updateHistoryField(
  recordId: string,
  fieldName: string,
  newValue: string
): Promise<{ success: boolean; message: string }> {
  return updatePatientField(recordId, fieldName, newValue, "history");
}
