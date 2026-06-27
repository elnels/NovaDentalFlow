"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PatientFormData } from "@/types";
import { syncCreateEvent, syncUpdateEvent, syncDeleteEvent } from "@/lib/calendar-api";

// Usar el proxy interno en lugar de la URL directa
const API_URL = '/api/proxy';
const IS_CLIENT = typeof window !== 'undefined';

// Función para obtener la URL base correcta
function getBaseUrl() {
  if (IS_CLIENT) {
    return window.location.origin;
  }
  
  // En el servidor, usar la URL de Vercel si está disponible
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // En desarrollo local - usar el puerto correcto
  return 'http://localhost:9004';
}

const FULL_API_URL = IS_CLIENT ? API_URL : `${getBaseUrl()}${API_URL}`;

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
  Sexo: z.enum(["Masculino", "Femenino"], { required_error: "El sexo es requerido" }),
  Estado_Civil: z.enum(["Casado", "Soltero", "Otro"], { required_error: "El estado civil es requerido" }),
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

async function postToActionAPI(action: string, data: any): Promise<any> {
    console.log('Sending action to API:', {
        action,
        dataKeys: Object.keys(data || {}),
        timestamp: new Date().toISOString()
    });
    
    const response = await fetch(FULL_API_URL, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ action, data }),
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('API success response:', {
        status: result.status,
        hasData: !!result.data
    });
    
    return result;
}

export async function addPatient(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = patientSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as Record<keyof PatientFormData, string>,
      success: false,
    };
  }

  try {
    // Formatear números de teléfono con comilla simple al inicio para Google Sheets
    const formattedData = {
      ...validatedFields.data,
      Telefono_Principal: `'${validatedFields.data.Telefono_Principal}`,
      Telefono_Alternativo: validatedFields.data.Telefono_Alternativo ? `'${validatedFields.data.Telefono_Alternativo}` : "",
    };
    
    const dataWithDefaults = {
      ...formattedData,
      Fecha_Registro: new Date().toISOString().split('T')[0],
      Estado: "Activo",
    }
    const result = await postToActionAPI("addPaciente", dataWithDefaults);

    if (result.status === "success") {
      revalidatePath("/");
      return { message: "Paciente agregado con éxito.", success: true, patientId: result.data.ID_Paciente };
    } else {
      return { message: result.message || "Error al agregar el paciente.", success: false };
    }
  } catch (e) {
    const error = e as Error;
    return { message: `Error de red: ${error.message}`, success: false };
  }
}

export async function updatePatient(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = patientSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            message: "Por favor, corrija los errores en el formulario.",
            errors: validatedFields.error.flatten().fieldErrors as Record<keyof PatientFormData, string>,
            success: false,
        };
    }

    try {
        // Formatear números de teléfono con comilla simple al inicio para Google Sheets
        const formattedData = {
            ...validatedFields.data,
            Telefono_Principal: `'${validatedFields.data.Telefono_Principal}`,
            Telefono_Alternativo: validatedFields.data.Telefono_Alternativo ? `'${validatedFields.data.Telefono_Alternativo}` : "",
        };
        
        const dataToUpdate = { ...formattedData, ID_Paciente: id };
        const result = await postToActionAPI("updatePaciente", dataToUpdate);

        if (result.status === "success") {
            revalidatePath(`/pacientes/${id}`);
            revalidatePath("/");
            return { message: "Paciente actualizado con éxito.", success: true, patientId: id };
        } else {
            return { message: result.message || "Error al actualizar el paciente.", success: false };
        }
    } catch (e) {
        const error = e as Error;
        return { message: `Error de red: ${error.message}`, success: false };
    }
}

type DeleteResult = {
    success: boolean;
    message: string;
}

export async function deletePatient(id: string): Promise<DeleteResult> {
    try {
        const result = await postToActionAPI("deletePaciente", { ID_Paciente: id });

        if (result.status === "success") {
            revalidatePath("/");
            return { success: true, message: "Paciente eliminado correctamente." };
        } else {
            return { success: false, message: result.message || "Error al eliminar el paciente." };
        }
    } catch (e) {
        const error = e as Error;
        return { success: false, message: `Error de red: ${error.message}` };
    }
}

export async function deletePaciente(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(FULL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        action: 'deletePaciente',
        id
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      revalidatePath('/');
      return { success: true, message: 'Paciente eliminado correctamente.' };
    } else {
      return { success: false, message: result.message || 'Error al eliminar el paciente.' };
    }
  } catch (e) {
    const error = e as Error;
    return { success: false, message: `Error de red: ${error.message}` };
  }
}

