# Phase 02 — Audit Log Module

> **Priority**: 🔴 P0 — Core feature
> **Estimate**: 2.5 days
> **Depends on**: Phase 01 (Service Refactor — services need clean DI before injecting audit)

---

## Problem Summary

**Current state:** มีแค่ infrastructure (RabbitMQ queue + `workers/auditWorker.ts` + MongoDB `activity_logs`) แต่:
- ไม่มี `backend/src/modules/audit/` module
- ไม่มี API ให้ query ประวัติการแก้ไข
- มีแต่ chat module ที่ publish audit event (POC)
- ไม่มี module ไหนที่มี "ดูประวัติการแก้ไข" เลย

**Reference:** Go `internal/auditlog/` at `/Users/lolymarsh/Desktop/project/be-go-echo/internal/auditlog/`

---

## Architecture Decision: MongoDB (not MySQL)

| เหตุผล | Detail |
|--------|--------|
| Native JSON | `changeDatas` = `[{field, old, new}]` — MongoDB เก็บ native, MySQL ต้อง serialize/deserialize |
| Write-heavy | Audit เขียนอย่างเดียว แทบไม่อ่าน — แยก DB คนละตัว ลด load MySQL |
| No cross-DB tx | Async fire-and-forget — audit fail ≠ business rollback |
| Infra มีอยู่ | MongoDB รันอยู่แล้วสำหรับ `chat_messages` + `activity_logs` |
| Direct insert | ไม่ผ่าน RabbitMQ — `setImmediate` direct เข้า MongoDB เร็วกว่า |

---

## Design

### MongoDB Document (`audit_logs` collection)

```ts
{
  _id: "ADL_a1b2c3d4e5f6g7h8i9j0",
  action: "UPDATE",           // CREATE | UPDATE | DELETE
  tableName: "customers",     // ชื่อ module
  recordId: "uuid-xxx",       // PK ของ record
  changeDatas: [
    { field: "firstName", old: "", new: "สมชาย" },
    { field: "phone", old: "0811111111", new: "0822222222" },
  ],
  userId: "uuid-admin",
  userDisplayName: "admin",   // Denormalize — ไม่ต้อง join
  ipAddress: "127.0.0.1",
  userAgent: "Mozilla/...",
  requestId: "REQ_...",
  createdAt: ISODate("2026-07-18T14:30:00Z"),
}
```

### Indexes (`database.ts`)

```ts
mongoDb.collection("audit_logs").createIndex({ tableName: 1, recordId: 1, createdAt: -1 });
mongoDb.collection("audit_logs").createIndex({ userId: 1, createdAt: -1 });
mongoDb.collection("audit_logs").createIndex({ action: 1, createdAt: -1 });
```

---

## Task 2.1 — Backend `modules/audit/` (1 day)

### Files

| File | Responsibility |
|------|---------------|
| `entity.ts` | `AuditLogDocument` + `ChangeModel` |
| `schema.ts` | Zod: `filterAuditLogSchema`, `AuditLogResponse`, `AuditLogDetailResponse` |
| `repo_mongo.ts` | `IAuditLogRepository`: `insertAuditLog`, `findByFilters`, `countByFilters`, `findByRecord` |
| `service.ts` | `IAuditLogService`: `filter`, `getDetail`, `insertAuditLog(action, table, recordId, userId, oldData, newData, meta?)` |
| `handler.ts` | Express handlers: `filter` (POST), `getDetail` (GET) |
| `route.ts` | `POST /api/audit-log/filter`, `GET /api/audit-log/detail?resource_id=&table_name=` |

### `repo_mongo.ts` — MongoDB Repository

