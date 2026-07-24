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

### 6. `workflow-reorder` (merged to main)
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

### 7. `calendar-sync-from-profile` (merged to main via `workflow-reorder`)
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

### 10. `back-button` (merged to main)
Added back navigation across all workflow steps:

- **`hc1-form.tsx`**: Added `onBack` prop + "Regresar" button (outline, submit row)
- **`hc2-form.tsx`**: Added `onBack` prop + "Regresar" button
- **`appointment-form.tsx`**: Added `onBack` prop + "Regresar" button
- **`sequential-workflow.tsx`**: Added `patientEditData` state, `handleBackFromHc1` (fetches patient data via `getPatientById`, maps to `Partial<PatientFormData>`), `handleBackFromHc2` (sets step to hc1), `handleBackFromAppointment` (sets step to hc2). Patient step renders in edit mode when `patientEditData` is set.
- **`patient-form.tsx`**: Exported `PatientFormData` type
- **Null coercion**: Mapped Prisma `null` → `undefined` via `v => v ?? undefined` to fix React "value should not be null" error

### 11. `fix-empty-historial-workflow` (merged to main)
Created `ClinicalHistory` record on workflow completion so profile page shows historial:

- **Root cause**: HC1/HC2 restructure removed the old "Historial" step that called `addEmptyHistorial`. Profile page reads `clinicalHistory` relation — always empty.
- **`sequential-workflow.tsx`**: Imported `addEmptyHistorial`, called it in `handleAppointmentSuccess` after appointment is saved. Creates placeholder record with "Pendiente de completar" status, exactly like the old skip behavior.

### 12. `fix-delete-patient-error` (merged to main)
Fixed race condition error after deleting a patient:

- **Root cause**: `delete-patient-dialog.tsx` called `onDataUpdate()` (which tried to reload the deleted patient via `getPacienteById`) before `router.push("/")`. API returned "Paciente no encontrado".
- **Fix**: Removed `onDataUpdate()` call — navigation to `/` naturally fetches fresh patient list.

### 13. `dedup-patient-on-create` (merged to main)
Prevent duplicate patient creation:

- **Trigger**: User reported that the same patient could be registered multiple times.
- **Approach**: Option A — exact match on `nombres + apellidos + fechaNacimiento + telefonoPrincipal` (all four must match). DNI not used (Mexico).
- **`actions.ts`**: `addPatient` now does `prisma.patient.findFirst()` with the 4 fields before `create`. If found, returns existing `patientId` with message "El paciente ya existe. Cargando datos...". Workflow advances to HC1 with the existing patient.
- **UX**: No new UI needed — `onSuccess(patientId)` handles it the same as a new registration.

### 14. `LabelFixes` (merged to main)
Removed "(HC1)" / "(HC2)" suffixes from UI labels:
- **`hc1-form.tsx`**: CardTitle from "Revisión de Datos (HC1)" → "Revisión de Datos"
- **`hc2-form.tsx`**: CardTitle from "Antecedentes Personales (HC2)" → "Antecedentes Personales"; button from "Guardar y Continuar (HC2)" → "Guardar y Continuar"

### 15. `workflow-clinical-history` (merged to main)
Replaced flat HC2 step with nested "Historia Clínica" parent step containing sub-steps:

- **`sequential-workflow.tsx`**:
  - New `SubStep` type: `"antecedentesPersonales" | "paso2Placeholder"`
  - `totalSubSteps = 6` hardcoded; `subStepIndex()` maps each sub-step to 1-based index
  - **StepIndicator**: H. Clínica node shows sub-step number in circle (instead of FileText icon) when active, "X de 6" text below. Counter always visible even when on earlier workflow steps (Paciente, Revisión).
  - New sub-step renders:
    - **Paso 1** (`antecedentesPersonales`): existing HC2 form (title "Antecedentes Personales", "Guardar y Continuar" → advances to paso 2)
    - **Paso 2** (`paso2Placeholder`): empty card with title "Antecedentes Personales", "Continuar" button only → completes clinicalHistory, advances to Cita
  - Handlers: `handleAntecedentesPersonalesSuccess` now goes to `paso2Placeholder`; new `handlePaso2Continue` marks step done; `handleBackFromAppointment` → paso 2

### 16. `hc3-heredo-familiares` (merged to main)
Replaced empty paso 2 placeholder with Antecedentes Heredo-Familiares form (HC3):

- **`src/components/hc3-form.tsx`** (new):
  - Table with 7 family conditions: Diabetes, Hipertensión Arterial, Cáncer, Cardiópatas, Nefrópatas, Malformaciones, Otros
  - Each row: checkbox (Sí/No) → shows "¿Quién?" dropdown (Padre, Madre, Abuelo paterno, Abuelo materno, Ambos padres, Ambos abuelos)
  - Cáncer and Malformaciones show extra "Tipo" free-text input when checked
  - Otros shows a text input instead of dropdown (free-text "¿Quién?")
  - Malformaciones has no dropdown — "¿Quién?" shows "—"
  - Loads existing `familyCondition` records via `getFamilyConditions()`

- **`src/lib/actions.ts`**:
  - `hc3Schema`: `patientId + conditions (JSON string)`
  - `saveHc3`: deletes all existing `FamilyCondition` records for patient in a transaction, creates new ones for checked conditions
  - `getFamilyConditions`: fetches all `FamilyCondition` records for a patient

- **`src/components/sequential-workflow.tsx`**:
  - `SubStep type`: `"paso2Placeholder"` → `"antecedentesHeredoFamiliares"`
  - `subStepIndex()`: index 2 for new sub-step
  - `handleAntecedentesPersonalesSuccess` → `antecedentesHeredoFamiliares`
  - `handleAntecedentesHeredoFamiliaresSuccess` → completes + goes to Cita
  - `handleBackFromAntecedentesHeredoFamiliares` → back to antecedentesPersonales
  - `handleBackFromAppointment` → antecentesHeredoFamiliares

### 17. `hc4-no-patologicos` (merged to main)
Antecedentes Personales No Patológicos form (HC4) — 10 yes/no questions with conditional fields:

- **`src/components/hc4-form.tsx`** (new):
  - 10 questions with Sí/No radio toggle; conditional inputs revealed on "Sí"
  - Questions: bajo tratamiento médico, toma medicamentos, embarazada (solo mujeres), transfusiones, sangrado excesivo, cirugías, vacunas, alergias, consume sustancias (con ¿Cuáles? + Frecuencia), higiene bucal
  - Loads/saves via `clinicalDetails` (all columns already existed in DB schema)
  - Uses JSON serialization for all fields (same pattern as HC2/HC3)

- **`src/lib/actions.ts`**:
  - `hc4Schema`: `patientId + hc4Data (JSON string)`
  - `saveHc4`: upserts `clinical_details` with all 10 question fields (booleans + conditional text/date)

- **`src/components/sequential-workflow.tsx`**:
  - `SubStep type`: added `"antecedentesNoPatologicos"` (index 3)
  - `handleAntecedentesHeredoFamiliaresSuccess` → `antecedentesNoPatologicos` (not Cita)
  - `handleAntecedentesNoPatologicosSuccess` → completes + Cita
  - `handleBackFromAntecedentesNoPatologicos` → back to `antecedentesHeredoFamiliares`
  - `handleBackFromAppointment` → `antecedentesNoPatologicos`

