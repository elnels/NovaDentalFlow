# Present Patient Data — Profile Page Expansion

## Goal

Show all patient data on the profile page (`/pacientes/[id]`): personal information, clinical history (HC1–HC6 with interactive odontogram), and appointments in a tabbed layout with editable sections.

## Current State

**Shown:**
- Patient info card (personal data, avatar, contact info, parent info)
- `HistorialTable` — per-visit clinical history records (diagnosis, treatment, etc.)
- `CitasTable` — appointments

**Missing:**
- `clinicalDetails` — HC1 (odontólogo), HC2 (motivo consulta, antecedentes personales), HC4 (10 no-patológicos questions), HC5 (exploración bucal)
- `familyConditions` — HC3 (heredo-familiares condition table)
- `clinicalHistory.odontograma` — HC6 odontogram JSON

**Bugs/tech debt:**
- Debug `console.log` calls throughout the component
- 10-second loading timeout hack (`setTimeout` forces `loading = false`)
- `patient.genero` reference on line 428 should be `patient.sexo`

## Architecture

### Data Loading

The proxy route (`/api/proxy`) handles all client-side data fetching. It uses Prisma to query patient data. Currently it only includes `appointments` and `clinicalHistory` relations — `clinicalDetails` and `familyConditions` are missing.

After the fix, the proxy includes all four relations with proper ordering:

```ts
include: {
  appointments: { orderBy: { fechaCita: "desc" } },
  clinicalHistory: { orderBy: { fechaHistorial: "desc" } },
  clinicalDetails: true,
  familyConditions: true,
}
```

`mapPatientFields()` already uses `...rest` spread, so `clinicalDetails` and `familyConditions` pass through without renaming.

### Ficha Clínica Tab

A new `ClinicalDetailsView` component renders HC1–HC5 read-only summaries with per-section **"Editar"** buttons. Each button opens a shadcn `<Dialog>` that reuses the existing HC form component.

| Section | Data Source | Form Component |
|---------|-------------|----------------|
| HC1 — Odontólogo | `clinicalDetails.nombreOdontologo` | `hc1-form.tsx` |
| HC2 — Antecedentes Personales | `clinicalDetails.motivoConsulta` + `clinicalDetails.antecedentesPersonales` (JSON) | `hc2-form.tsx` |
| HC3 — Heredo-Familiares | `familyConditions[]` | `hc3-form.tsx` |
| HC4 — No Patológicos | `clinicalDetails.*` (10 boolean + conditional fields) | `hc4-form.tsx` |
| HC5 — Exploración Bucal | `clinicalDetails.observacionesHc5` (JSON) | `hc5-form.tsx` |

**Dialog integration pattern:**

```tsx
const [openHc2, setOpenHc2] = useState(false);

// Dialog wrapper:
<Dialog open={openHc2} onOpenChange={setOpenHc2}>
  <DialogContent>
    <Hc2Form
      patientId={patientId}
      action={saveHc2}
      onBack={() => setOpenHc2(false)}
      onSuccess={() => { setOpenHc2(false); onDataUpdate(); }}
    />
  </DialogContent>
</Dialog>
```

All existing HC form components are reused **without modification** — each already:
- Takes `patientId`, `action`, `onSuccess`, `onBack` props
- Loads existing data via `getPatientById` in `useEffect`
- Manages its own form state
- Calls `onSuccess()` after saving

### Odontograma Tab

A new `OdontogramTab` component wraps the HC6 odontogram logic:

- **Same interactive behavior** as `hc6-form.tsx` in the registration workflow
- **Light mode** — the profile page uses light theme, unlike the dark-themed HC6 modal
- **Loads saved odontogram** from `clinicalHistory[0].odontograma` (falls back to `initialPermanentTeeth` / `initialTemporaryTeeth`)
- **Saves via** `saveHc6` server action
- **Button**: "Guardar Cambios" (not "Continuar" — since it's a tab, not a workflow step)
- **No "Regresar"** button

### Profile Page Layout

The right column (currently History + Citas stacked) becomes a `<Tabs>` component:

```
┌───────────────────┬─────────────────────────────────────────────┐
│  Patient Card     │  [Historial] [Citas] [Ficha Clínica] [Odontograma]  │
│  (col-span-1)     │                                                     │
│                   │  Tab content renders the relevant section           │
└───────────────────┴─────────────────────────────────────────────┘
```

## Implementation Order

### Step 1 — Proxy Data Loading
**File:** `src/app/api/proxy/route.ts`
- Add `clinicalDetails`, `familyConditions`, and ordering to `getPacienteById` Prisma query
- No `mapPatientFields` changes needed

### Step 2 — Clinical Details View
**New file:** `src/components/clinical-details-view.tsx`
- Read-only HC1–HC5 sections with edit dialogs
- Each dialog wraps existing HC form component
- Props: `patientId`, `clinicalDetails`, `familyConditions`, `onDataUpdate`

### Step 3 — Odontogram Tab
**New file:** `src/components/odontogram-tab.tsx`
- Interactive odontogram (light mode)
- Loads/saves via `getPatientById` / `saveHc6`
- Props: `patientId`, `onDataUpdate`

### Step 4 — Profile Page Refactor
**File:** `src/app/pacientes/[id]/page.tsx`
- Replace right-column stacking with `<Tabs>`
- Import and wire `ClinicalDetailsView` and `OdontogramTab`
- Remove debug `console.log` calls
- Remove 10s loading timeout hack
- Fix `patient.genero` → `patient.sexo`

## Branch Strategy

- **Branch name:** `feat/patient-profile-data`
- **5 commits** (in order):
  1. `docs: add Present_Patient_Data.md with profile expansion plan`
  2. `fix: include clinicalDetails and familyConditions in proxy route`
  3. `feat: add ClinicalDetailsView component with editable HC1-HC5 sections`
  4. `feat: add OdontogramTab component for profile page`
  5. `refactor: profile page tabs layout, cleanup debug code, fix genero→sexo`
- Steps 2 and 3 are independent and can be developed in parallel
- **Merge to `main` only after full end-to-end verification** of all features working correctly
