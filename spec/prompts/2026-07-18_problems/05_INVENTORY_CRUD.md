# Prompt — Phase 05: Inventory CRUD UI

implement phase 05 ตาม spec/2026-07-18_problems/05_INVENTORY_CRUD.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: frontend MVC, Zod validation, MUI Dialog/Autocomplete, version check + 409

backend API มีครบแล้ว — ทำ frontend อย่างเดียว

สิ่งที่ต้องทำ:
  frontend:
    - modules/inventory/controller.ts: useInventoryDetail(id) — fetch + refetch
    - modules/inventory/view.tsx: InventoryDetailView — product info + StockBadge + stock movements + action buttons
    - modules/inventory/controller.ts: useProductCreate(onSuccess) — Zod + API call
    - modules/inventory/view.tsx: ProductCreateDialog — form fields: sku*, name*, categoryId* (Autocomplete from listCategories), description, unit, costPrice, sellPrice, minStock, currentStock
    - modules/inventory/controller.ts: useProductUpdate(id, onSuccess) — pre-fill + version
    - modules/inventory/view.tsx: ProductEditDialog — handle 409
    - modules/inventory/controller.ts: useStockAdjust(id, onSuccess) — Zod (type, quantity, note)
    - modules/inventory/view.tsx: StockAdjustDialog — Select (IN/OUT/ADJUST) + quantity + note
    - modules/inventory/controller.ts: useProductDelete(id, onSuccess) — confirmation + softDelete
    - InventoryListView: add "เพิ่มสินค้า" Button
    - router.tsx: register /inventory/:id route

CRITICAL — Category Autocomplete:
  - โหลด categories จาก inventoryApi.listCategories() ตอน dialog open
  - แสดง category name ใน dropdown
  - ส่ง categoryId ตอน submit

CRITICAL — StockBadge Component:
  - currentStock > minStock → green Chip "success"
  - currentStock <= minStock → red Chip "error"
  - แสดงทั้งใน list view และ detail view

อย่าลืม:
  - price fields ใช้ type="number" หรือ coerce number ใน Zod
  - quantity ใน stock adjust: min 1
  - version check + 409 handling
  - onSuccess → refresh list/detail
