# Job Module — Database Schema

> **Reference**: Drizzle table definitions in `backend/src/config/schema.ts`
> **Pattern**: All tables use UUID v4 primary keys, soft-delete support, and optimistic locking via `version` column.

---

## 1. Table: `jobs`

```sql
CREATE TABLE jobs (
  id              VARCHAR(36)  PRIMARY KEY,
  customer_id     VARCHAR(36)  NOT NULL,
  vehicle_id      VARCHAR(36),
  invoice_id      VARCHAR(36),
  job_type        ENUM('INSTALL', 'REPAIR', 'INSPECT') NOT NULL DEFAULT 'INSTALL',
  status          ENUM('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'QUEUED',
  scheduled_date  DATE,
  start_time      DATETIME,
  end_time        DATETIME,
  technician_id   VARCHAR(36),
  notes           TEXT,
  created_by      VARCHAR(36)  NOT NULL,
  version         INT          NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL,

  INDEX idx_jobs_customer (customer_id),
  INDEX idx_jobs_vehicle (vehicle_id),
  INDEX idx_jobs_invoice (invoice_id),
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_job_type (job_type),
  INDEX idx_jobs_technician (technician_id),
  INDEX idx_jobs_scheduled_date (scheduled_date),
  INDEX idx_jobs_created_at (created_at),
  CONSTRAINT fk_jobs_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_jobs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_jobs_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_jobs_technician FOREIGN KEY (technician_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `customer_id` | VARCHAR(36) | NOT NULL, FK → customers(id) | |
| `vehicle_id` | VARCHAR(36) | FK → vehicles(id) | Vehicle being serviced |
| `invoice_id` | VARCHAR(36) | FK → invoices(id) | Optional invoice reference |
| `job_type` | ENUM | NOT NULL, DEFAULT 'INSTALL' | INSTALL = ติดตั้ง, REPAIR = ซ่อม, INSPECT = ตรวจสอบ |
| `status` | ENUM | NOT NULL, DEFAULT 'QUEUED' | See status flow below |
| `scheduled_date` | DATE | NULL | วันนัดหมาย |
| `start_time` | DATETIME | NULL | เวลาเริ่มทำงานจริง |
| `end_time` | DATETIME | NULL | เวลาเสร็จงานจริง |
| `technician_id` | VARCHAR(36) | FK → users(id) | ช่างที่รับผิดชอบ |
| `notes` | TEXT | NULL | บันทึกเพิ่มเติม |
| `created_by` | VARCHAR(36) | NOT NULL, FK → users(id) | |
| `version` | INT | NOT NULL, DEFAULT 1 | Optimistic lock |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | |
| `updated_at` | TIMESTAMP | NOT NULL, ON UPDATE NOW | |
| `deleted_at` | TIMESTAMP | NULL | Soft delete |

---

## 2. Table: `job_items`

```sql
CREATE TABLE job_items (
  id          VARCHAR(36)  PRIMARY KEY,
  job_id      VARCHAR(36)  NOT NULL,
  product_id  VARCHAR(36)  NOT NULL,
  quantity    INT          NOT NULL CHECK (quantity > 0),

  INDEX idx_job_items_job (job_id),
  INDEX idx_job_items_product (product_id),
  CONSTRAINT fk_job_items_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `job_id` | VARCHAR(36) | NOT NULL, FK → jobs(id) CASCADE | |
| `product_id` | VARCHAR(36) | NOT NULL, FK → products(id) | Products used in this job |
| `quantity` | INT | NOT NULL, CHECK > 0 | |

---

## 3. Table: `job_status_logs`

```sql
CREATE TABLE job_status_logs (
  id          VARCHAR(36)  PRIMARY KEY,
  job_id      VARCHAR(36)  NOT NULL,
  from_status ENUM('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
  to_status   ENUM('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL,
  changed_by  VARCHAR(36)  NOT NULL,
  note        TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_job_status_logs_job (job_id),
  INDEX idx_job_status_logs_created (created_at),
  CONSTRAINT fk_job_status_logs_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `job_id` | VARCHAR(36) | NOT NULL, FK → jobs(id) CASCADE | |
| `from_status` | ENUM | NULL | NULL for initial creation |
| `to_status` | ENUM | NOT NULL | |
| `changed_by` | VARCHAR(36) | NOT NULL, FK → users(id) | |
| `note` | TEXT | NULL | Reason for change |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | |

---

## 4. Transaction Pattern — Status Update

**Files**: `backend/src/modules/job/repo.ts`

```ts
// ⭐ ONE transaction — update job + insert log — ALL or NOTHING
async updateStatus(
  id: string,
  status: JobStatus,
  version: number,
  changedBy: string,
  note?: string,
): Promise<JobEntity | null> {
  return await db.transaction(async (tx) => {
    // 1. Get current job (WITH FOR UPDATE lock)
    const [current] = await tx
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .for('update');

    if (!current) return null;

    // 2. Validate status transition
    const fromStatus = current.status;
    if (!isValidTransition(fromStatus, status)) {
      throw new AppError(400, `Invalid transition: ${fromStatus} → ${status}`);
    }

    // 3. Update job with version check
    const [result] = await tx
      .update(jobs)
      .set({
        status,
        version: version + 1,
        startTime: status === 'IN_PROGRESS' ? new Date() : current.startTime,
        endTime: status === 'COMPLETED' ? new Date() : current.endTime,
        updatedAt: new Date(),
      })
      .where(and(eq(jobs.id, id), eq(jobs.version, version)));

    if (result.affectedRows === 0) return null;

    // 4. Insert status change log
    await tx.insert(jobStatusLogs).values({
      jobId: id,
      fromStatus,
      toStatus: status,
      changedBy,
      note: note ?? null,
    });

    return this.findById(id);
  });  // ← throw anywhere → FULL ROLLBACK
}
```

### Required Interfaces

```ts
interface IJobRepository {
  create(data: CreateJobData): Promise<JobEntity>;
  findById(id: string): Promise<JobEntity | null>;
  filter(params: FilterParams): Promise<{ data: JobEntity[]; total: number }>;
  todayQueue(): Promise<{ total: number; queued: number; inProgress: number; completed: number; cancelled: number }>;
  updateStatus(id: string, status: JobStatus, version: number, changedBy: string, note?: string): Promise<JobEntity | null>;
}
```

---

## 5. Zod Schemas (Validation)

```ts
// backend/src/modules/job/schema.ts

export const createJobSchema = z.object({
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid().optional().nullable(),
  invoiceId: z.string().uuid().optional().nullable(),
  jobType: z.enum(['INSTALL', 'REPAIR', 'INSPECT']),
  scheduledDate: z.string().optional().nullable(),  // ISO date string
  technicianId: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  note: z.string().max(500).optional().nullable(),
  version: z.number().int().min(1),
});

export const filterJobSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  sortName: z.string().optional(),
  sortBy: z.enum(['asc', 'desc']).optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.unknown(),
  })).max(20).optional(),
});