### 18. `hc5-exploracion-bucal` (merged to main)
Exploración Bucal form (HC5) — sub-step 4 of 6:

- **`src/components/hc5-form.tsx`** (new):
  - **Tejidos Blandos**: full-width Textarea
  - **Oclusión** subsection (shaded bg border): Línea Media (Normal/Desviada + Notas), Planos Terminales D/I (Notas), Espacios Terminales (Sí/No + Superior/Inferior), Clase de Angle D/I (Notas), Mordida Cruzada (Sí/No + Superior/Inferior), Traslape Horizontal/Vertical (Sí/No + mm), Borde a Borde (Sí/No), Mordida Abierta (Sí/No), Hábitos Nocivos (Sí/No + ¿Cuál?)
  - Sí/No fields show conditional inputs only when "Sí" selected
  - Loads/saves from `clinical_details.observacionesHc5` as JSON string

- **`src/lib/actions.ts`**:
  - `hc5Schema`: `patientId + hc5Data (JSON string)`
  - `saveHc5`: upserts `clinical_details.observacionesHc5` with JSON string

- **`src/components/sequential-workflow.tsx`**:
  - `SubStep type`: added `"exploracionBucal"` (index 4 of 6)
  - Flow: HC4 → HC5 → Cita (HC5 is last sub-step until HC6)

### 19. `hc6-odontogram` (committed directly to main)
Full odontogram integration (HC6) — sub-step 5 of 6:

- **Library files** (`src/lib/odontograma/`): 15 files copied from local `op-odontorgram` clone
  - `Odontogram.tsx` — simplified to 6 clinical props, scale `lg:scale-[0.93]`
  - `DetailedToothComponent.tsx` — light-mode uses hardcoded Tailwind colors (pink/purple/orange)
  - `AlignedToothContainer.tsx`, `columns/*` — core arch layout
  - `ColorLegend.tsx` — open by default, `DetailedToothComponent` mini previews, `xl:grid-cols-9`
  - `FloatingToothDetailsCard/` — 3-tab panel (Estado/Notas/Historial), SVG surface selector, `grid-cols-4` status grid
  - `SurfacesSection.tsx` — 5 clickable SVG tooth surface zones (V/M/O/D/L)

- **`src/components/hc6-form.tsx`**: Interfaz panel — `lg:grid-cols-3` layout, right panel always visible with placeholder
- **`src/components/sequential-workflow.tsx`**: Added `"odontograma"` sub-step (index 5 of 6), conditional modal sizing (`max-w-[1380px] h-[950px]`), type fixes for `sexo`/`esMenor`
- **`tailwind.config.ts`**: Added `'./src/lib/**/*.{js,ts,jsx,tsx,mdx}'` to `content`

- **Fixes applied**: Button `type="button"` to prevent form submit, light-mode colors from shadcn semantic → hardcoded Tailwind, `lg:scale-100` → `lg:scale-[0.93]`, modal sized to 1380×950
- **Build**: Verified passes

## Current Branch Status
| Branch | Merged to main | Status |
|---|---|---|---|---|
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
| `refactor/camelcase-write-path` | ✅ | Write-path fields → camelCase |
| `refactor/camelcase-read-path` | ✅ | Read-path fields → camelCase; legacy transforms deleted |
| `HC1` | ✅ | Complete; added HC1 review step + restructured Patient/ClinicalHistory fields |
| `back-button` | ✅ | Complete |
| `fix-empty-historial-workflow` | ✅ | Complete |
| `fix-delete-patient-error` | ✅ | Complete |
| `dedup-patient-on-create` | ✅ | Complete |
| `LabelFixes` | ✅ | Complete |
| `workflow-clinical-history` | ✅ | Complete; restructured HC step with sub-steps + counter |
| `hc3-heredo-familiares` | ✅ | Complete; Antecedentes Heredo-Familiares replaces empty paso 2 |
| `hc4-no-patologicos` | ✅ | Complete; Antecedentes Personales No Patológicos |
| `hc5-exploracion-bucal` | ✅ | Complete; Exploración Bucal (sub-step 4) |
| `hc6-odontogram` (main, no branch) | ✅ | Complete; Odontograma interactivo (sub-step 5) |
| `hc6-post-integration-fixes` (main, no branch) | ✅ | Dark mode, removed extraneous fields, ColorLegend fix, Regresar style |
| `fix/hc6-status-buttons-submit-form` | ✅ | type=button + tool-select-only + selectedTooth sync |
| `feat/notas-guardar-cancelar` | ❌ | Guardar/Cancelar notes, DD/MM/YY prefix, accumulation |
| `feat/hc6-patient-info` | ❌ | Reverted — patient name/age in HC6 header broke something; rolled back to 6b7b938 |
| `fix/temporary-teeth-interaction` | ✅ | Merged via `fix/temporary-teeth-orange-borders` — temp teeth now fully interactive (updateTooth routes to correct array, resetTeeth resets both) |
| `fix/temporary-teeth-orange-borders` | ✅ | Temporary teeth visually match permanent (same status backgrounds, same borders); only label is `text-orange-500`. Surface base border uses same gray as permanent (`border-gray-300`/`border-gray-600`). |
| `feat/hc6-patient-header` | ✅ | Patient name & age in HC6 header below Fecha, white text on `bg-gray-800/50`. Restablecer button removed. |
| `feat/paciente-tab` | ✅ | Paciente tab with read-only card + edit modal; left sidebar panel removed |
| `fix/odontogram-tab-background` | ✅ | Odontogram wrapper bg-gray-900 + isDarkMode=true (matches ColorLegend) |
| `fix/hc5-readonly-fields` | ✅ | HC3/HC5 read-only: all fields shown with YesNoBadge (HC4-style) |
| `feat/odontogram-temp-teeth-default` | ✅ | "Dientes temporales" auto-enables for minor patients |
| `fix/odontogram-status-not-erupted` | ✅ | Added "No erupcionado" to status selection panel |
| `fix/date-format-mx` | ✅ | Standardized all dates to DD/MM/YYYY, 24h time, 4-digit years; created `src/lib/formatDate.ts` utility |
| `fix/html-lang-es-mx` | ✅ | HTML lang set to es-MX for correct date input locale |
| `fix/remove-header-edit-button` | ✅ | Removed EditOptionsMenu from sticky header |
| `fix/tab-stay-on-edit` | ✅ | Background refreshes skip loading spinner, Tabs stays mounted |
| `fix/tab-rename` | ✅ | Historial → Historial de Tratamientos, Ficha Clínica → Historia Clínica |
| `feat/initial-motivo-consulta` | ✅ | Initial motivoConsulta shown at top of Historial de Tratamientos tab |
| `feat/pricing-procedures-payments` | ✅ | Phase 1: ProcedureCatalog + ProcedureLineItem models, admin CRUD page, itemized costs, dual-write backward compat, seed 25 procedures |
| `fecha-creacion-hc-readonly` | ❌ | Read-only creation date on Historia Clínica tab |
| `feat/auto-generate-procedure-code` | ❌ | Auto-generate procedure code on category selection, code input readOnly |
| `feat/testing-setup-vitest` | ❌ | Vitest with jsdom, 19 tests; Playwright-ready structure |

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

