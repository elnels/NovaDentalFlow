# Present Patient Data — Profile Page Expansion

## Goal

Show all patient data on the profile page (`/pacientes/[id]`): personal information, clinical history (HC1–HC6 with interactive odontogram), and appointments in a tabbed layout with editable sections.

## Status

✅ **Completed** — All 4 steps implemented, tested end-to-end, merged from `feat/patient-profile-data`.

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
