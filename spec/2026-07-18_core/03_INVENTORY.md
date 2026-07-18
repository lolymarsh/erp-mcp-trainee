# Phase 03 — Inventory (Products + Stock)

> **Priority**: 🔴 High
> **Estimate**: 1-2 days
> **Depends on**: Phase 01 (Foundation)

---

## Task 3.1 — Inventory Backend (1 day)

**Files**: `backend/src/modules/inventory/`

| File | Key Points |
|------|-----------|
| `entity.ts` | ProductEntity, CategoryEntity, StockMovementEntity |
| `schema.ts` | createProduct, updateProduct (with version), stockAdjust schema |
| `handler.ts` | filter(), getById(), create(), update(), softDelete(), adjustStock() |
| `service.ts` | IInventoryService + InventoryService — stock adjust with validation |
| `repo.ts` | IInventoryRepository + InventoryRepository — Drizzle + version check, stock movement log |
| `route.ts` | POST /filter, GET /:id, POST /, PATCH /:id, DELETE /:id, POST /:id/stock |

**Routes**:
```
POST   /api/inventory/products/filter     ← paginated product list
GET    /api/inventory/products/:id        ← product detail + movements
POST   /api/inventory/products            ← create product
PATCH  /api/inventory/products/:id        ← update (version required)
DELETE /api/inventory/products/:id        ← soft delete (version required)
POST   /api/inventory/products/:id/stock  ← stock adjustment (IN/OUT/ADJUST)
GET    /api/inventory/categories          ← list categories
```

**Special — Stock Adjustment**:
```ts
// Must insert stock_movements record
// Must update products.current_stock
// Use db.transaction() for both
```

**Acceptance**:
- CRUD with pagination + version check
- Stock adjustment creates movement + updates current_stock
- Transaction rollback if movement insert fails

---

## Task 3.2 — Inventory Frontend (0.5 day)

**Files**: `frontend/src/modules/inventory/`

| File | Key Points |
|------|-----------|
| `model.ts` | inventoryApi: filter, create, update, adjustStock |
| `controller.ts` | useInventoryList(), useLowStockAlerts() |
| `view.tsx` | InventoryTable — MUI DataGrid, StockBadge (color: red if low stock), adjust dialog |

---

## Phase 03 Checklist

```
[x] POST /api/inventory/products/filter → paginated with stock info
[x] POST /api/inventory/products → 201 created
[x] PATCH /api/inventory/products/:id (version mismatch) → 409
[x] POST /api/inventory/products/:id/stock → stock updated + movement logged
[x] Stock adjustment uses db.transaction()
[x] Frontend: product table with stock column + color coding
[x] Integration tests for all endpoints (including stock adjust rollback)
```

> **Next**: Phase 04 — Invoices
