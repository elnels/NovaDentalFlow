# Present Patient Data — Profile Page Expansion

## Goal

Show all patient data on the profile page (`/pacientes/[id]`): personal information, clinical history (HC1–HC6 with interactive odontogram), and appointments in a tabbed layout with card-based editable sections.

## Status

✅ **Completed** — 5 tabs (Paciente, Historial de Tratamientos, Citas, Historia Clínica, Odontograma). Left sidebar removed. Ficha Clínica HC3/HC5 read-only views now show all fields (HC4-style). Odontogram tab uses dark theme (`bg-gray-900` + `isDarkMode=true`) matching ColorLegend. "Dientes temporales" toggle auto-enables for minor patients. "No erupcionado" status added to right panel. All dates in DD/MM/YYYY (Mexican locale). HTML lang set to `es-MX`. Edit button removed from sticky header. Active tab preserved after background data refresh. Initial `motivoConsulta` shown at top of Historial de Tratamientos tab.

## What Was Done

### Step 1 — Proxy Data Loading
**Commit `4870db7`** → `src/app/api/proxy/route.ts`
- Added `clinicalDetails`, `familyConditions`, and `orderBy` to `getPacienteById` Prisma query
- No `mapPatientFields` changes needed (`...rest` spread already passes them through)

### Step 2 — Clinical Details View
**Commit `ca89a99`** → `src/components/clinical-details-view.tsx`
- Read-only HC1–HC5 sections (HC6 is the odontogram tab)
- Each section has an **"Editar"** button that opens a shadcn `<Dialog>` reusing the existing HC form component
- Props: `patientId`, `clinicalDetails`, `familyConditions`, `onDataUpdate`
- Graceful null handling: "No registrado" / "Sin datos" for missing content

### Step 3 — Odontogram Tab
**Commit `4b3e8b3`** → `src/components/odontogram-tab.tsx`
- Interactive odontogram in **light mode** (`isDarkMode={false}`, `theme="light"`)
- Loads saved odontogram from `clinicalHistory[0].odontograma` via `getPatientById`, falls back to `initialPermanentTeeth` / `initialTemporaryTeeth`
- **"Guardar Cambios"** button (no "Regresar")
- Saves via `saveHc6` server action

### Step 4 — Profile Page Refactor
**Commit `f52a045`** → `src/app/pacientes/[id]/page.tsx`
- Right column changed from stacked tables to `<Tabs>`:
  ```
  [Historial] [Citas] [Ficha Clínica] [Odontograma]
  ```
- Removed all debug `console.log` calls
- Removed 10-second loading timeout hack
- Fixed `patient.genero` → `patient.sexo`
- Removed unused `useAutoRefresh` hook import

### Bug Fix — Null Input Value
**Commit `514215d`** → `src/components/edit-patient-modal.tsx`
- Applied `?? ""` to all optional string fields in `initialData` to prevent `value={null}` React input error

### Step 5 — Historial & Citas Card-Based Refactor
**Commit `06abe2d`** → 4 new files + page.tsx
- Replaced MUI `HistorialTable` + `CitasTable` with `HistorialView` + `CitasView` (shadcn card-based layout matching Ficha Clínica style)
- Created `HistorialForm` and `CitasForm` components for create/edit dialogs (reuses `addHistorial`/`updateHistorial`/`addCita`/`updateCita` server actions)
- Removed inline MUI `EditableCell` editing — now dialog-only
- Removed MUI dependencies from profile page (replaced with shadcn/ui)
- Cleaned up unused imports and handlers from page.tsx

### Bug Fixes (Post-Step 5)

