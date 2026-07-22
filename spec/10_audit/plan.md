# 10 — Audit Log Module

> **Priority**: 🔴 P0 — Core feature
> **Estimate**: 2.5 days
> **Depends on**: All business modules (customer, inventory, invoice, job, user)

---

## Architecture Decision: MongoDB (not MySQL)

| เหตุผล | Detail |
|--------|--------|
| Native JSON | `changeDatas` = `[{field, old, new}]` — MongoDB เก็บ native, MySQL ต้อง serialize |
| Write-heavy | Audit เขียนอย่างเดียว แทบไม่อ่าน — แยก DB คนละตัว ลด load MySQL |
| No cross-DB tx | Async fire-and-forget — audit fail ≠ business rollback |
| Infra มีอยู่ | MongoDB รันอยู่แล้วสำหรับ `chat_messages` + `activity_logs` |

## Data Flow

```
Service (module/service.ts)
  │
  ├─ Snapshot oldData ก่อน mutate
  ├─ Mutate (create / update / soft delete)
  ├─ Snapshot newData หลัง mutate
  │
  └─ call auditService.insertAuditLog(action, table, recordId, userId, oldData, newData, meta)
       │
       ├─ diff engine: เปรียบเทียบ old vs new → เฉพาะ fields ที่เปลี่ยน
       ├─ setImmediate: async fire-and-forget (ไม่ block response)
       └─ repo.insertAuditLog() → MongoDB audit_logs collection
```

Alternative (via RabbitMQ):

```
Service → publish to erp.audit.log queue → auditWorker.ts → MongoDB
```

แต่สำหรับโมดูลนี้ใช้ **Direct MongoDB insert via setImmediate** ดีกว่า:
- เร็วกว่า (ไม่ต้องผ่าน queue)
- audit fail ไม่กระทบ business logic
- เขียนโค้ดง่ายกว่า

## Backend Module Structure

```
backend/src/modules/audit/
  ├── entity.ts          — AuditLogDocument + ChangeModel interfaces
  ├── schema.ts          — Zod: filterAuditLogSchema + response DTOs
  ├── repo_mongo.ts      — IAuditLogRepository + AuditLogRepository
  ├── service.ts         — IAuditLogService + diff engine + async insert
  ├── handler.ts         — filter (POST), getDetail (GET)
  └── route.ts           — POST /api/audit-log/filter, GET /api/audit-log/detail
```

### entity.ts

```ts
export interface ChangeModel {
  field: string;
  old: string;
  new: string;
}

export interface AuditLogDocument {
  _id: string;            // ADL_{uuid20}
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  tableName: string;      // ชื่อ module (customers, invoices, etc.)
  recordId: string;       // PK ของ record
  changeDatas: ChangeModel[];
  userId: string;
  userDisplayName: string | null; // Denormalize
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: Date;
}
```

### service.ts — Diff Engine

```ts
// IGNORED_FIELDS: updatedAt, updated_at, version, updatedBy, updated_by
// CREATE   → all fields (old = '')
// UPDATE   → only changed fields (JSON deep equal)
// DELETE   → all fields (new = '')
// No changes → skip insert
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

## AuditMeta Middleware

```ts
// backend/src/shared/middleware/auditMeta.ts
// Extract: ipAddress, userAgent, requestId, userDisplayName
// Apply in app.ts AFTER auth middleware (req.user must be ready)
```

## Integration Into All Modules

ทุก module ที่มี CREATE/UPDATE/DELETE ต้อง:
1. Inject `IAuditLogService` ใน constructor
2. Snapshot `oldData` ก่อน mutate, `newData` หลัง mutate
3. Call `void this.auditService.insertAuditLog(...)` — async, non-blocking

### Integration Pattern

```ts
async update(id: string, input: UpdateInput, userId: string): Promise<Entity> {
  const existing = await this.repo.findById(id);        // BEFORE snapshot
  if (!existing) throw new NotFoundError('Not found');
  const updated = await this.repo.update(id, input, input.version); // AFTER
  void this.auditService.insertAuditLog(
    'UPDATE', 'customers', id, userId,
    existing, updated, this.getAuditMeta()
  );
  return updated;
}
```

### Modules to Integrate

| Module | CREATE | UPDATE | DELETE | Notes |
|--------|--------|--------|--------|-------|
| `customer` | ✅ | ✅ | ✅ (soft) | |
| `inventory` | ✅ | ✅ | ✅ (soft) | รวม stock adjust |
| `invoice` | ✅ | — | — | Invoice มีแต่ create |
| `job` | ✅ | ✅ (status) | — | Status change = UPDATE |
| `user` | ✅ (admin) | ✅ | ✅ (soft) | Admin user management |

## Frontend

```
frontend/src/modules/audit/
  model.ts       — auditApi.getDetail(), auditApi.filter()
  controller.ts  — useAuditHistory(tableName, recordId)
  view.tsx       — AuditLogDialog (reusable dialog)
