import { google } from "googleapis";
import { prisma } from "@/lib/db";

interface CalendarAppointment {
  id: string;
  patientId: string;
  fechaCita: string;
  horaInicio: string;
  horaFin: string;
  motivoCita: string;
  notasCita: string;
  idDoctor: string;
  estadoCita: string;
}

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
  appointment: CalendarAppointment,
  patientName: string
): string {
  return `${patientName} — ${appointment.motivoCita}`;
}

function parseEventDescription(
  appointment: CalendarAppointment,
  patientName: string
): string {
  const marker = buildAppointmentMarker(appointment.id);
  return `${marker}\nPaciente: ${patientName}\nTeléfono: ${appointment.notasCita || ""}\nDoctor: ${appointment.idDoctor}\nEstado: ${appointment.estadoCita}`;
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
  appointment: CalendarAppointment,
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
          dateTime: buildEventTime(appointment.fechaCita, appointment.horaInicio),
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: buildEventTime(appointment.fechaCita, appointment.horaFin),
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
  appointment: CalendarAppointment,
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
          dateTime: buildEventTime(appointment.fechaCita, appointment.horaInicio),
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: buildEventTime(appointment.fechaCita, appointment.horaFin),
          timeZone: TIMEZONE,
        },
        status: appointment.estadoCita === "Cancelada" ? "cancelled" : "confirmed",
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
  appointment: CalendarAppointment
): Promise<void> {
  if (!isStatusTracked(appointment.estadoCita)) return;
  const patientName = await getPatientName(appointment.patientId);
  await createCalendarEvent(appointment, patientName);
}

export async function syncUpdateEvent(
  appointment: CalendarAppointment
): Promise<void> {
  const patientName = await getPatientName(appointment.patientId);
  const eventId = await findEventByAppointmentId(appointment.id);

  if (eventId && appointment.estadoCita === "Cancelada") {
    await updateCalendarEvent(eventId, appointment, patientName);
  } else if (eventId) {
    await updateCalendarEvent(eventId, appointment, patientName);
  } else if (isStatusTracked(appointment.estadoCita)) {
    await createCalendarEvent(appointment, patientName);
  }
}

export async function syncDeleteEvent(appointmentId: string): Promise<void> {
  const eventId = await findEventByAppointmentId(appointmentId);
  if (eventId) {
    await deleteCalendarEvent(eventId);
  }
}