| # | Commit | Issue | Fix |
|---|--------|-------|-----|
| 1 | `eb7c0a9` | Historial/Citas forms silently fail on submit | Added `catch` block + success/error toasts matching HC form pattern |
| 2 | `37327cd` | Edit historial/citas forms silently reject submission | Split ISO date string (`"2024-06-15T00:00:00.000Z"`) to `YYYY-MM-DD` before passing as `initialData` |
| 3 | `c9667b8` | `"Objects are not valid as a React child (found: Date)"` | Rendered `Date` objects via `toLocaleDateString()` in historial form/table |
| 4 | `cee3ffb` | `"Unknown argument nombrePadre"` in `updateHistorial` | Removed `nombrePadre`/`nombreMadre` — these belong to `Patient`, not `ClinicalHistory` |
| 5 | `20db1f1` | `"Decimal objects are not supported"` from server action `getPatientById` | Serialized Prisma return via `JSON.parse(JSON.stringify())` to convert `Decimal`→`string`, `Date`→ISO string |

### Step 6 — Paciente Tab & Left Panel Removal

**Commits `6abe6ea` + `ef70a62`** on branch `feat/paciente-tab` (merged to `main` as `ef70a62`)

Added a dedicated **"Paciente"** tab as the first of 5 tabs, showing all registration fields in a read-only card with an "Editar" button opening the existing `EditPatientModal`. The redundant left sidebar (avatar, name, status, info items) was removed since the Paciente tab now displays everything.

**New file:**
- `src/components/paciente-view.tsx` — Card-based read-only view of all patient fields (nombres, apellidos, fechaNacimiento, sexo, estadoCivil, ocupación, escolaridad, teléfonos, email, dirección, estado) with conditional tutor section when `esMenor` is true. "Editar" button reuses existing `EditPatientModal` (wraps `PatientForm`).

**Modified:**
- `src/app/pacientes/[id]/page.tsx` — Added `PacienteView` import, changed `grid-cols-4` → `grid-cols-5` for tab pills, set first tab to `"paciente"`, removed entire left sidebar panel and grid wrapper.

**Reused components (no changes needed):**
- `EditPatientModal` — already wraps `PatientForm` in a dialog
- `PatientForm` — full registration/edit form with Zod validation |

### Step 7 — Odontogram Tab Dark Mode & Ficha Clínica Read-only Fixes

**Branches:** `fix/odontogram-tab-background`, `fix/hc5-readonly-fields`, `feat/odontogram-temp-teeth-default`, `fix/odontogram-status-not-erupted`

| # | Commit | Fix |
|---|--------|-----|
| 1 | `f19cff1` | Odontogram tab wrapper: `bg-gray-900` + `isDarkMode=true` (matching ColorLegend pattern, replacing invisible `bg-muted`) |
| 2 | `96bccfa` | **HC5 read-only**: Added 6 missing fields (`planosTerminales`, `espaciosTerminales`, `claseAngle`). All booleans now use `YesNoBadge` (always visible). **HC3 read-only**: Shows all 7 conditions with `YesNoBadge` + conditional details (replaces filtered list) |
| 3 | `f05f138` | "Dientes temporales" toggle auto-enables when `patient.esMenor` is true — applies to both HC6 workflow and profile tab |
| 4 | `1f2700b` | Added "No erupcionado" (`not_erupted`) status button to the right panel's status grid (`FloatingToothDetailsCard`) |

**Files changed:**
- `src/components/odontogram-tab.tsx` — dark theme wrapper + `isDarkMode=true`
- `src/components/clinical-details-view.tsx` — HC3/HC5 read-all fields with YesNoBadge
- `src/components/hc6-form.tsx` — auto-enable temp teeth for minors
- `src/components/odontogram-tab.tsx` — auto-enable temp teeth for minors
- `src/lib/odontograma/components/FloatingToothDetailsCard/FloatingToothDetailsCard.tsx` — added not_erupted to statusOptions

### Step 8 — Date Format Standardization

**Branch `fix/date-format-mx` (merged `d5804a0`)**

Created `src/lib/formatDate.ts` with `formatDateDisplay()`, `formatTodayDate()`, `formatTimeDisplay()`. Replaced `toLocaleDateString("es")` / `format()` calls across HC1–HC6 forms, paciente-view, citas-view, historial-view, historial-form, historial-table, patients-table, dashboard, and FloatingToothDetailsCard. All dates now DD/MM/YYYY, 24h HH:MM, 4-digit years.

### Step 9 — HTML lang fix

**Commit `cfc39e4`**

