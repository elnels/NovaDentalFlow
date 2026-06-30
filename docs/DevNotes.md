# Session Notes: DNI & Address Modifications

## Branches Created

### 1. `DNInoMandatory` (merged to main)
Made DNI field optional across the stack:
- **Type** (`src/types/index.ts`): `DNI: string` → `DNI?: string`
- **Server validation** (`src/lib/actions.ts`): `z.string().min(8)` → `z.string().optional().or(z.literal(""))`
- **Form validation** (`src/components/patient-form.tsx`): `z.string().min(1).regex(...)` → `z.string().optional().or(z.literal(""))`
- **Detail display** (`src/app/pacientes/[id]/page.tsx`): Added fallback `|| "No registrado"`
- **Table display** (`src/components/patients-table.tsx`): Added fallback for table row

### 2. `DNIremovedFromUI` (merged to main)
Removed DNI field entirely from the UI:
- Removed DNI Zod field from `patient-form.tsx` schema
- Removed `DNI: ""` from form default values
- Removed DNI `<FormField>` block from the form render
- Removed `DNI: patient.DNI` from `edit-patient-modal.tsx` initialData
- Removed `<InfoItem>` for DNI from patient detail page
- Removed DNI from search filter in `patients-table.tsx`
- Removed DNI from table row display (replaced with `ID: {patient.ID_Paciente}`)
- Removed DNI from search placeholder text

### 3. `AddressIsOptinal` (merged to main)
Made Dirección field optional (kept in UI):
- **Type** (`src/types/index.ts`): `Direccion: string` → `Direccion?: string`
- **Server validation** (`src/lib/actions.ts`): `z.string().min(5)` → `z.string().optional().or(z.literal(""))`
- **Form validation** (`src/components/patient-form.tsx`): `z.string().min(5)` → `z.string().optional().or(z.literal(""))`
- **Detail display** (`src/app/pacientes/[id]/page.tsx`): Added fallback `|| "No registrada"`

### 4. `google-calendar-embed` (merged to main)
Added Google Calendar embed module:
- **New files**:
  - `src/components/calendar-embed.tsx` — Calendar iframe component with loading/error/unconfigured states
  - `src/lib/calendar.ts` — Calendar config and embed URL builder from env var
  - `src/types/calendar.ts` — Calendar types (CalendarConfig, CalendarView)
- **Modified** `src/app/page.tsx` — Added "Calendario" button on landing page and modal overlay view with AnimatePresence
- **Modified** `README.md` — Added Step 2 in local deployment guide for `NEXT_PUBLIC_GOOGLE_CALENDAR_ID` env var
- Uses private Google Calendar sharing (not public) — users authenticate via their own Google account
- **Architecture**: Independent module ready for Part 2 (Google Calendar API sync)

### 5. `google-calendar-api-sync` (merged to main)
Added Google Calendar API sync for appointments:
- **New dependency**: `googleapis` npm package
- **New file**: `src/lib/calendar-api.ts`
  - `initCalendar()` — auth via `GoogleAuth` (auto-reads `GOOGLE_APPLICATION_CREDENTIALS`)
  - `createCalendarEvent()` / `updateCalendarEvent()` / `deleteCalendarEvent()`
  - `findEventByAppointmentId()` — searches by `DentalFlow|CITA-xxx|` marker in description
  - `syncCreateEvent()` / `syncUpdateEvent()` / `syncDeleteEvent()` — fire-and-forget wrappers
  - `getPatientName()` — fetches patient name from Apps Script by ID
  - Tracks statuses: `"Programada"` | `"Confirmada"` | `"Cancelada"`
- **Modified**: `src/lib/actions.ts`
  - `addCita` / `addCitaFromObject` — after success → `syncCreateEvent()`
  - `updateCita` — after success → `syncUpdateEvent()`
  - `deleteCita` — after success → `syncDeleteEvent()`
  - `updatePatientField` — **NEW**: when `Estado_Cita` changes on appointment, fetches full appointment + `syncUpdateEvent()`
  - All sync calls fire-and-forget (`.catch()`) — never block the user
