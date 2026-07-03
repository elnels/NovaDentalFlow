# Data Layer Migration: Google Sheets → PostgreSQL

## Goal
Migrate the backend from Google Sheets (via Apps Script) to a local PostgreSQL database running in Docker on Windows. Then redesign Historial Clínico from a single-step form into a multi-step wizard (HC1–HC6).

---

## Constraints & Preferences
- PostgreSQL runs locally in Docker on Windows (Docker Desktop already installed).
- Development runs on Windows (Next.js dev server at `localhost:9004`). WSL Ubuntu is used for bash/git, with project files at `/mnt/c/...`.
- Connection: Windows Next.js → `localhost:5432` → Docker PostgreSQL container.
- Odontograma (HC6) saved for a later phase; create the page shell only.
- Save each HC step independently (not all-at-once at the end).
- Branch `historia-clinica` is already merged to `main` and pushed to GitHub.
- Google Calendar sync (`googleapis` package) is independent of the sheet — it stays as-is.

---

## ID System Decision

**Primary key:** `UUID` (native PostgreSQL `gen_random_uuid()`)

Internal only — used for FK relationships, API calls, and URLs.

**Display ID:** Auto-increment integer with prefix, computed in application layer

```
PAC-1, PAC-2, PAC-3...     ← patients
CITA-1, CITA-2, CITA-3...  ← appointments
HIST-1, HIST-2, HIST-3...  ← clinical history records
DET-1, DET-2...            ← clinical details
```

Implementation: Store `serial_num` (autoincrement Int) in DB. Compute `display_id` via a getter in the application layer:
```typescript
get displayId() { return 'PAC-' + this.serialNum; }
```

This avoids Prisma incompatibility with PostgreSQL `GENERATED ALWAYS AS` computed columns and keeps the schema portable.

---

## Database Schema

### Table: `patients`
Replaces the `Pacientes` sheet.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, `gen_random_uuid()` |
| serial_num | INT | Auto-increment, used for display_id |
| dni | TEXT? | Unique, optional |
| nombres | TEXT | Required |
| apellidos | TEXT | Required |
| fecha_nacimiento | DATE? | |
| telefono_principal | TEXT? | |
| telefono_alternativo | TEXT? | |
| email | TEXT? | |
| direccion | TEXT? | |
| genero | TEXT? | Renamed to `sexo` in HC1 branch |
| sexo | TEXT? | Moved from `clinical_history`; options: Masculino/Femenino/Otro |
| estado_civil | TEXT? | Moved from `clinical_history` |
| ocupacion | TEXT? | Moved from `clinical_history` |
| escolaridad | TEXT? | Moved from `clinical_history` |
| nombre_padre | TEXT? | Moved from `clinical_history`, esMenosConditional |
| nombre_madre | TEXT? | Moved from `clinical_history`, esMenosConditional |
| telefono_padre | TEXT? | Added in esMenosConditional |
| telefono_madre | TEXT? | Added in esMenosConditional |
| es_menor | BOOLEAN | Default false, esMenorBool branch |
| estado | TEXT | Default `'Activo'` |
| fecha_registro | TIMESTAMPTZ | Default `now()` |

### Table: `appointments`
Replaces the `Citas` sheet.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| serial_num | INT | Auto-increment |
| patient_id | UUID | FK → patients.id, CASCADE |
| fecha_cita | TIMESTAMPTZ | |
| hora_inicio | TEXT? | |
| hora_fin | TEXT? | |
| motivo_cita | TEXT? | |
| id_doctor | TEXT? | |
| notas_cita | TEXT? | |
| estado_cita | TEXT? | |

### Table: `clinical_history`
Per-visit clinical records. Replaces `Historial_Clinico` sheet + new fields (HC5–HC6).

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| serial_num | INT | Auto-increment |
| patient_id | UUID | FK → patients.id, CASCADE |
| appointment_id | UUID? | FK → appointments.id, SET NULL |
| fecha_historial | TIMESTAMPTZ | Default `now()` |
| diagnostico | TEXT? | |
| tratamiento | TEXT? | |
| prescripciones | TEXT? | |
| notas | TEXT? | |
| costo_tratamiento | DECIMAL? | |
| estado_pago | TEXT? | |
| telefono_contacto | TEXT? | |
| motivo_consulta | TEXT? | |
| antecedentes_personales | TEXT? | |
| exploracion_bucal | TEXT? | HC5 |
| odontograma | JSON? | Future |