Changed `layout.tsx` `lang="en"` → `lang="es-MX"`. This is the root cause of MM/DD/YYYY showing in native `<input type="date">` elements — browsers use the HTML lang attribute to determine date format. Updated HC4 placeholder text. Removed "(YYYY-MM-DD)" from Zod error messages.

### Step 10 — Header Edit Button Removed

**Commit `66c1c9f`**

Removed the redundant `<EditOptionsMenu>` from the sticky header in `page.tsx`. Edit functionality remains accessible exclusively through the Paciente tab's "Editar" button — consistent with the pattern used by all other tabs.

### Step 11 — Active Tab Preserved on Refresh

**Branch `fix/tab-stay-on-edit` (merged `1209e2a`)**

`loadPatient()` now accepts a `showLoading` boolean parameter. Background data refreshes call `loadPatient(false)`, which skips the loading spinner. This prevents `<Tabs>` from unmounting/remounting — the active tab and scroll position are preserved after edits from any tab.

### Step 12 — Tab Rename

**Commit `4102220`**

Tabs renamed for clarity: `Historial` → `Historial de Tratamientos`, `Ficha Clínica` → `Historia Clínica`. Change made in `page.tsx:149,151`.

### Step 13 — Initial MotivoConsulta in Historial de Tratamientos Tab

**Branch `feat/initial-motivo-consulta` (merged `f9f79a5`)**

Reads `clinicalDetails.motivoConsulta` and renders a blue read-only card "Motivo de Consulta Inicial" at the top of the Historial de Tratamientos tab (visible in both empty state and records list). This is the initial reason for consultation stored on `clinical_details` — distinct from per-visit `motivoConsulta` on each `clinical_history` RecordCard.

## Architecture

### Data Loading

The proxy route (`/api/proxy`) handles all client-side data fetching via Prisma with all four relations included:

```ts
include: {
  appointments: { orderBy: { fechaCita: "desc" } },
  clinicalHistory: { orderBy: { fechaHistorial: "desc" } },
  clinicalDetails: true,
  familyConditions: true,
}
```

`mapPatientFields()` passes through `clinicalDetails` and `familyConditions` via `...rest`.

### Ficha Clínica Tab (`ClinicalDetailsView`)

| Section | Data Source | Form Component |
|---------|-------------|----------------|
| HC1 — Odontólogo | `clinicalDetails.nombreOdontologo` | `hc1-form.tsx` |
| HC2 — Antecedentes Personales | `clinicalDetails.motivoConsulta` + `clinicalDetails.antecedentesPersonales` (JSON) | `hc2-form.tsx` |
| HC3 — Heredo-Familiares | `familyConditions[]` | `hc3-form.tsx` |
| HC4 — No Patológicos | `clinicalDetails.*` (10 boolean + conditional fields) | `hc4-form.tsx` |
| HC5 — Exploración Bucal | `clinicalDetails.observacionesHc5` (JSON) | `hc5-form.tsx` |

All existing HC form components reused **without modification** — each accepts `patientId`, `action`, `onBack`, `onSuccess`.

### Odontograma Tab (`OdontogramTab`)

- Dark-mode interactive odontogram (`bg-gray-900` + `isDarkMode=true`, matching ColorLegend style)
- "Dientes temporales" toggle auto-enables for minor patients (`esMenor`)
- Right panel status grid includes all statuses: Sano, Caries, Obturado, Corona, Endodoncia, Implante, Extraído, Fractura, Puente, Extracción indicada, **No erupcionado**
- Loads saved data, falls back to `initialPermanentTeeth` / `initialTemporaryTeeth`
- "Guardar Cambios" saves via `saveHc6`