```

### AuditLogDialog

Reusable dialog component — props: `open`, `onClose`, `tableName`, `recordId`, `entityLabel`

Display format:
```
┌──────────────────────────────────────────────────┐
│  ประวัติการแก้ไข — ลูกค้า: สมชาย ใจดี             │
├──────────────────────────────────────────────────┤
│  UPDATE  •  18/07/2026 14:30  •  โดย: admin      │
│  ├─ email: old@mail.com → new@mail.com            │
│  ├─ phone: 0811111111 → 0822222222                │
│  └─ address: - → กรุงเทพฯ                         │
│                                                   │
│  CREATE  •  15/07/2026 09:00  •  โดย: admin       │
│  ├─ firstName: - → สมชาย                          │
│  ├─ lastName: - → ใจดี                            │
│  └─ phone: - → 0811111111                         │
└──────────────────────────────────────────────────┘
```

### Action Buttons on Detail Pages

| Page | Route | Buttons |
|------|-------|---------|
| CustomerDetail | `/customers/:id` | แก้ไข / ลบ / **ประวัติ** |
| InventoryDetail | `/inventory/:id` | แก้ไข / ลบ / ปรับสต็อก / **ประวัติ** |
| JobDetail | `/jobs/:id` | เปลี่ยนสถานะ / **ประวัติ** |
| InvoiceDetail | `/sales/invoices/:id` | **ประวัติ** |

## Checklist

### Backend — Audit Module
- [x] `modules/audit/entity.ts` — `AuditLogDocument` + `ChangeModel`
- [x] `modules/audit/schema.ts` — Zod schemas + response DTOs
- [x] `modules/audit/repo_mongo.ts` — `IAuditLogRepository` + `AuditLogRepository`
- [x] `modules/audit/service.ts` — `IAuditLogService` + diff engine + async insert
- [x] `modules/audit/handler.ts` — `filter`, `getDetail`
- [x] `modules/audit/route.ts` — routes: `POST /api/audit-log/filter`, `GET /api/audit-log/detail`
- [x] `shared/middleware/auditMeta.ts` — IP/UA/RequestID extraction
- [x] Apply `auditMetaMiddleware` in `app.ts` after auth middleware

### Backend — Integration Into All Modules
- [x] Inject `IAuditLogService` into `customer/service.ts` + snapshot before/after mutate
- [x] Inject `IAuditLogService` into `inventory/service.ts` + snapshot (รวม stock adjust)
- [x] Inject `IAuditLogService` into `invoice/service.ts` + snapshot
- [x] Inject `IAuditLogService` into `job/service.ts` + snapshot (status changes)
- [x] Inject `IAuditLogService` into `user/service.ts` (admin user management)
- [x] DI wiring in all `route.ts` files
- [x] `npm run typecheck` — pass
- [x] `npm run lint` — no new errors

### Frontend
- [x] `modules/audit/model.ts` — `auditApi.getDetail()`, `auditApi.filter()`
- [x] `modules/audit/controller.ts` — `useAuditHistory(tableName, recordId)`
- [x] `shared/components/AuditLogDialog.tsx` — reusable audit history viewer
- [x] CustomerDetail — add "ประวัติการแก้ไข" button
- [x] InventoryDetail — add "ประวัติการแก้ไข" button
- [x] JobDetail — add "ประวัติการแก้ไข" button
- [x] InvoiceDetail — add "ประวัติการแก้ไข" button
- [x] `npm run typecheck` — pass
- [x] `npm run lint` — no new errors

### DB
- [x] MongoDB `audit_logs` collection indexes in `database.ts`
- [x] TTL index on `createdAt` (optional — 90 day retention)