### 14. `DBMigration` branch — Phase 0 & 1 (merged to main)
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

### 15. `refactor/camelcase-write-path` (merged to main)
Renamed all write-path fields from Google Sheets underscore style to Prisma-native camelCase:
- **`src/lib/actions.ts`**: All 3 Zod schemas (`patientSchema`, `appointmentSchema`, `medicalHistorySchema`) + Prisma `data` mappings → camelCase
- **`src/components/patient-form.tsx`**: Zod schema, `defaultValues`, all `FormField name` props → camelCase
- **`src/components/appointment-form.tsx`**: Same — all field names → camelCase
- **`src/components/medical-history-form.tsx`**: Same — all field names → camelCase
- **`src/lib/calendar-api.ts`**: All `Appointment` field refs in Google Calendar sync functions → camelCase
- **`src/app/pacientes/[id]/page.tsx`**: Added old→new mapping in `handleAddCita`/`handleAddHistorial` callers (bridging table components still sending old names)
- **`src/components/edit-patient-modal.tsx`**: Removed `PatientFormData` import; `initialData` builds camelCase keys from old-format GET data
- **Architecture**: Server-action-first — write path updated before read path

### 16. `refactor/camelcase-read-path` (merged to main)
Renamed read-path fields and eliminated legacy transform layer:
- **`src/types/index.ts`**: `Patient`, `ClinicalHistory`, `Appointment` interfaces → camelCase; removed `PatientFormData` (each form self-types from its Zod schema)
- **`src/app/api/proxy/route.ts`**: Deleted `patientToOld()`, `historyToOld()`, `appointmentToOld()` transforms; deleted all 12 dead POST handlers (468→106 lines); GET returns raw Prisma data
- **`src/components/citas-table.tsx`**: All field refs (data, state, string args, spread keys) → camelCase
- **`src/components/historial-table.tsx`**: Same — all field refs → camelCase
- **`src/components/patients-table.tsx`**: `patient.field` refs → camelCase
- **`src/app/pacientes/[id]/page.tsx`**: Removed type import; all `patient.field` refs → camelCase; simplified `handleAddCita`/`handleAddHistorial` (table components now send camelCase)
- **`src/components/edit-patient-modal.tsx`**: `patient.field` refs → camelCase

### 17. `HC1` branch (merged to main)
Restructured Historial Clínico: moved 4 demographic fields from per-visit (`ClinicalHistory`) to per-patient (`Patient`), renamed `genero` → `sexo`, and built HC1 review step.

**Schema + Migration:**
- `Patient`: renamed `genero` → `sexo`; added `estadoCivil`, `ocupacion`, `escolaridad`
- `ClinicalHistory`: removed `sexo`, `estadoCivil`, `ocupacion`, `escolaridad`
- Migration: `20260630191356_restructure_patient_fields`

**Registration form (`patient-form.tsx`):**
- Added sexo (dropdown: Mas/Fem/Otro), estadoCivil (dropdown), ocupacion (text), escolaridad (text) — all optional

**Server actions (`actions.ts`):**
- `patientSchema`: renamed `genero` → `sexo`, added 3 fields
- `medicalHistorySchema`: removed 4 fields; removed from Prisma `data` mappings and `historyFieldMap`
- Added `saveHc1Odontologo` — upserts `nombreOdontologo` to `clinical_details`
- Added `getPatientById` — server function for patient lookup

**Medical history form + table:**
- `medical-history-form.tsx`: removed 4 form field blocks + Zod entries
- `historial-table.tsx`: removed sexo/estadoCivil/ocupacion/escolaridad columns, add dialog fields, and EditableCells

**HC1 component (`hc1-form.tsx`):**
- New component: displays Fecha (today auto), Nombre del Odontólogo (editable, default "Dra Elsa Hernández"), all patient data read-only

**Workflow change:**
- Before: Paciente → Historial (old form) → Cita
- After: Paciente → **HC1** (review + odontólogo) → Cita
- Old `MedicalHistoryForm` removed from workflow; still available from patient detail page

**Proxy field-name mapping fix:**
- The proxy route (`/api/proxy/route.ts`) returned raw Prisma data with field names `appointments` and `clinicalHistory`, but the frontend expects `citas` and `historialClinico`. Added `mapPatientFields()` in the `ok()` helper to rename these fields before returning. This fixed appointments showing in Google Calendar but not on the patient detail page.

### 7. `esMenosConditional` (merged to main)
Added "Si es menor de Edad" checkbox to patient registration and moved parent fields from ClinicalHistory to Patient.

**Schema + Migration:**
- `Patient`: added `nombrePadre`, `nombreMadre`, `telefonoPadre`, `telefonoMadre`
- `ClinicalHistory`: removed `nombrePadre`, `nombreMadre`
- Migration: `20260630215745_add_parent_fields_to_patient`

**Registration form (`patient-form.tsx`):**
- Added checkbox `[ ] Si es menor de Edad` (UI toggle, not stored)
- When checked, reveals 4 fields: Nombre del Padre, Teléfono del Padre, Nombre de la Madre, Teléfono de la Madre
- Hidden input for checkbox state (same pattern as Select fields)

**Server actions (`actions.ts`):**
- `patientSchema`: added `nombrePadre`, `nombreMadre`, `telefonoPadre`, `telefonoMadre`
- `medicalHistorySchema`: removed `nombrePadre`, `nombreMadre`
- `addPatient` / `updatePatient`: persist 4 parent fields to Patient
- `addHistorial` / `addHistorialFromObject`: removed parent fields from Prisma create

**Medical history form + edit modal:**
- `medical-history-form.tsx`: removed nombrePadre/nombreMadre from schema, defaults, reset, and UI
- `edit-patient-modal.tsx`: added 4 parent fields to `initialData`

**Patient detail page (`pacientes/[id]/page.tsx`):**
- Conditionally shows parent names/phones when present

**Fixed `.gitignore`:**
- `*.sql` → `/*.sql` so Prisma migration files aren't blocked

### 8. `esMenorBool` (merged to main)
Persisted "Si es menor de Edad" checkbox state so it pre-checks correctly when editing a patient.

**Schema + Migration:**
- `Patient`: added `esMenor Boolean @default(false) @map("es_menor")`
- Migration: `20260630225025_add_es_menor_to_patient`

**Registration form (`patient-form.tsx`):**
- Checkbox reads `initialData.esMenor` instead of hardcoded `false`
- Hidden input name changed from `esMenorEdad` → `esMenor` to match Zod schema

**Server actions (`actions.ts`):**
- `patientSchema`: added `esMenor: z.string().optional()`
- `addPatient` / `updatePatient`: convert `esMenor === "true"` to boolean for Prisma

**Edit modal (`edit-patient-modal.tsx`):**
- Passes `patient.esMenor` to `initialData.esMenor`
- Added overflow scroll and widened to `max-w-4xl`

**Fixed edit modal layout:**
- Added `max-h-[85vh] overflow-y-auto` for scrolling support
- Widened from `sm:max-w-[425px]` to `max-w-4xl` to match registro-completo form

### 9. `hc2` (merged to main)
Added Antecedentes Personales step (HC2) between HC1 and Cita in the registration workflow.