### Table: `clinical_details`
One row per patient (1:1). HC1–HC4 data.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| serial_num | INT | Auto-increment |
| patient_id | UUID | FK → patients.id, UNIQUE, CASCADE |
| nombre_odontologo | TEXT? | HC1 (default "Dr Elsa Hernández") |
| motivo_consulta | TEXT? | HC2 |
| antecedentes_personales | TEXT? | HC2 |
| bajo_tratamiento_medico | BOOLEAN | Default false, HC4 |
| motivo | TEXT? | HC4 conditional |
| toma_medicamentos | BOOLEAN | Default false, HC4 |
| cuales_medicamentos | TEXT? | HC4 conditional |
| embarazada | BOOLEAN | Default false, HC4 |
| fecha_ultima_menstruacion | DATE? | HC4 conditional |
| transfusiones | BOOLEAN | Default false, HC4 |
| sangrado_excesivo | BOOLEAN | Default false, HC4 |
| sangrado_tiempo | TEXT? | HC4 conditional |
| cirugias | BOOLEAN | Default false, HC4 |
| cirugias_detalle | TEXT? | HC4 conditional |
| vacunas_completas | BOOLEAN | Default false, HC4 |
| alergico_medicamentos | BOOLEAN | Default false, HC4 |
| alergico_cual | TEXT? | HC4 conditional |
| consume_sustancias | BOOLEAN | Default false, HC4 |
| cuales_sustancias | TEXT? | HC4 conditional |
| frecuencia_sustancias | TEXT? | HC4 conditional |
| higiene_bucal | BOOLEAN | Default false, HC4 |
| frecuencia_higiene | TEXT? | HC4 conditional |
| observaciones_hc5 | TEXT? | HC5 |

### Table: `family_conditions`
Many per patient. HC3 data.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| patient_id | UUID | FK → patients.id, CASCADE |
| condition_name | TEXT | e.g. 'Diabetes', 'HTA', 'Cancer' |
| has_condition | BOOLEAN | Default false |
| tipo | TEXT? | For Cancer, Malformaciones |
| relatives | JSONB | `{ padre: bool, madre: bool, abuelos: bool, hermanos: bool }` |
| | | UNIQUE(patient_id, condition_name) |

---

## Skip Behavior
When the user skips Historial Clínico during registration, the system creates a `clinical_details` row with all optional fields set to null. This keeps a consistent lookup path (every patient always has a `clinical_details` row) and avoids null-checking everywhere in the UI.

---

## Migration Phases

### Phase 0 — Docker + Prisma Setup ✅
1. Create `docker-compose.yml` in project root
2. Add `DATABASE_URL` + `DB_PASSWORD` to `.env`
3. `npm install prisma @prisma/client`
4. `npx prisma init` — creates `prisma/schema.prisma`
5. Define the full schema (6 models)
6. `docker compose up -d` — start PostgreSQL container
7. `npx prisma migrate dev --name init` — create tables
8. Create `src/lib/db.ts` — Prisma client singleton
9. Create `prisma/seed.ts` — export Google Sheets data → import into PostgreSQL
10. `npx prisma db seed` — run seed

### Phase 1 — Replace Backend ✅
1. Rewrite `src/lib/actions.ts` — replace all `postToActionAPI()` calls with Prisma queries
2. Rewrite `src/app/api/proxy/route.ts` — handle GET/POST actions with Prisma instead of forwarding to Google Sheets
3. Remove `src/app/api/pacientes/route.ts` — redundant
4. Rewrite `src/lib/calendar-api.ts` — `getPatientName()` now uses Prisma instead of Google Script URL, timezone configurable via `TIMEZONE` env var
5. All existing CRUD works against PostgreSQL

