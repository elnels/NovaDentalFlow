import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const API_BASE = process.env.SEED_API_URL || "http://localhost:9004/api/proxy";

interface OldPatient {
  ID_Paciente: string;
  DNI?: string;
  Nombres: string;
  Apellidos: string;
  Fecha_Nacimiento?: string;
  Telefono_Principal?: string;
  Telefono_Alternativo?: string;
  Email?: string;
  Direccion?: string;
  Genero?: string;
  Estado?: string;
  Fecha_Registro?: string;
  Citas?: OldAppointment[];
  Historial_Clinico?: OldHistory[];
}

interface OldAppointment {
  ID_Cita: string;
  Fecha_Cita: string;
  Hora_Inicio?: string;
  Hora_Fin?: string;
  Motivo_Cita?: string;
  ID_Doctor?: string;
  Notas_Cita?: string;
  Estado_Cita?: string;
}

interface OldHistory {
  ID_Historial: string;
  Fecha_Historial?: string;
  Fecha_Tratamiento?: string;
  ID_Cita?: string;
  Diagnostico?: string;
  Tratamiento_Realizado?: string;
  Prescripciones?: string;
  Notas_Adicionales?: string;
  Costo_Tratamiento?: string;
  Estado_Pago?: string;
  Sexo?: string;
  Estado_Civil?: string;
  Ocupacion?: string;
  Escolaridad?: string;
  Nombre_Padre?: string;
  Nombre_Madre?: string;
  Telefono_Contacto?: string;
  Motivo_Consulta?: string;
  Antecedentes_Personales?: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (json.status === "error") throw new Error(json.message);
  return json.data as T;
}

async function fetchPatient(id: string): Promise<OldPatient> {
  return fetchJson<OldPatient>(
    `${API_BASE}?action=getPacienteById&id=${encodeURIComponent(id)}&_t=${Date.now()}`
  );
}

async function main() {
  console.log("Fetching patient list...");

  const list = await fetchJson<OldPatient[]>(
    `${API_BASE}?action=getPacientesWithAppointments&_t=${Date.now()}`
  );
  console.log(`Found ${list.length} patients`);

  let ok = 0;
  const failed: string[] = [];

  for (const entry of list) {
    try {
      const full = await fetchPatient(entry.ID_Paciente);

      await prisma.$transaction(async (tx) => {
        const patient = await tx.patient.create({
          data: {
            dni: full.DNI ? String(full.DNI) : null,
            nombres: full.Nombres,
            apellidos: full.Apellidos,
            fechaNacimiento: full.Fecha_Nacimiento
              ? new Date(full.Fecha_Nacimiento)
              : null,
            telefonoPrincipal: full.Telefono_Principal
                ? String(full.Telefono_Principal)
                : null,
            telefonoAlternativo: full.Telefono_Alternativo
                ? String(full.Telefono_Alternativo)
                : null,
            email: full.Email || null,
            direccion: full.Direccion || null,
            genero: full.Genero || null,
            estado: full.Estado || "Activo",
            fechaRegistro: full.Fecha_Registro
              ? new Date(full.Fecha_Registro)
              : new Date(),
          },
        });

        const appointmentMap = new Map<string, string>();

        for (const cita of full.Citas || []) {
          const a = await tx.appointment.create({
            data: {
              patientId: patient.id,
              fechaCita: new Date(cita.Fecha_Cita),
              horaInicio: cita.Hora_Inicio || null,
              horaFin: cita.Hora_Fin || null,
              motivoCita: cita.Motivo_Cita || null,
              idDoctor: cita.ID_Doctor ? String(cita.ID_Doctor) : null,
              notasCita: cita.Notas_Cita || null,
              estadoCita: cita.Estado_Cita || null,
            },
          });
          appointmentMap.set(cita.ID_Cita, a.id);
        }

        for (const h of full.Historial_Clinico || []) {
          await tx.clinicalHistory.create({
            data: {
              patientId: patient.id,
              appointmentId: h.ID_Cita
                ? appointmentMap.get(h.ID_Cita) || null
                : null,
              fechaHistorial: h.Fecha_Historial
                ? new Date(h.Fecha_Historial)
                : h.Fecha_Tratamiento
                  ? new Date(h.Fecha_Tratamiento)
                  : new Date(),
              diagnostico: h.Diagnostico || null,
              tratamiento: h.Tratamiento_Realizado || null,
              prescripciones: h.Prescripciones || null,
              notas: h.Notas_Adicionales || null,
              costoTratamiento: h.Costo_Tratamiento
                ? Number(h.Costo_Tratamiento)
                : null,
              estadoPago: h.Estado_Pago || null,
              sexo: h.Sexo || null,
              estadoCivil: h.Estado_Civil || null,
              ocupacion: h.Ocupacion || null,
              escolaridad: h.Escolaridad || null,
              nombrePadre: h.Nombre_Padre || null,
              nombreMadre: h.Nombre_Madre || null,
              telefonoContacto: h.Telefono_Contacto
                ? String(h.Telefono_Contacto)
                : null,
              motivoConsulta: h.Motivo_Consulta || null,
              antecedentesPersonales: h.Antecedentes_Personales || null,
            },
          });
        }
      });

      ok++;
      console.log(`  ✓ ${ok}/${list.length} ${full.Nombres} ${full.Apellidos}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${entry.ID_Paciente}`, (err as Error).message);
      failed.push(entry.ID_Paciente);
    }
  }

  console.log(`\nDone. ${ok}/${list.length} patients migrated.`);
  if (failed.length > 0) {
    console.log(`Failed IDs: ${failed.join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
