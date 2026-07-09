# Pricing, Procedures & Payments — Domain Separation Plan

## Phase 1 Implementation Status ✅ (Merged to main)

| Item | Status | Notes |
|------|--------|-------|
| `ProcedureCatalog` model + migration | ✅ Done | 34 procedures across 7 categories |
| `ProcedureLineItem` model + migration | ✅ Done | Linked to ClinicalHistory + ProcedureCatalog |
| `cancelled`/`cancelReason` on ClinicalHistory | ✅ Done | |
| Admin CRUD page at `/catalogo-procedimientos` | ✅ Done | Table, search, add/edit/delete dialogs |
| `ProcedurePicker` component | ✅ Done | cmdk-based searchable popover |
| Line-item table in `historial-form.tsx` | ✅ Done | Replaces flat `costoTratamiento` input |
| Itemized display in `historial-view.tsx` | ✅ Done | Shows procedure breakdown, flat cost fallback |
| Dual-write in `addHistorial`/`updateHistorial` | ✅ Done | Writes both line items + `costoTratamiento` (total) |
| `medical-history-form.tsx` — no `costoTratamiento` | ✅ Done | |
| `historial-table.tsx` (MUI) — updated | ✅ Done | No `costoTratamiento` in add dialogs |
| Home page — catalog button | ✅ Done | Opens `/catalogo-procedimientos` |
| Seed script — catalog + line items | ✅ Done | 34 procedures; patients created with randomized line items |
| Build passes | ✅ Done | `npm run build` OK |
| Automated testing setup | ✅ Done | Vitest + jsdom + @testing-library; 19 tests across 3 files |
| Label: "Historial Clínico" → "Tratamientos" | ✅ Done | Patient detail page heading |
| **Procedure catalog replaced (feat/replace-procedure-catalog)** | ✅ Done | 25 old → 34 real procedures with prices; old categories → clinic-standard taxonomy |

See the sections below for the full architectural plan (Phase 2—Payments and Phase 3—Odontogram Integration are still pending).

## 1. Current Architecture (Problem)

Today, all financial and treatment data is embedded as flat fields on the `ClinicalHistory` model (one row per visit):

| Field | Type | Problem |
|-------|------|---------|
| `tratamiento` | `String?` (free text) | No structured procedures — "Limpieza" vs "Limpieza dental" vs "Profilaxis" are all different strings. Impossible to report on procedure frequency. |
| `costoTratamiento` | `Decimal?` (single number) | One flat cost per visit. Can't itemize: "cleaning = $300, filling = $1200, total = $1500". No link to individual procedures. |
| `estadoPago` | `String?` (Pendiente/Pagado/Parcial/Cancelado) | No installment tracking. "Parcial" doesn't record how much was paid or when. Can't compute total patient balance across visits. |

**Three concerns conflated into one model:**
1. **Clinical** (what was done) — should reference a procedure catalog
2. **Pricing** (how much it costs) — should be computed from line items, not a flat number
3. **Payments** (what was paid) — should be tracked independently per payment event

### Additional Finding: ToothProcedure.cost is defined but unused

The odontograma library defines a `ToothProcedure` type with a `cost?: number` field (`src/lib/odontograma/types/index.ts:118`), but `FloatingToothDetailsCard.tsx` never sets it — only `id`, `type`, and `date` are populated. This is a missed integration point.

---

## 2. Proposed Data Model

### 2.1 New Tables

#### Table: `procedure_catalog`

A lookup of all dental procedures the clinic offers, with standard pricing.

```prisma
model ProcedureCatalog {
  id            String   @id @default(uuid())
  code          String   @unique           // e.g. "PROF-001"
  name          String                     // e.g. "Profilaxis (Limpieza Dental)"
  description   String?
  category      String?                    // e.g. "Preventiva", "Restauradora", "Cirugía", "Endodoncia", "Ortodoncia"
  defaultPrice  Decimal  @default(0) @map("default_price")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  lineItems     ProcedureLineItem[]

  @@map("procedure_catalog")
}
```

