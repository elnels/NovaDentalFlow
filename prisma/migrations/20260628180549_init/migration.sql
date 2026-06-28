-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "serial_num" SERIAL NOT NULL,
    "dni" TEXT,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "telefono_principal" TEXT,
    "telefono_alternativo" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "genero" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "serial_num" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "fecha_cita" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TEXT,
    "hora_fin" TEXT,
    "motivo_cita" TEXT,
    "id_doctor" TEXT,
    "notas_cita" TEXT,
    "estado_cita" TEXT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_history" (
    "id" TEXT NOT NULL,
    "serial_num" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "fecha_historial" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "prescripciones" TEXT,
    "notas" TEXT,
    "costo_tratamiento" DECIMAL(65,30),
    "estado_pago" TEXT,
    "sexo" TEXT,
    "estado_civil" TEXT,
    "ocupacion" TEXT,
    "escolaridad" TEXT,
    "nombre_padre" TEXT,
    "nombre_madre" TEXT,
    "telefono_contacto" TEXT,
    "motivo_consulta" TEXT,
    "antecedentes_personales" TEXT,
    "exploracion_bucal" TEXT,
    "observaciones" TEXT,
    "diagnostico_presuncion" TEXT,
    "estudios_auxiliares" TEXT,
    "odontograma" JSONB,

    CONSTRAINT "clinical_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_details" (
    "id" TEXT NOT NULL,
    "serial_num" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "nombre_odontologo" TEXT,
    "motivo_consulta" TEXT,
    "antecedentes_personales" TEXT,
    "bajo_tratamiento_medico" BOOLEAN NOT NULL DEFAULT false,
    "motivo" TEXT,
    "toma_medicamentos" BOOLEAN NOT NULL DEFAULT false,
    "cuales_medicamentos" TEXT,
    "embarazada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_ultima_menstruacion" TIMESTAMP(3),
    "transfusiones" BOOLEAN NOT NULL DEFAULT false,
    "sangrado_excesivo" BOOLEAN NOT NULL DEFAULT false,
    "sangrado_tiempo" TEXT,
    "cirugias" BOOLEAN NOT NULL DEFAULT false,
    "cirugias_detalle" TEXT,
    "vacunas_completas" BOOLEAN NOT NULL DEFAULT false,
    "alergico_medicamentos" BOOLEAN NOT NULL DEFAULT false,
    "alergico_cual" TEXT,
    "consume_sustancias" BOOLEAN NOT NULL DEFAULT false,
    "cuales_sustancias" TEXT,
    "frecuencia_sustancias" TEXT,
    "higiene_bucal" BOOLEAN NOT NULL DEFAULT false,
    "frecuencia_higiene" TEXT,
    "observaciones_hc5" TEXT,

    CONSTRAINT "clinical_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_conditions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "condition_name" TEXT NOT NULL,
    "has_condition" BOOLEAN NOT NULL DEFAULT false,
    "tipo" TEXT,
    "relatives" JSONB,

    CONSTRAINT "family_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_dni_key" ON "patients"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_details_patient_id_key" ON "clinical_details"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_conditions_patient_id_condition_name_key" ON "family_conditions"("patient_id", "condition_name");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_history" ADD CONSTRAINT "clinical_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_history" ADD CONSTRAINT "clinical_history_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_details" ADD CONSTRAINT "clinical_details_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_conditions" ADD CONSTRAINT "family_conditions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
