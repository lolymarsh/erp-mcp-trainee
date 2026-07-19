# Plan — 2026-07-19 Problems 2

> **Status**: `planning` | Estimate: 5-7 days | 7 Phases

## Overview

ตาม prompt.md พบปัญหาหลัก 4 ด้าน:
1. **Invoice** — ไม่มีค้นหา + filter status/paymentMethod + ไม่มีปุ่มอัพเดทสถานะใน detail
2. **Jobs** — ไม่มีค้นหา + ขาด filter ประเภทงาน (มีเฉพาะสถานะ)
3. **Customers** — ไม่มีปุ่มเพิ่ม/แก้ไข/ลบรถที่ลงทะเบียน + seed data vehicles น้อยเกินไป
4. **Admin Users** — IconButtons อยากเปลี่ยนเป็น Button + เพิ่มค้นหาด้วยชื่อ/ชื่อแสดง

---

## Phases

| # | Phase | Priority | Estimate | Depends On |
|---|-------|----------|----------|------------|
| 01 | [Invoice: Search + Filter + Payment Update](./01_INVOICE_SEARCH_FILTER.md) | 🔴 P0 | 1.5d | — |
| 02 | [Job: Search + JobType Filter](./02_JOB_SEARCH_FILTER.md) | 🔴 P0 | 0.5d | — |
| 03 | [Vehicle CRUD: Backend](./03_VEHICLE_BACKEND.md) | 🔴 P0 | 1d | — |
| 04 | [Vehicle CRUD: Frontend + Seed](./04_VEHICLE_FRONTEND_SEED.md) | 🔴 P0 | 1.5d | Phase 03 |
| 05 | [Admin Users: Button + Search](./05_ADMIN_USERS.md) | 🟡 P1 | 0.5d | — |
| 06 | [Seed Data: Vehicles 2-5 per Customer](./06_SEED_VEHICLES.md) | 🟡 P1 | 0.5d | — |
| 07 | [E2E Tests](./07_E2E.md) | 🟡 P1 | 1d | Phase 01-06 |

**Total: ~5-7 days**

---

## Order of Execution

```
Day 1: Phase 01 — Invoice Search + Filter + Payment Update
       Phase 02 — Job Search + JobType Filter

Day 2: Phase 03 — Vehicle CRUD Backend (entity, schema, service, repo, handler, route)

Day 3: Phase 04 — Vehicle CRUD Frontend (model, controller, view — add/edit/delete dialogs)
       Phase 05 — Admin Users Button + Search

Day 4: Phase 04 — Vehicle dialog integration + testing
       Phase 06 — Seed Data update (2-5 vehicles per customer)

Day 5: Phase 07 — E2E Tests (invoice payment update, job search/filter, vehicle CRUD, user search)
```

---

## Problem → Phase Mapping

| Problem | Phase |
|---------|-------|
| 1. Invoice list — ไม่มี search + filter status/paymentMethod | Phase 01 |
| 2. Invoice detail — ไม่มีปุ่มอัพเดทสถานะชำระเงิน | Phase 01 |
| 3. Job list — ไม่มี search + filter jobType | Phase 02 |
| 4. Customer detail — ไม่มีปุ่มเพิ่ม/แก้ไข/ลบรถ | Phase 03, 04 |
| 5. Seed — vehicles มีแค่ 5 คัน ไม่พอ test (40 customers) | Phase 06 |
| 6. Admin users — IconButtons อยากเปลี่ยนเป็น Button | Phase 05 |
| 7. Admin users — ไม่มีค้นหาชื่อ/displayName | Phase 05 |
| 8. E2E — ขาด test สำหรับฟีเจอร์ใหม่ | Phase 07 |