#### Table: `procedure_line_item`

Links a procedure from the catalog to a specific clinical history visit. This replaces the flat `tratamiento` + `costoTratamiento` fields.

```prisma
model ProcedureLineItem {
  id                  String  @id @default(uuid())
  clinicalHistoryId   String  @map("clinical_history_id")
  procedureCatalogId  String  @map("procedure_catalog_id")
  toothId             Int?    @map("tooth_id")              // nullable — not all procedures are tooth-specific
  quantity            Int     @default(1)
  fee                 Decimal @default(0)                   // actual charged amount (may differ from catalog price)
  discount            Decimal @default(0)
  notes               String?                               // e.g., "Paciente sensible, usar anestesia tópica"

  clinicalHistory  ClinicalHistory  @relation(fields: [clinicalHistoryId], references: [id], onDelete: Cascade)
  procedureCatalog ProcedureCatalog @relation(fields: [procedureCatalogId], references: [id])

  @@map("procedure_line_items")
}
```

#### Table: `payment`

Tracks individual payment events. Replaces the flat `estadoPago` on ClinicalHistory.

```prisma
model Payment {
  id                String   @id @default(uuid())
  patientId         String   @map("patient_id")
  clinicalHistoryId String   @map("clinical_history_id")
  amount            Decimal
  paymentDate       DateTime @default(now()) @map("payment_date")
  paymentMethod     String?  @map("payment_method")  // "Efectivo", "Tarjeta", "Transferencia", "Otro"
  reference         String?                          // ticket number, transaction ID
  notes             String?

  patient         Patient         @relation(fields: [patientId], references: [id], onDelete: Cascade)
  clinicalHistory ClinicalHistory @relation(fields: [clinicalHistoryId], references: [id])

  @@map("payments")
}
```

### 2.2 Changes to Existing Tables

#### `clinical_history` — Remove 2 fields, keep 1

| Field | Action | Rationale |
|-------|--------|-----------|
| `costoTratamiento` | **REMOVE** | Replaced by `SUM(procedureLineItems.fee) - SUM(procedureLineItems.discount)` |
| `estadoPago` | **REMOVE** | Replaced by computed state: if total payments ≥ total fees → "Pagado", if payments > 0 → "Parcial", else "Pendiente" |
| `tratamiento` | **KEEP** (optional) | Keep as free-text clinical narrative, but also reference line items |

The payment state becomes a **computed property** (not stored):

```typescript
function computePaymentState(totalFees: number, totalPayments: number): PaymentState {
  if (totalPayments === 0) return "Pendiente";
  if (totalPayments >= totalFees) return "Pagado";
  return "Parcial";
}
```

#### `clinical_history` — Add optional fields

```prisma
model ClinicalHistory {
  // ... existing fields ...
  // tratamiento stays as free text
  // costoTratamiento → REMOVED
  // estadoPago → REMOVED (computed)
  cancelled    Boolean  @default(false)
  cancelReason String?  @map("cancel_reason")
}
```

> **Note on "Cancelado":** The current `estadoPago` enum includes "Cancelado", which isn't a payment state — it's a visit state. In the new model, this becomes a `cancelled` boolean on `ClinicalHistory`, independent of payment tracking. A cancelled visit may still have fees if procedures were performed before cancellation.

### 2.3 View: `vw_patient_balance` (optional — for reporting/dashboard)

A computed view for fast balance lookups across all visits:

```sql
CREATE VIEW vw_patient_balance AS
SELECT
  p.id AS patient_id,
  p.nombres || ' ' || p.apellidos AS patient_name,
  COALESCE(SUM(pli.fee - pli.discount), 0) AS total_fees,
  COALESCE(pay.total_paid, 0) AS total_paid,
  COALESCE(SUM(pli.fee - pli.discount), 0) - COALESCE(pay.total_paid, 0) AS balance
FROM patients p
LEFT JOIN clinical_history ch ON ch.patient_id = p.id AND (ch.cancelled IS NOT TRUE)
LEFT JOIN procedure_line_items pli ON pli.clinical_history_id = ch.id
LEFT JOIN (
  SELECT clinical_history_id, SUM(amount) AS total_paid
  FROM payments GROUP BY clinical_history_id
) pay ON pay.clinical_history_id = ch.id
GROUP BY p.id, p.nombres, p.apellidos, pay.total_paid;
```

