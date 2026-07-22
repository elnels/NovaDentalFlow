import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { HistoriaClinicaPrintData, Hc3Condition } from "../types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
  },
  headerSubtitle: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e40af",
    backgroundColor: "#eff6ff",
    padding: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    width: 160,
    color: "#6b7280",
    fontSize: 8,
  },
  value: {
    flex: 1,
    fontSize: 9,
  },
  hc3Row: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  hc3Condition: {
    width: 140,
    fontSize: 8,
  },
  hc3Status: {
    width: 40,
    fontSize: 8,
    textAlign: "center",
  },
  hc3Detail: {
    flex: 1,
    fontSize: 8,
    color: "#6b7280",
  },
  hc3Header: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  hc3HeaderCell: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    fontSize: 7,
    color: "#9ca3af",
  },
  yesBadge: {
    color: "#16a34a",
    fontWeight: "bold",
  },
  noBadge: {
    color: "#dc2626",
  },
  hc5Subsection: {
    marginTop: 6,
    paddingLeft: 0,
  },
  hc5SubTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  patientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  patientField: {
    width: "50%",
    flexDirection: "row",
    paddingVertical: 2,
  },
  patientLabel: {
    width: 100,
    color: "#6b7280",
    fontSize: 8,
  },
  patientValue: {
    flex: 1,
    fontSize: 9,
  },
});

function YesNo({ value }: { value: boolean | null | undefined }) {
  if (value === null || value === undefined) {
    return <Text style={{ color: "#9ca3af" }}>—</Text>;
  }
  return value ? (
    <Text style={styles.yesBadge}>Sí</Text>
  ) : (
    <Text style={styles.noBadge}>No</Text>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "No disponible"}</Text>
    </View>
  );
}

function HC3Section({ conditions }: { conditions: Hc3Condition[] }) {
  const allConditions = [
    "Diabetes", "Hipertensión Arterial", "Cáncer",
    "Cardiópatas", "Nefrópatas", "Malformaciones", "Otros",
  ];

  return (
    <>
      <View style={styles.hc3Header}>
        <Text style={[styles.hc3HeaderCell, { width: 140 }]}>Condición</Text>
        <Text style={[styles.hc3HeaderCell, { width: 40, textAlign: "center" }]}>Estado</Text>
        <Text style={[styles.hc3HeaderCell, { flex: 1 }]}>Detalle</Text>
      </View>
      {allConditions.map((name) => {
        const found = conditions.find((c) => c.conditionName === name);
        const has = found?.hasCondition ?? false;
        const detail = has
          ? [found?.relatives ? `Quién: ${found.relatives}` : "", found?.tipo ? `Tipo: ${found.tipo}` : ""]
              .filter(Boolean)
              .join(" | ")
          : "";
        return (
          <View key={name} style={styles.hc3Row}>
            <Text style={styles.hc3Condition}>{name}</Text>
            <Text style={styles.hc3Status}>
              <YesNo value={has} />
            </Text>
            <Text style={styles.hc3Detail}>{detail || "—"}</Text>
          </View>
        );
      })}
    </>
  );
}