**Schema + Migration:**
- `ClinicalDetails.antecedentesPersonales`: `String?` → `Json?` (stores array of conditions)
- Migration: `20260701002934_add_antecedentes_personales_json`

**New component (`hc2-form.tsx`):**
- Odontólogo field (editable, pre-filled from `clinical_details.nombreOdontologo` or default "Dra Elsa Hernández")
- Motivo de Consulta textarea → saved to `clinical_details.motivo_consulta`
- 31-row conditions table with checkbox (Sí/No) + conditional Edad input
- Cáncer row shows extra detail field when checked ("Especifique el tipo...")
- "Otra condición" free-text input for custom conditions
- All conditions serialized as JSON hidden input for FormData submission

**Server actions (`actions.ts`):**
- `hc2Schema`: `patientId`, `nombreOdontologo`, `motivoConsulta`, `antecedentesPersonales`
- `saveHc2`: upserts `clinical_details` with parsed JSON conditions
- `getPatientById`: extended to include `clinicalDetails` relation

**Workflow (`sequential-workflow.tsx`):**
- New step order: Patient → HC1 → **HC2** → Cita → Completed

**Reference documents added to docs/:**
- `Antecedentes_Personales.csv` — 31 conditions list
- `Antecedentes_Personales.png` — form layout reference

### 20. `hc6-post-integration-fixes` (committed directly to main)
Post-integration fixes and cleanup after HC6 odontogram was added:

- **Removed extraneous HC6 text fields**: Diagnóstico de Presunción, Estudios Auxiliares, Observaciones removed from form — these were remnants from an earlier design that don't belong in the odontogram step. Prisma schema dropped `observaciones_hc6` (clinical_details), `diagnostico_presuncion`, `estudios_auxiliares`, `observaciones` (clinical_history). Migration: `20260703175214_drop_hc6_diagnostico_estudios_observaciones`.

- **Dark mode fixes**: Replaced all shadcn CSS variable classes (`bg-muted/10`, `text-muted-foreground`, `bg-background`, `border-border`, etc.) with hardcoded Tailwind dark colors (`bg-gray-900`, `text-gray-400`, `border-gray-700`) across all 10 odontogram component files. Set Card background to `!bg-[rgb(30,30,30)]`. This fixed the odontogram appearing as light gray boxes instead of a proper dark theme. The `ColorLegend` and `FloatingToothDetailsCard` now accept `isDarkMode`/`theme` props.

- **ColorLegend repositioned**: Moved outside the odontogram grid (`lg:col-span-2`) to below the entire grid to prevent overflow and ensure full width. Padding adjusted (`p-6`).

- **Regresar button style**: Changed `variant="outline"` → `variant="default"` to match Continuar button style.

- **Columns component refactor**: `OdontogramColumn1`/`Column2`/`Column3` and `types.ts` received dark mode styling pass (101 insertions/133 deletions across column components).

### 21. `fix/hc6-status-buttons-submit-form` (merged to main)
Fixed HC6 odontogram status buttons and surface painting:

- **`type="button"` on all buttons**: Tab buttons (Estado/Notas/Historial), status grid buttons (Selecciona un estado), and "Aplicar a todo el diente" button were missing `type="button"`. Inside the HC6 `<form>`, they defaulted to `type="submit"`, causing form submission → advancing to Programar Cita step.
- **Status buttons select tool only**: Removed `onUpdateTooth(tooth.id, { status })` from `handleStatusChange`. Status buttons now just set `selectedTool` (the brush) without modifying the tooth.
- **`selectedTooth` synced on update**: `updateTooth` in `hc6-form.tsx` now also updates `selectedTooth` via `setSelectedTooth`. Previously only `teeth[]` was updated, leaving `selectedTooth` stale — causing surface clicks to overwrite rather than accumulate, and the SVG right panel showing stale colors.

### 22. `feat/notas-guardar-cancelar` (not yet merged)
Added Guardar/Cancelar flow to the Notas tab in FloatingToothDetailsCard (right panel of HC6 odontogram):

- **Guardar/Cancelar buttons**: Textarea uses local draft state — no auto-save on keystroke. Guardar saves via `onUpdateTooth`, Cancelar discards draft.
- **Dated accumulation**: Each save prepends `DD/MM/YY -` to the note and appends it to existing notes (newline-separated). Multiple notes accumulate in `tooth.notes`.
- **Multi-entry display**: "Historial de notas:" section renders each dated entry as a separate card with date in small gray text and note body below (matching the Historial tab procedure card style).
- **Textarea clears on tooth switch**: When clicking a different tooth, textarea starts blank ready for a new note; history section still loads previous notes correctly.

### 23. `feat/hc6-patient-info` (reverted — superseded by `feat/hc6-patient-header`)
First attempt at patient name/age in HC6 header. White text on gray-800/50, "Name:" → "Nombre:". Caused a regression — rolled back. Revert corrupted `import './FloatingToothDetailsCard.css'` to `import  ;` — fixed.

### 24. `fix/temporary-teeth-interaction` + `fix/temporary-teeth-orange-borders` (merged to main)
Two branches that fix temporary (baby) teeth in the odontogram:

**Interaction fix** (`fix/temporary-teeth-interaction`):
- Added `setTemporaryTeeth` setter (was missing)
- `updateTooth` now checks `isTemporary` and updates the correct state array
- `resetTeeth` resets both `teeth` and `temporaryTeeth`

**Visual parity** (`fix/temporary-teeth-orange-borders`):
- Removed all `isTemporary` overrides from `getToothStyle` and `getSurfaceStyle` — temp teeth use same status colors and borders as permanent
- Surface grid template uses same gray base border (`border-gray-300`/`border-gray-600`) for all teeth (was `border-orange-400`/`border-orange-700` for temp)
- Only visual difference: label number is `text-orange-500`

### 25. `feat/hc6-patient-header` (merged to main)
Successful second attempt at patient name/age in HC6 header:
- Fetches patient via `getPatientById(patientId)` in `useEffect`
- Computes age from `fechaNacimiento`
- Displays below "Fecha:" in white text (`text-gray-100`) on `bg-gray-800/50`
- Header div changed from `bg-muted/30` to `bg-gray-800/50`

Also removed the "Restablecer" button, `resetTeeth` function, and `RotateCcw` import.

### 26. `feat/save-odontograma` (on branch, not yet merged)
Implemented odontograma save & load into the database `ClinicalHistory.odontograma` JSON column:

- **`src/lib/actions.ts` — `saveHc6`**: Replaced no-op with full Prisma write. Parses `hc6Data` JSON (`{ teeth, temporaryTeeth }`), finds latest `ClinicalHistory` for patient, updates `odontograma` field. Creates a new `ClinicalHistory` if none exists (with pending defaults).
- **`src/lib/actions.ts` — `addEmptyHistorial`**: Made idempotent (Option B). Before creating, checks if a `ClinicalHistory` already exists. If found, updates its `appointmentId` instead of creating a duplicate record. This prevents a second orphan history when HC6 already created one.
- **`src/components/hc6-form.tsx` — Load**: Extended existing `useEffect` that fetches `getPatientById`. After setting name/age, checks `clinicalHistory[0]?.odontograma` — if saved data exists, seeds `teeth` and `temporaryTeeth` state from it. Falls back to `initialPermanentTeeth`/`initialTemporaryTeeth` if empty.
- **Build**: ✅ Verified passes.
- **Roundtrip**: Load (DB → state) via cast from `Prisma.JsonValue` → `setTeeth`/`setTemporaryTeeth`; Save (state → DB) via `JSON.stringify` → `saveHc6` → `prisma.clinicalHistory.upsert`.
- **Data shape stored**: `{ permanentTeeth: Tooth[], temporaryTeeth: Tooth[], lastUpdate: ISO string }` — full arrays (not delta), same as in-memory format.
- **No changes to**: `sequential-workflow.tsx`, `prisma/schema.prisma`, odontogram components, any types.

