# OdontogramDevNotes — Project Analysis

## Integration Status — HC6 Odontogram (2026-07-03)

The odontogram library has been fully integrated into the NovaDentalFlow HC6 form.
All work was committed directly to `main` (no separate branch).

### Post-Integration Fixes (2026-07-03)
- **Removed extraneous text fields**: Diagnóstico de Presunción, Estudios Auxiliares, Observaciones removed from HC6 form (remnants from earlier design).
- **Dark mode overhaul**: All shadcn CSS variable classes (`bg-muted/10`, `text-muted-foreground`, `bg-background`, `border-border`, etc.) replaced with hardcoded Tailwind dark colors across all 10 odontogram component files. ColorLegend, FloatingToothDetailsCard, and column components now use `isDarkMode={true}` / `theme="dark"` props.
- **Card background**: Set to `!bg-[rgb(30,30,30)]` for consistent dark modal appearance.
- **ColorLegend repositioned**: Moved outside the odontogram grid (`lg:col-span-2`) to below the entire form, preventing overflow.
- **Regresar button**: Changed `variant="outline"` → `variant="default"` to match Continuar button style.
- **Restablecer button**: Replaced shadcn `Button` component with plain `<button>` using hardcoded cyan Tailwind classes.

### Files Integrated into `src/lib/odontograma/`
| File | Source | Notes |
|------|--------|-------|
| `components/Odontogram.tsx` | Library core | Simplified to 6 clinical props (removed 7 demo props); scale `lg:scale-[0.93]` |
| `components/DetailedToothComponent.tsx` | Library core | Light-mode colors use hardcoded Tailwind (pink/purple/orange) not shadcn semantic classes |
| `components/AlignedToothContainer.tsx` | Library core | — |
| `components/columns/` | Library core | 3-column arch layout |
| `components/ColorLegend.tsx` | Adapted from demo | Open by default, uses `DetailedToothComponent` mini previews, `xl:grid-cols-9` single-row |
| `components/FloatingToothDetailsCard/` | Adapted from demo | 3-tab panel (Estado/Notas/Historial) with SVG surface selector, `grid-cols-4` status grid |
| `components/FloatingToothDetailsCard/sections/SurfacesSection.tsx` | Adapted from demo | 5 clickable SVG tooth surface zones (V/M/O/D/L) |
| `data/dentalData.ts` | Library core | — |
| `types/index.ts` | Library core | — |
| `config/layoutConfig.ts` | Library core | — |
| `constants/layout.ts` | Library core | — |
| `styles/odontogram.css` | Library core | — |

### Layout (hc6-form.tsx)
Matches demo: `grid grid-cols-1 lg:grid-cols-3` with:
- Left (col-span-2): Odontogram + ColorLegend (always visible)
- Right (col-span-1): FloatingToothDetailsCard (when tooth selected) or "Selecciona un diente" placeholder (always visible)

### Key Fixes Applied
1. **Tailwind content paths** — Added `'./src/lib/**/*.{js,ts,jsx,tsx,mdx}'` to `tailwind.config.ts` so utility classes in `src/lib/` are generated
2. **Button type="submit" bug** — Added `type="button"` to all toggle buttons inside `<form>` to prevent unintended form submission (caused redirect to cita page)
3. **Modal width** — Odontogram step gets `max-w-[1380px] h-[950px]`; all other steps keep `max-w-4xl max-h-[90vh]`
4. **Status grid** — Changed to `grid-cols-4` compact layout matching demo
5. **Scale** — `lg:scale-100` → `lg:scale-[0.93]` to prevent 60px overflow on both sides at 1380px width
6. **Light-mode tooth colors** — `DetailedToothComponent` uses hardcoded Tailwind colors (`bg-pink-100 border-pink-500` for root_canal, `bg-purple-100 border-purple-500` for implant, `bg-orange-100 border-orange-500` for fracture) instead of shadcn `secondary`/`primary`/`accent` classes that rendered as light gray
7. **ColorLegend** — Rewritten to match demo: open by default, uses `DetailedToothComponent` for 9 mini sample teeth, `grid-cols-3 md:grid-cols-5 xl:grid-cols-9`, "Sistema FDI" footer note
8. **TypeScript** — Fixed `sexo` cast to enum union and `esMenor` string conversion in `sequential-workflow.tsx`
9. **Build** — Passes consistently (`npm run build`)
10. **Dark mode colors** — Replaced all shadcn CSS variable classes (`bg-muted/10`, `text-muted-foreground`, `bg-background`, `border-border`, etc.) with hardcoded Tailwind dark colors across 10 component files. Card background set to `!bg-[rgb(30,30,30)]`. ColorLegend/FloatingToothDetailsCard accept `isDarkMode`/`theme` props.
11. **Removed extraneous fields** — Diagnóstico de Presunción, Estudios Auxiliares, Observaciones removed from HC6 form. Prisma schema columns dropped accordingly.
12. **ColorLegend repositioned** — Moved outside odontogram grid to below the entire form section to prevent overflow.
13. **Regresar button style** — Changed `variant="outline"` → `variant="default"` to match Continuar.
14. ~~**Patient name & age in HC6 header** — `hc6-form.tsx` now fetches patient data via `getPatientById` (same pattern as hc2/hc5) and displays name + age below Fecha. Header background changed to `bg-gray-800/50` with `text-gray-100`. Label "Name:" → "Nombre:". Merged via `feat/hc6-patient-info` branch.~~ **REVERTED** — rolled back to 6b7b938. Revert corrupted `import './FloatingToothDetailsCard.css'` to `import  ;` — fixed.

