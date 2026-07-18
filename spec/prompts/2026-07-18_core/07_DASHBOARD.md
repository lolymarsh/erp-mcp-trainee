# Prompt — Phase 07: Dashboard

```
implement phase 07 ตาม spec/2026-07-18_core/07_DASHBOARD.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: Redis cache with invalidation

สิ่งที่ต้องทำ:
  backend:  modules/dashboard/ (entity, schema, handler, service, repo, route, test)
  frontend: modules/dashboard/ (model, controller, view)
  tests:    integration + unit

KPI Cards (4):
  - Today Sales (ยอดขายวันนี้): amount + count
  - Today Jobs (คิวงานวันนี้): total, completed, in-progress, queued
  - Low Stock (สต็อกใกล้หมด): products below min_stock
  - Monthly Sales (รายได้เดือนนี้): total

Charts (2 — Recharts):
  - Bar Chart: ยอดขายรายเดือน (12 months)
  - Bar Chart: Top 5 ช่าง (by job count)

Low Stock Table: MUI DataGrid — rows below min_stock

อย่าลืม:
  - Redis cache: dashboard:summary — TTL 5 min
  - Cache invalidation: on invoice create, stock adjust, job status change
  - Auto-refresh frontend every 5 min
  - Click KPI card → navigate to related page
```