function HC5Section({ hc5 }: { hc5: HistoriaClinicaPrintData["hc5"] }) {
  const o = hc5.oclusion;
  return (
    <>
      <FieldRow label="Tejidos blandos" value={hc5.tejidosBlandos} />
      {o && (
        <View style={styles.hc5Subsection}>
          <Text style={styles.hc5SubTitle}>Oclusión</Text>
          <FieldRow
            label="Línea media"
            value={o.lineaMedia?.valor ? `${o.lineaMedia.valor}${o.lineaMedia.notas ? ` — ${o.lineaMedia.notas}` : ""}` : null}
          />
          <FieldRow label="Plano terminal derecho" value={o.planosTerminales?.derecho} />
          <FieldRow label="Plano terminal izquierdo" value={o.planosTerminales?.izquierdo} />
          <FieldRow label="Espacios terminales" value={o.espaciosTerminales?.presente ? `Sí — ${o.espaciosTerminales.ubicacion || ""}` : "No"} />
          <FieldRow label="Clase Angle derecho" value={o.claseAngle?.derecho} />
          <FieldRow label="Clase Angle izquierdo" value={o.claseAngle?.izquierdo} />
          <FieldRow label="Mordida cruzada" value={o.mordidaCruzada?.presente ? `Sí — ${o.mordidaCruzada.ubicacion || ""}` : "No"} />
          <FieldRow label="Traslape horizontal" value={o.traslapeHorizontal?.presente ? `Sí — ${o.traslapeHorizontal.mm || ""} mm` : "No"} />
          <FieldRow label="Traslape vertical" value={o.traslapeVertical?.presente ? `Sí — ${o.traslapeVertical.mm || ""} mm` : "No"} />
          <FieldRow label="Borde a borde" value={o.bordeABorde ? "Sí" : "No"} />
          <FieldRow label="Mordida abierta" value={o.mordidaAbierta ? "Sí" : "No"} />
          <FieldRow label="Hábitos nocivos" value={o.habitosNocivos?.presente ? `Sí — ${o.habitosNocivos.cual || ""}` : "No"} />
        </View>
      )}
    </>
  );
}