```ts
import type { Db, Collection } from "mongodb";

export interface IAuditLogRepository {
  insertAuditLog(doc: AuditLogDocument): Promise<void>;
  findByFilters(filters: AuditLogFilterInput): Promise<AuditLogDocument[]>;
  countByFilters(filters: AuditLogFilterInput): Promise<number>;
  findByRecord(tableName: string, recordId: string, limit?: number): Promise<AuditLogDocument[]>;
}

export class AuditLogRepository implements IAuditLogRepository {
  private collection: Collection<AuditLogDocument>;

  constructor(mongoDb: Db) {
    this.collection = mongoDb.collection("audit_logs");
  }

  async insertAuditLog(doc: AuditLogDocument): Promise<void> {
    await this.collection.insertOne(doc);
  }

  async findByRecord(tableName: string, recordId: string, limit = 50) {
    return this.collection
      .find({ tableName, recordId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async findByFilters(filters: AuditLogFilterInput) { /* ... */ }
  async countByFilters(filters: AuditLogFilterInput): Promise<number> { /* ... */ }
}
```

### `service.ts` — Diff Engine + Async Insert

```ts
// Diff engine: compare old vs new → only changed fields
const IGNORED_FIELDS = new Set(['updatedAt', 'updated_at', 'version', 'updatedBy', 'updated_by']);

function structToMap(data: unknown): Record<string, unknown> {
  if (typeof data === 'object' && data !== null) {
    return JSON.parse(JSON.stringify(data));
  }
  return {};
}

function calculateChangedFields(
  oldMap: Record<string, unknown> | null,
  newMap: Record<string, unknown> | null,
  action: string
): ChangeModel[] {
  if (action === 'CREATE' && newMap) {
    return Object.entries(newMap)
      .filter(([k]) => !IGNORED_FIELDS.has(k))
      .map(([field, val]) => ({ field, old: '', new: String(val ?? '') }));
  }
  if (action === 'DELETE' && oldMap) {
    return Object.entries(oldMap)
      .filter(([k]) => !IGNORED_FIELDS.has(k))
      .map(([field, val]) => ({ field, old: String(val ?? ''), new: '' }));
  }
  // UPDATE — only changed fields (JSON deep equal)
  const changes: ChangeModel[] = [];
  const allKeys = new Set([...Object.keys(oldMap ?? {}), ...Object.keys(newMap ?? {})]);
  for (const key of allKeys) {
    if (IGNORED_FIELDS.has(key)) continue;
    if (JSON.stringify(oldMap?.[key]) !== JSON.stringify(newMap?.[key])) {
      changes.push({ field: key, old: String(oldMap?.[key] ?? ''), new: String(newMap?.[key] ?? '') });
    }
  }
  return changes;
}

// Async fire-and-forget (matching Go's bgManager.Go)
async insertAuditLog(
  action: string, tableName: string, recordId: string, userId: string,
  oldData: unknown, newData: unknown, meta?: AuditMeta
): Promise<void> {
  if (!tableName || !recordId) return;

  const VALID_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];
  if (!VALID_ACTIONS.includes(action)) return;

  const changeDatas = calculateChangedFields(
    oldData ? structToMap(oldData) : null,
    newData ? structToMap(newData) : null,
    action,
  );

  if (action === 'UPDATE' && changeDatas.length === 0) return; // No changes

  setImmediate(async () => {
    try {
      await this.repo.insertAuditLog({
        _id: `ADL_${uuidv4().replace(/-/g, '').slice(0, 20)}`,
        action, tableName, recordId, changeDatas, userId,
        userDisplayName: meta?.userDisplayName ?? null,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
        requestId: meta?.requestId ?? null,
        createdAt: new Date(),
      });
    } catch (err) {
      logger.error({ err }, 'Failed to insert audit log');
    }
  });
}
```

### API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/audit-log/detail?resource_id=X&table_name=Y` | Bearer | Detail with full `changeDatas` |
| `POST` | `/api/audit-log/filter` | Bearer | Paginated list (no `changeDatas` for performance) |

Filter body:
```json
{
  "page": 1, "page_size": 20,
  "filters": [
    { "field": "table_name", "value": "customers" },
    { "field": "record_id", "value": "uuid-xxx" },
    { "field": "action", "value": "UPDATE" },
    { "field": "user_id", "value": "uuid-yyy" },
    { "field": "created_at", "greater_than": 1721000000000, "less_than": 1722000000000 }
  ]
}
```