### What Was NOT Integrated (Demo-only features)
- Case selector (CompactCaseSelector) — not needed for HC6
- Bite animation — not needed
- Theme toggle — not needed
- Patient header — handled by HC6 workflow
- Services panel — unused in main flow
- Clinical case systems — not needed

---

## Overview

**op-odontorgram** is a dual-mode React project: an interactive dental odontogram library (`op-odontogram` npm package) and a demo application. Built with TypeScript, Vite, Tailwind CSS, and DaisyUI.

- npm: `op-odontogram` v1.2.0
- Author: Pedro Hernández Letelier
- License: MIT
- Status: Beta

---

## CRITICAL — Dual Codebase Structure

The project has **two parallel codebases** living inside `src/`. This is the most important architectural finding.

### 1. Library Core (`src/lib/odontograma/`)

The reusable npm library. Clean, self-contained components.

```
src/lib/odontograma/
├── index.ts              # Library entry point (exports)
├── types/index.ts        # Tooth, ToothStatus, ToothProcedure, ToothSurface, ToothRenderProps
├── data/dentalData.ts    # initialPermanentTeeth, initialTemporaryTeeth, TOOTH_TYPES, TOOTH_GROUPS
├── components/
│   ├── Odontogram.tsx    # Library Odontogram with column architecture
│   ├── DetailedToothComponent.tsx
│   ├── AlignedToothContainer.tsx  # Handles vertical alignment
│   └── columns/          # OdontogramColumn1, Column2, Column3
├── config/layoutConfig.ts  # Tooth-specific vertical offsets (arch curve)
├── constants/layout.ts     # Universal spacing constants, dev colors
└── styles/odontogram.css
```

### 2. Demo App (`src/components/`, `src/data/`, `src/hooks/`)

The demo application that wraps the library with extra UI.

```
src/
├── App.tsx                 # Root component — manages ALL state
├── main.tsx                # Entry point
├── components/
│   ├── Odontogram.tsx      # **APP-LEVEL** — extends library version
│   ├── DetailedToothComponent.tsx  # **APP-LEVEL** — hand-rolled inline SVG tooth
│   ├── FloatingToothDetailsCard/   # Tooth detail panel with tabs
│   │   ├── FloatingToothDetailsCard.tsx
│   │   ├── index.ts
│   │   └── sections/
│   │       ├── DiagnosisSection.tsx
│   │       ├── NotesSection.tsx
│   │       ├── ProceduresSection.tsx
│   │       └── SurfacesSection.tsx
│   ├── PatientHeader.tsx
│   ├── PatientInfo.tsx
│   ├── ColorLegend.tsx
│   ├── CompactCaseSelector.tsx
│   ├── ServicesPanel.tsx       # Unused/disconnected in main flow
│   ├── ToothDetailPanel.tsx    # Unused/disconnected in main flow
│   ├── CaseSelector.tsx
│   └── ToothDocumentation.tsx
├── data/
│   ├── dentalData.ts        # **DUPLICATE** of lib version
│   ├── demoTeeth.ts         # Demo teeth generator
│   ├── clinicalCases.ts     # **OLD system** — mutates arrays directly
│   ├── clinicalCasesNew.ts  # **NEW system** — uses applyCase() pattern
│   └── cases/               # Modular case data files
│       ├── index.ts
│       ├── emptyCaseData.ts
│       ├── basicCaseData.ts
│       ├── complexCaseData.ts
│       ├── orthodonticCaseData.ts
│       ├── pediatricCaseData.ts
│       ├── infantCaseData.ts
│       └── periodontalCaseData.ts
├── hooks/
│   ├── index.ts
│   ├── useOdontogramState.ts  # Teeth state management hook
│   ├── useBiteAnimation.ts    # Bite open/close animation
│   ├── useClinicalCases.ts    # Case application logic
│   └── useLocalStorage.ts     # Persistence (exists but NOT wired in App.tsx)
├── types/
│   └── dental.ts             # **DUPLICATE** of lib/types — slightly different
└── index.css
```

---

## Key Finding: Dual Type Definitions

There are **two separate `Tooth` type definitions** that are slightly different:

| Aspect | `src/types/dental.ts` | `lib/odontograma/types/index.ts` |
|--------|----------------------|----------------------------------|
| Demo properties | `isDemo`, `demoLabel` | NOT present |
| `lastUpdate` | Present | Present |
| `procedures` | `any[]` | `ToothProcedure[]` (typed) |
| ToothSurface | Inline in `surfaces?` | Separate `ToothSurface` interface |
| `ToothRenderProps` | NOT present | Present |

**Result:** Some components import from `../../types/dental`, others from `../../lib/odontograma/types`. This can cause type mismatches.

---

## Data Flow

```
App.tsx (single source of truth for all state)
 ├── Patient state → PatientHeader component
 ├── Teeth arrays → Odontogram component (app-level)
 │   ├── Groups teeth by quadrant/position
 │   ├── Renders DetailedToothComponent for each tooth
 │   └── Handles bite animation effect
 ├── Selected tooth → FloatingToothDetailsCard
 │   └── 3 tabs: Estado | Notas | Historial
 └── Case selection → CompactCaseSelector
     └── Applies clinical case data to teeth arrays
```

- **No global state management** (no Redux, Zustand, Context)
- All state lives in `App.tsx` via `useState` hooks
- State flows down through props
- Callbacks flow up through props

---

## Clinical Case Systems (DUAL)

### Old System: `clinicalCases.ts`
- Inline data with `updateTeeth()` helper that **mutates arrays directly** (`tooth.status = status`)
- Creates teeth via `createTooth()` and `createTempTooth()` helpers
- Used by `CompactCaseSelector.tsx` and `App.tsx`

