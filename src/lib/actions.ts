"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncCreateEvent, syncUpdateEvent, syncDeleteEvent } from "@/lib/calendar-api";

const patientSchema = z.object({
  dni: z.string().optional().or(z.literal("")),
  nombres: z.string().min(2, "El nombre es requerido"),
  apellidos: z.string().min(2, "El apellido es requerido"),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  telefonoPrincipal: z.string().min(7, "El teléfono principal es requerido"),
  telefonoAlternativo: z.string().optional(),
  email: z.string().email("Email inválido"),
  direccion: z.string().optional().or(z.literal("")),
  genero: z.enum(["Masculino", "Femenino", "Otro"], { required_error: "El género es requerido"}),
});

const appointmentSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  fechaCita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  motivoCita: z.string().min(1, "El motivo de la cita es requerido"),
  estadoCita: z.enum(["Programada", "Confirmada", "En Proceso", "Completada", "Cancelada"], { required_error: "El estado es requerido"}),
  notasCita: z.string().optional(),
  idDoctor: z.string().min(1, "El ID del doctor es requerido"),
});

const medicalHistorySchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  appointmentId: z.string().optional().or(z.literal("")),
  fechaHistorial: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  diagnostico: z.string().optional().or(z.literal("")),
  tratamiento: z.string().optional().or(z.literal("")),
  prescripciones: z.string().optional().or(z.literal("")),
  notas: z.string().optional().or(z.literal("")),
  costoTratamiento: z.string().optional().or(z.literal("")),
  estadoPago: z.enum(["Pendiente", "Pagado", "Parcial", "Cancelado"], { required_error: "El estado de pago es requerido"}),
  sexo: z.enum(["Masculino", "Femenino"]).optional().or(z.literal("")),
  estadoCivil: z.string().optional().or(z.literal("")),
  ocupacion: z.string().optional().or(z.literal("")),
  escolaridad: z.string().optional().or(z.literal("")),
  nombrePadre: z.string().optional().or(z.literal("")),
  nombreMadre: z.string().optional().or(z.literal("")),
  telefonoContacto: z.string().optional().or(z.literal("")),
  motivoConsulta: z.string().optional().or(z.literal("")),
  antecedentesPersonales: z.string().optional().or(z.literal("")),
});

export type FormState = {
  message: string;
  errors?: Record<string, string>;
  success: boolean;
  patientId?: string;
  appointmentId?: string;
  historyId?: string;
};

type PatientFormFields = z.infer<typeof patientSchema>;
type AppointmentFormFields = z.infer<typeof appointmentSchema>;

