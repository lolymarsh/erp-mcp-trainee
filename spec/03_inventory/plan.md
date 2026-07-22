# 03 — Inventory (Products & Stock)

> **Priority**: 🔴 High
> **Estimate**: 1–2 days
> **Depends on**: Phase 01 (Foundation)

---

## Overview

Inventory module manages product catalog, stock levels, and stock movements. Products are organized by categories. Each product tracks current stock with a full audit trail of every stock movement (IN/OUT/ADJUST). The module supports full CRUD with optimistic locking, paginated filtering, stock adjustment with DB transaction, and frontend UI with color-coded stock badges.

---

## Architecture Patterns

| Layer | Pattern | Key Points |
|-------|---------|------------|
| Backend | Go-style Domain Module | `modules/inventory/` — entity, schema, handler, service, repo, route |
| Frontend | React MVC | `modules/inventory/` — model.ts, controller.ts, view.tsx |
| DB | MySQL (Drizzle ORM) | 3 tables: `categories`, `products`, `stock_movements` |
| Locking | Optimistic (version column) | PATCH/DELETE on products & categories require `version`; mismatch → 409 |
| Pagination | POST `/filter` | `{ page, page_size, sort_name, sort_by, filters[] }` |
| Transaction | Stock adjustment | `db.transaction()` — insert movement + update stock atomically |

---

## Flow

```
User → InventoryListView (search + pagination + stock badges)
         │
         ├── [Manage Categories] → CategoryManageView (full CRUD)
         │                            ├── CreateCategoryDialog
         │                            ├── EditCategoryDialog (version)
         │                            └── DeleteConfirmDialog (version)
         │
         ├── [Create Product] → CreateProductDialog
         │
         └── Click row → InventoryDetailView (info + movements)
                            ├── [Edit] → EditProductDialog (version)
                            ├── [Delete] → DeleteProductConfirm (version)
                            └── [Adjust Stock] → StockAdjustDialog
                                   ├── IN (increase stock)
                                   ├── OUT (decrease stock)
                                   └── ADJUST (set exact stock)
```

---

## Backend Tasks

### Products CRUD

| File | Key Points |
|------|------------|
| `entity.ts` | `ProductEntity`, `CategoryEntity`, `StockMovementEntity` |
| `schema.ts` | `createProductSchema`, `updateProductSchema` (with version), `stockAdjustSchema`, `ProductResponse` (includes `categoryName`) |
| `handler.ts` | `filter()`, `getById()`, `create()`, `update()`, `softDelete()`, `adjustStock()` |
| `service.ts` | `IInventoryService` + `InventoryService` — CRUD + stock adjust with validation |
| `repo.ts` | `IInventoryRepository` + `InventoryRepository` — Drizzle + version check, stock movement log |
| `route.ts` | `POST /filter`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/stock` |

**Routes**:
```
POST   /api/inventory/products/filter     ← paginated product list
GET    /api/inventory/products/:id        ← product detail + movements
POST   /api/inventory/products            ← create product
PATCH  /api/inventory/products/:id        ← update (version required)
DELETE /api/inventory/products/:id        ← soft delete (version required)
POST   /api/inventory/products/:id/stock  ← stock adjustment
GET    /api/inventory/categories          ← list categories (for dropdown)
```

**Acceptance**:
- CRUD with pagination + version check
- `ProductResponse` includes `categoryName` (JOIN categories)
- GET `/:id` returns product detail + associated stock movements

### Stock Adjustment

Special endpoint `POST /api/inventory/products/:id/stock`:

```ts
// Request body
{ "type": "IN" | "OUT" | "ADJUST", "quantity": number, "note": string }

