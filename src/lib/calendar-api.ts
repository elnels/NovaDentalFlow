import { google } from "googleapis";
import type { Appointment } from "@/types";
import { prisma } from "@/lib/db";

const CALENDAR_ID = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;
const TIMEZONE = process.env.TIMEZONE || "America/Mexico_City";
const SYNC_MARKER = "DentalFlow|";

let calendarClient: ReturnType<typeof google.calendar> | null = null;

function getCalendarId(): string {
  if (!CALENDAR_ID) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CALENDAR_ID no está configurado");
  }
  return CALENDAR_ID;
}

function initCalendar() {
  if (calendarClient) return calendarClient;

  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  calendarClient = google.calendar({ version: "v3", auth });
  return calendarClient;
}

async function getPatientName(patientId: string): Promise<string> {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { nombres: true, apellidos: true },
    });
    if (patient) return `${patient.nombres} ${patient.apellidos}`;
  } catch {
    console.error("Error fetching patient name for calendar sync");
  }
  return "Paciente";
}

function buildAppointmentMarker(appointmentId: string): string {
  return `${SYNC_MARKER}${appointmentId}|`;
}

function parseEventSummary(
  appointment: Appointment,
  patientName: string
): string {
  return `${patientName} — ${appointment.Motivo_Cita}`;
}

function parseEventDescription(
  appointment: Appointment,
  patientName: string
): string {
  const marker = buildAppointmentMarker(appointment.ID_Cita);
  return `${marker}\nPaciente: ${patientName}\nTeléfono: ${appointment.Notas_Cita || ""}\nDoctor: ${appointment.ID_Doctor}\nEstado: ${appointment.Estado_Cita}`;
}

function buildEventTime(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00`;
}

const TRACKED_STATUSES = new Set([
  "Programada",
  "Confirmada",
  "Cancelada",
]);

export function isStatusTracked(status: string): boolean {
  return TRACKED_STATUSES.has(status);
}

export async function createCalendarEvent(
  appointment: Appointment,
  patientName: string
): Promise<string | null> {
  try {
    const calendar = initCalendar();
    const calendarId = getCalendarId();

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: parseEventSummary(appointment, patientName),
        description: parseEventDescription(appointment, patientName),
        start: {
          dateTime: buildEventTime(appointment.Fecha_Cita, appointment.Hora_Inicio),
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: buildEventTime(appointment.Fecha_Cita, appointment.Hora_Fin),
          timeZone: TIMEZONE,
        },
        status: "confirmed",
      },
    });

    return response.data.id || null;
  } catch (error) {
    console.error("Error creando evento en Google Calendar:", error);
    return null;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  appointment: Appointment,
  patientName: string
): Promise<boolean> {
  try {
    const calendar = initCalendar();
    const calendarId = getCalendarId();

    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: parseEventSummary(appointment, patientName),
        description: parseEventDescription(appointment, patientName),
        start: {
          dateTime: buildEventTime(appointment.Fecha_Cita, appointment.Hora_Inicio),
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: buildEventTime(appointment.Fecha_Cita, appointment.Hora_Fin),
          timeZone: TIMEZONE,
        },
        status: appointment.Estado_Cita === "Cancelada" ? "cancelled" : "confirmed",
      },
    });

    return true;
  } catch (error) {
    console.error("Error actualizando evento en Google Calendar:", error);
    return false;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const calendar = initCalendar();
    const calendarId = getCalendarId();

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return true;
  } catch (error) {
    console.error("Error eliminando evento en Google Calendar:", error);
    return false;
  }
}

export async function findEventByAppointmentId(
  appointmentId: string
): Promise<string | null> {
  try {
    const calendar = initCalendar();
    const calendarId = getCalendarId();
    const marker = buildAppointmentMarker(appointmentId);

    const response = await calendar.events.list({
      calendarId,
      q: marker,
      maxResults: 1,
    });

    const event = response.data.items?.[0];
    return event?.id || null;
  } catch (error) {
    console.error("Error buscando evento en Google Calendar:", error);
    return null;
  }
}

export async function syncCreateEvent(
  appointment: Appointment
): Promise<void> {
  if (!isStatusTracked(appointment.Estado_Cita)) return;
  const patientName = await getPatientName(appointment.ID_Paciente);
  await createCalendarEvent(appointment, patientName);
}

export async function syncUpdateEvent(
  appointment: Appointment
): Promise<void> {
  const patientName = await getPatientName(appointment.ID_Paciente);
  const eventId = await findEventByAppointmentId(appointment.ID_Cita);

  if (eventId && appointment.Estado_Cita === "Cancelada") {
    await updateCalendarEvent(eventId, appointment, patientName);
  } else if (eventId) {
    await updateCalendarEvent(eventId, appointment, patientName);
  } else if (isStatusTracked(appointment.Estado_Cita)) {
    await createCalendarEvent(appointment, patientName);
  }
}

export async function syncDeleteEvent(appointmentId: string): Promise<void> {
  const eventId = await findEventByAppointmentId(appointmentId);
  if (eventId) {
    await deleteCalendarEvent(eventId);
  }
}