export async function addCita(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = appointmentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error('Validation error for addCita:', validatedFields.error.flatten().fieldErrors);
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    console.log('Adding cita with data:', validatedFields.data);
    const result = await postToActionAPI("addCita", validatedFields.data);

    if (result.status === "success") {
      console.log('Cita created successfully, revalidating paths');
      console.log('addCita API response data:', result.data);
      const appointmentId = result.data?.ID_Cita || result.data?.appointmentId;
      if (appointmentId) {
        console.log('Syncing new cita to calendar:', appointmentId);
        syncCreateEvent({
          ID_Cita: appointmentId,
          ...validatedFields.data,
        } as any).catch((err) => console.error('Calendar sync error:', err));
      } else {
        console.warn('No appointmentId found in response, skipping calendar sync');
      }
      revalidatePath("/");
      revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
      return {
        message: "Cita programada correctamente.",
        success: true,
        appointmentId,
      };
    } else {
      console.error('Error creating cita:', result.message);
      return {
        message: result.message || "Error al programar la cita.",
        success: false,
      };
    }
  } catch (e) {
    const error = e as Error;
    console.error('Exception in addCita:', error);
    return {
      message: `Error de conexión: ${error.message}`,
      success: false,
    };
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
    const result = await postToActionAPI("addCita", validatedFields.data);

    if (result.status === "success") {
      console.log('addCitaFromObject API response data:', result.data);
      const appointmentId = result.data?.ID_Cita || result.data?.appointmentId;
      if (appointmentId) {
        console.log('Syncing new cita to calendar:', appointmentId);
        syncCreateEvent({
          ID_Cita: appointmentId,
          ...validatedFields.data,
        } as any).catch((err) => console.error('Calendar sync error:', err));
      } else {
        console.warn('No appointmentId found in response, skipping calendar sync');
      }
      revalidatePath("/");
      revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
      return {
        message: "Cita programada correctamente.",
        success: true,
        appointmentId,
      };
    } else {
      return {
        message: result.message || "Error al programar la cita.",
        success: false,
      };
    }
  } catch (e) {
    const error = e as Error;
    return {
      message: `Error de red: ${error.message}`,
      success: false,
    };
  }
 }

export async function addHistorial(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = medicalHistorySchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error('Validation error for addHistorial:', validatedFields.error.flatten().fieldErrors);
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    console.log('Adding historial with data:', validatedFields.data);
    const result = await postToActionAPI("addHistorial", validatedFields.data);

    if (result.status === "success") {
      console.log('Historial created successfully, revalidating paths');
      revalidatePath("/");
      revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
      return { message: "Historial clínico agregado con éxito.", success: true, historyId: result.data.historyId || result.data.ID_Historial };
    } else {
      console.error('Error creating historial:', result.message);
      return { message: result.message || "Error al agregar el historial clínico.", success: false };
    }
  } catch (e) {
    const error = e as Error;
    console.error('Exception in addHistorial:', error);
    return { message: `Error de conexión: ${error.message}`, success: false };
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
    const result = await postToActionAPI("addHistorial", validatedFields.data);

    if (result.status === "success") {
      revalidatePath("/");
      revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
      return {
        message: "Historial clínico agregado correctamente.",
        success: true,
        historyId: result.data?.historyId || result.data?.ID_Historial,
        updatedData: result.data?.updatedData, // Incluir los datos actualizados del backend
      };
    } else {
      return {
        message: result.message || "Error al agregar el historial clínico.",
        success: false,
      };
    }
  } catch (e) {
    const error = e as Error;
    return { message: `Error de red: ${error.message}`, success: false };
  }
}

export async function addEmptyHistorial(patientId: string, appointmentId?: string): Promise<FormState> {
  const emptyHistoryData = {
    ID_Paciente: patientId,
    ID_Cita: appointmentId || "",
    Fecha_Historial: new Date().toISOString().split('T')[0], // Fecha actual
    Diagnostico: "Pendiente de completar",
    Tratamiento_Realizado: "Pendiente de completar",
    Prescripciones: "",
    Notas_Adicionales: "Historial creado automáticamente - Pendiente de completar",
    Costo_Tratamiento: "0",
    Estado_Pago: "Pendiente" as const,
  };

  try {
    const result = await postToActionAPI("addHistorial", emptyHistoryData);

    if (result.status === "success") {
      revalidatePath("/");
      revalidatePath(`/pacientes/${patientId}`);
      return { message: "Historial clínico creado (pendiente de completar).", success: true, historyId: result.data.historyId || result.data.ID_Historial };
    } else {
      return { message: result.message || "Error al crear el historial clínico.", success: false };
    }
  } catch (e) {
    const error = e as Error;
    return { message: `Error de red: ${error.message}`, success: false };
  }
}

