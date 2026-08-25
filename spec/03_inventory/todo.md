# 03 Inventory Module — Todo & Status

> **Module**: 03_inventory (Products, Categories & Stock Movements)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T3.1**: Category CRUD Backend (`/api/inventory/categories`)
- [x] **T3.2**: Product CRUD Backend with version check (`/api/inventory/products`)
- [x] **T3.3**: Stock Adjustment with DB Transaction (`POST /api/inventory/products/:id/adjust-stock`)
- [x] **T3.4**: Low stock alert endpoint & filter query
- [x] **T3.5**: Frontend MVC structure (`model.ts`, `controller.ts`, `view.tsx`)
- [x] **T3.6**: Fix `InventoryView.test.tsx` mock data missing `categoryName` property
- [ ] **T3.7**: Migrate Inventory list and stock badges to shadcn/ui (`Badge`, `Table`, `Card`)
- [x] **T3.8**: Quick stock adjust & CSV export support

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **UI Migration to shadcn/ui**:
   - ปรับแต่ง `StockBadge` ให้ใช้ shadcn `Badge` variant `destructive` สำหรับสต็อกต่ำ
   - ทำ `StockAdjustDialog`, `ProductCreateDialog`, `ProductEditDialog` ด้วย shadcn `Dialog` + `Input` แทนที่ MUI ทั้งหมด
