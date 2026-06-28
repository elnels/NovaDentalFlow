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
| genero | TEXT? | |
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
| sexo | TEXT? | |
| estado_civil | TEXT? | |
| ocupacion | TEXT? | |
| escolaridad | TEXT? | |
| nombre_padre | TEXT? | |
| nombre_madre | TEXT? | |
| telefono_contacto | TEXT? | |
| motivo_consulta | TEXT? | |
| antecedentes_personales | TEXT? | |
| exploracion_bucal | TEXT? | HC5 |
| observaciones | TEXT? | HC6 |
| diagnostico_presuncion | TEXT? | HC6 |
| estudios_auxiliares | TEXT? | HC6 |
| odontograma | JSON? | Future |

### Table: `clinical_details`
One row per patient (1:1). HC1–HC4 data.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| serial_num | INT | Auto-increment |
| patient_id | UUID | FK → patients.id, UNIQUE, CASCADE |
| nombre_odontologo | TEXT? | HC1 |
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

### Phase 0 — Docker + Prisma Setup
1. Create `docker-compose.yml` in project root
2. Add `DATABASE_URL` + `DB_PASSWORD` to `.env.local`
3. `npm install prisma @prisma/client`
4. `npx prisma init` — creates `prisma/schema.prisma`
5. Define the full schema (6 models)
6. `docker compose up -d` — start PostgreSQL container
7. `npx prisma migrate dev --name init` — create tables
8. Create `src/lib/db.ts` — Prisma client singleton
9. Create `prisma/seed.ts` — export Google Sheets data → import into PostgreSQL
10. `npx prisma db seed` — run seed

### Phase 1 — Replace Backend (app code unchanged)
1. Rewrite `src/lib/actions.ts` — replace all `postToActionAPI()` calls with Prisma queries
2. Update `src/lib/api.ts` — replace proxy calls with direct DB calls (or keep server actions)
3. Remove proxy routes (`/api/proxy/`, `/api/pacientes/`)
4. Archive `codigo.gs` (no longer needed)
5. Test all existing CRUD still works

### Phase 2 — Build Clinical Details (Multi-step HC Wizard)
1. Extend Prisma schema with `clinical_details` + `family_conditions`
2. `npx prisma migrate dev` — new tables
3. Build HC1 step (patient data pre-filled read-only + odontólogo)
4. Build HC2 step (motivo consulta + antecedentes personales)
5. Build HC3 step (condition cards with checkboxes + relative checkboxes)
6. Build HC4 step (yes/no questions with conditional text fields)
7. Build HC5 + HC6 (placeholders with textareas + legal footer)
8. Wire into workflow — replace single history step with 6-step mini-wizard
9. Build patient detail tabs — "Ficha Clínica" / "Consultas"

---

## Relevant Files

| File | Role in Migration |
|---|---|
| `docker-compose.yml` | To be created |
| `.env.local` | Add `DATABASE_URL` |
| `prisma/schema.prisma` | To be created |
| `src/lib/db.ts` | To be created — Prisma singleton |
| `prisma/seed.ts` | To be created |
| `src/lib/actions.ts` | Rewrite to use Prisma |
| `src/lib/api.ts` | Deprecate proxy calls |
| `src/app/api/proxy/route.ts` | Remove after migration |
| `src/app/api/pacientes/route.ts` | Remove after migration |
| `codigo.gs` | Archive after migration |
| `src/types/index.ts` | Align with new schema |
| `src/components/sequential-workflow.tsx` | Add 6-step HC sub-wizard |
| `src/components/medical-history-form.tsx` | Replace with multi-step wizard |
| `src/components/historial-table.tsx` | Becomes "Consultas" tab |
| `src/app/pacientes/[id]/page.tsx` | Add tab/accordion layout |

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