- **Issues & fixes**:
  | Issue | Fix |
  |---|---|
  | `GOOGLE_APPLICATION_CREDENTIALS` path doubled (`.\NovaDentalFlow\...`) | Windows absolute path |
  | WSL path doesn't work with Windows Node.js | `C:\Users\...` path |
  | Apps Script 5-min cache returns stale status | Overwrite `Estado_Cita` with `newValue` after fetch |
  | `updatePatientField` bypassed sync | Added conditional sync on `Estado_Cita` changes |
- **Test result**: All statuses sync correctly — `Programada` (create), `Confirmada` (update), `Cancelada` (cancelled in calendar)

### 6. `workflow-reorder` (not yet merged)
Reordered the sequential registration flow from Paciente → Cita → Historial to Paciente → Historial → Cita:
- **`src/components/sequential-workflow.tsx`**:
  - Step definitions reordered (patient → history → appointment → completed)
  - Handler transitions updated: `handlePatientSuccess` → history, `handleHistorySuccess` → appointment, `handleAppointmentSuccess` → completed, `handleSkipHistory` → appointment (no longer needs `appointmentId`)
  - Rendering blocks swapped (history step renders before appointment)
  - History step condition no longer requires `appointmentId` (only `patientId`)
  - Skip button text: "Omitir y Finalizar Registro" → "Omitir y Continuar a Cita"
  - Completed screen badges and messages reordered to reflect Paciente → Historial → Cita
- **`src/components/medical-history-form.tsx`**:
  - `appointmentId` prop made optional (`appointmentId?: string`)
  - Default values and form reset handle `undefined` with fallback to `""`
  - Hidden `ID_Cita` input rendered only when `appointmentId` is provided
- **Build**: Verified passes

### 7. `calendar-sync-from-profile` (added to `workflow-reorder` branch)
Fixed Google Calendar sync not triggering when adding appointments from the patient profile page ("Programar Nueva Cita" modal):
- **`src/lib/actions.ts`**:
  - Both `addCita` and `addCitaFromObject` now try both `result.data?.ID_Cita` and `result.data?.appointmentId` key names (API response format was ambiguous)
  - `.catch(() => {})` → `.catch((err) => console.error(...))` — calendar sync errors are now logged
  - Added logging of `result.data` response and warnings when `appointmentId` is missing
- **Root cause**: `addCitaFromObject` read `result.data?.ID_Cita` while `addCita` read `result.data?.appointmentId`. If the Apps Script returned the other key, the sync silently skipped.

### 8. `homepage-card-width` (merged to main)
Increased the homepage hero card width:
- **`src/app/page.tsx`**: `max-w-2xl` (672px) → `max-w-4xl` (896px), +112px each side

### 9. `default-doctor` (merged to main)
Pre-filled Doctor field with default value "Dra Elsa Hernandez":
- **`src/components/appointment-form.tsx`**: Default value from `""` → `"Dra Elsa Hernandez"`, label from `"ID del Doctor"` → `"Doctor"`, placeholder from `"Ingrese el ID del doctor"` → `"Nombre del doctor"`
- **`src/components/citas-table.tsx`**: Default value from `''` → `'Dra Elsa Hernandez'`

### 10. `add-sexo-field` (merged to main)
Added Sexo field (Masculino/Femenino) to Historial Clínico:
- **Procedure**: Sheet column → Apps Script → Backend test (no deploy needed) → UI
- **`codigo.gs`**: `addHistorial` & `updateHistorial` append `data.Sexo` to their row arrays
- **`src/types/index.ts`**: `Sexo?: 'Masculino' | 'Femenino' | ''` on `ClinicalHistory`
- **`src/lib/actions.ts`**: `Sexo: z.enum(["Masculino", "Femenino"]).optional().or(z.literal(""))` in `medicalHistorySchema`
- **`src/components/medical-history-form.tsx`**: Sexo select field added to form (between Prescripciones and Costo/Estado grid)
- **`src/components/historial-table.tsx`**: Sexo column in table (EditableCell with select), add dialog field
- **Test**: Apps Script test function run directly in editor before any UI work

