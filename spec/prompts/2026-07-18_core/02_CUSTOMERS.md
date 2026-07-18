# Prompt — Phase 02: Customers + Vehicles

```
implement phase 02 ตาม spec/2026-07-18_core/02_CUSTOMERS.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: DI (constructor), version check, pagination, transaction

สิ่งที่ต้องทำ:
  backend:  modules/customer/ (entity, schema, handler, service, repo, route, test)
  frontend: modules/customer/ (model, controller, view)
  tests:    integration + unit + component

อย่าลืม:
  - POST /api/customers/filter ต้อง return pagination
  - PATCH ต้องมี version check → 409 if mismatch
  - DELETE เป็น soft delete (ต้องส่ง version)
  - repo รับ db ผ่าน constructor (ห้าม import global)
  - model.ts ห้าม import React
  - view.tsx ใช้ MUI DataGrid + search + pagination
```
