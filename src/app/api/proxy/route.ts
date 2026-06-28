import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncUpdateEvent } from "@/lib/calendar-api";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

function ok(data: unknown) {
  return NextResponse.json({ status: "success", data }, { headers: corsHeaders });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ status: "error", message }, { status, headers: corsHeaders });
}

function patientToOld(p: any) {
  return {
    ID_Paciente: p.id,
    DNI: p.dni || "",
    Nombres: p.nombres,
    Apellidos: p.apellidos,
    Fecha_Nacimiento: p.fechaNacimiento
      ? p.fechaNacimiento.toISOString().split("T")[0]
      : "",
    Edad: p.fechaNacimiento
      ? Math.floor(
          (Date.now() - new Date(p.fechaNacimiento).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 0,
    Genero: p.genero || "",
    Telefono_Principal: p.telefonoPrincipal || "",
    Telefono_Alternativo: p.telefonoAlternativo || "",
    Email: p.email || "",
    Direccion: p.direccion || "",
    Fecha_Registro: p.fechaRegistro
      ? p.fechaRegistro.toISOString()
      : new Date().toISOString(),
    Estado: p.estado || "Activo",
    Citas: (p.appointments || []).map(appointmentToOld),
    Historial_Clinico: (p.clinicalHistory || []).map(historyToOld),
  };
}

function appointmentToOld(a: any) {
  return {
    ID_Cita: a.id,
    Fecha_Cita: a.fechaCita
      ? a.fechaCita.toISOString().split("T")[0]
      : "",
    Hora_Inicio: a.horaInicio || "",
    Hora_Fin: a.horaFin || "",
    Motivo_Cita: a.motivoCita || "",
    ID_Doctor: a.idDoctor || "",
    Notas_Cita: a.notasCita || "",
    Estado_Cita: a.estadoCita || "Programada",
  };
}

function historyToOld(h: any) {
  return {
    ID_Historial: h.id,
    ID_Paciente: h.patientId,
    ID_Cita: h.appointmentId || "",
    Fecha_Historial: h.fechaHistorial
      ? h.fechaHistorial.toISOString().split("T")[0]
      : "",
    Diagnostico: h.diagnostico || "",
    Tratamiento_Realizado: h.tratamiento || "",
    Prescripciones: h.prescripciones || "",
    Notas_Adicionales: h.notas || "",
    Costo_Tratamiento: h.costoTratamiento ? String(h.costoTratamiento) : "",
    Estado_Pago: h.estadoPago || "",
    Sexo: h.sexo || "",
    Estado_Civil: h.estadoCivil || "",
    Ocupacion: h.ocupacion || "",
    Escolaridad: h.escolaridad || "",
    Nombre_Padre: h.nombrePadre || "",
    Nombre_Madre: h.nombreMadre || "",
    Telefono_Contacto: h.telefonoContacto || "",
    Motivo_Consulta: h.motivoConsulta || "",
    Antecedentes_Personales: h.antecedentesPersonales || "",
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "getPacientesWithAppointments": {
        const patients = await prisma.patient.findMany({
          include: {
            appointments: true,
            clinicalHistory: true,
          },
          orderBy: { fechaRegistro: "desc" },
        });
        return ok(patients.map(patientToOld));
      }

      case "getPacienteById": {
        const id = searchParams.get("id");
        if (!id) return fail("ID del paciente requerido");
        const patient = await prisma.patient.findUnique({
          where: { id },
          include: {
            appointments: true,
            clinicalHistory: true,
          },
        });
        if (!patient) return fail("Paciente no encontrado", 404);
        return ok(patientToOld(patient));
      }

      case "searchPacientes": {
        const query = searchParams.get("query") || "";
        const patients = await prisma.patient.findMany({
          where: {
            OR: [
              { nombres: { contains: query, mode: "insensitive" } },
              { apellidos: { contains: query, mode: "insensitive" } },
              { telefonoPrincipal: { contains: query } },
            ],
          },
          include: { appointments: true },
          orderBy: { fechaRegistro: "desc" },
        });
        return ok(patients.map(patientToOld));
      }

      case "debugHeaders": {
        return ok({
          pacientes_headers: [
            "ID_Paciente",
            "DNI",
            "Nombres",
            "Apellidos",
            "Fecha_Nacimiento",
          ],
          citas_headers: [
            "ID_Cita",
            "ID_Paciente",
            "Fecha_Cita",
            "Hora_Inicio",
            "Hora_Fin",
            "Motivo_Cita",
          ],
          historial_headers: [
            "ID_Historial",
            "ID_Paciente",
            "ID_Cita",
            "Fecha_Historial",
            "Diagnostico",
          ],
        });
      }

      case "debugData": {
        const count = await prisma.patient.count();
        return ok({ message: `PostgreSQL connected. ${count} patients.` });
      }

      default:
        return fail(`Acción desconocida: ${action}`);
    }
  } catch (error) {
    console.error("Proxy GET error:", error);
    return fail(
      error instanceof Error ? error.message : "Error interno del servidor",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "addPaciente": {
        const patient = await prisma.patient.create({
          data: {
            dni: data.DNI || null,
            nombres: data.Nombres,
            apellidos: data.Apellidos,
            fechaNacimiento: data.Fecha_Nacimiento
              ? new Date(data.Fecha_Nacimiento)
              : null,
            telefonoPrincipal: data.Telefono_Principal
              ? String(data.Telefono_Principal).replace(/^'/, "")
              : null,
            telefonoAlternativo: data.Telefono_Alternativo
              ? String(data.Telefono_Alternativo).replace(/^'/, "")
              : null,
            email: data.Email || null,
            direccion: data.Direccion || null,
            genero: data.Genero || null,
          },
        });
        return ok({ ID_Paciente: patient.id });
      }

      case "updatePaciente": {
        const patient = await prisma.patient.update({
          where: { id: data.ID_Paciente },
          data: {
            dni: data.DNI || null,
            nombres: data.Nombres,
            apellidos: data.Apellidos,
            fechaNacimiento: data.Fecha_Nacimiento
              ? new Date(data.Fecha_Nacimiento)
              : null,
            telefonoPrincipal: data.Telefono_Principal
              ? String(data.Telefono_Principal).replace(/^'/, "")
              : null,
            telefonoAlternativo: data.Telefono_Alternativo
              ? String(data.Telefono_Alternativo).replace(/^'/, "")
              : null,
            email: data.Email || null,
            direccion: data.Direccion || null,
            genero: data.Genero || null,
          },
        });
        return ok({ ID_Paciente: patient.id });
      }

      case "deletePaciente": {
        await prisma.patient.delete({
          where: { id: data.ID_Paciente || data.id },
        });
        return ok({ success: true });
      }

      case "addCita": {
        const appointment = await prisma.appointment.create({
          data: {
            patientId: data.ID_Paciente,
            fechaCita: new Date(data.Fecha_Cita),
            horaInicio: data.Hora_Inicio || null,
            horaFin: data.Hora_Fin || null,
            motivoCita: data.Motivo_Cita || null,
            idDoctor: data.ID_Doctor ? String(data.ID_Doctor) : null,
            notasCita: data.Notas_Cita || null,
            estadoCita: data.Estado_Cita || null,
          },
        });
        return ok({ ID_Cita: appointment.id, appointmentId: appointment.id });
      }

      case "updateCita": {
        await prisma.appointment.update({
          where: { id: data.ID_Cita },
          data: {
            fechaCita: data.Fecha_Cita ? new Date(data.Fecha_Cita) : undefined,
            horaInicio: data.Hora_Inicio || null,
            horaFin: data.Hora_Fin || null,
            motivoCita: data.Motivo_Cita || null,
            idDoctor: data.ID_Doctor ? String(data.ID_Doctor) : null,
            notasCita: data.Notas_Cita || null,
            estadoCita: data.Estado_Cita || null,
          },
        });
        return ok({ success: true });
      }

      case "deleteCita": {
        await prisma.appointment.delete({
          where: { id: data.ID_Cita },
        });
        return ok({ success: true });
      }

      case "addHistorial": {
        const history = await prisma.clinicalHistory.create({
          data: {
            patientId: data.ID_Paciente,
            appointmentId: data.ID_Cita || null,
            fechaHistorial: data.Fecha_Historial
              ? new Date(data.Fecha_Historial)
              : new Date(),
            diagnostico: data.Diagnostico || null,
            tratamiento: data.Tratamiento_Realizado || null,
            prescripciones: data.Prescripciones || null,
            notas: data.Notas_Adicionales || null,
            costoTratamiento: data.Costo_Tratamiento
              ? Number(data.Costo_Tratamiento)
              : null,
            estadoPago: data.Estado_Pago || null,
            sexo: data.Sexo || null,
            estadoCivil: data.Estado_Civil || null,
            ocupacion: data.Ocupacion || null,
            escolaridad: data.Escolaridad || null,
            nombrePadre: data.Nombre_Padre || null,
            nombreMadre: data.Nombre_Madre || null,
            telefonoContacto: data.Telefono_Contacto
              ? String(data.Telefono_Contacto)
              : null,
            motivoConsulta: data.Motivo_Consulta || null,
            antecedentesPersonales: data.Antecedentes_Personales || null,
          },
        });
        return ok({ ID_Historial: history.id, historyId: history.id });
      }

      case "updateHistorial": {
        await prisma.clinicalHistory.update({
          where: { id: data.ID_Historial },
          data: {
            fechaHistorial: data.Fecha_Historial
              ? new Date(data.Fecha_Historial)
              : undefined,
            diagnostico: data.Diagnostico || null,
            tratamiento: data.Tratamiento_Realizado || null,
            prescripciones: data.Prescripciones || null,
            notas: data.Notas_Adicionales || null,
            costoTratamiento: data.Costo_Tratamiento
              ? Number(data.Costo_Tratamiento)
              : null,
            estadoPago: data.Estado_Pago || null,
            sexo: data.Sexo || null,
            estadoCivil: data.Estado_Civil || null,
            ocupacion: data.Ocupacion || null,
            escolaridad: data.Escolaridad || null,
            nombrePadre: data.Nombre_Padre || null,
            nombreMadre: data.Nombre_Madre || null,
            telefonoContacto: data.Telefono_Contacto
              ? String(data.Telefono_Contacto)
              : null,
            motivoConsulta: data.Motivo_Consulta || null,
            antecedentesPersonales: data.Antecedentes_Personales || null,
          },
        });
        return ok({ success: true });
      }

      case "deleteHistorial": {
        await prisma.clinicalHistory.delete({
          where: { id: data.ID_Historial },
        });
        return ok({ success: true });
      }

      case "updateField": {
        const { recordId, fieldName, newValue, recordType } = data;

        if (recordType === "history") {
          const fieldMap: Record<string, string> = {
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
          const prismaField = fieldMap[fieldName];
          if (!prismaField)
            return fail(`Campo desconocido: ${fieldName}`);

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
          const fieldMap: Record<string, string> = {
            Fecha_Cita: "fechaCita",
            Hora_Inicio: "horaInicio",
            Hora_Fin: "horaFin",
            Motivo_Cita: "motivoCita",
            ID_Doctor: "idDoctor",
            Notas_Cita: "notasCita",
            Estado_Cita: "estadoCita",
          };
          const prismaField = fieldMap[fieldName];
          if (!prismaField)
            return fail(`Campo desconocido: ${fieldName}`);

          const updateData: any = {};
          updateData[prismaField] =
            fieldName === "Fecha_Cita"
              ? new Date(newValue)
              : fieldName === "ID_Doctor"
                ? String(newValue)
                : newValue;

          const appointment = await prisma.appointment.update({
            where: { id: recordId },
            data: updateData,
          });

          if (fieldName === "Estado_Cita") {
            const appt = await prisma.appointment.findUnique({
              where: { id: recordId },
            });
            if (appt) {
              syncUpdateEvent({
                ID_Cita: recordId,
                ID_Paciente: appt.patientId,
                Fecha_Cita: appt.fechaCita.toISOString().split("T")[0],
                Hora_Inicio: appt.horaInicio || "",
                Hora_Fin: appt.horaFin || "",
                Motivo_Cita: appt.motivoCita || "",
                Estado_Cita: newValue,
              } as any).catch(() => {});
            }
          }
        } else {
          return fail(`Tipo de registro desconocido: ${recordType}`);
        }

        return ok({ success: true });
      }

      case "getHistorialById": {
        const h = await prisma.clinicalHistory.findUnique({
          where: { id: data.ID_Historial },
        });
        if (!h) return fail("Historial no encontrado", 404);
        return ok(historyToOld(h));
      }

      case "getCitaById": {
        const a = await prisma.appointment.findUnique({
          where: { id: data.ID_Cita },
        });
        if (!a) return fail("Cita no encontrada", 404);
        return ok(appointmentToOld(a));
      }

      default:
        return fail(`Acción desconocida: ${action}`);
    }
  } catch (error) {
    console.error("Proxy POST error:", error);
    return fail(
      error instanceof Error ? error.message : "Error interno del servidor",
      500
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