## Current Branch Status
| Branch | Merged to main | Status |
|---|---|---|---|
| `DNInoMandatory` | ✅ | Complete |
| `DNIremovedFromUI` | ✅ | Complete |
| `AddressIsOptinal` | ✅ | Complete |
| `google-calendar-embed` | ✅ | Complete |
| `google-calendar-api-sync` | ✅ | Complete |
| `workflow-reorder` | ✅ | Complete |
| `homepage-card-width` | ✅ | Complete |
| `default-doctor` | ✅ | Complete |
| `add-sexo-field` | ✅ | Complete |
| `historia-clinica` | ✅ | Complete |
| `DBMigration` | ✅ | Phase 0+1 merged (full Prisma/PostgreSQL backend) |

### 11. `historial-clinico-new-fields` (reverted)
Experimented with adding 9 new fields to Historial Clínico (Sexo, Estado Civil, Ocupación, Escolaridad, datos de padres, Motivo Consulta, Antecedentes Personales grid). Required Apps Script changes failed to deploy — reverted completely.

### 12. `HistoriaClinicaMods` (reverted — branch deleted)
Second attempt at adding the same 8 fields (Estado Civil, Ocupación, Escolaridad, Nombre Padre/Madre, Teléfono, Motivo Consulta, Antecedentes grid). Followed the 5-step workflow (sheet → codigo.gs → test → UI → build). Step 3 test passed (local editor), but when deployed the live API silently ignored new fields after Sexo. Root cause unclear — possibly header/column misalignment between the row array and sheet layout. Rolled back to main (Sexo only) to re-plan.

| Branch | Merged to main | Status |
|---|---|---|
| `HistoriaClinicaMods` | ❌ | Reverted |

### 13. `historia-clinica` (merged to main)
Branch for exploring Historial Clínico expansion in small chunks. Diagnostic phase completed on 2026-06-27.

#### Diagnostic: Column Mapping — `addHistorial()` Row Array vs Sheet
Called `debugSheetHeaders()` via `GET /api/debug-headers` on the live Google Sheet. The `Historial_Clinico` sheet already has **19 columns** (added by the two previous failed attempts).

| Array Index | Code Writes (`codigo.gs:374`) | Sheet Header | Status |
|---|---|---|---|
| 0 | `newId` | `ID_Historial` | ✅ |
| 1 | `data.ID_Paciente` | `ID_Paciente` | ✅ |
| 2 | `data.ID_Cita` | `ID_Cita` | ✅ |
| 3 | `data.Fecha_Historial` | `Fecha_Tratamiento` | ✅ writes to right column (positional) |
| 4 | `data.Diagnostico` | `Diagnostico` | ✅ |
| 5 | `data.Tratamiento_Realizado` | `Tratamiento_Realizado` | ✅ |
| 6 | `data.Prescripciones` | `Prescripciones` | ✅ |
| 7 | `data.Notas_Adicionales` | `Notas_Adicionales` | ✅ |
| 8 | `data.Costo_Tratamiento` | `Costo_Tratamiento` | ✅ |
| 9 | `data.Estado_Pago` | `Estado_Pago` | ✅ |
| 10 | `data.Sexo` | `sexo` | ✅ case mismatch fixed (sends `'sexo'` to updateField) |
| 11 | `data.Estado_Civil` | `Estado_Civil` | ✅ |
| 12 | `data.Ocupacion` | `Ocupacion` | ✅ |
| 13 | `data.Escolaridad` | `Escolaridad` | ✅ |
| 14 | `data.Nombre_Padre` | `Nombre_Padre` | ✅ |
| 15 | `data.Nombre_Madre` | `Nombre_Madre` | ✅ |
| 16 | `data.Telefono_Contacto` | `Telefono_Contacto` | ✅ |
| 17 | `data.Motivo_Consulta` | `Motivo_Consulta` | ✅ |
| 18 | `data.Antecedentes_Personales` | `Antecedentes_Personales` | ✅ |

Two misalignments found:
1. **Sexo vs sexo** (case) — `updateField()` uses `headers.indexOf(fieldName)` which is case-sensitive. Editing Sexo via `historial-table.tsx` will fail with `Campo 'Sexo' no encontrado en la hoja.` Need to send lowercase `sexo` to the API, or map it.
2. **Fecha_Historial vs Fecha_Tratamiento** — The sheet header uses `Fecha_Tratamiento` but the code throughout uses `Fecha_Historial`. Works positionally in `addHistorial`/`updateHistorial`, but `updateField` would fail if passed `Fecha_Historial` to the case-sensitive header lookup.

