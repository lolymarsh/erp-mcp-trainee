# Prompt — Phase 03: Inventory (Products + Stock)

```
implement phase 03 ตาม spec/2026-07-18_core/03_INVENTORY.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: DI (constructor), version check, pagination, transaction (stock adjust)

สิ่งที่ต้องทำ:
  backend:  modules/inventory/ (entity, schema, handler, service, repo, route, test)
  frontend: modules/inventory/ (model, controller, view)
  tests:    integration + unit + component

อย่าลืม:
  - POST /api/inventory/products/:id/stock ต้องใช้ db.transaction() (update stock + insert movement)
  - PATCH ต้องมี version check → 409 if mismatch
  - POST /filter ต้อง return pagination
  - repo รับ db ผ่าน constructor
  - model.ts ห้าม import React
  - StockBadge ใน view: สีแดงถ้าต่ำกว่า min_stock
```