export function HistoriaClinicaTemplate({ data }: { data: HistoriaClinicaPrintData }) {
  const { patient, hc1, hc2, hc3, hc4, hc5, createdAt, printDate, branding } = data;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {branding.clinicLogoBase64 && (
              <Image src={branding.clinicLogoBase64} style={styles.logo} />
            )}
            <View>
              <Text style={styles.headerTitle}>HISTORIA CLÍNICA</Text>
              <Text style={styles.headerSubtitle}>{branding.clinicName}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.headerSubtitle}>Fecha de creación</Text>
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>
              {createdAt ? new Date(createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "No disponible"}
            </Text>
          </View>
        </View>

        {/* Patient Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL PACIENTE</Text>
          <View style={styles.patientGrid}>
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>Nombre:</Text>
              <Text style={styles.patientValue}>{patient.nombres} {patient.apellidos}</Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>DNI:</Text>
              <Text style={styles.patientValue}>{patient.dni || "No disponible"}</Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>Fecha nacimiento:</Text>
              <Text style={styles.patientValue}>{patient.fechaNacimiento ? new Date(patient.fechaNacimiento).toLocaleDateString("es-MX") : "No disponible"}</Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>Edad:</Text>
              <Text style={styles.patientValue}>{patient.fechaNacimiento ? `${Math.floor((Date.now() - new Date(patient.fechaNacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} años` : "No disponible"}</Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>Sexo:</Text>
              <Text style={styles.patientValue}>{patient.sexo || "No disponible"}</Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>Teléfono:</Text>
              <Text style={styles.patientValue}>{patient.telefonoPrincipal || "No disponible"}</Text>
            </View>
            {patient.telefonoAlternativo && (
              <View style={styles.patientField}>
                <Text style={styles.patientLabel}>Tel. alternativo:</Text>
                <Text style={styles.patientValue}>{patient.telefonoAlternativo}</Text>
              </View>
            )}
            {patient.email && (
              <View style={styles.patientField}>
                <Text style={styles.patientLabel}>Email:</Text>
                <Text style={styles.patientValue}>{patient.email}</Text>
              </View>
            )}
            {patient.direccion && (
              <View style={styles.patientField}>
                <Text style={styles.patientLabel}>Dirección:</Text>
                <Text style={styles.patientValue}>{patient.direccion}</Text>
              </View>
            )}
            {patient.estadoCivil && (
              <View style={styles.patientField}>
                <Text style={styles.patientLabel}>Estado civil:</Text>
                <Text style={styles.patientValue}>{patient.estadoCivil}</Text>
              </View>
            )}
            {patient.ocupacion && (
              <View style={styles.patientField}>
                <Text style={styles.patientLabel}>Ocupación:</Text>
                <Text style={styles.patientValue}>{patient.ocupacion}</Text>
              </View>
            )}
            {patient.escolaridad && (
              <View style={styles.patientField}>
                <Text style={styles.patientLabel}>Escolaridad:</Text>
                <Text style={styles.patientValue}>{patient.escolaridad}</Text>
              </View>
            )}
          </View>
        </View>

        {/* HC1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ODONTÓLOGO</Text>
          <FieldRow label="Nombre del odontólogo" value={hc1.nombreOdontologo} />
        </View>

        {/* HC2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANTECEDENTES PERSONALES</Text>
          <FieldRow label="Motivo de consulta" value={hc2.motivoConsulta} />
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 4 }}>Condiciones presentes:</Text>
            {hc2.antecedentesPersonales.filter((c) => c.presents).length > 0 ? (
              hc2.antecedentesPersonales
                .filter((c) => c.presents)
                .map((c, i) => (
                  <Text key={i} style={{ fontSize: 8, paddingLeft: 8, paddingBottom: 2 }}>
                    • {c.name}{c.edad ? ` (${c.edad} años)` : ""}
                  </Text>
                ))
            ) : (
              <Text style={{ fontSize: 8, color: "#9ca3af", paddingLeft: 8 }}>Ninguna condición registrada</Text>
            )}
          </View>
        </View>

        {/* HC3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANTECEDENTES HEREDO-FAMILIARES</Text>
          <HC3Section conditions={hc3} />
        </View>

        {/* HC4 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANTECEDENTES PERSONALES NO PATOLÓGICOS</Text>
          <FieldRow label="¿Bajo tratamiento médico?" value={hc4.bajoTratamientoMedico ? "Sí" : "No"} />
          {hc4.bajoTratamientoMedico && hc4.motivo && (
            <FieldRow label="Motivo" value={hc4.motivo} />
          )}
          <FieldRow label="¿Toma medicamentos?" value={hc4.tomaMedicamentos ? "Sí" : "No"} />
          {hc4.tomaMedicamentos && hc4.cualesMedicamentos && (
            <FieldRow label="¿Cuáles?" value={hc4.cualesMedicamentos} />
          )}
          {hc4.embarazada !== null && hc4.embarazada !== undefined && (
            <FieldRow label="¿Embarazada?" value={hc4.embarazada ? "Sí" : "No"} />
          )}
          <FieldRow label="¿Transfusiones?" value={hc4.transfusiones ? "Sí" : "No"} />
          <FieldRow label="¿Sangrado excesivo?" value={hc4.sangradoExcesivo ? "Sí" : "No"} />
          {hc4.sangradoExcesivo && hc4.sangradoTiempo && (
            <FieldRow label="Tiempo de sangrado" value={hc4.sangradoTiempo} />
          )}
          <FieldRow label="¿Cirugías?" value={hc4.cirugias ? "Sí" : "No"} />
          {hc4.cirugias && hc4.cirugiasDetalle && (
            <FieldRow label="Detalle cirugías" value={hc4.cirugiasDetalle} />
          )}
          <FieldRow label="¿Vacunas completas?" value={hc4.vacunasCompletas ? "Sí" : "No"} />
          <FieldRow label="¿Alérgico a medicamentos?" value={hc4.alergicoMedicamentos ? "Sí" : "No"} />
          {hc4.alergicoMedicamentos && hc4.alergicoCual && (
            <FieldRow label="¿Cuál?" value={hc4.alergicoCual} />
          )}
          <FieldRow label="¿Consume sustancias?" value={hc4.consumeSustancias ? "Sí" : "No"} />
          {hc4.consumeSustancias && hc4.cualesSustancias && (
            <FieldRow label="¿Cuáles?" value={hc4.cualesSustancias} />
          )}
          {hc4.consumeSustancias && hc4.frecuenciaSustancias && (
            <FieldRow label="Frecuencia" value={hc4.frecuenciaSustancias} />
          )}
          <FieldRow label="¿Higiene bucal?" value={hc4.higieneBucal ? "Sí" : "No"} />
          {hc4.higieneBucal && hc4.frecuenciaHigiene && (
            <FieldRow label="Frecuencia higiene" value={hc4.frecuenciaHigiene} />
          )}
        </View>

        {/* HC5 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPLORACIÓN BUCAL</Text>
          <HC5Section hc5={hc5} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{branding.clinicAddress || "No Disponible"}</Text>
          <Text>{printDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
