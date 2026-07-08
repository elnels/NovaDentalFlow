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

const sampleProcedures = [
  { code: "CON-001", name: "Consulta General", category: "Consulta", defaultPrice: 500 },
  { code: "CON-002", name: "Consulta de Urgencia", category: "Consulta", defaultPrice: 700 },
  { code: "CON-003", name: "Valoración Ortodóncica", category: "Consulta", defaultPrice: 600 },
  { code: "DIAG-001", name: "Radiografía Periapical", category: "Diagnóstico", defaultPrice: 200 },
  { code: "DIAG-002", name: "Radiografía Panorámica", category: "Diagnóstico", defaultPrice: 500 },
  { code: "DIAG-003", name: "Radiografía Cefalométrica", category: "Diagnóstico", defaultPrice: 600 },
  { code: "DIAG-004", name: "Tomografía CBCT", category: "Diagnóstico", defaultPrice: 2500 },
  { code: "PREV-001", name: "Profilaxis (Limpieza Dental)", category: "Preventivo", defaultPrice: 600 },
  { code: "PREV-002", name: "Aplicación de Flúor", category: "Preventivo", defaultPrice: 300 },
  { code: "PREV-003", name: "Selladores de Fosetas y Fisuras", category: "Preventivo", defaultPrice: 350 },
  { code: "OP-001", name: "Resina Simple (1 superficie)", category: "Operatoria", defaultPrice: 600 },
  { code: "OP-002", name: "Resina Compuesta (2 superficies)", category: "Operatoria", defaultPrice: 900 },
  { code: "OP-003", name: "Resina Compuesta (3+ superficies)", category: "Operatoria", defaultPrice: 1200 },
  { code: "OP-004", name: "Incrustación Cerámica", category: "Operatoria", defaultPrice: 3500 },
  { code: "END-001", name: "Endodoncia Unirradicular", category: "Endodoncia", defaultPrice: 2500 },
  { code: "END-002", name: "Endodoncia Birradicular", category: "Endodoncia", defaultPrice: 3500 },
  { code: "END-003", name: "Endodoncia Multirradicular", category: "Endodoncia", defaultPrice: 4500 },
  { code: "PERIO-001", name: "Raspaje y Alisado Radicular (Cuadrante)", category: "Periodoncia", defaultPrice: 1200 },
  { code: "PERIO-002", name: "Curetaje Gingival", category: "Periodoncia", defaultPrice: 800 },
  { code: "PERIO-003", name: "Cirugía Periodontal", category: "Periodoncia", defaultPrice: 3000 },
  { code: "EXO-001", name: "Extracción Simple", category: "Cirugía", defaultPrice: 800 },
  { code: "EXO-002", name: "Extracción Quirúrgica (Incluye Cordales)", category: "Cirugía", defaultPrice: 2000 },
  { code: "EXO-003", name: "Odontectomía Cordal Incluido", category: "Cirugía", defaultPrice: 3500 },
  { code: "ORT-001", name: "Colocación de Brackets (Arco Completo)", category: "Ortodoncia", defaultPrice: 8000 },
  { code: "PROT-001", name: "Corona de Metal-Cerámica", category: "Prótesis", defaultPrice: 5000 },
];

const procedureNames = [
  "CON-001 — Consulta General",
  "CON-002 — Consulta de Urgencia",
  "DIAG-001 — Radiografía Periapical",
  "PREV-001 — Profilaxis (Limpieza Dental)",
  "PREV-002 — Aplicación de Flúor",
  "OP-001 — Resina Simple (1 superficie)",
  "EXO-001 — Extracción Simple",
  "PERIO-001 — Raspaje y Alisado Radicular (Cuadrante)",
];

async function main() {
  console.log("Seeding sample data...");

  const existing = await prisma.patient.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} patients, skipping seed.`);
    return;
  }

  const procedures = await Promise.all(
    sampleProcedures.map((p) =>
      prisma.procedureCatalog.create({ data: p })
    )
  );
  console.log(`  ✓ Created ${procedures.length} procedure catalog items`);

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

    const numItems = Math.floor(Math.random() * 4) + 1;
    const selected = [...procedures].sort(() => Math.random() - 0.5).slice(0, numItems);
    let totalCost = 0;
    const lineItemsData = selected.map((proc) => {
      const qty = Math.floor(Math.random() * 2) + 1;
      const discount = Math.random() < 0.3 ? Math.floor(proc.defaultPrice * 0.1) : 0;
      const fee = proc.defaultPrice;
      totalCost += (fee - discount) * qty;
      return {
        procedureCatalogId: proc.id,
        quantity: qty,
        fee,
        discount,
      };
    });

    await prisma.clinicalHistory.create({
      data: {
        patientId: patient.id,
        appointmentId: appointment.id,
        diagnostico: sampleDiagnostics[Math.floor(Math.random() * sampleDiagnostics.length)],
        tratamiento: "Limpieza dental y aplicación de flúor",
        prescripciones: "Enjuague bucal con clorhexidina por 7 días",
        notas: "Paciente coopera adecuadamente",
        costoTratamiento: totalCost,
        estadoPago: "Pendiente",
        procedureLineItems: {
          create: lineItemsData,
        },
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