### New System: `clinicalCasesNew.ts` + `data/cases/`
- Cleaner `applyCase()` function that merges partial updates immutably
- `cases/index.ts` imports from separate per-category files
- Library exports `createTooth()` helper

### 7 Predefined Cases:
| ID | Category | Age | Description |
|----|----------|-----|-------------|
| `empty` | empty | 30 | Clean odontogram |
| `basic-adult` | basic | 35 | Caries + fillings + 1 extraction |
| `periodontal` | periodontal | 55 | Advanced periodontal disease |
| `complex` | complex | 60 | Crowns, implants, root canals, bridge |
| `orthodontic` | orthodontic | 16 | Active braces with therapeutic extractions |
| `pediatric` | pediatric | 7 | Mixed dentition, sealants |
| `infant` | infant | 4 | Primary teeth only, baby bottle caries |

---

## Odontogram Layout Architecture

### 6-Group Layout
The tooth arch is split into 6 groups forming a 3-column × 2-row grid:
- **Column 1:** Group 1 (upper right posteriors) + Group 4 (lower right posteriors)
- **Column 2:** Group 2 (upper anteriors) + Group 5 (lower anteriors) — with midline separator
- **Column 3:** Group 3 (upper left posteriors) + Group 6 (lower left posteriors)

### Tooth Positioning
- **`layoutConfig.ts`:** Defines `verticalOffset` per tooth to simulate the arch curve
- **`constants/layout.ts`:** Universal slot height (`h-[130px]`), temporary tooth height (`h-[100px]`), spacing
- **`AlignedToothContainer.tsx`:** Upper teeth align to top, lower teeth align to bottom (natural occlusal alignment)
- Developer mode overlays position debug info

### Bite Animation
- Managed by `useBiteAnimation` hook
- State: `showBiteEffect` (open/closed) + `isAnimatingBite` (in-progress)
- Creates animated space between upper and lower arches
- Temporary teeth visible only when bite is "open" (`showBiteEffect=true`)

---

## Component-Specific Notes

### `DetailedToothComponent` (App-level, `src/components/`)
- Hand-rolled inline SVG/HTML tooth rendering (NOT a canvas or SVG-based system)
- Shows 5 surfaces in a 3×3 grid: vestibular (top), mesial (L), oclusal (center), distal (R), lingual (bottom)
- Root visualization: single/bifurcated/trifurcated based on `toothType` and `isUpper`
- Temporary teeth shown in orange theme with smaller dimensions
- Uses `lucide-react` icons for status badges
- Extracted teeth show X mark overlay and 40% opacity

### `FloatingToothDetailsCard` (App-level)
- 3-tab panel: Estado (status + surface SVG picker), Notas, Historial
- Includes an interactive SVG tooth for surface-level status application
- "Apply to whole tooth" button sets all surfaces + main status at once
- Shows save-success animation feedback

### `ColorLegend`
- Imports `DetailedToothComponent` from `lib/odontograma/components`
- Accepts `isDarkMode` prop that does NOT exist on the library component's props interface
- Collapsible grid showing all 9 tooth states as mini previews

### `PatientHeader`
- Editable patient name, age
- Generates NHC (health record number) from timestamp
- Theme toggle (light/dark) via `data-theme` attribute on `<html>`

---

## UI Framework & Styling

- **Tailwind CSS** v3.4.1
- **DaisyUI** v5.0.46 (optional dependency)
- **Lucide React** v0.344.0 (icons)
- Light/dark theme via DaisyUI `data-theme` attribute
- Styling uses a mix of DaisyUI classes (`btn`, `card`, `badge`, `dropdown`) and custom Tailwind classes (`bg-surface-primary`, `text-text-primary`)

---

## Known Issues & Tech Debt

1. **Dual Clinical Case Systems** — `clinicalCases.ts` (legacy) and `clinicalCasesNew.ts` (new) coexist. The legacy system mutates arrays. The `CompactCaseSelector` still imports from the old system.

2. **Dual Type Definitions** — `src/types/dental.ts` vs `lib/odontograma/types/index.ts` have different fields. Components import inconsistently.

3. **Dual Odontogram Components** — App-level `src/components/Odontogram.tsx` and library `lib/odontograma/components/Odontogram.tsx` have diverging prop interfaces. The app version duplicates the library's JSX rather than wrapping it.

4. **Dual DentalData Files** — `src/data/dentalData.ts` duplicates `lib/odontograma/data/dentalData.ts` with slightly different variable names.

5. **Unused/Disconnected Components** — `ServicesPanel.tsx` and `ToothDetailPanel.tsx` are not imported anywhere in the current app flow but appear to be previous iterations of the details panel.

6. **`useLocalStorage` Not Wired** — The persistence hook exists but is never used in `App.tsx`. Changes are lost on refresh.

7. **`ColorLegend` Prop Mismatch** — Passes `isDarkMode` prop to the library's `DetailedToothComponent` which doesn't accept it.

8. **No Testing** — No test framework or test files found in the project.

9. **State Management** — All state in `App.tsx` creates a monolithic component (~243 lines). The `useOdontogramState` hook exists but isn't used.

10. **`any` Usage** — `procedures` typed as `any[]` in `dental.ts` instead of proper type; `caseToothData` in `clinicalCases.ts` uses `any`.

11. **Direct Mutation** — `updateTeeth()` in `clinicalCases.ts` mutates the teeth array in place.

12. **Magic Numbers** — Temporary tooth ID range `51-85` hardcoded in `App.tsx:142` for determining if a tooth is temporary.

13. **`ToothRenderProps` not exported** — Type exists in library types but missing from `lib/odontograma/index.ts` exports.

