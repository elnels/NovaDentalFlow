import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

function mapPatientFields(patient: any) {
  if (!patient) return patient;
  const { appointments, clinicalHistory, ...rest } = patient;
  return {
    ...rest,
    citas: appointments ?? [],
    historialClinico: clinicalHistory ?? [],
  };
}

function ok(data: unknown) {
  const mapped = Array.isArray(data) ? data.map(mapPatientFields) : mapPatientFields(data);
  return NextResponse.json({ status: "success", data: mapped }, { headers: corsHeaders });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ status: "error", message }, { status, headers: corsHeaders });
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
        return ok(patients);
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
        return ok(patient);
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
        return ok(patients);
      }

      case "debugHeaders": {
        return ok({
          pacientes_headers: [
            "id", "dni", "nombres", "apellidos", "fechaNacimiento",
          ],
          citas_headers: [
            "id", "patientId", "fechaCita", "horaInicio", "horaFin", "motivoCita",
          ],
          historial_headers: [
            "id", "patientId", "appointmentId", "fechaHistorial", "diagnostico",
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