export interface JobResponse {
  id: string;
  customerId: string;
  customerName?: string;
  vehicleId?: string;
  licensePlate?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  jobType: string;
  status: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  technicianId?: string;
  technicianName?: string;
  notes?: string;
  createdBy: string;
  version: number;
  createdAt: string;
  items?: JobItemResponse[];
  statusLogs?: JobStatusLogResponse[];
}

export interface JobItemResponse {
  id: string;
  jobId: string;
  productId: string;
  productName?: string;
  quantity: number;
}

export interface JobStatusLogResponse {
  id: string;
  jobId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  note: string | null;
  createdAt: string;
}
```

---

## 6. Status Flow

```
                    ┌──────────┐
                    │  QUEUED  │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼                    ▼
     ┌──────────────┐      ┌───────────┐
     │ IN_PROGRESS   │      │ CANCELLED │
     └──────┬───────┘      └───────────┘
            │
            ▼
     ┌───────────┐
     │ COMPLETED  │
     └───────────┘
```

### Valid Transitions

| Current Status | Can Transition To |
|----------------|-------------------|
| `QUEUED` | `IN_PROGRESS`, `CANCELLED` |
| `IN_PROGRESS` | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | — (terminal) |
| `CANCELLED` | — (terminal) |

```ts
function isValidTransition(from: JobStatus, to: JobStatus): boolean {
  const validTransitions: Record<JobStatus, JobStatus[]> = {
    QUEUED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };
  return validTransitions[from]?.includes(to) ?? false;
}
```

---

## 7. Enum Values

### job_type
| Value | Description |
|-------|-------------|
| `INSTALL` | ติดตั้ง |
| `REPAIR` | ซ่อม |
| `INSPECT` | ตรวจสอบ |

### status
| Value | Description | Badge Color |
|-------|-------------|-------------|
| `QUEUED` | รอดำเนินการ | Default/Info |
| `IN_PROGRESS` | กำลังดำเนินการ | Warning |
| `COMPLETED` | เสร็จแล้ว | Success |
| `CANCELLED` | ยกเลิก | Error/Default |
