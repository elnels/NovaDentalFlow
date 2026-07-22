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
    sexo: "Masculino",
  },
  {
    dni: "23456789",
    nombres: "María",
    apellidos: "López Hernández",
    telefonoPrincipal: "555-0102",
    email: "maria.lopez@email.com",
    sexo: "Femenino",
  },
  {
    dni: "34567890",
    nombres: "Carlos",
    apellidos: "Martínez Rodríguez",
    telefonoPrincipal: "555-0103",
    email: "carlos.martinez@email.com",
    sexo: "Masculino",
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
  { code: "CON-001", name: "Consulta", category: "Consulta", defaultPrice: 230 },
  { code: "PREV-001", name: "Limpieza Dental", category: "Preventiva", defaultPrice: 550 },
  { code: "PREV-002", name: "Aplicación de Flúor", category: "Preventiva", defaultPrice: 390 },
  { code: "PREV-003", name: "Limpieza Niños con Fluor", category: "Preventiva", defaultPrice: 450 },
  { code: "PREV-004", name: "Selladores de fosetas", category: "Preventiva", defaultPrice: 440 },
  { code: "REST-001", name: "Restauración de resina", category: "Restauradora", defaultPrice: 830 },
  { code: "REST-002", name: "Incrustación metálica", category: "Restauradora", defaultPrice: 1840 },
  { code: "REST-003", name: "Amalgamas", category: "Restauradora", defaultPrice: 430 },
  { code: "REST-004", name: "Incrustación Estética", category: "Restauradora", defaultPrice: 1860 },
  { code: "REST-005", name: "Poste colado", category: "Restauradora", defaultPrice: 1460 },
  { code: "REST-006", name: "Poste estético prefabricado", category: "Restauradora", defaultPrice: 1600 },
  { code: "REST-007", name: "Curación", category: "Restauradora", defaultPrice: 350 },
  { code: "END-001", name: "Endodoncia molares", category: "Endodoncia", defaultPrice: 1860 },
  { code: "END-002", name: "Endodoncia premolares", category: "Endodoncia", defaultPrice: 1320 },
  { code: "END-003", name: "Endodoncia anteriores", category: "Endodoncia", defaultPrice: 1890 },
  { code: "END-004", name: "Pulpotomia", category: "Endodoncia", defaultPrice: 720 },
  { code: "CIR-001", name: "Extracciones", category: "Cirugía", defaultPrice: 670 },
  { code: "CIR-002", name: "Extracción 3er molar - 1", category: "Cirugía", defaultPrice: 450 },
  { code: "CIR-003", name: "Extracción 3er molar - 2", category: "Cirugía", defaultPrice: 830 },
  { code: "CIR-004", name: "Cirugias 3ros molares (consulta externa)", category: "Cirugía", defaultPrice: 3500 },
  { code: "PROT-001", name: "Coronas Metal Porcelana", category: "Prótesis", defaultPrice: 2980 },
  { code: "PROT-002", name: "Coronas Zirconia", category: "Prótesis", defaultPrice: 4280 },
  { code: "PROT-003", name: "Coronita Infantil", category: "Prótesis", defaultPrice: 1340 },
  { code: "PROT-004", name: "Cementación", category: "Prótesis", defaultPrice: 380 },
  { code: "PROT-005", name: "Provisional fijo (acrílico - unidad)", category: "Prótesis", defaultPrice: 440 },
  { code: "PROT-006", name: "Provisional removible unilateral", category: "Prótesis", defaultPrice: 710 },
  { code: "PROT-007", name: "Provisional removible bilateral", category: "Prótesis", defaultPrice: 830 },
  { code: "PROT-008", name: "Removible Metálico unilateral", category: "Prótesis", defaultPrice: 715 },
  { code: "PROT-009", name: "Removible Metálico bilateral", category: "Prótesis", defaultPrice: 830 },
  { code: "PROT-010", name: "Val plas o Luciton unilateral", category: "Prótesis", defaultPrice: 2300 },
  { code: "PROT-011", name: "Val plas o Luciton bilateral", category: "Prótesis", defaultPrice: 2830 },
  { code: "PROT-012", name: "Placa total", category: "Prótesis", defaultPrice: 4800 },
  { code: "PROT-013", name: "Guardas oclusales", category: "Prótesis", defaultPrice: 560 },
  { code: "RADIO-001", name: "RX", category: "Radiología", defaultPrice: 150 },
];

async function main() {
  console.log("Seeding sample data...");

  // Clear all existing data
  console.log("  Clearing existing data...");
  await prisma.procedureLineItem.deleteMany();
  await prisma.procedureCatalog.deleteMany();
  await prisma.patient.deleteMany();
  console.log("  ✓ Existing data cleared");

  // Create new procedure catalog
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
      const price = Number(proc.defaultPrice);
      const discount = Math.random() < 0.3 ? Math.floor(price * 0.1) : 0;
      const fee = price;
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