---

## 3. Data Flow (Before vs After)

### Current Flow (simplified)

```
[HistorialForm]
  User enters: costoTratamiento (number), estadoPago (dropdown)
       │
       ▼
[Server Action] addHistorial / updateHistorial
       │
       ▼
[Prisma → DB]
  clinical_history.costo_tratamiento (Decimal)
  clinical_history.estado_pago (String)
       │
       ▼
[HistorialView]
  Cost: "$1,500" (parseFloat + toLocaleString)
  Payment: colored badge (Pendiente/Pagado/Parcial/Cancelado)
```

### Proposed Flow — Phase 1 (Replace costoTratamiento)

```
[ProcedureCatalog Admin Page]
  Dentist adds procedures: code, name, category, defaultPrice
       │
       ▼
[DB] procedure_catalog table ──► [ProcedurePicker] component

[HistorialForm]
  Dentist picks procedures from catalog, enters fee per item
  Line items: [{ procedure: "Profilaxis", fee: 300 }, { procedure: "Resina", fee: 1200 }]
  Total: auto-computed (read-only display)
  estadoPago: removed from form
       │
       ▼
[Server Action] addHistorial / updateHistorial
  Saves: clinicalHistory record + procedureLineItems[]
  costoTratamiento: no longer written (column being removed)
       │
       ▼
[Prisma → DB]
  clinical_history (no costoTratamiento)
  procedure_line_items (fee, discount, toothId, ...)
       │
       ▼
[HistorialView]
  Itemized list: Profilaxis $300, Resina $1,200
  Computed total: $1,500
  estadoPago badge: "Pendiente" (no payments yet — read-only computed)
```

### Proposed Flow — Phase 2 (Replace estadoPago)

```
[PaymentPanel]
  Total fees: $1,500 (computed from line items)
  Total paid: $500 (computed from payments table)
  Balance:   $1,000
  [Agregar Pago] → PaymentForm dialog
       │
       ▼
[Server Action] addPayment
  Saves: Payment { amount, method, date, reference }
       │
       ▼
[Prisma → DB]
  payments (amount, paymentMethod, paymentDate, ...)
       │
       ▼
[HistorialView]
  Payment history list: $500 on 05/07/2026 (Efectivo)
  Computed estadoPago badge: "Parcial" (payments > 0 but < total)
  If balance becomes 0 → badge shows "Pagado" (green)
```

---

## 4. UI Changes by Phase

### Phase 1 — Procedure Catalog + Line Items

| Component | Change |
|-----------|--------|
| **Admin page (new)** | `src/app/catalogo-procedimientos/page.tsx` — CRUD for procedure catalog |
| **ProcedurePicker (new)** | Reusable searchable dropdown/modal to pick a procedure from catalog |
| **`historial-form.tsx`** | Replace single "Costo del Tratamiento" `<Input type="number">` with a line-item table: columns [Procedure picker] [Fee] [Discount] [Notes] [Remove]. "Add Item" button. Zod schema validates array of line items. |
| **`historial-view.tsx`** | Replace `costoTratamiento` display with itemized list + computed total. "Ver desglose" expandable section. |
| **`historial-table.tsx`** | Same changes as historial-view (MUI-based). |
| **`medical-history-form.tsx`** | Remove `costoTratamiento` field from standalone form. |
| **`src/lib/actions.ts`** | New actions: `addProcedureCatalogItem`, `updateProcedureCatalogItem`, `deleteProcedureCatalogItem`, `getProcedureCatalog`. Modify `addHistorial`/`updateHistorial` to accept & save procedureLineItems. |
| **`src/types/index.ts`** | Add `ProcedureCatalog`, `ProcedureLineItem` interfaces. Remove `costoTratamiento` from `ClinicalHistory`. |
| **`src/lib/api.ts`** | Add `getProcedureCatalog()` client fetch. |
| **`src/app/api/proxy/route.ts`** | Include `procedureLineItems` relation in Prisma queries. |
| **`src/components/hc1-form.tsx`** | Update field mapping — remove `costoTratamiento` reference. |