---

## Task 2.2 — AuditMeta Middleware (0.25 day)

```ts
// backend/src/shared/middleware/auditMeta.ts
import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export interface AuditMeta {
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  userDisplayName: string | null;
}

export function auditMetaMiddleware(req: Request, _res: Response, next: NextFunction) {
  (req as any).auditMeta = {
    ipAddress: req.ip ?? null,
    userAgent: req.get('User-Agent') ?? null,
    requestId: req.get('X-Request-ID') ?? `REQ_${uuidv4().replace(/-/g, '').slice(0, 20)}`,
    userDisplayName: (req as any).user?.displayName ?? null,
  };
  next();
}
```

Apply globally in `app.ts` **after** auth middleware (เพื่อให้ `req.user` พร้อม)

---

## Task 2.3 — Integrate Audit into All Modules (0.5 day)

ทุก module ที่มี CREATE/UPDATE/DELETE ต้อง:
1. Inject `IAuditLogService` ใน constructor
2. Snapshot `oldData` ก่อน mutate, `newData` หลัง mutate
3. Call `void this.auditService.insertAuditLog(...)` — async, non-blocking

### Modules to integrate

| Module | CREATE | UPDATE | DELETE | Notes |
|--------|--------|--------|--------|-------|
| `customer` | ✅ | ✅ | ✅ (soft) | |
| `inventory` | ✅ | ✅ | ✅ (soft) | รวม stock adjust |
| `invoice` | ✅ | — | — | Invoice มีแต่ create |
| `job` | ✅ | ✅ (status) | — | Status change = UPDATE |
| `user` | ✅ (admin) | — | — | |

### Integration pattern (customer example)

```ts
// customer/service.ts
export class CustomerService implements ICustomerService {
  constructor(
    private repo: ICustomerRepository,
    private auditService: IAuditLogService,
    private getAuditMeta: () => AuditMeta,
  ) {}

  async create(input: CreateCustomerInput, userId: string): Promise<CustomerEntity> {
    const customer = await this.repo.create(input);
    void this.auditService.insertAuditLog(
      'CREATE', 'customers', customer.id, userId,
      null, customer, this.getAuditMeta()
    );
    return customer;
  }

  async update(id: string, input: UpdateCustomerInput, userId: string): Promise<CustomerEntity> {
    const existing = await this.repo.findById(id);             // BEFORE snapshot
    if (!existing) throw new NotFoundError('Customer not found');
    const updated = await this.repo.update(id, input, input.version); // AFTER
    void this.auditService.insertAuditLog(
      'UPDATE', 'customers', id, userId,
      existing, updated, this.getAuditMeta()
    );
    return updated;
  }

  async softDelete(id: string, version: number, userId: string): Promise<void> {
    const before = await this.repo.findById(id);
    await this.repo.softDelete(id, version);
    const after = await this.repo.findById(id); // After soft delete (has deletedAt)
    void this.auditService.insertAuditLog(
      'DELETE', 'customers', id, userId,
      before, after, this.getAuditMeta()
    );
  }
}
```

### DI wiring

```ts
// customer/route.ts (or central DI)
const auditRepo = new AuditLogRepository(mongoDb);
const auditSvc = new AuditLogService(auditRepo);
const getAuditMeta = (req: Request) => (req as any).auditMeta as AuditMeta;

const customerRepo = new CustomerRepository(db);           // MySQL
const customerSvc = new CustomerService(customerRepo, auditSvc, () => getAuditMeta(req));
```

---

## Task 2.4 — Frontend `modules/audit/` + Action Buttons (0.75 day)

### Frontend files

```
frontend/src/modules/audit/
  model.ts       — auditApi.getDetail(tableName, recordId), auditApi.filter(filters)
  controller.ts  — useAuditHistory(tableName, recordId)
  view.tsx       — AuditLogDialog (reusable dialog)
```

