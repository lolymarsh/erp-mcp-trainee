# Phase 04 — Invoices (Sales + Payments)

> **Priority**: 🔴 High — Core business module
> **Estimate**: 2-3 days
> **Depends on**: Phase 02 (Customers), Phase 03 (Inventory)

---

## Task 4.1 — Invoice Backend (1.5 days)

**Files**: `backend/src/modules/invoice/`

| File | Key Points |
|------|-----------|
| `entity.ts` | InvoiceEntity, InvoiceItemEntity |
| `schema.ts` | createInvoice, InvoiceResponse, FilterRequest |
| `handler.ts` | filter(), getById(), create(), todaySummary() |
| `service.ts` | InvoiceService — validate stock, calculate totals, create invoice |
| `repo.ts` | InvoiceRepository — **MULTI-TABLE TRANSACTION** |
| `route.ts` | POST /filter, GET /:id, POST /, GET /today-summary |

**Routes**:
```
POST  /api/sales/invoices/filter       ← paginated invoice list
GET   /api/sales/invoices/:id          ← invoice detail with items
POST  /api/sales/invoices              ← CREATE INVOICE (transaction!)
GET   /api/sales/invoices/today-summary ← today's total sales + count
```

**CRITICAL — Create Invoice Transaction**:
```ts
// repo.ts — ONE transaction, FOUR tables
await db.transaction(async (tx) => {
  // 1. INSERT invoices
  // 2. INSERT invoice_items (loop)
  // 3. UPDATE products.current_stock (deduct quantity) — FOR UPDATE lock
  // 4. INSERT stock_movements (type: OUT)
  // Any throw → full rollback
});
```

**Validation before transaction**:
- Customer exists
- All products exist
- Stock sufficient for each item

**Acceptance**:
- POST /invoices creates invoice + items + deducts stock — all in one transaction
- If stock insufficient → 400 error, nothing changed in DB
- today-summary returns correct total + count

---

## Task 4.2 — Invoice Frontend (1 day)

**Files**: `frontend/src/modules/invoice/`

| File | Key Points |
|------|-----------|
| `model.ts` | invoiceApi: filter, create, getById, todaySummary |
| `controller.ts` | useInvoiceList(), useInvoiceCreate() — form state, validation, submit |
| `view.tsx` | InvoiceListView (DataGrid), InvoiceCreateView (Form with item rows) |

**Invoice Form**:
- Customer selector (dropdown with search)
- Product selector (dropdown with price autofill)
- Add/remove item rows
- Auto-calculate totals
- Submit → backend transaction

**Acceptance**:
- Invoice list with pagination
- Create invoice form works
- Submit → stock deducted → new invoice appears in list

---

## Phase 04 Checklist

```
[x] POST /api/sales/invoices → 201, stock deducted, movement logged
[x] POST /api/sales/invoices (insufficient stock) → 400, no partial changes
[x] POST /api/sales/invoices/filter → paginated
[x] GET /api/sales/invoices/today-summary → correct total
[x] Frontend: invoice list + create form
[x] Transaction test: verify rollback on failure (repo uses db.transaction, service pre-validates)
[x] Integration tests for all endpoints (8 unit tests for service layer)
```

> **Next**: Phase 05 — Jobs