14. **README-LIBRARY.md documents unexported APIs** — `getClinicalCaseById` and case usage shown in examples, but neither is exported from the library entry point.

15. **README example incomplete** — Shows `<Odontogram>` with 3 props; library requires 10 required props, causing TypeScript errors for new users.

16. **No hooks in library API** — Consumers must reimplement `useOdontogramState`, `useBiteAnimation`, etc. with no library-provided hooks.

---

## Build & Deploy

```bash
npm run dev           # Vite dev server
npm run build         # Build app
npm run build:lib     # Build npm library (to dist/)
npm run build:demo    # Build for GitHub Pages
npm run lint          # ESLint
npm run preview       # Preview production build
```

- GitHub Pages deployment: `GITHUB_PAGES=true vite build`
- Library build vite config at `vite.config.ts` checks `command === 'build' && mode === 'lib'`

---

## File Tree

```
.github/workflows/deploy.yml
API.md
README-LIBRARY.md
README.md
eslint.config.js
index.html
postcss.config.js
package.json
tailwind.config.js
tsconfig.app.json
tsconfig.node.json
vite.config.ts
src/
├── App.tsx
├── main.tsx
├── index.css
├── components/
│   ├── CaseSelector.tsx
│   ├── ColorLegend.tsx
│   ├── CompactCaseSelector.tsx
│   ├── DetailedToothComponent.tsx
│   ├── Odontogram.tsx
│   ├── PatientHeader.tsx
│   ├── PatientInfo.tsx
│   ├── ServicesPanel.tsx
│   ├── ToothDetailPanel.tsx
│   ├── ToothDocumentation.tsx
│   └── FloatingToothDetailsCard/
│       ├── FloatingToothDetailsCard.tsx
│       ├── index.ts
│       └── sections/
│           ├── DiagnosisSection.tsx
│           ├── NotesSection.tsx
│           ├── ProceduresSection.tsx
│           └── SurfacesSection.tsx
├── data/
│   ├── clinicalCases.ts
│   ├── clinicalCasesNew.ts
│   ├── demoTeeth.ts
│   ├── dentalData.ts
│   └── cases/
│       ├── index.ts
│       ├── basicCaseData.ts
│       ├── complexCaseData.ts
│       ├── emptyCaseData.ts
│       ├── infantCaseData.ts
│       ├── orthodonticCaseData.ts
│       ├── pediatricCaseData.ts
│       └── periodontalCaseData.ts
├── hooks/
│   ├── index.ts
│   ├── useBiteAnimation.ts
│   ├── useClinicalCases.ts
│   ├── useLocalStorage.ts
│   └── useOdontogramState.ts
├── lib/
│   └── odontograma/
│       ├── index.ts
│       ├── components/
│       │   ├── Odontogram.tsx
│       │   ├── DetailedToothComponent.tsx
│       │   ├── AlignedToothContainer.tsx
│       │   └── columns/    # Column1, Column2, Column3
│       ├── config/
│       │   └── layoutConfig.ts
│       ├── constants/
│       │   └── layout.ts
│       ├── data/
│       │   └── dentalData.ts
│       ├── styles/
│       │   └── odontogram.css
│       └── types/
│           └── index.ts
└── types/
    └── dental.ts
```

---

## Library Mode (`op-odontogram` npm package)

### Build Pipeline

`npm run build:lib` runs `vite build --mode lib`, which triggers the library-specific config in `vite.config.ts`:

- **Entry point:** `src/lib/odontograma/index.ts`
- **Outputs:**
  - `dist/index.es.js` — ES module (preferred by bundlers)
  - `dist/index.js` — CommonJS fallback
- **Externals (not bundled):** `react`, `react-dom` (peer dependencies)
- **Bundled dependency:** `lucide-react` (runtime dep)
- **TypeScript declarations:** generated by `tsc` during `npm run build` (`vite build && tsc`)
- **CSS:** `src/lib/odontograma/styles/odontogram.css` must be in `dist/` — consumers import separately
- **Prepublish:** `prepublishOnly` runs `npm run build:lib`

### Package Config (`package.json` fields for npm publish)

```json
{
  "main": "dist/index.js",
  "module": "dist/index.es.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md", "LICENSE"]
}
```

### Public API (Everything Exported from `lib/odontograma/index.ts`)

| Export | Kind | Source |
|--------|------|--------|
| `Odontogram` | Component | `./components/Odontogram` |
| `OdontogramProps` | Type | `./components/Odontogram` |
| `DetailedToothComponent` | Component | `./components/DetailedToothComponent` |
| `DetailedToothComponentProps` | Type | `./components/DetailedToothComponent` |
| `Tooth` | Type | `./types` |
| `ToothStatus` | Type | `./types` |
| `ToothProcedure` | Type | `./types` |
| `ToothSurface` | Type | `./types` |
| `TOOTH_TYPES` | Const | `./data/dentalData` |
| `TOOTH_GROUPS` | Const | `./data/dentalData` |
| `initialPermanentTeeth` | Data | `./data/dentalData` |
| `initialTemporaryTeeth` | Data | `./data/dentalData` |
| `toothLayoutConfig` | Config | `./config/layoutConfig` |
| `getToothVerticalOffset` | Util | `./config/layoutConfig` |
| `ToothLayoutConfig` | Type | `./config/layoutConfig` |
| `createTooth(id, quad, pos, opts?)` | Util | inline in `index.ts` |

### Consumer Usage Pattern

The library is **headless** regarding state — consumers manage everything themselves:

