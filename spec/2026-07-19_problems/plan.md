# Plan — 2026-07-19 Bug Fixes & Improvements

> **Status**: `planning` | Estimate: 7-9 days | 8 Phases

## Overview

ตาม prompt.md พบปัญหาหลัก 4 ด้าน:
1. **ภาษา** — ไทยคำอังกฤษคำปนกันหลายหน้า
2. **Inventory** — หมวดหมู่แสดง UUID แทนชื่อหมวดหมู่
3. **Invoice Modal** — customer/product search + pagination ใช้ไม่ได้
4. **Jobs** — customer selection API leak + ขาด debounce/pagination
5. **Seed Data** — มี customers 5, products 10 ไม่พอ test
6. **User Management** — ยังไม่มีหน้า UI จัดการผู้ใช้งาน
7. **E2E Tests** — ขาด job e2e, invoice e2e ไม่ครบ flow

---

## Phases

| # | Phase | Priority | Estimate | Depends On |
|---|-------|----------|----------|------------|
| 01 | [Quick Wins: ไทย + Invoice Props + Job API Leak](./01_QUICK_WINS.md) | 🔴 P0 | 0.5d | — |
| 02 | [Inventory: Category Name + Category CRUD](./02_INVENTORY_CATEGORY.md) | 🔴 P0 | 1d | — |
| 03 | [Job: Customer Selection Overhaul](./03_JOB_CUSTOMER.md) | 🔴 P0 | 1d | — |
| 04 | [Seed Data: 20 Customers + 20 Products](./04_SEED_DATA.md) | 🟡 P1 | 0.5d | — |
| 05 | [User Management: Backend](./05_USER_BACKEND.md) | 🔴 P0 | 1.5d | — |
| 06 | [User Management: Frontend](./06_USER_FRONTEND.md) | 🔴 P0 | 1.5d | Phase 05 |
| 07 | [E2E: Invoice Full Flow](./07_E2E_INVOICE.md) | 🟡 P1 | 0.5d | Phase 01, 04 |
| 08 | [E2E: Job Full Flow + User](./08_E2E_JOB_USER.md) | 🟡 P1 | 1d | Phase 03, 06 |

**Total: ~7.5 days**

---

## Order of Execution

```
Day 1: Phase 01 — ไทย + Invoice Props + Job API Leak
       Phase 02 — Inventory Category Name

Day 2: Phase 03 — Job Customer Selection (debounce + pagination + infinite scroll)

Day 3: Phase 04 — Seed Data (20 customers + 20 products)
       Phase 05 — User Management Backend (endpoints + service + repo)

Day 4: Phase 05 — User Management Backend (ต่อ) + tests

Day 5: Phase 06 — User Management Frontend (model + controller + view)

Day 6: Phase 06 — User Management Frontend (router + layout) + Phase 07 — E2E Invoice

Day 7: Phase 08 — E2E Job + User + Final review
```

---

## Problem → Phase Mapping

| Problem | Phase |
|---------|-------|
| 1. ภาษาไทยปนอังกฤษ (invoice/job) | Phase 01 |
| 2. Invoice modal — ค้นหา/เลือก customer/product ไม่ได้ | Phase 01 |
| 3. Job — API รั่วตอนพิมพ์หาลูกค้า | Phase 01 |
| 4. Inventory — หมวดหมู่แสดง UUID แทนชื่อ | Phase 02 |
| 5. Job — เลือกลูกค้าไม่มี debounce/pagination | Phase 03 |
| 6. Seed data มีน้อยไป (5 customers, 10 products) | Phase 04 |
| 7. User Management — ไม่มี backend endpoints (filter, update, delete) | Phase 05 |
| 8. User Management — ไม่มี frontend UI | Phase 06 |
| 9. Invoice E2E — test ไม่ครบ flow | Phase 07 |
| 10. Job E2E — ไม่มี test เลย | Phase 08 |
| 11. User E2E — ไม่มี test เลย | Phase 08 |