### Phase 2 — Build Clinical Details (Multi-step HC Wizard) ✅
1. ✅ Extend Prisma schema with `clinical_details` + `family_conditions`
2. ✅ `npx prisma migrate dev` — new tables
3. ✅ Build **HC1** step (Fecha auto + Nombre del Odontólogo editable + all patient data read-only → saves `nombreOdontologo` to `clinical_details`)
4. ✅ Build **HC2** step (nombre_odontologo default + motivo_consulta + antecedentes_personales → `clinical_details`)
5. ✅ Build **HC3** step (condition cards with checkboxes + relative checkboxes → `family_conditions`)
6. ✅ Build **HC4** step (yes/no questions with conditional text fields → `clinical_details`)
7. ✅ Build **HC5** (Exploración Bucal → `clinical_details.observacionesHc5`) + **HC6** (Odontograma interactivo with full `op-odontogram` library integration → `FloatingToothDetailsCard` with SVG surface selector)
8. ✅ Wire into workflow — 6-step mini-wizard (HC1 → HC2 → HC3 → HC4 → HC5 → HC6 → Cita)
9. Build patient detail tabs — "Ficha Clínica" / "Consultas"

---

## Relevant Files

| File | Status |
|---|---|
| `docker-compose.yml` | ✅ PostgreSQL 16 container |
| `.env` | ✅ `DATABASE_URL`, `DB_PASSWORD`, `TIMEZONE`, `NEXT_PUBLIC_GOOGLE_CALENDAR_ID` |
| `prisma/schema.prisma` | ✅ 6 models with UUID PKs |
| `prisma/migrations/` | ✅ Initial migration |
| `prisma/seed.ts` | ✅ Data from Google Sheets → PostgreSQL |
| `src/lib/db.ts` | ✅ Prisma 7 singleton with adapter-pg |
| `src/lib/actions.ts` | ✅ All server actions use Prisma directly |
| `src/lib/api.ts` | ✅ Calls proxy GET (returns raw Prisma data) |
| `src/lib/calendar-api.ts` | ✅ Uses Prisma for patient lookups, configurable timezone, camelCase fields |
| `src/app/api/proxy/route.ts` | ✅ Returns Prisma data with field names mapped to frontend expectations (`appointments` → `citas`, `clinicalHistory` → `historialClinico`) via `mapPatientFields()` |
| `src/app/api/pacientes/route.ts` | ❌ Removed (redundant) |
| `src/types/index.ts` | ✅ Updated to camelCase — `Patient`, `ClinicalHistory`, `Appointment` interfaces; sexo/estadoCivil/ocupacion/escolaridad moved from ClinicalHistory to Patient |
| `src/components/sequential-workflow.tsx` | ✅ HC1 step inserted between Paciente and Cita; old history step removed |
| `src/components/medical-history-form.tsx` | ⏳ Still used from patient detail page; sexo/estadoCivil/ocupacion/escolaridad removed |
| `src/components/hc1-form.tsx` | ✅ New — HC1 review step (read-only patient data + odontólogo) |
| `src/app/pacientes/[id]/page.tsx` | ⏳ Add tab/accordion layout in Phase 2; parent name/phone fields displayed when present |

---

## Key Decisions Log