export async function addPatient(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = patientSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as unknown as Record<keyof PatientFormFields, string>,
      success: false,
    };
  }

  try {
    const patient = await prisma.patient.create({
      data: {
        dni: validatedFields.data.dni || null,
        nombres: validatedFields.data.nombres,
        apellidos: validatedFields.data.apellidos,
        fechaNacimiento: new Date(validatedFields.data.fechaNacimiento),
        telefonoPrincipal: validatedFields.data.telefonoPrincipal,
        telefonoAlternativo: validatedFields.data.telefonoAlternativo || null,
        email: validatedFields.data.email,
        direccion: validatedFields.data.direccion || null,
        genero: validatedFields.data.genero,
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
      errors: validatedFields.error.flatten().fieldErrors as unknown as Record<keyof PatientFormFields, string>,
      success: false,
    };
  }

  try {
    await prisma.patient.update({
      where: { id },
      data: {
        dni: validatedFields.data.dni || null,
        nombres: validatedFields.data.nombres,
        apellidos: validatedFields.data.apellidos,
        fechaNacimiento: new Date(validatedFields.data.fechaNacimiento),
        telefonoPrincipal: validatedFields.data.telefonoPrincipal,
        telefonoAlternativo: validatedFields.data.telefonoAlternativo || null,
        email: validatedFields.data.email,
        direccion: validatedFields.data.direccion || null,
        genero: validatedFields.data.genero,
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
        patientId: validatedFields.data.patientId,
        fechaCita: new Date(validatedFields.data.fechaCita),
        horaInicio: validatedFields.data.horaInicio,
        horaFin: validatedFields.data.horaFin,
        motivoCita: validatedFields.data.motivoCita,
        idDoctor: validatedFields.data.idDoctor,
        notasCita: validatedFields.data.notasCita || null,
        estadoCita: validatedFields.data.estadoCita,
      },
    });

    syncCreateEvent({
      id: appointment.id,
      patientId: validatedFields.data.patientId,
      fechaCita: validatedFields.data.fechaCita,
      horaInicio: validatedFields.data.horaInicio,
      horaFin: validatedFields.data.horaFin,
      motivoCita: validatedFields.data.motivoCita,
      notasCita: validatedFields.data.notasCita || "",
      idDoctor: validatedFields.data.idDoctor,
      estadoCita: validatedFields.data.estadoCita,
    } as any).catch((err) => console.error("Calendar sync error:", err));

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
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
        patientId: validatedFields.data.patientId,
        fechaCita: new Date(validatedFields.data.fechaCita),
        horaInicio: validatedFields.data.horaInicio,
        horaFin: validatedFields.data.horaFin,
        motivoCita: validatedFields.data.motivoCita,
        idDoctor: validatedFields.data.idDoctor,
        notasCita: validatedFields.data.notasCita || null,
        estadoCita: validatedFields.data.estadoCita,
      },
    });

    syncCreateEvent({
      id: appointment.id,
      patientId: validatedFields.data.patientId,
      fechaCita: validatedFields.data.fechaCita,
      horaInicio: validatedFields.data.horaInicio,
      horaFin: validatedFields.data.horaFin,
      motivoCita: validatedFields.data.motivoCita,
      notasCita: validatedFields.data.notasCita || "",
      idDoctor: validatedFields.data.idDoctor,
      estadoCita: validatedFields.data.estadoCita,
    } as any).catch((err) => console.error("Calendar sync error:", err));

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
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
        patientId: validatedFields.data.patientId,
        appointmentId: validatedFields.data.appointmentId || null,
        fechaHistorial: new Date(validatedFields.data.fechaHistorial),
        diagnostico: validatedFields.data.diagnostico || null,
        tratamiento: validatedFields.data.tratamiento || null,
        prescripciones: validatedFields.data.prescripciones || null,
        notas: validatedFields.data.notas || null,
        costoTratamiento: validatedFields.data.costoTratamiento
          ? Number(validatedFields.data.costoTratamiento)
          : null,
        estadoPago: validatedFields.data.estadoPago,
        sexo: validatedFields.data.sexo || null,
        estadoCivil: validatedFields.data.estadoCivil || null,
        ocupacion: validatedFields.data.ocupacion || null,
        escolaridad: validatedFields.data.escolaridad || null,
        nombrePadre: validatedFields.data.nombrePadre || null,
        nombreMadre: validatedFields.data.nombreMadre || null,
        telefonoContacto: validatedFields.data.telefonoContacto || null,
        motivoConsulta: validatedFields.data.motivoConsulta || null,
        antecedentesPersonales: validatedFields.data.antecedentesPersonales || null,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
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
        patientId: validatedFields.data.patientId,
        appointmentId: validatedFields.data.appointmentId || null,
        fechaHistorial: new Date(validatedFields.data.fechaHistorial),
        diagnostico: validatedFields.data.diagnostico || null,
        tratamiento: validatedFields.data.tratamiento || null,
        prescripciones: validatedFields.data.prescripciones || null,
        notas: validatedFields.data.notas || null,
        costoTratamiento: validatedFields.data.costoTratamiento
          ? Number(validatedFields.data.costoTratamiento)
          : null,
        estadoPago: validatedFields.data.estadoPago,
        sexo: validatedFields.data.sexo || null,
        estadoCivil: validatedFields.data.estadoCivil || null,
        ocupacion: validatedFields.data.ocupacion || null,
        escolaridad: validatedFields.data.escolaridad || null,
        nombrePadre: validatedFields.data.nombrePadre || null,
        nombreMadre: validatedFields.data.nombreMadre || null,
        telefonoContacto: validatedFields.data.telefonoContacto || null,
        motivoConsulta: validatedFields.data.motivoConsulta || null,
        antecedentesPersonales: validatedFields.data.antecedentesPersonales || null,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
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
        fechaCita: new Date(validatedFields.data.fechaCita),
        horaInicio: validatedFields.data.horaInicio,
        horaFin: validatedFields.data.horaFin,
        motivoCita: validatedFields.data.motivoCita,
        idDoctor: validatedFields.data.idDoctor,
        notasCita: validatedFields.data.notasCita || null,
        estadoCita: validatedFields.data.estadoCita,
      },
    });

    syncUpdateEvent({
      id,
      patientId: validatedFields.data.patientId,
      fechaCita: validatedFields.data.fechaCita,
      horaInicio: validatedFields.data.horaInicio,
      horaFin: validatedFields.data.horaFin,
      motivoCita: validatedFields.data.motivoCita,
      idDoctor: validatedFields.data.idDoctor,
      notasCita: validatedFields.data.notasCita || "",
      estadoCita: validatedFields.data.estadoCita,
    } as any).catch(() => {});

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
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
        const appt = await prisma.appointment.findUnique({
          where: { id: recordId },
        });
        if (appt) {
          syncUpdateEvent({
            id: recordId,
            patientId: appt.patientId,
            fechaCita: appt.fechaCita.toISOString().split("T")[0],
            horaInicio: appt.horaInicio || "",
            horaFin: appt.horaFin || "",
            motivoCita: appt.motivoCita || "",
            notasCita: appt.notasCita || "",
            idDoctor: appt.idDoctor || "",
            estadoCita: newValue,
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
        fechaHistorial: new Date(validatedFields.data.fechaHistorial),
        diagnostico: validatedFields.data.diagnostico || null,
        tratamiento: validatedFields.data.tratamiento || null,
        prescripciones: validatedFields.data.prescripciones || null,
        notas: validatedFields.data.notas || null,
        costoTratamiento: validatedFields.data.costoTratamiento
          ? Number(validatedFields.data.costoTratamiento)
          : null,
        estadoPago: validatedFields.data.estadoPago,
        sexo: validatedFields.data.sexo || null,
        estadoCivil: validatedFields.data.estadoCivil || null,
        ocupacion: validatedFields.data.ocupacion || null,
        escolaridad: validatedFields.data.escolaridad || null,
        nombrePadre: validatedFields.data.nombrePadre || null,
        nombreMadre: validatedFields.data.nombreMadre || null,
        telefonoContacto: validatedFields.data.telefonoContacto || null,
        motivoConsulta: validatedFields.data.motivoConsulta || null,
        antecedentesPersonales: validatedFields.data.antecedentesPersonales || null,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
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