### Phase 2 — Payments

| Component | Change |
|-----------|--------|
| **PaymentPanel (new)** | `src/components/payment-panel.tsx` — card showing: total fees, total paid, balance. "Agregar Pago" button. Payment history list. |
| **PaymentForm (new)** | `src/components/payment-form.tsx` — amount, paymentMethod (select: Efectivo/Tarjeta/Transferencia/Otro), date, reference, notes. |
| **`historial-view.tsx`** | Add PaymentPanel to each RecordCard below the Cost section. Replace `estadoPago` badge with computed value. Remove `DollarSign`/`CreditCard` unused imports. |
| **`historial-form.tsx`** | Remove `estadoPago` select entirely. |
| **`historial-table.tsx`** | Remove `estadoPago` column and EditableCell. |
| **`medical-history-form.tsx`** | Remove `estadoPago` field. |
| **`src/lib/actions.ts`** | New actions: `addPayment`, `deletePayment`, `getPaymentsByClinicalHistory`. Compute `estadoPago` on read. |
| **`src/types/index.ts`** | Add `Payment` interface. Remove `estadoPago` from `ClinicalHistory`. |
| **`src/app/api/proxy/route.ts`** | Include `payments` relation. |
| **`prisma/schema.prisma`** | Add `Payment` model. Remove `estadoPago` from `ClinicalHistory`. |

### Phase 3 — Odontogram Integration

| Component | Change |
|-----------|--------|
| **`hc6-form.tsx`** | On save, also create `ProcedureLineItem` records from tooth procedures. Each tooth with a non-healthy status generates a line item. |
| **`FloatingToothDetailsCard.tsx`** | Wire the `cost` field in `handleSaveTratamiento`. Add a price input when adding a procedure. |
| **`src/lib/actions.ts`** | Modify `saveHc6` to also persist `ProcedureLineItem` records derived from odontogram tooth data. |

---

## 5. File-by-File Impact Summary

### New Files (6–7)

| File | Size | Phase |
|------|------|-------|
| `src/app/catalogo-procedimientos/page.tsx` | ~150 lines | 1 |
| `src/components/procedure-picker.tsx` | ~80 lines | 1 |
| `src/components/payment-panel.tsx` | ~120 lines | 2 |
| `src/components/payment-form.tsx` | ~100 lines | 2 |
| `prisma/migrations/XXX_add_procedure_payment_tables/` | auto | 1 |
| `prisma/migrations/YYY_remove_costo_estado_pago/` | auto | 2 |

### Modified Files (12–15)

| File | Phase | Nature of Change |
|------|-------|------------------|
| `prisma/schema.prisma` | 1,2 | Add 3 models, modify `ClinicalHistory` |
| `src/lib/actions.ts` | 1,2,3 | ~200 new lines — CRUD for catalog/items/payments |
| `src/types/index.ts` | 1,2 | Add 3 interfaces, remove 2 fields from `ClinicalHistory` |
| `src/components/historial-form.tsx` | 1,2 | Replace cost+status with line-item table |
| `src/components/historial-view.tsx` | 1,2 | Show itemized costs + payment panel |
| `src/components/historial-table.tsx` | 1,2 | Same as historial-view (MUI) |
| `src/components/medical-history-form.tsx` | 1,2 | Remove cost+status fields |
| `src/app/api/proxy/route.ts` | 1 | Include new relations in Prisma queries |
| `src/lib/api.ts` | 1 | Add catalog fetch function |
| `src/components/hc1-form.tsx` | 1 | Update field mapping (remove cost/status) |
| `src/components/hc6-form.tsx` | 3 | Wire odontogram procedures to line items |
| `src/lib/odontograma/components/.../FloatingToothDetailsCard.tsx` | 3 | Populate `cost` on `ToothProcedure` |
| `prisma/seed.ts` | 1 | Add sample procedure catalog entries |

