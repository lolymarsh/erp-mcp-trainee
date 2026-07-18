# Phase 05 — Inventory CRUD UI

> **Priority**: 🔴 P0 — User-facing
> **Estimate**: 1 day
> **Depends on**: Nothing (backend CRUD APIs + model.ts ready)

---

## Problem Summary

**Current:** `frontend/src/modules/inventory/view.tsx` — เหมือน customer: มีแค่ list + search + dead navigate ไป `/inventory/:id`

**Backend มีแล้ว:** `POST /products`, `PATCH /products/:id`, `DELETE /products/:id`, `POST /products/:id/stock`, `GET /categories`, `GET /products/:id`
**Model มีแล้ว:** `inventoryApi.create()`, `inventoryApi.update()`, `inventoryApi.softDelete()`, `inventoryApi.adjustStock()`, `inventoryApi.listCategories()`

---

## Task 5.1 — Product Detail Page (0.3 day)

### Route: `/inventory/:id` → `InventoryDetailRoute`

แสดง:
- ข้อมูลสินค้า (SKU, ชื่อ, หมวดหมู่, คำอธิบาย, หน่วย, ราคาทุน, ราคาขาย, สต็อกคงเหลือ, สต็อกขั้นต่ำ)
- `StockBadge` — แดงถ้า `currentStock <= minStock`, เขียวถ้าเพียงพอ
- Stock movement history (ถ้ามี API)
- Action buttons: แก้ไข / ลบ / ปรับสต็อก / **ประวัติการแก้ไข** (Phase 02)

---

## Task 5.2 — Create Product Dialog (0.2 day)

### Form fields
- SKU* (TextField)
- ชื่อสินค้า* (TextField)
- หมวดหมู่ (Select / Autocomplete from `listCategories()` API)
- คำอธิบาย (TextField multiline)
- หน่วย (TextField, default "ชิ้น")
- ราคาทุน (TextField type="number")
- ราคาขาย (TextField type="number")
- สต็อกขั้นต่ำ (TextField type="number", default 0)
- สต็อกคงเหลือ (TextField type="number", default 0)

### Zod validation
```ts
const createProductSchema = z.object({
  sku: z.string().min(1, 'กรุณากรอก SKU'),
  name: z.string().min(1, 'กรุณากรอกชื่อสินค้า'),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  description: z.string().optional(),
  unit: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ').optional(),
  sellPrice: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ').optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  currentStock: z.coerce.number().int().min(0).optional(),
});
```

---

## Task 5.3 — Edit Product (0.2 day)

- Pre-fill form with existing product data
- Include `version` field
- Handle 409 Conflict

---

## Task 5.4 — Delete Product (0.1 day)

- Soft delete — confirmation dialog
- Call `inventoryApi.softDelete(id, version)`

---

## Task 5.5 — Stock Adjustment Dialog (0.15 day)

### Controller: `useStockAdjust(id)`

```ts
const stockAdjustSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  quantity: z.coerce.number().int().min(1, 'จำนวนต้องมากกว่า 0'),
  note: z.string().optional(),
});
```

### View: `StockAdjustDialog`

- Select: IN (เพิ่มสต็อก) / OUT (ตัดสต็อก) / ADJUST (ปรับยอด)
- TextField: จำนวน (number, min 1)
- TextField: หมายเหตุ
- Submit → call `inventoryApi.adjustStock(id, payload)`

---

## Task 5.6 — Register Routes (0.05 day)

```tsx
{ path: 'inventory/:id', element: <InventoryDetailRoute /> }
```

---

## Phase 05 Checklist

- [ ] `useInventoryDetail(id)` controller
- [ ] `InventoryDetailView` — product info + StockBadge + stock movements
- [ ] `useProductCreate()` controller + Zod schema
- [ ] `ProductCreateDialog` — form with category Autocomplete
- [ ] "เพิ่มสินค้า" button in `InventoryListView` header
- [ ] `useProductUpdate(id)` controller + pre-fill + version
- [ ] `ProductEditDialog` — handle 409
- [ ] `useProductDelete(id)` controller + confirmation
- [ ] `useStockAdjust(id)` controller + Zod
- [ ] `StockAdjustDialog`
- [ ] `/inventory/:id` route registered
- [ ] Run `npm run typecheck` — pass
