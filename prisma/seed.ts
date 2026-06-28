import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const samplePatients = [
  {
    dni: "12345678",
    nombres: "Juan",
    apellidos: "Pérez García",
    telefonoPrincipal: "555-0101",
    email: "juan.perez@email.com",
    genero: "Masculino",
  },
  {
    dni: "23456789",
    nombres: "María",
    apellidos: "López Hernández",
    telefonoPrincipal: "555-0102",
    email: "maria.lopez@email.com",
    genero: "Femenino",
  },
  {
    dni: "34567890",
    nombres: "Carlos",
    apellidos: "Martínez Rodríguez",
    telefonoPrincipal: "555-0103",
    email: "carlos.martinez@email.com",
    genero: "Masculino",
  },
];

const sampleDiagnostics = [
  "Caries dental",
  "Gingivitis",
  "Periodontitis",
  "Sarro dental",
  "Sensibilidad dental",
];

async function main() {
  console.log("Seeding sample data...");

  const existing = await prisma.patient.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} patients, skipping seed.`);
    return;
  }

  for (const p of samplePatients) {
    const patient = await prisma.patient.create({
      data: {
        ...p,
        fechaNacimiento: new Date("1990-01-15"),
        direccion: "Calle Principal 123",
        estado: "Activo",
      },
    });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        fechaCita: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        horaInicio: "10:00",
        horaFin: "11:00",
        motivoCita: "Revisión general",
        estadoCita: "Programada",
      },
    });

    await prisma.clinicalHistory.create({
      data: {
        patientId: patient.id,
        appointmentId: appointment.id,
        diagnostico: sampleDiagnostics[Math.floor(Math.random() * sampleDiagnostics.length)],
        tratamiento: "Limpieza dental y aplicación de flúor",
        prescripciones: "Enjuague bucal con clorhexidina por 7 días",
        notas: "Paciente coopera adecuadamente",
        costoTratamiento: 500,
        estadoPago: "Pendiente",
      },
    });

    console.log(`  ✓ Created: ${p.nombres} ${p.apellidos}`);
  }

  const count = await prisma.patient.count();
  console.log(`\nDone. ${count} patients seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