```jsx
import React, { useState } from 'react';
import { Odontogram, initialPermanentTeeth, initialTemporaryTeeth } from 'op-odontogram';
import 'op-odontogram/styles/odontogram.css';

function App() {
  const [teeth, setTeeth] = useState(initialPermanentTeeth);
  const [temporaryTeeth, setTemporaryTeeth] = useState(initialTemporaryTeeth);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [showTemporaryTeeth, setShowTemporaryTeeth] = useState(false);
  const [showBiteEffect, setShowBiteEffect] = useState(false);
  const [isAnimatingBite, setIsAnimatingBite] = useState(false);

  const handleToothClick = (tooth) => setSelectedTooth(tooth);

  const simulateBite = () => {
    if (isAnimatingBite) return;
    setIsAnimatingBite(true);
    setShowBiteEffect(false);
    setTimeout(() => setShowBiteEffect(true), 300);
    setTimeout(() => setShowBiteEffect(false), 1000);
    setTimeout(() => setIsAnimatingBite(false), 1500);
  };

  return (
    <div style={{ height: '600px' }}>
      <Odontogram
        teeth={teeth}
        temporaryTeeth={temporaryTeeth}
        showTemporaryTeeth={showTemporaryTeeth}
        onToggleTemporaryTeeth={setShowTemporaryTeeth}
        selectedTooth={selectedTooth}
        onToothClick={handleToothClick}
        showBiteEffect={showBiteEffect}
        onToggleBiteEffect={setShowBiteEffect}
        isAnimatingBite={isAnimatingBite}
        onSimulateBite={simulateBite}
      />
    </div>
  );
}
```

**Key requirements for consumers:**
1. Manage all 10 required Odontogram props via their own state
2. Provide a height context (e.g., `style={{ height: '600px' }}` or `h-full` parent)
3. Import CSS separately from `'op-odontogram/styles/odontogram.css'`
4. Have Tailwind CSS + DaisyUI configured (the components use Tailwind utility classes directly)

### Component Architecture (Library Internal)

```
Odontogram
├── Header (title, temp teeth toggle, dev mode btn, bite controls)
├── 3-column layout
│   ├── OdontogramColumn1 (Groups 1 & 4 — right molars/premolars)
│   ├── OdontogramColumn2 (Groups 2 & 5 — anteriors + midline)
│   └── OdontogramColumn3 (Groups 3 & 6 — left molars/premolars)
│       └── Each column has 4 rows:
│           ├── Permanent upper → AlignedToothContainer → DetailedToothComponent
│           ├── Temporary upper (conditional) → AlignedToothContainer → DetailedToothComponent
│           ├── Temporary lower (conditional) → AlignedToothContainer → DetailedToothComponent
│           └── Permanent lower → AlignedToothContainer → DetailedToothComponent
└── Horizontal separator between arches
```

### Layout System

- **`AlignedToothContainer`** — fixed-height slot (`h-[130px]` per tooth, `h-[100px]` for temps). Upper teeth align to top, lower to bottom.
- **`DetailedToothComponent`** — renders tooth body in a 105px area. Uses `verticalOffset` from `layoutConfig.ts` to push teeth up/down, simulating arch curvature. The offset creates a U-shape: incisors have highest offset (35px), molars the lowest (0px).
- **`constants/layout.ts`** — universal constants (`TOOTH_SLOT_HEIGHT`, `TOOTH_SLOT_WIDTH`, `TOOTH_SPACING`, `ROW_SPACING`) ensuring consistent layout.
- **Developer mode** — toggles colored borders, labels, and alignment reference lines for debugging tooth positions.
- **Bite animation** — `showBiteEffect` toggles temporary tooth rows between 0 and 100px height via CSS transitions. Temp teeth are only visible when the "mouth" is open.

### Styling Approach

- **Tailwind utility classes** are hardcoded in every component (e.g., `bg-success/20`, `border-error`, `text-accent`)
- **Fallback CSS** (`styles/odontogram.css`) provides `.tooth-*`, `.odontogram-*`, and `.tooth-surface-*` classes for consumers without Tailwind
- **Dark mode** via `isDarkMode` prop on `DetailedToothComponent` switches light/dark Tailwind color palettes
- **DaisyUI** is optional — the library uses class conventions compatible with DaisyUI but doesn't strictly require it

### What's NOT Exported (Critical Gaps)

These exist in the codebase or are documented in README-LIBRARY.md but are **not** part of the actual library API:

| Feature | Location | Issue |
|---------|----------|-------|
| `getClinicalCaseById()` | `src/data/clinicalCases.ts` | Documented in README-LIBRARY.md but not exported from `index.ts` |
| `clinicalCases` array | `src/data/clinicalCases.ts` | Same — documented but not exported |
| `applyCase()` | `src/data/clinicalCasesNew.ts` | Not exported |
| All hooks | `src/hooks/` | Not exported |
| `AlignedToothContainer` | `lib/components/` | Internal only |
| Column components | `lib/components/columns/` | Internal only |
| `ToothRenderProps` type | `lib/types/` | Defined but **not** exported from `lib/index.ts` |
| Layout constants | `lib/constants/layout.ts` | Not exported |
| `FloatingToothDetailsCard` | `src/components/` | App-level, not in library |

### Known Issues in Library Mode

1. **`ToothRenderProps` type** is defined in `lib/types/index.ts:136` but omitted from `lib/index.ts` exports.
2. **`README-LIBRARY.md` documents features not actually exported** — `getClinicalCaseById` and case usage examples reference unexported APIs.
3. **README-LIBRARY.md example is incomplete** — shows `<Odontogram>` with only 3 props (`teeth`, `showTemporaryTeeth`, `onToothClick`), but the component requires 10 required props.
4. **No hooks exported** — consumers must implement `useOdontogramState`, `useBiteAnimation`, etc. themselves with no library support.
5. **CSS import path** `'op-odontogram/styles/odontogram.css'` — relies on the CSS being copied to the dist folder. Not verified that this actually works.
6. **Tailwind dependency** — consumers must have Tailwind configured with the same color classes (`bg-success`, `border-error`, etc.) or the styling breaks. The fallback CSS file exists but is not the primary styling mechanism.