### Profile Page Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [Paciente] [Historial de Tratamientos] [Citas] [Historia Clínica] [Odontograma]  │
│                                                                │
│ Tab content renders the relevant section                       │
└────────────────────────────────────────────────────────────────┘
```

The left sidebar was removed in Step 6 — all patient data is now accessed via the dedicated Paciente tab.

## Commits (in order)

1. `a65942b` — `docs: add Present_Patient_Data.md with profile expansion plan`
2. `4870db7` — `fix: include clinicalDetails and familyConditions in proxy route`
3. `ca89a99` — `feat: add ClinicalDetailsView component with editable HC1-HC5 sections`
4. `4b3e8b3` — `feat: add OdontogramTab component for profile page`
5. `f52a045` — `feat: refactor patient profile page with tabs, remove debug logs, fix genero→sexo`
6. `514215d` — `fix: handle null values in edit-patient initialData to prevent null input value error`
7. `06abe2d` — `feat: replace HistorialTable/CitasTable with card-based HistorialView/CitasView`
8. `8b2909d` — `docs: update Present_Patient_Data.md with Step 5 card-based refactor`
9. `bbd61fd` — `fix: add missing DialogTitle to HC1-HC5 edit dialogs for accessibility`
10. `eb7c0a9` — `fix: add catch/error toasts to historial-form and citas-form handleSubmit`
11. `37327cd` — `fix: format ISO date to YYYY-MM-DD in historial-view and citas-view initialData`
12. `c9667b8` — `fix: render Date objects from Prisma as locale string in historial-form/table`
13. `cee3ffb` — `fix: remove nombrePadre/nombreMadre from updateHistorial`
14. `20db1f1` — `fix: serialize Prisma objects to plain JSON in getPatientById`
15. `6abe6ea` — `feat: add Paciente tab with read-only card + edit modal`
16. `ef70a62` — `refactor: remove redundant left sidebar panel (data now in Paciente tab)`
17. `f19cff1` — `fix: hardcoded bg-gray-900 + isDarkMode=true on odontogram wrappers (matching ColorLegend)`
18. `96bccfa` — `fix: HC3/HC5 read-only now shows all fields with YesNoBadge (matching HC4 pattern)`
19. `f05f138` — `feat: auto-enable Dientes temporales toggle when patient is a minor (esMenor)`
20. `1f2700b` — `fix: add No erupcionado (not_erupted) to status selection panel`
21. `d5804a0` — `fix: standardize all dates to Mexican locale (DD/MM/YYYY, 24h time, 4-digit years)`
22. `cfc39e4` — `fix: set HTML lang to es-MX for correct date input locale`
23. `66c1c9f` — `refactor: remove redundant EditOptionsMenu from sticky header`
24. `1209e2a` — `fix: preserve active tab after data refresh`
25. `4102220` — `fix: rename tabs - Historial → Historial de Tratamientos, Ficha Clínica → Historia Clínica`
26. `85e62ea` — `chore: reduce footer text to 10px`
27. `f9f79a5` — `feat: show initial motivoConsulta at top of Historial de Tratamientos tab`

## Relevant Files

| File | Purpose |
|------|---------|
| `src/app/api/proxy/route.ts` | Prisma includes for `getPacienteById` |
| `src/components/clinical-details-view.tsx` | HC1–HC5 read-only + edit dialogs |
| `src/components/odontogram-tab.tsx` | HC6 interactive odontogram (light) |
| `src/app/pacientes/[id]/page.tsx` | 5-tab layout, all sections wired |
| `src/components/paciente-view.tsx` | Paciente tab — read-only card + edit modal |
| `src/components/edit-patient-modal.tsx` | Null-safe initial data |
| `src/lib/api.ts` | Client-side fetch wrapper (unchanged) |
| `src/lib/actions.ts` | Server actions (`saveHc1`–`saveHc6`) (unchanged) |
| `src/components/hc1-form.tsx`–`hc5-form.tsx` | Reused inside dialogs (unchanged) |
| `src/lib/odontograma/components/FloatingToothDetailsCard/FloatingToothDetailsCard.tsx` | Right panel status grid (11 statuses including not_erupted) |
| `src/components/historial-view.tsx` | Card-based view for clinical history records |
| `src/components/historial-form.tsx` | Create/edit form for history records (dialog) |
| `src/components/citas-view.tsx` | Card-based view for appointments |
| `src/components/citas-form.tsx` | Create/edit form for appointments (dialog) |
| `docs/Present_Patient_Data.md` | This file — architecture doc with all steps and fixes |
