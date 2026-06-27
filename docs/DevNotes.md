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
|---|---|---|
| `DNInoMandatory` | ✅ | Complete |
| `DNIremovedFromUI` | ✅ | Complete |
| `AddressIsOptinal` | ✅ | Complete |
| `google-calendar-embed` | ✅ | Complete |
| `google-calendar-api-sync` | ✅ | Complete |
| `workflow-reorder` | ✅ | Complete |
| `homepage-card-width` | ✅ | Complete |
| `default-doctor` | ✅ | Complete |
| `add-sexo-field` | ✅ | Complete |

### 11. `historial-clinico-new-fields` (reverted)
Experimented with adding 9 new fields to Historial Clínico (Sexo, Estado Civil, Ocupación, Escolaridad, datos de padres, Motivo Consulta, Antecedentes Personales grid). Required Apps Script changes failed to deploy — reverted completely.

### 12. `HistoriaClinicaMods` (reverted — branch deleted)
Second attempt at adding the same 8 fields (Estado Civil, Ocupación, Escolaridad, Nombre Padre/Madre, Teléfono, Motivo Consulta, Antecedentes grid). Followed the 5-step workflow (sheet → codigo.gs → test → UI → build). Step 3 test passed (local editor), but when deployed the live API silently ignored new fields after Sexo. Root cause unclear — possibly header/column misalignment between the row array and sheet layout. Rolled back to main (Sexo only) to re-plan.

| Branch | Merged to main | Status |
|---|---|---|
| `HistoriaClinicaMods` | ❌ | Reverted |

## Other Tasks
- Fixed `JSX.IntrinsicElements` error by running `npm install`
- Confirmed no unit test framework exists in the project
- Created session notes file `docs/DNIRemovedOptionalAddress.md` → renamed to `docs/DevNotes.md`
- Added Google Calendar config to README
