# Plan — Audit & Fix Issues

> Status: `planning` | Estimate: 7-9 days | 9 Phases

## Overview

จากการ audit เทียบ spec `2026-07-18_core/` vs implementation จริง พบปัญหาใน 4 หมวด:
1. **Backend** — service เรียก db โดยตรง (invoice/job) — ละเมิด architecture
2. **Audit Log** — ไม่มีโมดูล auditlog (มีแค่ infrastructure เปล่า)
3. **Frontend** — ขาด create/edit/delete UI, ไม่มี validation, ไม่มี debounce/skeleton/404
4. **Cross-cutting** — pagination ไม่สม่ำเสมอ, route detail หาย, rules ต้องอัพเดท

---

## Phases

| # | Phase | Priority | Estimate | Depends On |
|---|-------|----------|----------|------------|
| 01 | [Service Layer Refactor](./01_SERVICE_FIX.md) | 🔴 P0 | 1.25d | — |
| 02 | [Audit Log Module](./02_AUDIT_LOG.md) | 🔴 P0 | 2.5d | Phase 01 |
| 03 | [Login Validation](./03_LOGIN_VALIDATION.md) | 🔴 P0 | 0.5d | — |
| 04 | [Customer CRUD UI](./04_CUSTOMER_CRUD.md) | 🔴 P0 | 1d | — |
| 05 | [Inventory CRUD UI](./05_INVENTORY_CRUD.md) | 🔴 P0 | 1d | — |
| 06 | [Jobs + Invoice + Pagination](./06_JOBS_INVOICE.md) | 🟡 P1 | 1d | Phase 04 |
| 07 | [Cross-Cutting: Routes, 404, Skeleton, Debounce](./07_CROSS_CUTTING.md) | 🟡 P1 | 1d | Phase 04-06 |
| 08 | [AI Chat Fixes](./08_AI_CHAT.md) | 🟡 P1 | 0.75d | — |
| 09 | [Rules Update](./09_RULES.md) | 🔴 P0 | 0.25d | — |

**Total: ~7-9 days**

---

## Order of Execution

```
Day 1:  Phase 01 — Service Layer Refactor → Phase 09 — Rules Update
Day 2:  Phase 02 — Audit Log Backend (entity, repo_mongo, service diff engine, handler, route)
Day 3:  Phase 02 — Audit middleware + Integrate into all services + Phase 03 — Login Validation
Day 4:  Phase 04 — Customer CRUD UI (create, edit, delete, detail)
Day 5:  Phase 05 — Inventory CRUD UI (create, edit, delete, stock adjust, detail)
Day 6:  Phase 06 — Jobs CRUD + Invoice Detail + Pagination standardization
Day 7:  Phase 07 — Routes registration + 404 pages + Skeleton loading + Debounce
Day 8:  Phase 02 — Audit frontend (action buttons on detail pages) + Phase 08 — AI Chat fixes

(Phase 02 frontend depends on Phase 04-06 detail pages existing)
```

---

## Problem → Phase Mapping

| Problem | Phase |
|---------|-------|
| 1. Login — no validation | Phase 03 |
| 2. Customer — missing CRUD UI | Phase 04 |
| 3. Inventory — missing CRUD UI | Phase 05 |
| 4. Service calls DB directly | Phase 01 |
| 5. Missing routes (detail pages) | Phase 07 |
| 6. No skeleton loading | Phase 07 |
| 7. No debounce on search | Phase 07 |
| 8. No 404 page | Phase 07 |
| 9. Jobs — missing CRUD UI | Phase 06 |
| 10. AI Chat — key + error handling | Phase 08 |
| 11. Pagination inconsistency | Phase 06 |
| 12. Rules update | Phase 09 |
| 13. Audit log module + action buttons | Phase 02 |