#### Chunk 2 — Fix Sexo/sexo case mismatch (complete)
- **Root cause**: Sheet header is `sexo` (lowercase) but `historial-table.tsx` sent `'Sexo'` (capitalized) to `updateField()`. The Apps Script `updateField()` uses `headers.indexOf(fieldName)` which is case-sensitive, so inline edit of Sexo threw `Campo 'Sexo' no encontrado en la hoja.`
- **Fix**: Changed `'Sexo'` → `'sexo'` in the EditableCell save call in `historial-table.tsx:509`
- **Lesson**: All `fieldName` values passed to `updateField()` must match the sheet header **exactly** (case-sensitive)

#### Chunk 3+4 — Add all remaining Historia Clinica fields (complete)
After testing confirmed the backend works, expanded all 7 remaining fields (Ocupacion, Escolaridad, Nombre_Padre, Nombre_Madre, Telefono_Contacto, Motivo_Consulta, Antecedentes_Personales) across the full stack.

**`codigo.gs`**: Both `addHistorial` and `updateHistorial` row arrays expanded to 19 elements (indices 0-18), matching all sheet columns.

**`src/types/index.ts`**: Added 7 fields to `ClinicalHistory`:
```
  Ocupacion?: string;
  Escolaridad?: string;
  Nombre_Padre?: string;
  Nombre_Madre?: string;
  Telefono_Contacto?: string;
  Motivo_Consulta?: string;
  Antecedentes_Personales?: string;
```

**`src/lib/actions.ts`**: Added all 7 to `medicalHistorySchema` Zod validation.

**`src/components/medical-history-form.tsx`**: Added form fields:
- Ocupacion / Escolaridad (2-col grid)
- Nombre_Padre / Nombre_Madre (2-col grid)
- Telefono_Contacto (full width Input)
- Motivo_Consulta (full width Textarea)
- Antecedentes_Personales (full width Textarea)

**`src/components/historial-table.tsx`**: Added columns, EditableCells, and fields in both add dialogs for all 7 fields.

#### Chunk 3+4 — All fields deployed and verified
All 8 fields (Estado_Civil + 7 from Chunk 4) are now saving to the sheet correctly from the UI. The key lesson: Apps Script **must be deployed as a new version** — saving the editor is not enough.

#### Verification
- `debugHeaders` + `debugSheetData` functions added to `src/lib/api.ts`
- Endpoint `/api/debug-headers` confirms sheet columns match discovered layout

### 14. `DBMigration` branch — Phase 0 & 1 (not merged)
Complete data layer migration from Google Sheets to PostgreSQL.

**Phase 0** — Infrastructure:
- `docker-compose.yml` for PostgreSQL 16 in Docker
- Prisma 7 with 6 models (UUID PKs + serial_num)
- `src/lib/db.ts` — Prisma singleton with `@prisma/adapter-pg`
- `prisma/seed.ts` — migrated 30 patients, 14 appointments, 20 history records

**Phase 1** — Backend rewrite:
- `src/lib/actions.ts`: all `postToActionAPI()` calls replaced with direct Prisma queries
- `src/app/api/proxy/route.ts`: now handles all actions with Prisma instead of forwarding to Google Scripts
- `src/app/api/pacientes/route.ts`: removed (redundant)
- `src/lib/calendar-api.ts`: `getPatientName()` uses Prisma instead of Google Script URL; timezone configurable via `TIMEZONE` env var (default `America/Mexico_City`)
- All CRUD operations verified working against PostgreSQL

**Key lesson**: Prisma 7 uses a completely different config model than v6 — no `url` in schema, requires driver adapters (`@prisma/adapter-pg`), and `prisma.config.ts` for configuration. The migration `seed` config goes under `migrations.seed`.

## Other Tasks
- Fixed `JSX.IntrinsicElements` error by running `npm install`
- Confirmed no unit test framework exists in the project
- Created session notes file `docs/DNIRemovedOptionalAddress.md` → renamed to `docs/DevNotes.md`
- Added Google Calendar config to README