export async function updateCita(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  console.log('updateCita - Raw form data:', rawData);
  console.log('updateCita - Appointment ID:', id);
  
  const validatedFields = appointmentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.log('updateCita - Validation errors:', validatedFields.error.flatten().fieldErrors);
    return {
      message: "Por favor, corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string>,
      success: false,
    };
  }

  try {
    const dataToUpdate = { ...validatedFields.data, ID_Cita: id };
    console.log('updateCita - Data to update:', dataToUpdate);
    
    const result = await postToActionAPI("updateCita", dataToUpdate);
    console.log('updateCita - API response:', result);

    if (result.status === "success") {
      syncUpdateEvent({
        ID_Cita: id,
        ...validatedFields.data,
      } as any).catch(() => {});
      revalidatePath("/");
      revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
      return { message: "Cita actualizada con éxito.", success: true, appointmentId: id };
    } else {
      console.log('updateCita - API returned error:', result);
      return { message: result.message || "Error al actualizar la cita.", success: false };
    }
  } catch (e) {
    const error = e as Error;
    console.log('updateCita - Network error:', error);
    return { message: `Error de red: ${error.message}`, success: false };
  }
}

export async function deleteCita(id: string, patientId?: string): Promise<DeleteResult> {
  try {
    const result = await postToActionAPI("deleteCita", { ID_Cita: id });

    if (result.status === "success") {
      syncDeleteEvent(id).catch(() => {});
      revalidatePath("/");
      if (patientId) {
        revalidatePath(`/pacientes/${patientId}`);
      }
      return { success: true, message: "Cita eliminada correctamente." };
    } else {
      return { success: false, message: result.message || "Error al eliminar la cita." };
    }
  } catch (e) {
    const error = e as Error;
    return { success: false, message: `Error de red: ${error.message}` };
  }
}

// --- FUNCIÓN PARA ACTUALIZAR CAMPOS INDIVIDUALES ---
export async function updatePatientField(
  recordId: string, 
  fieldName: string, 
  newValue: string, 
  recordType: 'history' | 'appointment'
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await postToActionAPI('updateField', {
      recordId,
      fieldName,
      newValue,
      recordType
    });

    if (result.status === "success") {
      if (fieldName === 'Estado_Cita' && recordType === 'appointment') {
        postToActionAPI('getCitaById', { ID_Cita: recordId })
          .then(appt => {
            if (appt?.data) {
              syncUpdateEvent({ ...appt.data, Estado_Cita: newValue });
            }
          })
          .catch(() => {});
      }
      return { success: true, message: "Campo actualizado correctamente." };
    } else {
      return { success: false, message: result.message || "Error al actualizar el campo." };
    }
  } catch (e) {
    const error = e as Error;
    return { success: false, message: `Error de red: ${error.message}` };
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
    const dataToUpdate = { ...validatedFields.data, ID_Historial: id };
    const result = await postToActionAPI("updateHistorial", dataToUpdate);

    if (result.status === "success") {
      revalidatePath("/");
      revalidatePath(`/pacientes/${validatedFields.data.ID_Paciente}`);
      return { message: "Historial clínico actualizado con éxito.", success: true, historyId: id };
    } else {
      return { message: result.message || "Error al actualizar el historial clínico.", success: false };
    }
  } catch (e) {
    const error = e as Error;
    return { message: `Error de red: ${error.message}`, success: false };
  }
}

export async function deleteHistorial(id: string): Promise<DeleteResult> {
  try {
    // Primero obtener el historial para conocer el ID del paciente
    const historialData = await postToActionAPI("getHistorialById", { ID_Historial: id });
    const patientId = historialData?.data?.ID_Paciente;
    
    const result = await postToActionAPI("deleteHistorial", { ID_Historial: id });

    if (result.status === "success") {
      revalidatePath("/");
      if (patientId) {
        revalidatePath(`/pacientes/${patientId}`);
      }
      return { success: true, message: "Historial clínico eliminado correctamente." };
    } else {
      return { success: false, message: result.message || "Error al eliminar el historial clínico." };
    }
  } catch (e) {
    const error = e as Error;
    return { success: false, message: `Error de red: ${error.message}` };
  }
}
