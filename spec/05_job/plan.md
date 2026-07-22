# Module 05 — Job (Installation Management)

> **Priority**: 🟡 Medium-High
> **Estimate**: 1-2 days
> **Depends on**: Phase 02 (Customers), Phase 04 (Invoices)
> **Architecture**: See `spec/ARCHITECTURE.md` Sections 3-4 (module template, central wiring), Section 9 (pagination, transaction, version check)
> **Core Spec**: `spec/2026-07-18_core/05_JOBS.md`

---

## 1. Business Flow

```
Customer → Invoice → Job Created (QUEUED)
                         ↓
                  Technician Assigned
                         ↓
                  IN_PROGRESS (start work)
                         ↓
                  COMPLETED (finish)
                         ↓
                  [or] CANCELLED
```

## 2. API Endpoints

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/jobs/filter` | `filter()` | Paginated job list with search + filters |
| `GET` | `/api/jobs/:id` | `getById()` | Job detail + status history |
| `POST` | `/api/jobs` | `create()` | Create job (link customer + vehicle + optional invoice) |
| `PATCH` | `/api/jobs/:id/status` | `updateStatus()` | Update status (version required) |
| `GET` | `/api/jobs/today-queue` | `todayQueue()` | Today's queue with counts by status |

## 3. Module Structure

```
backend/src/modules/job/
├── entity.ts       ← JobEntity, JobStatusLogEntity
├── schema.ts       ← Zod schemas: createJob, updateJobStatus, filterRequest, JobResponse
├── handler.ts      ← filter(), getById(), create(), updateStatus(), todayQueue()
├── service.ts      ← JobService — status transitions, technician assignment
├── repo.ts         ← JobRepository — status change → log + update in transaction
├── route.ts        ← Router registration: POST /filter, GET /:id, POST /, PATCH /:id/status, GET /today-queue
└── job.test.ts     ← Integration + unit tests

frontend/src/modules/job/
├── model.ts        ← jobApi: filter, create, updateStatus, todayQueue
├── controller.ts   ← useJobQueue(), useJobDetail(), useJobCreate(), useJobStatusUpdate()
└── view.tsx        ← JobQueueView (table with status badges + search/filter), JobCreateDialog, JobDetailView
```

## 4. Tasks

### Task 4.1 — Job Backend (1 day)

#### Status Flow

```
QUEUED ──→ IN_PROGRESS ──→ COMPLETED
   │
   └──→ CANCELLED
```

**Valid transitions**:
| From | To |
|------|----|
| QUEUED | IN_PROGRESS, CANCELLED |
| IN_PROGRESS | COMPLETED, CANCELLED |
| COMPLETED | — (terminal) |
| CANCELLED | — (terminal) |

#### Status Update Transaction

```ts
// repo.ts — ONE transaction: update job + insert log
await db.transaction(async (tx) => {
  // 1. UPDATE jobs (status, version check)
  // 2. INSERT job_status_logs
  // Any throw → full rollback
});
```

**Detail**:
```ts
async updateStatus(id: string, status: JobStatus, version: number, changedBy: string, note?: string): Promise<JobEntity | null> {
  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(jobs)
      .set({ status, version: version + 1, updatedAt: new Date() })
      .where(and(eq(jobs.id, id), eq(jobs.version, version)));

    if (updated.affectedRows === 0) return null;

    await tx.insert(jobStatusLogs).values({
      jobId: id,
      fromStatus: status,  // actual: should query old status first
      toStatus: status,
      changedBy,
      note: note ?? null,
    });

    return this.findById(id);
  });
}
```

#### Create Job

- `POST /api/jobs`
- Body: `{ customerId, vehicleId?, invoiceId?, jobType, scheduledDate?, technicianId?, notes? }`
- Default status: `QUEUED`
- Pre-validate: customer exists, vehicle belongs to customer

#### Today Queue

- `GET /api/jobs/today-queue`
- Returns: `{ total: number, queued: number, inProgress: number, completed: number, cancelled: number }`
- Filter by `scheduled_date` = today

#### Filter/Search

- `POST /api/jobs/filter`
- Pagination + sort + filters
- Filters:
  - `status` with operator `eq`
  - `jobType` with operator `eq`

### Task 4.2 — Job Frontend (0.5 day)

#### Job Queue Page
- Search by customer (debounced 400ms)
- Filter by status dropdown (QUEUED/IN_PROGRESS/COMPLETED/CANCELLED)
- Filter by jobType dropdown (INSTALL/REPAIR/INSPECT)
- Paginated table with color-coded status badges
- "Create Job" button → dialog

#### Job Create Dialog
- Customer selector with **infinite scroll + debounce + pagination** (search customers via API)
- Vehicle selector (loaded when customer selected, with error handling fallback)
- Job type dropdown
- Invoice reference (optional)
- Technician assignment
- Scheduled date picker

#### Status Update
- Inline status change dropdown per row
- Or detail page with status update button
- 409 alert if version mismatch
- Success → refetch queue

### Task 4.3 — Customer Selection Overhaul (0.5 day)

**Problem**: Job create dialog previously loaded all customers with `pageSize: 100`, no infinite scroll, API called on every keystroke.

**Solution**: Refactor `useJobCreate` to:
1. Paginate customer search (`pageSize: 10`)
2. Debounce search input (300ms)
3. Infinite scroll via listbox `onScroll` handler
4. Reset page on new search
5. Cleanup debounce timer on unmount

**Pattern** (same as InvoiceCreateView):
```ts
// useJobCreate — customer search refs
const customerSearchTerm = useRef('');
const customerPageRef = useRef(1);
const customerTotalPagesRef = useRef(1);
const customerLoadingRef = useRef(false);

const searchCustomers = async (search: string, page: number, append: boolean) => {
  // ... customerApi.filter with pagination
  // append = true → accumulate results (infinite scroll)
  // append = false → reset results (new search)
};
```

## 5. Acceptance Criteria

- [ ] `POST /api/jobs` → 201, linked to customer+vehicle
- [ ] `PATCH /api/jobs/:id/status` → status updated + log created
- [ ] `PATCH /api/jobs/:id/status` (wrong version) → 409
- [ ] `PATCH /api/jobs/:id/status` (invalid transition) → 400
- [ ] `POST /api/jobs/filter` → paginated with filters
- [ ] `GET /api/jobs/today-queue` → correct counts by status
- [ ] Status change uses `db.transaction()` (job + log)
- [ ] Frontend: job queue with search/filter + color-coded status badges
- [ ] Frontend: customer selector with infinite scroll + debounce
- [ ] Integration tests for all endpoints