### AuditLogDialog

```tsx
// shared/components/AuditLogDialog.tsx
// Props: open, onClose, tableName, recordId, entityLabel
// Display:
// ┌──────────────────────────────────────────────────┐
// │  ประวัติการแก้ไข — ลูกค้า: สมชาย ใจดี             │
// ├──────────────────────────────────────────────────┤
// │  UPDATE  •  18/07/2026 14:30  •  โดย: admin      │
// │  ├─ email: old@mail.com → new@mail.com            │
// │  ├─ phone: 0811111111 → 0822222222                │
// │  └─ address: - → กรุงเทพฯ                         │
// │                                                   │
// │  CREATE  •  15/07/2026 09:00  •  โดย: admin       │
// │  ├─ firstName: - → สมชาย                          │
// │  ├─ lastName: - → ใจดี                            │
// │  └─ phone: - → 0811111111                         │
// └──────────────────────────────────────────────────┘
```

### Action Buttons on Detail Pages

ทุก detail page ต้องมีปุ่ม "ประวัติการแก้ไข":

| Page | Route | Buttons |
|------|-------|---------|
| CustomerDetail | `/customers/:id` | แก้ไข / ลบ / **ประวัติ** |
| InventoryDetail | `/inventory/:id` | แก้ไข / ลบ / ปรับสต็อก / **ประวัติ** |
| JobDetail | `/jobs/:id` | เปลี่ยนสถานะ / **ประวัติ** |
| InvoiceDetail | `/sales/invoices/:id` | **ประวัติ** |

> ⚠️ Dependency: ต้องทำ Phase 04 (Customer CRUD), 05 (Inventory CRUD), 06 (Jobs/Invoice) ก่อน — detail pages ต้องมีก่อนถึงใส่ปุ่มได้

---

## Phase 02 Checklist

### Backend
- [ ] MongoDB `audit_logs` collection indexes in `database.ts`
- [ ] `modules/audit/entity.ts` — `AuditLogDocument` + `ChangeModel`
- [ ] `modules/audit/schema.ts` — Zod schemas + response DTOs
- [ ] `modules/audit/repo_mongo.ts` — `IAuditLogRepository` + `AuditLogRepository`
- [ ] `modules/audit/service.ts` — `IAuditLogService` + diff engine + async insert
- [ ] `modules/audit/handler.ts` — `filter`, `getDetail`
- [ ] `modules/audit/route.ts` — `/api/audit-log/filter`, `/api/audit-log/detail`
- [ ] `shared/middleware/auditMeta.ts` — IP/UA/RequestID extraction
- [ ] Apply `auditMetaMiddleware` in `app.ts` after auth middleware
- [ ] `customer/service.ts` — inject `IAuditLogService` + log CREATE/UPDATE/DELETE
- [ ] `inventory/service.ts` — inject `IAuditLogService` + log CREATE/UPDATE/DELETE + stock adjust
- [ ] `invoice/service.ts` — inject `IAuditLogService` + log CREATE
- [ ] `job/service.ts` — inject `IAuditLogService` + log CREATE + status change
- [ ] `user/service.ts` — inject `IAuditLogService` + log admin create user
- [ ] All DI wiring updated in `route.ts` files
- [ ] Run `npm run typecheck` — pass
- [ ] Run `npm test` — all tests pass

### Frontend
- [ ] `modules/audit/model.ts` — `auditApi.getDetail()`, `auditApi.filter()`
- [ ] `modules/audit/controller.ts` — `useAuditHistory(tableName, recordId)`
- [ ] `shared/components/AuditLogDialog.tsx` — reusable audit history viewer
- [ ] CustomerDetail — add "ประวัติการแก้ไข" button
- [ ] InventoryDetail — add "ประวัติการแก้ไข" button
- [ ] JobDetail — add "ประวัติการแก้ไข" button
- [ ] InvoiceDetail — add "ประวัติการแก้ไข" button