### Files with No Changes Needed

- `src/components/patient-form.tsx` — No financial data
- `src/components/paciente-view.tsx` — No financial data
- `src/components/edit-patient-modal.tsx` — No financial data
- `src/components/citas-form.tsx` / `citas-view.tsx` / `citas-table.tsx` — No cost/payment data
- `src/components/add-patient-modal.tsx` — No financial data
- `src/components/sequential-workflow.tsx` — Workflow structure unchanged
- `src/components/delete-patient-dialog.tsx` — No financial data
- `src/hooks/` — No financial logic
- `src/lib/calendar-api.ts` — Independent module
- `src/lib/db.ts` — Singleton unchanged
- `src/lib/utils.ts` — Utilities unchanged
- `src/lib/formatDate.ts` — Date helpers unchanged
- `src/app/layout.tsx` — Root layout unchanged
- `src/app/page.tsx` — Dashboard unchanged (no totals shown yet)
- `src/app/registro-completo/page.tsx` — Just wraps workflow
- `src/app/api/debug*/*.ts` — Debug endpoints unchanged
- `src/components/ui/*.tsx` — shadcn primitives unchanged
- `src/ai/` — AI module unchanged

---

## 6. Migration Strategy

### Step 1: Schema expansion (no data loss)
1. Add new tables (`procedure_catalog`, `procedure_line_items`, `payments`)
2. `costoTratamiento` + `estadoPago` stay on `clinical_history` temporarily
3. Run `prisma migrate dev` — only additive changes
4. Deploy new backend code (dual-write: new tables + old columns)

### Step 2: Seed procedure catalog
1. Create 15–20 common dental procedures via admin UI or seed script
2. Procedures needed: Profilaxis, Resina (1/2/3 caras), Extracción simple, Extracción quirúrgica, Endodoncia (anterior/posterior), Corona, Puente, Limpieza profunda, Aplicación de flúor, Blanqueamiento, etc.

### Step 3: UI cutover — Phase 1
1. Deploy new `historial-form.tsx` with line-item table (old cost field hidden behind feature flag)
2. Dentists create new records using catalog-based line items
3. Old records still show flat `costoTratamiento` as fallback read

### Step 4: UI cutover — Phase 2
1. Deploy `payment-panel.tsx` + `payment-form.tsx`
2. Remove `estadoPago` from forms (now computed)
3. Add a "Migrate" button or script to convert old `estadoPago` values into synthetic payment records:
   - `Pagado` → single payment for full amount
   - `Parcial` → no automatic conversion (dentist enters manually)
   - `Pendiente` → no payments created
   - `Cancelado` → set `cancelled = true` on ClinicalHistory

### Step 5: Schema cleanup
1. Verify no code reads old columns
2. Run migration to drop `costo_tratamiento` + `estado_pago` from `clinical_history`
3. Clean up deprecated code and field maps in `actions.ts`

---

## 7. Backward Compatibility

| Aspect | Strategy |
|--------|----------|
| **Write path** | During Phase 1, dual-write: save to both `procedure_line_items` (new) and `costoTratamiento` (old). During Phase 2, stop writing old columns. |
| **Read path** | If `procedureLineItems` exist, show itemized view. If not (legacy records), fall back to `costoTratamiento` from old column. Remove fallback in Step 5. |
| **Field maps** | `historyFieldMap` in `actions.ts:842` still maps `Costo_Tratamiento` and `Estado_Pago` for `updatePatientField`. These stay until the old columns are dropped. |
| **API responses** | The proxy route (`/api/proxy`) returns flat `costoTratamiento` in `historialClinico[]`. During Phase 1, keep this field but also return `procedureLineItems[]`. Remove after cutover. |
| **Feature flag** | A simple env var or constant (`USE_ITEMIZED_PRICING`) can toggle between old and new form views during development. |

