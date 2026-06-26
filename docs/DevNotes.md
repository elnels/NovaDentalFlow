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

## Current Branch Status
| Branch | Merged to main | Status |
|---|---|---|
| `DNInoMandatory` | ✅ | Complete |
| `DNIremovedFromUI` | ✅ | Complete |
| `AddressIsOptinal` | ✅ | Complete |
| `google-calendar-embed` | ✅ | Complete |
| `google-calendar-api-sync` | ✅ | Complete |

## Other Tasks
- Fixed `JSX.IntrinsicElements` error by running `npm install`
- Confirmed no unit test framework exists in the project
- Created session notes file `docs/DNIRemovedOptionalAddress.md`
- Added Google Calendar config to README