| Date | Decision |
|---|---|
| 2026-06-28 | Primary keys will be UUID (`gen_random_uuid()`) |
| 2026-06-28 | Display IDs will use auto-increment serial_num + app-layer prefix getter |
| 2026-06-28 | Skip HC → creates empty `clinical_details` row with nulls |
| 2026-06-28 | Google Calendar sync stays as-is (independent of the data layer) |
| 2026-06-28 | PostgreSQL runs in Docker on Windows, not in WSL |
| 2026-06-28 | Development machine: Windows (Next.js), WSL (bash/git) |
| 2026-06-28 | Start clean — no backward-compatible ID mapping needed; UUIDs are the single ID format |
| 2026-06-28 | Server actions use Prisma directly (no HTTP roundtrip through proxy) |
| 2026-06-28 | Proxy route still handles GET data fetching for client-side `api.ts` |
| 2026-06-28 | Google Calendar timezone set via `TIMEZONE` env var (default America/Mexico_City) |
| 2026-06-28 | Patient name lookup in calendar sync uses Prisma, not Google Scripts |
| 2026-06-30 | All field names migrated from Google Sheets underscore style to Prisma-native camelCase across the entire stack |
| 2026-06-30 | `patientToOld()` / `historyToOld()` / `appointmentToOld()` transforms deleted — proxy GET returns raw Prisma data |
| 2026-06-30 | All 12 POST handlers in `/api/proxy` deleted — server actions handle all mutations directly |
| 2026-06-30 | `PatientFormData` type removed — each form self-types from its own Zod schema via `z.infer<>` |
| 2026-06-30 | Moved sexo, estado_civil, ocupacion, escolaridad from `ClinicalHistory` (per-visit) → `Patient` (permanent demographics). Renamed `genero` → `sexo` on Patient. |
| 2026-06-30 | HC1 implemented as review-only step (Fecha auto + odontólogo editable + read-only patient data). Workflow changed to: Registro → HC1 → Cita → Completed. |
| 2026-06-30 | Proxy route added `mapPatientFields()` to rename Prisma field names (`appointments` → `citas`, `clinicalHistory` → `historialClinico`) for frontend compatibility. Hidden `<input>` elements added to shadcn Select components (sexo, estadoCivil) so their values appear in FormData. |
| 2026-06-30 | Added "Si es menor de Edad" checkbox to patient registration. When checked, reveals 4 parent fields (nombrePadre, telefonoPadre, nombreMadre, telefonoMadre). Moved nombrePadre/nombreMadre from `ClinicalHistory` → `Patient`. Fixed .gitignore: `/*.sql` instead of `*.sql` to preserve Prisma migration files. |
| 2026-06-30 | Persisted `esMenor` boolean on Patient to preserve checkbox state across edit cycles. Hidden input name changed from `esMenorEdad` → `esMenor` to match Zod schema. Edit modal widened and scrollable. |
| 2026-07-01 | HC2 (Antecedentes Personales) added as step between HC1 and Cita. Changed `clinical_details.antecedentes_personales` from `String?` to `Json?` to store structured conditions array. New `hc2-form.tsx` with 31-condition table, motivoConsulta, odontólogo. Workflow: Paciente → HC1 → HC2 → Cita → Completed. |
| 2026-07-01 | Added "Regresar" buttons on all workflow steps (HC1 → Patient edit mode, HC2 → HC1, Cita → HC2). Navigation back from HC1 fetches patient data via `getPatientById`, maps to form initialData, and renders `PatientForm` in edit mode with `updatePatient.bind()`. |
| 2026-07-01 | Fixed missing historial on profile page: added `addEmptyHistorial()` call when workflow completes (after appointment saved). Creates placeholder `ClinicalHistory` record so profile page doesn't show "No hay registros". |
| 2026-07-01 | Fixed delete-patient race condition: removed `onDataUpdate()` call after successful delete — `router.push("/")` handles navigation away; no need to reload deleted patient data. |
| 2026-07-01 | Added duplicate patient detection: before `prisma.patient.create()`, checks for existing patient with same `nombres + apellidos + fechaNacimiento + telefonoPrincipal`. If found, returns existing `patientId` instead of creating a duplicate. DNI not used (Mexico). |
| 2026-07-01 | Replaced flat HC2 step with nested "Historia Clínica" parent step (6 sub-steps). Sub-step counter on main step indicator shows "X de 6". Paso 2 is empty placeholder with "Antecedentes Personales" title + "Continuar" button. |
| 2026-07-01 | Replaced empty paso 2 placeholder with HC3 (Antecedentes Heredo-Familiares) form. 7 condition rows with checkbox, ¿Quién? dropdown, and Tipo free-text for Cáncer/Malformaciones. Saves to `family_conditions` table via `saveHc3`. |
| 2026-07-01 | Added HC4 (Antecedentes Personales No Patológicos) — 10 yes/no questions with conditional inputs. All columns already existed in `clinical_details` schema. Flow: HC3 → HC4 → Cita. |
| 2026-07-01 | Added HC5 (Exploración Bucal) — Tejidos Blandos textarea + Oclusión section with 12 fields. Stored as JSON string in `clinical_details.observacionesHc5`. Flow: HC4 → HC5 → Cita. |
| 2026-07-02 | Integrated full `op-odontogram` library as HC6 (Odontograma, sub-step 5 of 6). 15 library files in `src/lib/odontograma/`. Components adapted: ColorLegend (open by default, xl:grid-cols-9), FloatingToothDetailsCard (3-tab panel, SVG surface selector, grid-cols-4 status grid). Modal sized to 1380×950 for adequate space. Scale reduced to `lg:scale-[0.93]` to prevent overflow. Light-mode tooth colors hardcoded to Tailwind (pink/purple/orange) because shadcn `--secondary` maps to light gray, not DaisyUI purple. Button `type="button"` fix prevents form submission. Layout: `lg:grid-cols-3` with always-visible right panel. |
| 2026-07-02 | All HC6 commits went directly to `main` (no branch). Build verified passing. |