---

## 8. Open Questions & Trade-offs

| Question | Options | Recommendation |
|----------|---------|----------------|
| **Cancelled visits** — Current "Cancelado" isn't a payment state, it's a visit state. | (a) Boolean on ClinicalHistory, (b) A synthetic "Cancelado" state, (c) Drop it | **(a)** Add `cancelled: Boolean` and `cancelReason: String?` to ClinicalHistory. |
| **Payment allocation** — Can one payment cover multiple visits? (e.g., patient pays $3000 for 3 visits) | (a) Single-visit only, (b) Multi-visit with allocation table | **(a)** Start simple (one payment → one ClinicalHistory). Add multi-visit later with a `PaymentAllocation` bridge table. |
| **Discount precision** — Per-item discount vs per-visit discount? | (a) Discount per line item, (b) Global discount field on ClinicalHistory | **(a)** Per line item (more flexible). A global discount can be a line item named "Descuento general" with no procedure link. |
| **Tax (IVA/VAT)** — Does the clinic charge tax? | (a) Included in fee, (b) Separate tax column on line items | **(a)** Included for now. Add tax column later if needed — it's a single column addition on `procedure_line_items`. |
| **Insurance co-pay** — Does insurance cover part of the cost? | (a) Insurance is just a payment method, (b) Separate insurance model | **(a)** Simple: insurance payment = a `Payment` with `method = "Seguro"`. Separate model would add complexity without clear benefit yet. |
| **Phase 3 necessity** — Should odontogram procedures generate chargeable line items? | (a) Yes — every clinical action is chargeable, (b) No — odontogram is diagnostic only, (c) Dentist chooses per tooth | **(c)** Let the dentist decide. Add a checkbox "Generar cargo" in the tooth's detail panel. Default: unchecked for diagnostic, checked for treatment. |
| **Reporting** — Where does reporting live? | (a) Dashboard page, (b) Separate reporting module, (c) SQL views only | **(c)** Start with SQL views for ad-hoc queries. Add a dashboard widget later showing total revenue, pending payments, etc. |

---

## 9. Entity Relationship Diagram

```
┌──────────────────┐     ┌──────────────────────────┐     ┌──────────────────┐
│   Patient        │     │   ClinicalHistory         │     │  Appointment     │
├──────────────────┤     ├──────────────────────────┤     ├──────────────────┤
│ id               │1──N│ patientId                 │     │ id               │
│ nombres          │     │ id                        │     │ fechaCita        │
│ apellidos        │     │ fechaHistorial            │     │ ...              │
│ ...              │     │ diagnostico               │     └──────────────────┘
└──────────────────┘     │ prescripciones            │
        │                │ notas                     │
        │                │ tratamiento (free text)   │
        │                │ ────────────────────────  │
        │                │ costoTratamiento ──→ REMOVE│
        │                │ estadoPago ────────→ REMOVE│
        │                │ cancelled?                │
        │                │ cancelReason?             │
        │                └──────────┬────────────────┘
        │                           │
        │                ┌──────────▼─────────────────┐     ┌──────────────────┐
        │                │  ProcedureLineItem          │     │ ProcedureCatalog │
        │                ├────────────────────────────┤     ├──────────────────┤
        │                │ id                         │N──1│ id               │
        │                │ clinicalHistoryId           │     │ code (unique)    │
        │                │ procedureCatalogId          │     │ name             │
        │                │ toothId (nullable)          │     │ category         │
        │                │ quantity                    │     │ defaultPrice     │
        │                │ fee                         │     │ isActive         │
        │                │ discount                    │     └──────────────────┘
        │                │ notes                       │
        │                └────────────────────────────┘
        │
        │                ┌────────────────────────────┐
        └──────────────N─│  Payment                   │
                         ├────────────────────────────┤
                         │ id                         │
                         │ patientId                  │
                         │ clinicalHistoryId          │
                         │ amount                     │
                         │ paymentDate                │
                         │ paymentMethod              │
                         │ reference                  │
                         │ notes                      │
                         └────────────────────────────┘
```

