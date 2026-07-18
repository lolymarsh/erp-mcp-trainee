# Phase 05 — Jobs (Installation Management)

> **Priority**: 🟡 Medium-High
> **Estimate**: 1-2 days
> **Depends on**: Phase 02 (Customers), Phase 04 (Invoices)

---

## Task 5.1 — Job Backend (1 day)

**Files**: `backend/src/modules/job/`

| File | Key Points |
|------|-----------|
| `entity.ts` | JobEntity, JobStatusLog |
| `schema.ts` | createJob, updateJobStatus (with version), JobResponse |
| `handler.ts` | filter(), getById(), create(), updateStatus(), todayQueue() |
| `service.ts` | JobService — status transitions, technician assignment |
| `repo.ts` | JobRepository — status change → log + update in transaction |
| `route.ts` | POST /filter, GET /:id, POST /, PATCH /:id/status, GET /today-queue |

**Routes**:
```
POST  /api/jobs/filter         ← paginated job list
GET   /api/jobs/:id            ← job detail + status history
POST  /api/jobs                ← create job (link customer + vehicle + optional invoice)
PATCH /api/jobs/:id/status     ← update status (version required!)
GET   /api/jobs/today-queue    ← today's queue: pending + in-progress count
```

**Status Flow**:
```
QUEUED → IN_PROGRESS → COMPLETED
   ↓
CANCELLED
```

**Job Status Change — Transaction**:
```ts
await db.transaction(async (tx) => {
  // 1. UPDATE jobs (status, version check)
  // 2. INSERT job_status_logs
});
```

**Acceptance**:
- Status change logs history
- today-queue returns counts by status
- Version check prevents concurrent status updates

---

## Task 5.2 — Job Frontend (0.5 day)

**Files**: `frontend/src/modules/job/`

| File | Key Points |
|------|-----------|
| `model.ts` | jobApi: filter, create, updateStatus, todayQueue |
| `controller.ts` | useJobQueue(), useJobDetail() |
| `view.tsx` | JobQueueView — table with status badges (color-coded), status change dropdown |

**Acceptance**:
- Job queue with color-coded status
- Status change dropdown works
- 409 alert if version mismatch

---

## Phase 05 Checklist

```
[ ] POST /api/jobs → 201, linked to customer+vehicle
[ ] PATCH /api/jobs/:id/status → status updated + log created
[ ] PATCH /api/jobs/:id/status (wrong version) → 409
[ ] GET /api/jobs/today-queue → correct counts
[ ] Status change uses db.transaction() (job + log)
[ ] Frontend: job queue with status badges
[ ] Integration tests for all endpoints
```

> **Next**: Phase 06 — AI Chatbot
