# Prompt — Phase 05: Jobs (Installation Management)

```
implement phase 05 ตาม spec/2026-07-18_core/05_JOBS.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: DI (constructor), version check, pagination, transaction (status change)

สิ่งที่ต้องทำ:
  backend:  modules/job/ (entity, schema, handler, service, repo, route, test)
  frontend: modules/job/ (model, controller, view)
  tests:    integration + unit + component

อย่าลืม:
  - Status change: db.transaction (UPDATE jobs + INSERT job_status_logs)
  - PATCH /:id/status ต้องมี version check → 409 if mismatch
  - Status flow: QUEUED → IN_PROGRESS → COMPLETED (or CANCELLED)
  - GET /today-queue return counts by status
  - POST /filter ต้อง return pagination
  - Frontend: status badge สีตามสถานะ, dropdown เปลี่ยนสถานะ
```