### 27. `feat/paciente-tab` (merged to main)
Added a dedicated "Paciente" tab to the patient profile page showing all registration fields, and removed the redundant left sidebar:

- **`src/components/paciente-view.tsx`** (new):
  - Card-based read-only view of all patient fields (nombres, apellidos, fechaNacimiento, sexo, estadoCivil, ocupación, escolaridad, teléfonos, email, dirección, estado)
  - Tutor section shown conditionally when `esMenor` is true
  - "Editar" button reuses existing `EditPatientModal` (wraps `PatientForm`) — same pattern as Historial/Citas/Ficha Clínica tabs

- **`src/app/pacientes/[id]/page.tsx`**:
  - Added `PacienteView` import, `"paciente"` as first tab
  - `grid-cols-4` → `grid-cols-5` for tab pills
  - Removed entire left sidebar panel (Card/Avatar/InfoItems) and grid wrapper
  - Removed unused imports: `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Avatar`, `Badge`, `getAge`, `InfoItem`, `GenderIcon`, date-fns (`format`/`parseISO`/`differenceInYears`), lucide (`User`, `Cake`, `Phone`, `Mail`, `Home`, `Venus`, `Mars`, `Smartphone`, `CheckCircle2`, `XCircle`, `FileClock`, `FileText`, `Calendar`, `ClipboardList`)
  - Bundle size: 255kB → 253kB, lines: 295 → 206

- **Commits**: `6abe6ea` (Paciente tab), `ef70a62` (left panel removal, merged to main)

### 28. `fix/odontogram-tab-background` (merged to main)
Fixed odontogram tab background in patient profile page — same issue as the HC6 workflow:
- **Root cause**: Wrapper div had `bg-muted` (invisible in light mode) — the tooth grid area blended into the white Card background
- **Fix**: Changed all three wrapper divs to `bg-gray-900 shadow-sm border-gray-700 rounded-lg border` + switched `isDarkMode={false}` → `isDarkMode={true}`, matching the ColorLegend section
- **Commit**: `f19cff1`

### 29. `fix/hc5-readonly-fields` (merged to main)
Fixed Ficha Clínica tab read-only views for HC3 and HC5:
- **HC5 — Exploración Bucal**: Added 6 missing fields (`planosTerminales.derecho`, `planosTerminales.izquierdo`, `espaciosTerminales.presente`, `espaciosTerminales.ubicacion`, `claseAngle.derecho`, `claseAngle.izquierdo`). All booleans now use `YesNoBadge` (always visible, matching HC4 pattern)
- **HC3 — Heredo-Familiares**: Replaced `activeFamilyConditions` filter with static `ALL_HC3_CONDITIONS` list (7 conditions). Each shows `YesNoBadge` + conditional details (`¿Quién?` for all, `Tipo` for Cáncer/Malformaciones)
- **Commit**: `96bccfa`

### 30. `feat/odontogram-temp-teeth-default` (merged to main)
"Dientes temporales" toggle auto-enables for minor patients:
- Added `if (res.esMenor) setShowTemporaryTeeth(true)` to the `getPatientById` useEffect in both `hc6-form.tsx` and `odontogram-tab.tsx`
- The API already returns `esMenor` as part of the full patient object — no backend changes needed
- **Commit**: `f05f138`

### 31. `fix/odontogram-status-not-erupted` (merged to main)
Added "No erupcionado" to the status selection panel:
- **Root cause**: `statusOptions` array in `FloatingToothDetailsCard.tsx` had 10 statuses but was missing `not_erupted` — even though `ToothStatus` type and `ColorLegend` already included it
- **Fix**: Added `HelpCircle` icon + `{ id: 'not_erupted', name: 'No erupcionado', icon: HelpCircle, color: '#14b8a6' }` to `statusOptions`
- Same component used by both HC6 workflow and profile tab — one change applies everywhere
- **Commit**: `1f2700b`

### 32. `fix/date-format-mx` (merged to main)
Standardized all dates to Mexican locale (DD/MM/YYYY, 24h time, 4-digit years):
- **Created** `src/lib/formatDate.ts` with `formatDateDisplay`, `formatTodayDate`, `formatTimeDisplay` helpers
- **HC1–HC6 forms**: Replaced `toLocaleDateString("es-MX", {month: "long"})` with `formatTodayDate()` — changed 7 spots
- **Paciente/Citas/Historial views**: Replaced `format(..., "d 'de' MMMM 'de' yyyy")` with `formatDateDisplay()` — changed 3 spots
- **Historial-form/Historial-table dropdowns**: Changed `toLocaleDateString("es")` to `toLocaleDateString("es-MX", {2-digit})`/`formatDateDisplay()` — changed 2 spots
- **Patients-table**: Changed `"es-ES"` to `"es-MX"` for consistency
- **Dashboard**: Replaced `toLocaleTimeString()` with `formatTimeDisplay()` (24h HH:MM)
- **FloatingToothDetailsCard notes/procedures**: Changed `.slice(-2)` to `getFullYear()` — 2-digit → 4-digit year

### 33. `fix/html-lang-es-mx` (merged to main)
Fixed `<html lang>` attribute causing MM/DD/YYYY in native date inputs:
- **`layout.tsx`**: Changed `lang="en"` → `lang="es-MX"` — browsers use `lang` to determine date format in `<input type="date">`
- **`hc4-form.tsx`**: Placeholder changed from `"YYYY-MM-DD"` → `"DD/MM/AAAA"`
- **Zod error messages**: Stripped `"(YYYY-MM-DD)"` from validation messages
- **Commit**: `cfc39e4`

### 34. `fix/remove-header-edit-button` (merged to main)
Removed redundant edit button from sticky header:
- **`src/app/pacientes/[id]/page.tsx`**: Removed `<EditOptionsMenu>` import and usage (line 14, 133)
- Edit still available via Paciente tab's "Editar" button — single entry point
- **Commit**: `66c1c9f`

### 35. `fix/tab-stay-on-edit` (merged to main)
Preserved active tab after background data refresh:
- **`src/app/pacientes/[id]/page.tsx`**: `loadPatient` now accepts `showLoading` param (default `true`)
- Background refreshes call `loadPatient(false)` — skips loading spinner, `<Tabs>` stays mounted
- Active tab and scroll position are preserved after edits from any tab
- **Commit**: `1209e2a`

### 36. `chore/billcodex-footer-removal` (committed to main)
Removed then restored BillCodex footer at smaller size:
- `57c8ccf` — Removed BillCodex footer from layout
- `c2c099a` — Restored with `text-xs py-2`
- `85e62ea` — Final size: `text-[10px]` + `py-2`

