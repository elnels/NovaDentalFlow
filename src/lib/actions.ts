"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncCreateEvent, syncUpdateEvent, syncDeleteEvent } from "@/lib/calendar-api";

const hc1Schema = z.object({
  patientId: z.string().min(1),
  nombreOdontologo: z.string().optional().or(z.literal("")),
});

const hc2Schema = z.object({
  patientId: z.string().min(1),
  nombreOdontologo: z.string().optional().or(z.literal("")),
  motivoConsulta: z.string().optional().or(z.literal("")),
  antecedentesPersonales: z.string().optional().or(z.literal("")),
});

export async function saveHc1Odontologo(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = hc1Schema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Datos inválidos.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    await prisma.clinicalDetails.upsert({
      where: { patientId: validatedFields.data.patientId },
      create: {
        patientId: validatedFields.data.patientId,
        nombreOdontologo: validatedFields.data.nombreOdontologo || null,
      },
      update: {
        nombreOdontologo: validatedFields.data.nombreOdontologo || null,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
    return { message: "Datos guardados con éxito.", success: true };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function getFamilyConditions(patientId: string) {
  try {
    return await prisma.familyCondition.findMany({
      where: { patientId },
    });
  } catch {
    return [];
  }
}

const hc3Schema = z.object({
  patientId: z.string().min(1),
  conditions: z.string().optional().or(z.literal("")),
});

export async function saveHc3(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = hc3Schema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Datos inválidos.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  let parsedConditions: any[] = [];
  const rawJson = validatedFields.data.conditions;
  if (rawJson) {
    try {
      parsedConditions = JSON.parse(rawJson);
    } catch {
      return { message: "Error al procesar las condiciones familiares.", success: false };
    }
  }

  try {
    const patientId = validatedFields.data.patientId;

    await prisma.$transaction(async (tx) => {
      await tx.familyCondition.deleteMany({ where: { patientId } });

      for (const c of parsedConditions) {
        if (c.hasCondition) {
          await tx.familyCondition.create({
            data: {
              patientId,
              conditionName: c.conditionName,
              hasCondition: true,
              tipo: c.tipo || null,
              relatives: c.quien || null,
            },
          });
        }
      }
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${patientId}`);
    return { message: "Antecedentes heredo-familiares guardados con éxito.", success: true };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

const hc4Schema = z.object({
  patientId: z.string().min(1),
  hc4Data: z.string().optional().or(z.literal("")),
});

export async function saveHc4(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = hc4Schema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Datos inválidos.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  let parsed: any = {};
  const rawJson = validatedFields.data.hc4Data;
  if (rawJson) {
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return { message: "Error al procesar los datos.", success: false };
    }
  }

  try {
    await prisma.clinicalDetails.upsert({
      where: { patientId: validatedFields.data.patientId },
      create: {
        patientId: validatedFields.data.patientId,
        bajoTratamientoMedico: parsed.bajoTratamientoMedico ?? false,
        motivo: parsed.motivo || null,
        tomaMedicamentos: parsed.tomaMedicamentos ?? false,
        cualesMedicamentos: parsed.cualesMedicamentos || null,
        embarazada: parsed.embarazada ?? false,
        fechaUltimaMenstruacion: parsed.fechaUltimaMenstruacion ? new Date(parsed.fechaUltimaMenstruacion + "T12:00:00.000Z") : null,
        transfusiones: parsed.transfusiones ?? false,
        sangradoExcesivo: parsed.sangradoExcesivo ?? false,
        sangradoTiempo: parsed.sangradoTiempo || null,
        cirugias: parsed.cirugias ?? false,
        cirugiasDetalle: parsed.cirugiasDetalle || null,
        vacunasCompletas: parsed.vacunasCompletas ?? false,
        alergicoMedicamentos: parsed.alergicoMedicamentos ?? false,
        alergicoCual: parsed.alergicoCual || null,
        consumeSustancias: parsed.consumeSustancias ?? false,
        cualesSustancias: parsed.cualesSustancias || null,
        frecuenciaSustancias: parsed.frecuenciaSustancias || null,
        higieneBucal: parsed.higieneBucal ?? false,
        frecuenciaHigiene: parsed.frecuenciaHigiene || null,
      },
      update: {
        bajoTratamientoMedico: parsed.bajoTratamientoMedico ?? false,
        motivo: parsed.motivo || null,
        tomaMedicamentos: parsed.tomaMedicamentos ?? false,
        cualesMedicamentos: parsed.cualesMedicamentos || null,
        embarazada: parsed.embarazada ?? false,
        fechaUltimaMenstruacion: parsed.fechaUltimaMenstruacion ? new Date(parsed.fechaUltimaMenstruacion + "T12:00:00.000Z") : null,
        transfusiones: parsed.transfusiones ?? false,
        sangradoExcesivo: parsed.sangradoExcesivo ?? false,
        sangradoTiempo: parsed.sangradoTiempo || null,
        cirugias: parsed.cirugias ?? false,
        cirugiasDetalle: parsed.cirugiasDetalle || null,
        vacunasCompletas: parsed.vacunasCompletas ?? false,
        alergicoMedicamentos: parsed.alergicoMedicamentos ?? false,
        alergicoCual: parsed.alergicoCual || null,
        consumeSustancias: parsed.consumeSustancias ?? false,
        cualesSustancias: parsed.cualesSustancias || null,
        frecuenciaSustancias: parsed.frecuenciaSustancias || null,
        higieneBucal: parsed.higieneBucal ?? false,
        frecuenciaHigiene: parsed.frecuenciaHigiene || null,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
    return { message: "Antecedentes no patológicos guardados con éxito.", success: true };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

const hc5Schema = z.object({
  patientId: z.string().min(1),
  hc5Data: z.string().optional().or(z.literal("")),
});

export async function saveHc5(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = hc5Schema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Datos inválidos.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  const rawJson = validatedFields.data.hc5Data;

  try {
    await prisma.clinicalDetails.upsert({
      where: { patientId: validatedFields.data.patientId },
      create: {
        patientId: validatedFields.data.patientId,
        observacionesHc5: rawJson || null,
      },
      update: {
        observacionesHc5: rawJson || null,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
    return { message: "Exploración bucal guardada con éxito.", success: true };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

const hc6Schema = z.object({
  patientId: z.string().min(1),
  hc6Data: z.string().optional().or(z.literal("")),
});

export async function saveHc6(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = hc6Schema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Datos inválidos.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  const rawJson = validatedFields.data.hc6Data;

  try {
    const odontogramaData = rawJson ? JSON.parse(rawJson) : null;
    if (!odontogramaData) {
      return { message: "No hay datos de odontograma para guardar.", success: false };
    }

    const existing = await prisma.clinicalHistory.findFirst({
      where: { patientId: validatedFields.data.patientId },
      orderBy: { fechaHistorial: "desc" },
    });

    const odontogramaPayload = {
      permanentTeeth: odontogramaData.teeth,
      temporaryTeeth: odontogramaData.temporaryTeeth,
      lastUpdate: new Date().toISOString(),
    };

    if (existing) {
      await prisma.clinicalHistory.update({
        where: { id: existing.id },
        data: { odontograma: odontogramaPayload },
      });
    } else {
      await prisma.clinicalHistory.create({
        data: {
          patientId: validatedFields.data.patientId,
          diagnostico: "Pendiente de completar",
          tratamiento: "Pendiente de completar",
          notas: "Historial creado desde odontograma",
          estadoPago: "Pendiente",
          odontograma: odontogramaPayload,
        },
      });
    }

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
    return { message: "Odontograma guardado con éxito.", success: true };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function saveHc2(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = hc2Schema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Datos inválidos.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  let parsedConditions: any[] = [];
  const rawJson = validatedFields.data.antecedentesPersonales;
  if (rawJson) {
    try {
      parsedConditions = JSON.parse(rawJson);
    } catch {
      return { message: "Error al procesar los antecedentes personales.", success: false };
    }
  }

  try {
    await prisma.clinicalDetails.upsert({
      where: { patientId: validatedFields.data.patientId },
      create: {
        patientId: validatedFields.data.patientId,
        nombreOdontologo: validatedFields.data.nombreOdontologo || null,
        motivoConsulta: validatedFields.data.motivoConsulta || null,
        antecedentesPersonales: parsedConditions,
      },
      update: {
        nombreOdontologo: validatedFields.data.nombreOdontologo || null,
        motivoConsulta: validatedFields.data.motivoConsulta || null,
        antecedentesPersonales: parsedConditions,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
    return { message: "Antecedentes guardados con éxito.", success: true };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function getPatientById(id: string) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: { orderBy: { fechaCita: "desc" }, take: 1 },
        clinicalHistory: { orderBy: { fechaHistorial: "desc" } },
        clinicalDetails: true,
      },
    });
    if (!patient) return null;
    return JSON.parse(JSON.stringify(patient));
  } catch {
    return null;
  }
}

export async function getProcedureCatalog(includeInactive = false) {
  try {
    const procedures = await prisma.procedureCatalog.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
    });
    return JSON.parse(JSON.stringify(procedures));
  } catch {
    return [];
  }
}

export async function addProcedureCatalogItem(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const schema = z.object({
    code: z.string().min(1, "El código es requerido"),
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional().or(z.literal("")),
    category: z.string().optional().or(z.literal("")),
    defaultPrice: z.string().min(1, "El precio es requerido"),
  });
  const validatedFields = schema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    await prisma.procedureCatalog.create({
      data: {
        code: validatedFields.data.code,
        name: validatedFields.data.name,
        description: validatedFields.data.description || null,
        category: validatedFields.data.category || null,
        defaultPrice: Number(validatedFields.data.defaultPrice),
      },
    });

    revalidatePath("/catalogo-procedimientos");
    return { message: "Procedimiento agregado con éxito.", success: true };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function updateProcedureCatalogItem(
  id: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const schema = z.object({
    code: z.string().min(1, "El código es requerido"),
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional().or(z.literal("")),
    category: z.string().optional().or(z.literal("")),
    defaultPrice: z.string().min(1, "El precio es requerido"),
    isActive: z.string().optional(),
  });
  const validatedFields = schema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    await prisma.procedureCatalog.update({
      where: { id },
      data: {
        code: validatedFields.data.code,
        name: validatedFields.data.name,
        description: validatedFields.data.description || null,
        category: validatedFields.data.category || null,
        defaultPrice: Number(validatedFields.data.defaultPrice),
        isActive: validatedFields.data.isActive === "true",
      },
    });

    revalidatePath("/catalogo-procedimientos");
    return { message: "Procedimiento actualizado con éxito.", success: true };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function deleteProcedureCatalogItem(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.procedureCatalog.delete({ where: { id } });
    revalidatePath("/catalogo-procedimientos");
    return { success: true, message: "Procedimiento eliminado correctamente." };
  } catch (e) {
    return { success: false, message: `Error: ${(e as Error).message}` };
  }
}

const patientSchema = z.object({
  dni: z.string().optional().or(z.literal("")),
  nombres: z.string().min(2, "El nombre es requerido"),
  apellidos: z.string().min(2, "El apellido es requerido"),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválida"),
  telefonoPrincipal: z.string().min(1, "El teléfono principal es requerido").regex(/^[\d\s\-()+]+$/, "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +").refine((val) => { const d = val.replace(/\D/g, ""); return d.length === 10 || (d.startsWith("52") && d.length === 12); }, "Ingrese un número de teléfono mexicano válido (10 dígitos)"),
  telefonoAlternativo: z.string().regex(/^[\d\s\-()+]*$/, "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +").refine((val) => { const d = val.replace(/\D/g, ""); return d === "" || d.length === 10 || (d.startsWith("52") && d.length === 12); }, "Ingrese un número de teléfono mexicano válido (10 dígitos)").optional(),
  email: z.string().email("Email inválido"),
  direccion: z.string().optional().or(z.literal("")),
  sexo: z.enum(["Masculino", "Femenino", "Otro"]).optional(),
  estadoCivil: z.string().optional().or(z.literal("")),
  ocupacion: z.string().optional().or(z.literal("")),
  escolaridad: z.string().optional().or(z.literal("")),
  nombrePadre: z.string().optional().or(z.literal("")),
  nombreMadre: z.string().optional().or(z.literal("")),
  telefonoPadre: z.string().regex(/^[\d\s\-()+]*$/, "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +").refine((val) => { const d = val.replace(/\D/g, ""); return d === "" || d.length === 10 || (d.startsWith("52") && d.length === 12); }, "Ingrese un número de teléfono mexicano válido (10 dígitos)").optional(),
  telefonoMadre: z.string().regex(/^[\d\s\-()+]*$/, "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +").refine((val) => { const d = val.replace(/\D/g, ""); return d === "" || d.length === 10 || (d.startsWith("52") && d.length === 12); }, "Ingrese un número de teléfono mexicano válido (10 dígitos)").optional(),
  esMenor: z.string().optional(),
});

const appointmentSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es requerido"),
  fechaCita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválida"),
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
  fechaHistorial: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválida"),
  diagnostico: z.string().optional().or(z.literal("")),
  tratamiento: z.string().optional().or(z.literal("")),
  prescripciones: z.string().optional().or(z.literal("")),
  notas: z.string().optional().or(z.literal("")),
  costoTratamiento: z.string().optional().or(z.literal("")),
  estadoPago: z.enum(["Pendiente", "Pagado", "Parcial", "Cancelado"], { required_error: "El estado de pago es requerido"}),
  motivoConsulta: z.string().optional().or(z.literal("")),
  procedureLineItems: z.string().optional().or(z.literal("")),
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
    // Check for duplicate: same full name + birth date + phone
    const existing = await prisma.patient.findFirst({
      where: {
        nombres: validatedFields.data.nombres,
        apellidos: validatedFields.data.apellidos,
        fechaNacimiento: new Date(validatedFields.data.fechaNacimiento + "T12:00:00.000Z"),
        telefonoPrincipal: validatedFields.data.telefonoPrincipal,
      },
    });
    if (existing) {
      return { message: "El paciente ya existe. Cargando datos...", success: true, patientId: existing.id };
    }

    const patient = await prisma.patient.create({
      data: {
        dni: validatedFields.data.dni || null,
        nombres: validatedFields.data.nombres,
        apellidos: validatedFields.data.apellidos,
        fechaNacimiento: new Date(validatedFields.data.fechaNacimiento + "T12:00:00.000Z"),
        telefonoPrincipal: validatedFields.data.telefonoPrincipal,
        telefonoAlternativo: validatedFields.data.telefonoAlternativo || null,
        email: validatedFields.data.email,
        direccion: validatedFields.data.direccion || null,
        sexo: validatedFields.data.sexo || null,
        estadoCivil: validatedFields.data.estadoCivil || null,
        ocupacion: validatedFields.data.ocupacion || null,
        escolaridad: validatedFields.data.escolaridad || null,
        nombrePadre: validatedFields.data.nombrePadre || null,
        nombreMadre: validatedFields.data.nombreMadre || null,
        telefonoPadre: validatedFields.data.telefonoPadre || null,
        telefonoMadre: validatedFields.data.telefonoMadre || null,
        esMenor: validatedFields.data.esMenor === "true",
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
        fechaNacimiento: new Date(validatedFields.data.fechaNacimiento + "T12:00:00.000Z"),
        telefonoPrincipal: validatedFields.data.telefonoPrincipal,
        telefonoAlternativo: validatedFields.data.telefonoAlternativo || null,
        email: validatedFields.data.email,
        direccion: validatedFields.data.direccion || null,
        sexo: validatedFields.data.sexo || null,
        estadoCivil: validatedFields.data.estadoCivil || null,
        ocupacion: validatedFields.data.ocupacion || null,
        escolaridad: validatedFields.data.escolaridad || null,
        nombrePadre: validatedFields.data.nombrePadre || null,
        nombreMadre: validatedFields.data.nombreMadre || null,
        telefonoPadre: validatedFields.data.telefonoPadre || null,
        telefonoMadre: validatedFields.data.telefonoMadre || null,
        esMenor: validatedFields.data.esMenor === "true",
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
        fechaCita: new Date(validatedFields.data.fechaCita + "T12:00:00.000Z"),
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
        fechaCita: new Date(validatedFields.data.fechaCita + "T12:00:00.000Z"),
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

  let parsedLineItems: any[] = [];
  const rawLineItems = validatedFields.data.procedureLineItems;
  if (rawLineItems) {
    try {
      parsedLineItems = JSON.parse(rawLineItems);
    } catch {
      return { message: "Error al procesar los procedimientos.", success: false };
    }
  }

  const totalFee = parsedLineItems.reduce(
    (sum: number, item: any) => sum + (Number(item.fee) - Number(item.discount || 0)) * Number(item.quantity || 1),
    0
  );

  try {
    const history = await prisma.clinicalHistory.create({
      data: {
        patientId: validatedFields.data.patientId,
        appointmentId: validatedFields.data.appointmentId || null,
        fechaHistorial: new Date(validatedFields.data.fechaHistorial + "T12:00:00.000Z"),
        diagnostico: validatedFields.data.diagnostico || null,
        tratamiento: validatedFields.data.tratamiento || null,
        prescripciones: validatedFields.data.prescripciones || null,
        notas: validatedFields.data.notas || null,
        costoTratamiento: totalFee > 0 ? totalFee : (validatedFields.data.costoTratamiento ? Number(validatedFields.data.costoTratamiento) : null),
        estadoPago: validatedFields.data.estadoPago,
        motivoConsulta: validatedFields.data.motivoConsulta || null,
        procedureLineItems: parsedLineItems.length > 0
          ? {
              create: parsedLineItems.map((item: any) => ({
                procedureCatalogId: item.procedureCatalogId,
                toothId: item.toothId ? Number(item.toothId) : null,
                quantity: Number(item.quantity || 1),
                fee: Number(item.fee || 0),
                discount: Number(item.discount || 0),
                notes: item.notes || null,
              })),
            }
          : undefined,
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

  let parsedLineItems: any[] = [];
  const rawLineItems = validatedFields.data.procedureLineItems;
  if (rawLineItems) {
    try {
      parsedLineItems = typeof rawLineItems === "string" ? JSON.parse(rawLineItems) : rawLineItems;
    } catch {
      parsedLineItems = [];
    }
  }

  const totalFee = parsedLineItems.reduce(
    (sum: number, item: any) => sum + (Number(item.fee) - Number(item.discount || 0)) * Number(item.quantity || 1),
    0
  );

  try {
    const history = await prisma.clinicalHistory.create({
      data: {
        patientId: validatedFields.data.patientId,
        appointmentId: validatedFields.data.appointmentId || null,
        fechaHistorial: new Date(validatedFields.data.fechaHistorial + "T12:00:00.000Z"),
        diagnostico: validatedFields.data.diagnostico || null,
        tratamiento: validatedFields.data.tratamiento || null,
        prescripciones: validatedFields.data.prescripciones || null,
        notas: validatedFields.data.notas || null,
        costoTratamiento: totalFee > 0 ? totalFee : (validatedFields.data.costoTratamiento ? Number(validatedFields.data.costoTratamiento) : null),
        estadoPago: validatedFields.data.estadoPago,
        motivoConsulta: validatedFields.data.motivoConsulta || null,
        procedureLineItems: parsedLineItems.length > 0
          ? {
              create: parsedLineItems.map((item: any) => ({
                procedureCatalogId: item.procedureCatalogId,
                toothId: item.toothId ? Number(item.toothId) : null,
                quantity: Number(item.quantity || 1),
                fee: Number(item.fee || 0),
                discount: Number(item.discount || 0),
                notes: item.notes || null,
              })),
            }
          : undefined,
      },
    });

    revalidatePath("/");
    revalidatePath(`/pacientes/${validatedFields.data.patientId}`);
    return { message: "Historial clínico agregado con éxito.", success: true, historyId: history.id };
  } catch (e) {
    return { message: `Error: ${(e as Error).message}`, success: false };
  }
}

export async function addEmptyHistorial(patientId: string, appointmentId?: string): Promise<FormState> {
  try {
    const existing = await prisma.clinicalHistory.findFirst({
      where: { patientId },
      orderBy: { fechaHistorial: "desc" },
    });

    if (existing) {
      if (appointmentId) {
        await prisma.clinicalHistory.update({
          where: { id: existing.id },
          data: { appointmentId },
        });
      }
      revalidatePath("/");
      revalidatePath(`/pacientes/${patientId}`);
      return { message: "Historial clínico actualizado con cita.", success: true, historyId: existing.id };
    }

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
        fechaCita: new Date(validatedFields.data.fechaCita + "T12:00:00.000Z"),
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
  Nombre_Padre: "nombrePadre",
  Nombre_Madre: "nombreMadre",
  Motivo_Consulta: "motivoConsulta",
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
          ? new Date(newValue + "T12:00:00.000Z")
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

  let parsedLineItems: any[] = [];
  const rawLineItems = validatedFields.data.procedureLineItems;
  if (rawLineItems) {
    try {
      parsedLineItems = JSON.parse(rawLineItems);
    } catch {
      return { message: "Error al procesar los procedimientos.", success: false };
    }
  }

  const totalFee = parsedLineItems.reduce(
    (sum: number, item: any) => sum + (Number(item.fee) - Number(item.discount || 0)) * Number(item.quantity || 1),
    0
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.clinicalHistory.update({
        where: { id },
        data: {
          fechaHistorial: new Date(validatedFields.data.fechaHistorial + "T12:00:00.000Z"),
          diagnostico: validatedFields.data.diagnostico || null,
          tratamiento: validatedFields.data.tratamiento || null,
          prescripciones: validatedFields.data.prescripciones || null,
          notas: validatedFields.data.notas || null,
          costoTratamiento: totalFee > 0 ? totalFee : (validatedFields.data.costoTratamiento ? Number(validatedFields.data.costoTratamiento) : null),
          estadoPago: validatedFields.data.estadoPago,
          motivoConsulta: validatedFields.data.motivoConsulta || null,
        },
      });

      if (parsedLineItems.length > 0) {
        await tx.procedureLineItem.deleteMany({ where: { clinicalHistoryId: id } });
        await tx.procedureLineItem.createMany({
          data: parsedLineItems.map((item: any) => ({
            clinicalHistoryId: id,
            procedureCatalogId: item.procedureCatalogId,
            toothId: item.toothId ? Number(item.toothId) : null,
            quantity: Number(item.quantity || 1),
            fee: Number(item.fee || 0),
            discount: Number(item.discount || 0),
            notes: item.notes || null,
          })),
        });
      }
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