---

## 10. Common Dental Procedures — Seed Data Template

Current catalog (34 procedures, 7 categories — deployed in production):

| Code | Name | Category | Default Price |
|------|------|----------|---------------|
| CON-001 | Consulta | Consulta | $230 |
| PREV-001 | Limpieza Dental | Preventiva | $550 |
| PREV-002 | Aplicación de Flúor | Preventiva | $390 |
| PREV-003 | Limpieza Niños con Fluor | Preventiva | $450 |
| PREV-004 | Selladores de fosetas | Preventiva | $440 |
| REST-001 | Restauración de resina | Restauradora | $830 |
| REST-002 | Incrustación metálica | Restauradora | $1,840 |
| REST-003 | Amalgamas | Restauradora | $430 |
| REST-004 | Incrustación Estética | Restauradora | $1,860 |
| REST-005 | Poste colado | Restauradora | $1,460 |
| REST-006 | Poste estético prefabricado | Restauradora | $1,600 |
| REST-007 | Curación | Restauradora | $350 |
| END-001 | Endodoncia molares | Endodoncia | $1,860 |
| END-002 | Endodoncia premolares | Endodoncia | $1,320 |
| END-003 | Endodoncia anteriores | Endodoncia | $1,890 |
| END-004 | Pulpotomia | Endodoncia | $720 |
| CIR-001 | Extracciones | Cirugía | $670 |
| CIR-002 | Extracción 3er molar - 1 | Cirugía | $450 |
| CIR-003 | Extracción 3er molar - 2 | Cirugía | $830 |
| CIR-004 | Cirugias 3ros molares (consulta externa) | Cirugía | $3,500 |
| PROT-001 | Coronas Metal Porcelana | Prótesis | $2,980 |
| PROT-002 | Coronas Zirconia | Prótesis | $4,280 |
| PROT-003 | Coronita Infantil | Prótesis | $1,340 |
| PROT-004 | Cementación | Prótesis | $380 |
| PROT-005 | Provisional fijo (acrílico - unidad) | Prótesis | $440 |
| PROT-006 | Provisional removible unilateral | Prótesis | $710 |
| PROT-007 | Provisional removible bilateral | Prótesis | $830 |
| PROT-008 | Removible Metálico unilateral | Prótesis | $715 |
| PROT-009 | Removible Metálico bilateral | Prótesis | $830 |
| PROT-010 | Val plas o Luciton unilateral | Prótesis | $2,300 |
| PROT-011 | Val plas o Luciton bilateral | Prótesis | $2,830 |
| PROT-012 | Placa total | Prótesis | $4,800 |
| PROT-013 | Guardas oclusales | Prótesis | $560 |
| RADIO-001 | RX | Radiología | $150 |

> **Note:** This is the live catalog in production. Prices can be adjusted through the admin UI at `/catalogo-procedimientos`. The `defaultPrice` is a starting point — the actual `fee` on each `ProcedureLineItem` can be overridden per patient.

---

## 11. Future Considerations (Out of Scope for Now)

| Feature | When | Approach |
|---------|------|----------|
| **Multi-visit invoices** | After Phase 2 | Add `Invoice` table grouping multiple `ClinicalHistory` records. `Payment` moves to invoice-level instead of visit-level. |
| **Treatment plans** | Future | Add `TreatmentPlan` (pre-authorization) with estimated procedures and costs, then convert to actual line items when work is done. |
| **Insurance claims** | Future | Add `Claim` table linked to line items, with claim status and reimbursement tracking. |
| **Payment reminders** | Future | Add due dates, late fees, automated reminders based on balance. |
| **Revenue dashboard** | Future | Add financial KPIs to homepage: monthly revenue, pending payments, average fee per patient, most common procedures. |
| **Discount/promotion codes** | Future | Add promotional discounts that apply globally (e.g., "10% off first visit"). |
| **Credit/debit card processing** | Future | Integrate with payment gateway (Stripe, Clip, Conekta) for POS or online payments. |