### 37. `fix/tab-rename` (committed to main)
Tabs renamed for clarity:
- **`page.tsx`**: `Historial` → `Historial de Tratamientos`, `Ficha Clínica` → `Historia Clínica`
- **Commit**: `4102220`

### 38. `feat/initial-motivo-consulta` (merged to main)
Shows initial motivoConsulta at top of Historial de Tratamientos tab:
- Reads `clinicalDetails.motivoConsulta` and renders a blue read-only card "Motivo de Consulta Inicial"
- Distinct from per-visit `motivoConsulta` on each `clinical_history` RecordCard
- Visible in empty state and records list
- **Commit**: `f9f79a5`

### 39. `fecha-creacion-hc-readonly` (pending merge)
Shows auto-created clinical history creation date as read-only on "Historia Clínica" tab:
- **`src/components/clinical-details-view.tsx`**: Added `createdAt?: string` prop; displays "Fecha de Creación" as a read-only `InfoRow` card at the top of the tab
- **`src/app/pacientes/[id]/page.tsx`**: Passes `patient.historialClinico?.[0]?.fechaHistorial` as `createdAt`
- **`src/lib/actions.ts`**: Restored `fechaHistorial` field (already present in main; minor return message formatting)
- **Build**: Verified passes
- **Branch**: `fecha-creacion-hc-readonly`

### 40. `feat/pricing-procedures-payments` (merged to main)
Phase 1 of pricing/procedures/payments domain separation — added structured procedure catalog and itemized line items:

**Schema + Migration:**
- `ProcedureCatalog` model: `code` (unique), `name`, `description`, `category`, `defaultPrice`, `isActive`
- `ProcedureLineItem` model: `clinicalHistoryId`, `procedureCatalogId`, `toothId`, `quantity`, `fee`, `discount`, `notes`
- `ClinicalHistory`: added `cancelled Boolean @default(false)`, `cancelReason String?`
- Migration: `20260708154214_add_procedure_catalog_line_items`

**Admin page (`/catalogo-procedimientos`):**
- Table with search by name/code/category, price formatting, active/inactive badge
- Add dialog with code (auto-generated), name, category select, description, price
- Edit dialog (same fields, code readOnly), delete with confirm
- Build: passes

**ProcedurePicker component (`src/components/procedure-picker.tsx`):**
- cmdk-based searchable popover (installed `cmdk` dependency)
- Searches by name or code
- Calls `onChange(procedureId, procedureObject)` on select

**Historial form (`historial-form.tsx`):**
- Replaced single `costoTratamiento` `<Input type="number">` with line-item table
- Columns: ProcedurePicker, Cant., Honorarios, Desc., Remove button
- "Agregar" button adds a row; total auto-computed from `(fee - discount) * quantity`
- Line items serialized as JSON hidden input for FormData submission
- Backward compat: empty line items array still works (shows "No hay procedimientos" text)

**Historial view (`historial-view.tsx`):**
- Itemized cost display: each line item shows procedure name, quantity, subtotal
- Total row at bottom
- Fallback: if no `procedureLineItems` but `costoTratamiento` exists → show flat cost
- Edit dialog passes line items as JSON string in `initialData`

**Clinical history views (`medical-history-form.tsx`, `historial-table.tsx`):**
- `medical-history-form.tsx`: removed `costoTratamiento` field from schema and form; added `procedureLineItems` to schema
- `historial-table.tsx` (MUI): removed `costoTratamiento` from both add dialogs and default state

**Server actions (`actions.ts`):**
- New: `addProcedureCatalogItem`, `updateProcedureCatalogItem`, `deleteProcedureCatalogItem`, `getProcedureCatalog`
- Modified: `addHistorial`/`updateHistorial` dual-write — saves line items + `costoTratamiento` (total)
- `medicalHistorySchema`: removed `costoTratamiento`, added `procedureLineItems` (JSON string)

**Seed script (`prisma/seed.ts`):**
- 25 sample procedures across 8 categories (Consulta, Preventiva, Restauradora, Endodoncia, Cirugía, Periodoncia, Ortodoncia, Prótesis, Radiología, Estética)
- Patients created with randomized line items (1–4 procedures, random quantities, 30% chance of 10% discount)
- Fix: procedure catalog seeded before patient check to prevent unreachable code on re-runs
- Fix: renamed `genero` → `sexo` in sample patient data

**API proxy route (`proxy/route.ts`):**
- `getPacienteById`/`getPacientesWithAppointments`: include `procedureLineItems { include procedureCatalog }`
- New standalone `getProcedureCatalog` handler

**Client API (`api.ts`):**
- Added `getProcedureCatalog()` fetch function

**Home page (`page.tsx`):**
- Added "Catálogo de Procedimientos" button in hero card (purple outline)

**Commits**: `30b40e9` `863d308` `8c16a3e` `6b5b63f` `0f89e90` `756aea1` `601d05e`
- Prisma models + types → server actions → proxy route → API client → admin page + ProcedurePicker → UI forms → seed ordering fix → `genero`→`sexo` fix

**Key lesson**: Procedure catalog `Promise.all` was placed after `patient.count()` early return — unreachable on re-runs. Fixed by moving catalog seeding before the check, using `count() === 0` guard for idempotency.

### 41. Label change: "Historial Clínico" → "Tratamientos"
Changed the heading label on the patient detail page from "Historial Clínico" to "Tratamientos":
- **`src/components/historial-view.tsx`**: `<h3>Historial Clínico ({data.length})</h3>` → `<h3>Tratamientos ({data.length})</h3>` (line 268)
- **`src/components/historial-table.tsx`**: `<Typography>Historial Clínico ({data.length})</Typography>` → `<Typography>Tratamientos ({data.length})</Typography>` (MUI variant)
- Dialog titles, empty state messages, and buttons were intentionally NOT changed
- **Commit**: `0f89e90` (included in the pricing-procedures-payments branch)

### 42. `feat/auto-generate-procedure-code` (on main)
Procedure code auto-generates when category is selected in the "Agregar/Editar Procedimiento" dialog:
- **Category→Prefix map**: `Consulta→CON`, `Preventiva→PREV`, `Restauradora→REST`, `Endodoncia→END`, `Cirugía→CIR`, `Periodoncia→PERIO`, `Ortodoncia→ORT`, `Prótesis→PROT`, `Radiología→RADIO`, `Estética→EST`
- **`generateNextCode(category, existing)`**: Scans existing codes for `{PREFIX}-{NNN}`, finds max numeric suffix, returns next in sequence (padded to 3 digits)
- **Auto-fill logic**: `useEffect` watches `category` field. On create: fills code immediately. On edit: skips initial mount (preserves existing code), updates only when category changes
- **Code input**: Always `readOnly` — user cannot manually edit
- **File**: `src/app/catalogo-procedimientos/page.tsx`
- **Commit**: `f5bb657` (auto-generate on create), `78839db` (also on edit mode)
- **Branch**: `feat/auto-generate-procedure-code`

### 43. `feat/testing-setup-vitest` (current branch)
Automated testing setup with Vitest, structured for future Playwright addition:

