import { parseHc2Conditions, parseHc5Data } from "./utils";
import type { HistoriaClinicaPrintData } from "./types";

export function buildPrintData(
  patient: any,
  patientData: {
    clinicalDetails: any;
    familyConditions: any[];
    createdAt?: string;
  }
): HistoriaClinicaPrintData {
  return {
    patient: {
      id: patient.id,
      nombres: patient.nombres,
      apellidos: patient.apellidos,
      dni: patient.dni,
      fechaNacimiento: patient.fechaNacimiento,
      sexo: patient.sexo,
      telefonoPrincipal: patient.telefonoPrincipal,
      telefonoAlternativo: patient.telefonoAlternativo,
      email: patient.email,
      direccion: patient.direccion,
      estadoCivil: patient.estadoCivil,
      ocupacion: patient.ocupacion,
      escolaridad: patient.escolaridad,
      nombrePadre: patient.nombrePadre,
      nombreMadre: patient.nombreMadre,
      fechaRegistro: patient.fechaRegistro,
    },
    hc1: {
      nombreOdontologo: patientData.clinicalDetails?.nombreOdontologo || null,
    },
    hc2: {
      motivoConsulta: patientData.clinicalDetails?.motivoConsulta || null,
      antecedentesPersonales: parseHc2Conditions(patientData.clinicalDetails?.antecedentesPersonales),
    },
    hc3: (patientData.familyConditions || []).map((fc: any) => ({
      conditionName: fc.conditionName,
      hasCondition: fc.hasCondition,
      tipo: fc.tipo || null,
      relatives: fc.relatives
        ? typeof fc.relatives === "string"
          ? fc.relatives
          : JSON.stringify(fc.relatives)
        : null,
    })),
    hc4: {
      bajoTratamientoMedico: patientData.clinicalDetails?.bajoTratamientoMedico ?? false,
      motivo: patientData.clinicalDetails?.motivo || null,
      tomaMedicamentos: patientData.clinicalDetails?.tomaMedicamentos ?? false,
      cualesMedicamentos: patientData.clinicalDetails?.cualesMedicamentos || null,
      embarazada: patientData.clinicalDetails?.embarazada ?? null,
      transfusiones: patientData.clinicalDetails?.transfusiones ?? false,
      sangradoExcesivo: patientData.clinicalDetails?.sangradoExcesivo ?? false,
      sangradoTiempo: patientData.clinicalDetails?.sangradoTiempo || null,
      cirugias: patientData.clinicalDetails?.cirugias ?? false,
      cirugiasDetalle: patientData.clinicalDetails?.cirugiasDetalle || null,
      vacunasCompletas: patientData.clinicalDetails?.vacunasCompletas ?? false,
      alergicoMedicamentos: patientData.clinicalDetails?.alergicoMedicamentos ?? false,
      alergicoCual: patientData.clinicalDetails?.alergicoCual || null,
      consumeSustancias: patientData.clinicalDetails?.consumeSustancias ?? false,
      cualesSustancias: patientData.clinicalDetails?.cualesSustancias || null,
      frecuenciaSustancias: patientData.clinicalDetails?.frecuenciaSustancias || null,
      higieneBucal: patientData.clinicalDetails?.higieneBucal ?? false,
      frecuenciaHigiene: patientData.clinicalDetails?.frecuenciaHigiene || null,
    },
    hc5: parseHc5Data(patientData.clinicalDetails?.observacionesHc5),
    createdAt: patientData.createdAt || null,
    printDate: new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    branding: {
      clinicName: process.env.NEXT_PUBLIC_CLINIC_NAME || "DentalFlow",
      clinicAddress: process.env.NEXT_PUBLIC_CLINIC_ADDRESS || null,
      clinicLogoUrl: process.env.NEXT_PUBLIC_CLINIC_LOGO_URL || null,
      clinicLogoBase64: null,
    },
  };
}