---

## Quick Start Checklist

Step-by-step to get an Odontogram on screen in a new project:

### Step 1: Install Dependencies

```bash
npm install op-odontogram lucide-react react react-dom
```

If using Tailwind (recommended):
```bash
npm install -D tailwindcss @tailwindcss/vite
```

If using DaisyUI (optional, provides theme colors):
```bash
npm install -D daisyui
```

### Step 2: Configure Tailwind

```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  plugins: [require('daisyui')],  // optional
  daisyui: {
    themes: ['light', 'dark'],    // or custom theme
  },
}
```

Add Tailwind to your CSS:
```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 3: Import CSS

```js
// src/main.tsx or App.tsx
import 'op-odontogram/styles/odontogram.css';
```

The library CSS provides fallback `.tooth-*` classes. Without Tailwind, these are your only styling.

### Step 4: Minimal Component

```tsx
import { useState } from 'react';
import { Odontogram, initialPermanentTeeth, initialTemporaryTeeth } from 'op-odontogram';
import type { Tooth } from 'op-odontogram';

function DentalChart() {
  const [teeth, setTeeth] = useState(initialPermanentTeeth);
  const [tempTeeth, setTempTeeth] = useState(initialTemporaryTeeth);
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [showTemp, setShowTemp] = useState(false);
  const [showBite, setShowBite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const simulateBite = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowBite(false);
    setTimeout(() => setShowBite(true), 300);
    setTimeout(() => setShowBite(false), 1000);
    setTimeout(() => setIsAnimating(false), 1500);
  };

  return (
    <div className="h-[600px]">
      <Odontogram
        teeth={teeth}
        temporaryTeeth={tempTeeth}
        showTemporaryTeeth={showTemp}
        onToggleTemporaryTeeth={setShowTemp}
        selectedTooth={selectedTooth}
        onToothClick={setSelectedTooth}
        showBiteEffect={showBite}
        onToggleBiteEffect={setShowBite}
        isAnimatingBite={isAnimating}
        onSimulateBite={simulateBite}
      />
    </div>
  );
}
```

### Step 5: Verify

The odontogram renders with 32 healthy permanent teeth. Click any tooth to select it (visual ring highlight). Toggle "Dientes temporales" to see 20 temporary teeth. Use the bite animation button.

---

## Full Props Reference — Odontogram

All 15 props from the library's `OdontogramProps` interface (`lib/odontograma/components/Odontogram.tsx:5`):

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `teeth` | `Tooth[]` | ✅ Yes | — | 32 permanent teeth array |
| `temporaryTeeth` | `Tooth[]` | ✅ Yes | — | 20 temporary teeth array |
| `showTemporaryTeeth` | `boolean` | ✅ Yes | — | Show/hide temporary teeth row |
| `onToggleTemporaryTeeth` | `(show: boolean) => void` | ✅ Yes | — | Called when user toggles temp teeth |
| `selectedTooth` | `Tooth \| null` | ✅ Yes | — | Currently selected tooth (highlighted) |
| `onToothClick` | `(tooth: Tooth) => void` | ✅ Yes | — | Called when a tooth is clicked |
| `showBiteEffect` | `boolean` | ✅ Yes | — | Open (true) / closed (false) mouth |
| `onToggleBiteEffect` | `(show: boolean) => void` | ✅ Yes | — | Called when bite toggle is clicked |
| `isAnimatingBite` | `boolean` | ✅ Yes | — | Disables bite button during animation |
| `onSimulateBite` | `() => void` | ✅ Yes | — | Triggers open→close→open sequence |
| `selectedCaseId` | `string` | ❌ No | — | Highlights matching case in the built-in selector |
| `onCaseSelect` | `(caseId: string) => void` | ❌ No | — | Called when a clinical case is selected |
| `developerMode` | `boolean` | ❌ No | `false` | Shows layout debug overlays |
| `onToggleDeveloperMode` | `(enabled: boolean) => void` | ❌ No | — | Called when dev mode toggled |
| `onToothHover` | `(tooth: Tooth \| null) => void` | ❌ No | — | Called on mouse enter/leave a tooth |

---

## State Management Recipes

Common patterns a consumer must implement (library provides no hooks):

### 1. Update Tooth Status on Click

```tsx
const handleToothClick = (tooth: Tooth) => {
  setSelectedTooth(tooth);
  setTeeth(prev => prev.map(t =>
    t.id === tooth.id ? { ...t, status: currentTool } : t
  ));
};
```

### 2. Toggle Individual Surface Status

```tsx
const updateSurface = (toothId: number, surface: string, status: ToothStatus) => {
  setTeeth(prev => prev.map(t =>
    t.id === toothId
      ? { ...t, surfaces: { ...t.surfaces, [surface]: status } }
      : t
  ));
};
```

### 3. Reset All Teeth to Healthy

```tsx
const resetTeeth = () => {
  setTeeth(initialPermanentTeeth);
  setTempTeeth(initialTemporaryTeeth);
  setSelectedTooth(null);
};
```

### 4. Bite Animation Hook (copy-paste ready)

```tsx
function useBiteAnimation() {
  const [showBiteEffect, setShowBiteEffect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const simulateBite = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowBiteEffect(false);
    setTimeout(() => setShowBiteEffect(true), 300);
    setTimeout(() => setShowBiteEffect(false), 1000);
    setTimeout(() => setIsAnimating(false), 1500);
  };

  return { showBiteEffect, isAnimating, setShowBiteEffect, simulateBite };
}
```

### 5. Apply a Clinical Case

```tsx
// Note: clinicalCases is NOT exported from the library.
// You must copy src/data/clinicalCases.ts into your own project or implement your own.
import { clinicalCases } from './data/clinicalCases';
import { initialPermanentTeeth, initialTemporaryTeeth } from 'op-odontogram';