**Dependencies installed:**
- `vitest` — test runner (v4.1.10)
- `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` — React component testing
- `jsdom` — DOM environment for component tests
- `@vitejs/plugin-react` — JSX transform in test pipeline

**New files:**
| File | Purpose |
|------|---------|
| `vitest.config.ts` | Config with jsdom, `@/` path alias, react plugin, globals |
| `src/test/setup.ts` | Imports `@testing-library/jest-dom/vitest` matchers |
| `playwright.config.ts` | Commented placeholder — uncomment when `@playwright/test` installed |
| `e2e-tests/.gitkeep` | Future Playwright test directory |

**Test scripts in package.json:**
- `npm test` → `vitest run` (single run, CI)
- `npm run test:watch` → `vitest` (watch mode)

**Tests written (19 total, all passing):**
1. `src/lib/__tests__/generateNextCode.test.ts` — 6 tests for auto-generated procedure codes
2. `src/lib/__tests__/schemas.test.ts` — 10 tests for Zod schema validation (procedure + line item)
3. `src/components/__tests__/render.test.tsx` — 3 tests proving jsdom + RTL + userEvent pipeline

**Test patterns:**
- Vitest excludes `e2e-tests/` — Playwright tests run independently
- Pure logic tests in `src/lib/__tests__/` (no mocking needed)
- Component tests in `src/components/__tests__/` (jsdom + testing-library)
- Future E2E tests in `e2e-tests/` (Playwright)

**Commit**: (pending merge)

### 44. `feat/center-paciente-fields` (merged to main)
Centered all InfoRow fields inside each tab's Cards with `mx-auto max-w-2xl`:
- **`paciente-view.tsx`**: Wrapped all InfoRows inside `<div className="mx-auto max-w-2xl">` in CardContent
- **`historial-view.tsx`**: Same wrapper inside `RecordCard`'s CardContent
- **`citas-view.tsx`**: Same wrapper inside `AppointmentCard`'s CardContent
- **`clinical-details-view.tsx`**: Same wrapper inside `SectionCard`'s CardContent + standalone date card
- CardHeader stays full-width; only the field content is centered
- **Commits**: `fda8490` (paciente tab), `f027cd0` (all 3 remaining tabs)

### 45. `feat/replace-procedure-catalog` (merged to main)
Replaced all 25 old seed procedures with 34 real procedures matching the clinic's price list:
- Deleted all existing data: `ProcedureLineItem` → `ProcedureCatalog` → `Patient` (cascades to everything)
- Seeded 34 new procedures across 7 categories with real-world prices
- Updated `prisma/seed.ts` with cleanup-then-seed pattern (always clears + re-seeds)
- Categories used: Consulta (1), Preventiva (4), Restauradora (7), Endodoncia (4), Cirugía (4), Prótesis (13), Radiología (1)
- Old categories removed: Diagnóstico, Operatoria, Periodoncia, Ortodoncia, Estética
- **Commit**: `5797710`

### 46. `fix/remove-redundant-fields-from-historial-form` (merged to main)
Removed `telefonoContacto` and `antecedentesPersonales` from ClinicalHistory (Nuevo Registro modal):
- **Root cause**: `telefonoContacto` was redundant with `Patient.telefonoPrincipal`/`telefonoAlternativo`; `antecedentesPersonales` was redundant with `ClinicalDetails.antecedentesPersonales` (structured conditions)
- **Files changed** (7 files, 185 lines removed):
  - `types/index.ts` — removed from `ClinicalHistory` interface
  - `historial-form.tsx` — removed from Zod schema, defaults, and UI
  - `medical-history-form.tsx` — removed from schema, defaults, and UI
  - `historial-view.tsx` — removed from RecordCard and edit dialog
  - `historial-table.tsx` — removed from MUI dialogs and editable cells
  - `hc1-form.tsx` — removed from prefill mapping
  - `actions.ts` — removed from `medicalHistorySchema`, write calls, and `historyFieldMap`
- **Commit**: `8c60553`

### 47. `fix/timezone-date-display` (merged to main)
Fixed date showing one day earlier in Citas tab due to UTC-to-local timezone shift:
- **Root cause**: `formatDateDisplay` used `parseISO(dateStr)` which interprets `2026-07-13T00:00:00.000Z` as midnight UTC. In Mexico's UTC-6 timezone, this renders as `12/07/2026` (6 PM previous day).
- **Fix**: Parse date string components directly (`dateStr.split("T")[0].split("-")`) and construct a local `Date`, avoiding timezone conversion entirely. Same pattern already used in `patients-table.tsx:450-460`.
- **File**: `src/lib/formatDate.ts`
- **Commit**: `0856406`

### 48. `fix/mexican-phone-validation` (merged to main)
Added flexible Mexican phone validation to all 4 phone fields:
- **Problem**: Phone fields accepted any 7+ character string including alphabetic characters, no format enforcement. Placeholders showed `+51` (Peru) instead of `+52` (Mexico).
- **Validation**: Two-layer check — regex rejects non-phone characters (`/^[\d\s\-()+]+$/`), then `.refine()` verifies exactly 10 digits (or `+52` prefix + 10 digits).
- **Accepted formats**: `5512345678`, `+52 55 1234 5678`, `55-1234-5678`, `(55) 1234-5678`
- **Files changed** (2 files):
  - `src/lib/actions.ts` — server-side Zod `patientSchema`: all 4 phone fields (`telefonoPrincipal`, `telefonoAlternativo`, `telefonoPadre`, `telefonoMadre`)
  - `src/components/patient-form.tsx` — client-side Zod schema + form inputs: added `inputMode="tel"`, updated placeholders to `+52 55 1234 5678` / `+52 33 9876 5432`
- **Commit**: `2909068`

## Branch Status
- Fixed `JSX.IntrinsicElements` error by running `npm install`
- Confirmed no unit test framework exists in the project
- Created session notes file `docs/DNIRemovedOptionalAddress.md` → renamed to `docs/DevNotes.md`
- Added Google Calendar config to README

### 49. `feat/docker-deploy` (merged to main)
Docker production deployment — run the app as two Linux containers on any Windows PC with Docker Desktop:
- **`Dockerfile`**: Multi-stage build (builder compiles Next.js, runner runs with Alpine + `postgresql-client` for `pg_isready`)
- **`entrypoint.sh`**: Wait for PostgreSQL → `prisma migrate deploy` → `prisma db seed` → `node server.js`
- **`.dockerignore`**: Excludes `node_modules`, `.next`, `.git`, `*.md`, `.env` from Docker context
- **`docker-compose.yml`**: Added `nextjs` service with `environment:` overrides (`DATABASE_URL` uses service name `postgres` instead of `localhost`, `GOOGLE_APPLICATION_CREDENTIALS` uses Linux path `/app/gcp-key.json`), healthcheck on `postgres` service
- **`next.config.ts`**: Added `output: "standalone"` for Docker
- **`.env`**: Never modified — dev workflow unchanged; production values come from `docker-compose.yml`
- **`docs/deploy-prod.md`**: Full English deployment guide (~400 lines) covering architecture, prerequisites, step-by-step deploy, update workflow, troubleshooting
- **`README.md`**: Translated from Spanish to English
- **Key design**: `.env` stays for dev, Docker Compose overrides the 2 values that differ via `environment:` block
- **Bug fixes during testing**: (1) Added `postgresql-client` for `pg_isready`, (2) Added `COPY prisma.config.ts ./` for Prisma 7.x, (3) Reverted `prisma generate` in builder to run without `prisma.config.ts`
- **Branch**: `feat/docker-deploy`