// Transaction flow:
await db.transaction(async (tx) => {
  // 1. Lock product row
  const [product] = await tx.select().from(products)
    .where(eq(products.id, id)).for('update');

  // 2. Validate
  if (!product) throw new NotFoundError('Product not found');
  if (type === 'OUT' && product.currentStock < quantity) {
    throw new AppError(400, 'Insufficient stock');
  }

  // 3. Calculate new stock
  const newStock = type === 'IN'  ? product.currentStock + quantity
                 : type === 'OUT' ? product.currentStock - quantity
                 :                  quantity;  // ADJUST = set exact

  // 4. Update product stock
  await tx.update(products)
    .set({ currentStock: newStock, version: product.version + 1 })
    .where(eq(products.id, id));

  // 5. Insert stock movement record
  await tx.insert(stockMovements).values({
    productId: id,
    type,
    quantity,
    note: note ?? null,
  });
});
```

**Acceptance**:
- Stock adjustment creates movement + updates `current_stock`
- Transaction rollback if movement insert fails
- `OUT` type validates sufficient stock
- `ADJUST` sets exact quantity regardless of current stock

### Categories CRUD

| File | Key Points |
|------|------------|
| `schema.ts` | `createCategorySchema`, `updateCategorySchema` (with version), `deleteCategorySchema` |
| `repo.ts` | `findCategoryById`, `createCategory`, `updateCategory` (version check), `deleteCategory` (version check) |
| `service.ts` | `createCategory`, `updateCategory`, `deleteCategory` (audit log + version check) |
| `handler.ts` | `createCategory`, `updateCategory`, `deleteCategory` handlers |
| `route.ts` | `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`, `POST /categories/filter` |

**Additional — Product Repo Changes**:
- All product queries (`findFiltered`, `findById`, `findByIds`) must LEFT JOIN categories to include `categoryName`
- Category uses hard delete (no `deletedAt`) unless soft delete is required later

**Acceptance**:
- Categories CRUD with version check
- Product list/detail shows `categoryName` instead of UUID
- Category delete returns 409 if version mismatch

---

## Frontend Tasks

| File | Key Points |
|------|------------|
| `model.ts` | `inventoryApi`: filter, create, update, adjustStock, delete; `categoryApi`: create, update, delete, filter; `ProductEntity` includes `categoryName` |
| `controller.ts` | `useInventoryList()` — pagination + search; `useLowStockAlerts()`; `useCategoryList()`; `useCategoryCreate/Update/Delete()` |
| `view.tsx` | `InventoryListView` (MUI DataGrid + manage categories button); `InventoryDetailView` (info + movement log); `StockAdjustDialog`; `CategoryManageView` (full page); `CategoryCreateDialog`; `CategoryEditDialog`; `CategoryDeleteConfirmDialog` |

**Key UI Details**:
- `StockBadge` — color: green (normal), yellow (low), red (critical)
- `InventoryListView` header: "จัดการหมวดหมู่" button + "เพิ่มสินค้า" button
- `InventoryDetailView` shows product info + stock movement history
- `CategoryManageView` is a full page (not dialog) at route `/inventory/categories`

**Acceptance**:
- Product table with stock column + color coding
- Category management UI (full page with table + CRUD dialogs)
- Stock adjustment dialog with type selector + quantity input
- Detail page shows movement history
- `npm run typecheck` — pass
- `npm run lint` — no new errors

---

## Checklist

### Backend — Products
- [ ] `POST /api/inventory/products/filter` → paginated with stock info + categoryName
- [ ] `POST /api/inventory/products` → 201 created
- [ ] `GET /api/inventory/products/:id` → product detail + movements
- [ ] `PATCH /api/inventory/products/:id` → 200 updated
- [ ] `PATCH /api/inventory/products/:id` (version mismatch) → 409
- [ ] `DELETE /api/inventory/products/:id` → soft delete
- [ ] Integration tests for all endpoints

### Backend — Stock Adjustment
- [ ] `POST /api/inventory/products/:id/stock` → stock updated + movement logged
- [ ] Stock adjustment uses `db.transaction()` with `FOR UPDATE`
- [ ] `OUT` type validates sufficient stock → 400 if insufficient
- [ ] IN/OUT/ADJUST all calculate correctly
- [ ] Integration tests (including rollback scenario)

### Backend — Categories
- [ ] `POST /api/inventory/categories` → 201 created
- [ ] `PATCH /api/inventory/categories/:id` → 200 updated
- [ ] `DELETE /api/inventory/categories/:id` → deleted
- [ ] Version mismatch → 409
- [ ] Product queries JOIN categories → include `categoryName`
- [ ] `POST /api/inventory/categories/filter` → paginated list

### Frontend
- [ ] Product list with pagination + search + stock color badges
- [ ] Product detail page with movement history
- [ ] Stock adjustment dialog (IN/OUT/ADJUST)
- [ ] Category management full page with CRUD dialogs
- [ ] Version passed in edit/delete operations
- [ ] `npm run typecheck` — pass
- [ ] `npm run lint` — no new errors