const applyCase = (caseId: string) => {
  if (caseId === 'empty') {
    setTeeth(initialPermanentTeeth);
    setTempTeeth(initialTemporaryTeeth);
    return;
  }
  const clinicalCase = clinicalCases.find(c => c.id === caseId);
  if (!clinicalCase) return;
  setTeeth(prev => prev.map(t => {
    const caseData = clinicalCase.permanentTeeth.find(ct => ct.id === t.id);
    return caseData ? { ...t, status: caseData.status, notes: caseData.notes } : t;
  }));
};
```

### 6. Track Tooth Changes (Dirty Flag)

```tsx
const [hasChanges, setHasChanges] = useState(false);
const [teeth, setTeeth] = useState(initialPermanentTeeth);

const updateTooth = (id: number, updates: Partial<Tooth>) => {
  setTeeth(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  setHasChanges(true);
};
```

---

## Tailwind Color Mapping

The library components hardcode DaisyUI semantic color classes. A consumer's Tailwind config must define these or the teeth will be invisible.

### Required Color Classes

The library's `DetailedToothComponent` uses these DaisyUI/Tailwind classes directly:

| Class | CSS Variable | Fallback (if no DaisyUI) |
|-------|-------------|--------------------------|
| `bg-success/20` | `--s` (DaisyUI) or custom | `rgba(16, 185, 129, 0.2)` |
| `border-success` | `--s` | `#10b981` |
| `text-success-content` | DaisyUI derived | `#065f46` |
| `bg-error/20` | `--er` | `rgba(239, 68, 68, 0.2)` |
| `border-error` | `--er` | `#ef4444` |
| `bg-info/20` | `--in` | `rgba(59, 130, 246, 0.2)` |
| `border-info` | `--in` | `#3b82f6` |
| `bg-warning/20` | `--wa` | `rgba(245, 158, 11, 0.2)` |
| `border-warning` | `--wa` | `#f59e0b` |
| `bg-primary/20` | `--p` | `rgba(37, 99, 235, 0.2)` |
| `border-primary` | `--p` | `#2563eb` |
| `bg-secondary/20` | `--s` | `rgba(5, 150, 105, 0.2)` |
| `border-secondary` | `--s` | `#059669` |
| `bg-accent/10` | `--a` | `rgba(220, 38, 38, 0.1)` |
| `text-accent` | `--a` | `#dc2626` |
| `text-accent-content` | DaisyUI derived | `#ffffff` |
| `bg-base-100` | `--b1` | `#ffffff` |
| `bg-base-200` | `--b2` | `#f3f4f6` |
| `border-base-300` | `--b3` | `#e5e7eb` |
| `text-base-content` | `--bc` | `#1f2937` |

### Minimum Tailwind Config Without DaisyUI

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        success: { DEFAULT: '#10b981', content: '#065f46' },
        error:   { DEFAULT: '#ef4444', content: '#991b1b' },
        warning: { DEFAULT: '#f59e0b', content: '#92400e' },
        info:    { DEFAULT: '#3b82f6', content: '#1e3a8a' },
        primary: { DEFAULT: '#2563eb', content: '#ffffff' },
        secondary: { DEFAULT: '#059669', content: '#ffffff' },
        accent:  { DEFAULT: '#dc2626', content: '#ffffff' },
        neutral: { DEFAULT: '#374151', content: '#ffffff' },
        base: {
          100: '#ffffff', 200: '#f3f4f6', 300: '#e5e7eb',
          content: '#1f2937',
        },
      },
    },
  },
};
```

### CSS Variable Approach (No Tailwind)

The library's `styles/odontogram.css` file defines `.tooth-status-*`, `.tooth-surface-*`, and `.odontogram-*` classes that use fixed CSS colors (not Tailwind variables). If Tailwind is not configured, import this CSS and the tooth statuses will render with the fallback palette:

```css
.tooth-status-healthy { background-color: #d1fae5; border-color: #10b981; }
.tooth-status-caries  { background-color: #fee2e2; border-color: #ef4444; }
/* etc. — see styles/odontogram.css for full list */
```

---

## CSS Customization Guide

### Overriding Tooth Sizes

The library uses responsive Tailwind classes for tooth dimensions. Override via CSS:

```css
/* Make all permanent teeth larger */
[class*="tooth-size-permanent"] {
  width: 3rem !important;
  height: 4.5rem !important;
}

/* Or target by tooth type */
.tooth-size-permanent-molar {
  width: 3rem;
  height: 5rem;
}
```

The CSS fallback classes are defined in `styles/odontogram.css`:
- `.tooth-size-permanent-frontal` — incisors/canines (pos 1-3)
- `.tooth-size-permanent-premolar` — premolars (pos 4-5)
- `.tooth-size-permanent-molar` — molars (pos 6-8)
- `.tooth-size-temporary-{frontal,premolar,molar}` — smaller variants

### Overriding Tooth Colors

Target by status class:

```css
.tooth-status-caries {
  background-color: #ffb3b3 !important;
  border-color: #cc0000 !important;
}
```

Or override the DaisyUI theme colors in your tailwind.config.js:

```js
daisyui: {
  themes: [{
    mytheme: {
      'success': '#00cc66',
      'error':   '#ff3333',
      /* ... */
    },
  }],
},
```

### Overriding Root Appearance

Roots are rendered as plain divs with border styles. Override via:

```css
/* Single root (incisors/canines) */
.tooth-root-single { width: 10px; height: 20px; }

/* Bifurcated roots (premolars, lower molars) */
.tooth-root-double { width: 6px; height: 16px; }

/* Trifurcated roots (upper molars) */
.tooth-root-triple { width: 4px; height: 16px; }
```

### Adding Custom Tooth Statuses

The `ToothStatus` type is a union. To extend:
1. Add your status string to the type (library limitation — you'd need to fork or use type augmentation)
2. Add a corresponding color definition in your CSS (`.tooth-status-your-status`)
3. The component will fall through to `default` case (gray styling) for unknown statuses

---

## Responsive Behavior

### Scaling

The odontogram uses CSS `scale()` for responsive sizing:

```css
.odontogram-columns {
  scale: 0.75;      /* mobile (< 640px) */
}
@media (min-width: 640px) {
  scale: 0.9;       /* tablet */
}
@media (min-width: 1024px) {
  scale: 1;         /* desktop */
}
```

This means the odontogram renders at native size only above 1024px. Below that it shrinks proportionally.

### Minimum Container Size

| Breakpoint | Container Width | Odontogram Width (approx) |
|------------|----------------|---------------------------|
| Mobile (<640px) | min 320px | ~450px (scaled 75%) |
| Tablet (640-1024px) | min 480px | ~550px (scaled 90%) |
| Desktop (>1024px) | min 600px | ~600px (scaled 100%) |

The odontogram needs a **container with explicit height** (e.g., `h-[600px]`, `min-h-screen`, or `style={{ height: '500px' }}`). Without a height, it collapses.

### Tooth Slot Sizes

Each tooth sits in a fixed-height slot:
- **Permanent:** `h-[130px]` (includes tooth body + roots + label + offset)
- **Temporary:** `h-[100px]`

Tooth body height within the slot: `105px` (constant via `TOOTH_HEIGHT` in `constants/layout.ts`).

### Gap Between Teeth

```css
/* Mobile */  gap: 0.25rem;  /* 4px */
/* Tablet */  gap: 0.375rem; /* 6px */
/* Desktop */ gap: 0.5rem;   /* 8px */
```

---

## Event Handling Reference

All callbacks the `Odontogram` component fires:

| Callback | Signature | Fires |
|----------|-----------|-------|
| `onToothClick` | `(tooth: Tooth, event?: React.MouseEvent) => void` | Click on a tooth button |
| `onToothHover` | `(tooth: Tooth \| null) => void` | Mouse enter (tooth) / leave (null) |
| `onToggleTemporaryTeeth` | `(show: boolean) => void` | Toggle switch clicked |
| `onToggleBiteEffect` | `(show: boolean) => void` | Bite open/close button clicked |
| `onSimulateBite` | `() => void` | Simulate bite button clicked |
| `onCaseSelect` | `(caseId: string) => void` | Case selected from dropdown |
| `onToggleDeveloperMode` | `(enabled: boolean) => void` | Dev mode button toggled |

### Default Behavior (if callbacks are no-ops)

- Teeth render with whatever data is in the `teeth` prop
- No visual highlight on click (no `selectedTooth` state)
- Toggle switches render but do nothing
- Bite buttons render but have no effect

### Important: Mouse Event on Tooth Click

The `onToothClick` signature is `(tooth: Tooth, event?: React.MouseEvent) => void`. The second argument is the raw React mouse event, useful for:
- `event.clientX/Y` — positioning detail panels near the tooth
- `event.preventDefault()` — already called internally
- `event.stopPropagation()` — if nesting within other click handlers

---

## Accessibility Notes

### Current State

The library has minimal built-in accessibility:

- **Tooth buttons** are `<button>` elements (natively focusable)
- **Selected tooth** gets `ring-2 ring-accent ring-offset-2` (visual focus indicator)
- **Tooltip on hover** via DaisyUI's `tooltip` class (shows `tooth.notes`)
- **`prefers-reduced-motion`** is respected in the demo app's `index.css` (disables animations)

### What's Missing

| Feature | Status | Impact |
|---------|--------|--------|
| `aria-label` on tooth buttons | ❌ Not present | Screen readers only read tooth number |
| `role="grid"` / `role="gridcell"` | ❌ Not present | No grid semantics for assistive tech |
| Keyboard navigation (arrow keys) | ❌ Not present | Can't navigate between teeth via keyboard |
| Focus management | ❌ Not present | Focus doesn't move when selection changes |
| `aria-pressed` on toggle buttons | ❌ Not present | Toggle state not announced |
| Color contrast | ⚠️ Partial | DaisyUI themes vary; custom themes may fail WCAG |
| Touch targets | ⚠️ Partial | Small teeth (<40px) may fail at 24x24 minimum |

### Recommended Consumer Additions

```tsx
// Wrap Odontogram in a focus-managed container
<div role="application" aria-label="Odontograma dental">
  <Odontogram
    onToothClick={(tooth) => {
      setSelectedTooth(tooth);
      // Announce selection to screen readers
      announceToScreenReader(`Diente ${tooth.clinicalId} seleccionado: ${tooth.status}`);
    }}
    // ...
  />
</div>
```

For keyboard navigation, the consumer should implement arrow-key handling by tracking the focused tooth position in state and calling `onToothClick` programmatically.