### 50. `feat/print-historia-clinica` (merged to main)
PDF print module for patient clinical history:
- **`@react-pdf/renderer`** + **`@react-pdf/types`**: Installed for declarative PDF generation
- **`src/lib/print/types.ts`**: 10 interfaces (`PrintData`, `BrandingConfig`, `Hc1Data`–`Hc5Data`, etc.)
- **`src/lib/print/config.ts`**: Reads `NEXT_PUBLIC_CLINIC_NAME` / `NEXT_PUBLIC_CLINIC_LOGO_URL` from env
- **`src/lib/print/utils.ts`**: Spanish date formatting, currency, HC2/HC5 JSON parsers
- **`src/lib/print/templates/HistoriaClinica.tsx`**: Letter-size (8.5"×11") PDF template with clinic header, patient data, HC1–HC5 sections, footer
- **`src/lib/print/components/PrintButton.tsx`**: "Imprimir Historia Clínica" button with dynamic import (no SSR), loading state, toast feedback
- **`src/lib/print/components/PrintPreviewDialog.tsx`**: Dialog with embedded PDF preview via `BlobProvider`, Download and Print actions
- **`src/components/clinical-details-view.tsx`**: Added PrintButton at top of Historia Clínica tab
- **`.env.example`**: Added `NEXT_PUBLIC_CLINIC_NAME`, `NEXT_PUBLIC_CLINIC_LOGO_URL` for branding
- **Architecture**: Reusable `src/lib/print/` module — easy to add new templates (Treatment History, Patient Summary, etc.)
- **Key technical**: `@react-pdf/renderer` uses `React.lazy` → must be dynamically imported with `next/dynamic` + `{ ssr: false }`
- **Branch**: `feat/print-historia-clinica`

### 51. `fix/audit-vulnerabilities` (merged to main)
Resolved npm vulnerabilities (105 → 3) and fixed all pre-existing typecheck errors (23 → 0):
- **`next` 15.3.3 → 15.5.21**: Fixed 1 critical + 17 CVEs (cache poisoning, SSRF, RCE, DoS, XSS) plus transitive `sharp` and `postcss`
- **Removed `genkit` packages**: Deleted `genkit`, `@genkit-ai/googleai`, `@genkit-ai/next`, `genkit-cli` — all were dead code (`src/ai/genkit.ts` and `src/ai/dev.ts` had no imports). Eliminated entire `@opentelemetry/*` chain (~50 transitive vulns)
- **Deleted**: `src/ai/genkit.ts`, `src/ai/dev.ts`, removed `genkit:dev`/`genkit:watch` scripts
- **Remaining 3 vulnerabilities**: `postcss` and `sharp` bundled inside `next/node_modules/` — server-side only, not exploitable, must wait for Next.js to patch upstream
- **Typecheck fixes (21 pre-existing errors)**:
  - `prisma/seed.ts`: `Number()` conversion for Prisma `Decimal` arithmetic
  - `edit-patient-modal.tsx`: Removed extra `handlePatientSuccess` arg, converted `esMenor` boolean → string
  - `patient-form.tsx`: Removed impossible `=== true` comparison on string type
  - `historial-form.tsx` / `historial-table.tsx`: Removed dead `instanceof Date` branches (always false)
  - `patients-table.tsx`: Removed extra props (`isEven`, `onPatientSelect`) from `PatientRow`
  - `api.ts`: Narrowed `error` type before accessing `.name` (`error instanceof Error`)
  - `ColorLegend.tsx`: Standardized odontograma surface names to Spanish (`buccal` → `vestibular`, `occlusal` → `oclusal`)
  - `odontograma/index.ts`: Added missing `import type { Tooth }` for local use
- **Branch**: `fix/audit-vulnerabilities`

### 52. `feat/wizard-print-preview` (merged to main)
Added PDF print preview step in registration wizard between HC5 (Exploración Bucal) and HC6 (Odontograma):
- **`src/lib/print/build-data.ts`** (new): Extracted `buildPrintData` from `PrintButton.tsx` into a shared module so both the profile page and the wizard can use it
- **`src/lib/print/components/PrintButton.tsx`**: Now imports `buildPrintData` from the shared module instead of defining it locally
- **`src/components/print-preview-step.tsx`** (new): Wizard step component that fetches patient data via `getPacienteById`, builds print data via `buildPrintData`, and renders the HistoriaClinica PDF preview in an iframe (using `BlobProvider` from `@react-pdf/renderer`, dynamically imported with `ssr: false`). Shows header "Vista Previa — Historia Clinica" with subtitle, scrollable PDF preview, and Regresar/Continuar buttons. Uses `max-w-4xl` layout.
- **`src/components/sequential-workflow.tsx`**: Added `"printPreview"` to `SubStep` type, updated `subStepIndex` (printPreview=5, odontograma=6). Flow is now: exploracionBucal → printPreview → odontograma. Updated handlers: `handleExploracionBucalSuccess` → printPreview, new `handlePrintPreviewSuccess` → odontograma, new `handleBackFromPrintPreview` → exploracionBucal, `handleBackFromOdontograma` → printPreview. Sub-step counter now shows "X de 6" correctly.
- **Wizard flow**: HC5 → Print Preview → HC6 → Appointment. The preview shows HC1–HC5 data (no odontograma yet). No data is saved at the preview step — it's read-only.
- **Key design**: `buildPrintData` is now in `src/lib/print/build-data.ts`, importable by both client and server components. The print preview step reuses the same `PDFPreviewFrame` pattern from `PrintPreviewDialog.tsx`.
- **Branch**: `feat/wizard-print-preview`

### 53. `fix/print-template-labels` + `fix/hc3-quien-not-saving` (merged to main)
Three fixes to Historia Clínica print template and HC3 data flow:

**Print template fixes (`HistoriaClinica.tsx`):**
- Removed DNI field from PDF patient grid (was removed from UI in session 2 but kept in template)
- Changed "Fecha de creación" label → "Fecha de Registro"
- Modified `FieldRow` to accept `React.ReactNode` values (for colored elements)
- Applied green/red `YesNo` color scheme to all 10 HC4 boolean fields
- Applied green/red `YesNo` color scheme to HC5 pure booleans (`bordeABorde`, `mordidaAbierta`); complex fields (espaciosTerminales, mordidaCruzada, etc.) keep plain text

**HC3 bug fix (`actions.ts:109`):**
- **Root cause**: Field name mismatch — form sends `quien` but `saveHc3` read `c.relatives` (undefined), so `relatives` column was always saved as `null`
- **Fix**: Changed `c.relatives` → `c.quien` in `saveHc3`
- Fixes both the print PDF (missing "Quién?" for Cáncer) and the edit form (not loading "Quién?")
- Existing patients with the bug need HC3 data re-saved to populate the DB

**DataLayerChange.md**: Fixed `relatives` column description from `{ padre: bool, ... }` to actual stored format (selected relative string)
