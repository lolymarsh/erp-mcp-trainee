# Module 04 — Invoice (Sales & Payments)

> **Priority**: 🔴 High — Core business module
> **Estimate**: 2-3 days
> **Depends on**: Phase 02 (Customers), Phase 03 (Inventory)
> **Architecture**: See `spec/ARCHITECTURE.md` Sections 3-4 (module template, central wiring), Section 9 (pagination, transaction, version check)
> **Core Spec**: `spec/2026-07-18_core/04_INVOICES.md`

---

## 1. Business Flow

```
Customer Order → Quotation (optional) → Invoice → Payment
                                            ↓
                                     Stock Deduction
                                            ↓
                                     Job Creation (optional)
```

## 2. API Endpoints

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/sales/invoices/filter` | `filter()` | Paginated invoice list with search + filters |
| `GET` | `/api/sales/invoices/:id` | `getById()` | Invoice detail with items |
| `POST` | `/api/sales/invoices` | `create()` | Create invoice (transaction: invoice + items + stock) |
| `PATCH` | `/api/sales/invoices/:id/payment-status` | `updatePaymentStatus()` | Update payment status/method (version check) |
| `GET` | `/api/sales/invoices/today-summary` | `todaySummary()` | Today's total sales + count |

## 3. Module Structure

```
backend/src/modules/invoice/
├── entity.ts       ← InvoiceEntity, InvoiceItemEntity, QuotationEntity
├── schema.ts       ← Zod schemas: createInvoice, updatePaymentStatusSchema, filterRequest, InvoiceResponse
├── handler.ts      ← filter(), getById(), create(), updatePaymentStatus(), todaySummary()
├── service.ts      ← InvoiceService — validate stock, calculate totals, create invoice
├── repo.ts         ← InvoiceRepository — MULTI-TABLE TRANSACTION + query methods
├── route.ts        ← Router registration: POST /filter, GET /:id, POST /, PATCH /:id/payment-status, GET /today-summary
└── invoice.test.ts ← Integration + unit tests

frontend/src/modules/invoice/
├── model.ts        ← invoiceApi: filter, create, getById, todaySummary, updatePaymentStatus
├── controller.ts   ← useInvoiceList(), useInvoiceCreate(), useInvoiceDetail(), useInvoicePaymentUpdate()
└── view.tsx        ← InvoiceListView (DataGrid + search/filter), InvoiceCreateView (Form with item rows),
                       InvoiceDetailView, InvoicePaymentUpdateDialog
```

## 4. Tasks

### Task 4.1 — Invoice Backend (1.5 days)

#### Create Invoice Transaction (CRITICAL)

```ts
// repo.ts — ONE transaction affecting FOUR tables
await db.transaction(async (tx) => {
  // 1. INSERT invoices
  // 2. INSERT invoice_items (loop)
  // 3. SELECT products ... FOR UPDATE (lock row)
  // 4. UPDATE products.current_stock (deduct quantity)
  // 5. INSERT stock_movements (type: OUT)
  // Any throw → full rollback
});
```

**Pre-validation** (before transaction):
- Customer exists
- All products exist
- Stock sufficient for each item

**Stock deduction detail**:
```ts
// Lock row with FOR UPDATE to prevent race conditions
const [product] = await tx
  .select({ stock: products.currentStock, version: products.version })
  .from(products)
  .where(eq(products.id, item.productId))
  .for('update');

if (!product || product.stock < item.quantity) {
  throw new AppError(400, `Stock insufficient for product ${item.productId}`);
}

await tx
  .update(products)
  .set({ currentStock: product.stock - item.quantity, version: product.version + 1 })
  .where(eq(products.id, item.productId));

await tx.insert(stockMovements).values({
  productId: item.productId,
  type: 'OUT',
  quantity: item.quantity,
  referenceType: 'invoice',
  referenceId: inv.id,
});
```

#### Update Payment Status (with Version Check)

- `PATCH /api/sales/invoices/:id/payment-status`
- Body: `{ paymentStatus: "PENDING" | "PAID" | "PARTIAL" | "REFUNDED", paymentMethod?: "CASH" | "BANK_TRANSFER" | "CREDIT" | "PROMPTPAY" | null, version: number }`
- Validation: `updatePaymentStatusSchema` (Zod)
- Service: findById → updatePaymentStatus (version check) → audit log → toResponse
- Version mismatch → HTTP 409 Conflict

#### Today Summary

- `GET /api/sales/invoices/today-summary`
- Returns: `{ totalSales: number, invoiceCount: number }`
- Filter by `createdAt` = today (Asia/Bangkok)

#### Filter/Search

- `POST /api/sales/invoices/filter`
- Pagination + sort + filters
- Filters:
  - `invoiceNumber` with operator `contains` (search)
  - `paymentStatus` with operator `eq`
  - `paymentMethod` with operator `eq`

### Task 4.2 — Invoice Frontend (1 day)

#### Invoice List Page
- Search by invoice number (debounced 400ms)
- Filter by payment status dropdown
- Filter by payment method dropdown
- Paginated DataGrid
- "Create Invoice" button → navigate to form

#### Invoice Create Form
- Customer selector (searchable dropdown)
- Product selector with price autofill
- Add/remove item rows
- Auto-calculate totals (subtotal, discount, tax, grand total)
- Submit → backend transaction → navigate to detail

#### Invoice Detail Page
- Invoice info + items table
- Payment history (audit log)
- "Update Payment Status" button → dialog
- InvoicePaymentUpdateDialog with status + method selectors

### Task 4.3 — Payment Update Dialog (0.5 day)

- `useInvoicePaymentUpdate` hook: open, submitting, error, submit
- Dialog pre-fills current values
- On submit: call API → refetch detail → close dialog
- Version mismatch → show error → user refreshes

## 5. Checklist

### Backend
- [x] `POST /api/sales/invoices` → 201, stock deducted, movement logged
- [x] `POST /api/sales/invoices` (insufficient stock) → 400, no partial changes
- [x] Invoice creation uses `db.transaction()` with `FOR UPDATE`
- [x] `POST /api/sales/invoices/filter` → paginated results with search + status/method filters
- [x] `GET /api/sales/invoices/:id` → invoice detail with items
- [x] `PATCH /api/sales/invoices/:id/payment-status` → status updated + audit logged
- [x] `PATCH /api/sales/invoices/:id/payment-status` (wrong version) → 409
- [x] `GET /api/sales/invoices/today-summary` → correct total + count
- [x] Transaction test: verify rollback on failure
- [x] Integration tests for all endpoints (8 unit tests for service layer)

### Frontend
- [x] Invoice list page with search (debounced 400ms) + payment status/method filter dropdowns
- [x] Invoice create form with customer selector + product selector + auto-calculate totals
- [x] Invoice detail page with items table + payment history
- [x] Payment update dialog (status + method selectors, version check)
- [x] `npm run typecheck` — pass
- [x] `npm run lint` — no new errors
