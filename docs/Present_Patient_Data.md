# Present Patient Data — Profile Page Expansion

## Goal

Show all patient data on the profile page (`/pacientes/[id]`): personal information, clinical history (HC1–HC6 with interactive odontogram), and appointments in a tabbed layout with editable sections.

## Status

✅ **Completed** — All 5 steps + bug fixes implemented, tested end-to-end, ready to merge from `feat/patient-profile-data`.

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

- Light-mode interactive odontogram
- Loads saved data, falls back to `initialPermanentTeeth` / `initialTemporaryTeeth`
- "Guardar Cambios" saves via `saveHc6`

### Profile Page Layout

```
┌───────────────────┬─────────────────────────────────────────────┐
│  Patient Card     │  [Historial] [Citas] [Ficha Clínica] [Odontograma]  │
│  (col-span-1)     │                                                     │
│                   │  Tab content renders the relevant section           │
└───────────────────┴─────────────────────────────────────────────┘
```

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

## Relevant Files

| File | Purpose |
|------|---------|
| `src/app/api/proxy/route.ts` | Prisma includes for `getPacienteById` |
| `src/components/clinical-details-view.tsx` | HC1–HC5 read-only + edit dialogs |
| `src/components/odontogram-tab.tsx` | HC6 interactive odontogram (light) |
| `src/app/pacientes/[id]/page.tsx` | Tab layout, all sections wired |
| `src/components/edit-patient-modal.tsx` | Null-safe initial data |
| `src/lib/api.ts` | Client-side fetch wrapper (unchanged) |
| `src/lib/actions.ts` | Server actions (`saveHc1`–`saveHc6`) (unchanged) |
| `src/components/hc1-form.tsx`–`hc5-form.tsx` | Reused inside dialogs (unchanged) |
| `src/components/historial-view.tsx` | Card-based view for clinical history records |
| `src/components/historial-form.tsx` | Create/edit form for history records (dialog) |
| `src/components/citas-view.tsx` | Card-based view for appointments |
| `src/components/citas-form.tsx` | Create/edit form for appointments (dialog) |
| `docs/Present_Patient_Data.md` | This file — architecture doc with all steps and fixes |
