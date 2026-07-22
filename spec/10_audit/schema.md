# 10 — Audit Log Schema (MongoDB)

## Collection: `audit_logs`

Collection สำหรับบันทึกกิจกรรมการแก้ไขข้อมูลทั้งหมดในระบบ แบบ append-only

### Document Structure

```ts
{
  _id: "ADL_a1b2c3d4e5f6g7h8i9j0",    // Custom ID: ADL_{uuid (no dash, 20 chars)}
  action: "UPDATE",                     // CREATE | UPDATE | DELETE
  tableName: "customers",               // ชื่อ module/table
  recordId: "550e8400-e29b-41d4-a716-446655440000",  // PK ของ record ที่ถูกแก้ไข
  changeDatas: [                        // เฉพาะ fields ที่เปลี่ยน (UPDATE) หรือทั้งหมด (CREATE/DELETE)
    { field: "firstName", old: "", new: "สมชาย" },
    { field: "phone", old: "0811111111", new: "0822222222" },
  ],
  userId: "550e8400-e29b-41d4-a716-446655440000",     // ผู้กระทำ
  userDisplayName: "admin",             // Denormalized — ไม่ต้อง join
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 ...",
  requestId: "REQ_a1b2c3d4e5f6g7h8i9j0",  // สำหรับ trace request
  createdAt: ISODate("2026-07-18T14:30:00Z"),
}
```

### Field Types

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `string` | Custom ID prefix `ADL_` + 20 char uuid |
| `action` | `string` | `CREATE` / `UPDATE` / `DELETE` |
| `tableName` | `string` | ชื่อ table/module เช่น `customers`, `inventory`, `invoices`, `jobs`, `users` |
| `recordId` | `string` | UUID ของ record |
| `changeDatas` | `Array<{field, old, new}>` | เฉพาะ fields ที่เปลี่ยนแปลง |
| `userId` | `string` | UUID ของผู้กระทำ |
| `userDisplayName` | `string\|null` | Denormalized display name |
| `ipAddress` | `string\|null` | Client IP |
| `userAgent` | `string\|null` | User-Agent header |
| `requestId` | `string\|null` | สำหรับ tracing |
| `createdAt` | `Date` | Timestamp |

### Indexes

```ts
// Core query pattern: audit log for a specific record
mongoDb.collection("audit_logs").createIndex(
  { tableName: 1, recordId: 1, createdAt: -1 },
  { name: "idx_record_history" }
);

// Query by user
mongoDb.collection("audit_logs").createIndex(
  { userId: 1, createdAt: -1 },
  { name: "idx_user_actions" }
);

// Filter by action type
mongoDb.collection("audit_logs").createIndex(
  { action: 1, createdAt: -1 },
  { name: "idx_action_type" }
);

// Time-based queries for admin audit trail viewer
mongoDb.collection("audit_logs").createIndex(
  { createdAt: -1 },
  { name: "idx_created_at" }
);

// Filter by table name for admin view
mongoDb.collection("audit_logs").createIndex(
  { tableName: 1, createdAt: -1 },
  { name: "idx_table_audit" }
);
```

### TTL Strategy

| Strategy | Approach | Detail |
|----------|----------|--------|
| **Primary** | No TTL (full retention) | Audit logs เก็บถาวร — ไม่ลบ |
| **Optional** | TTL index on `createdAt` | ถ้าต้องการ limited retention: `createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 })` = 90 วัน |
| **Archive** | MongoDB Atlas Online Archive | สำหรับ production scale: ย้าย logs เก่า > 90 วันไป S3 |

### Query Patterns

#### Get change history for a specific record

```ts
// For "ประวัติ" button on detail pages
const logs = await collection
  .find({ tableName: "customers", recordId: "uuid-xxx" })
  .sort({ createdAt: -1 })
  .limit(50)
  .toArray();
```

#### Filter with pagination (without changeDatas)

```ts
// For admin audit trail viewer
const logs = await collection
  .find({
    tableName: "customers",
    action: "UPDATE",
    createdAt: { $gte: startDate, $lte: endDate },
  })
  .project({ changeDatas: 0 })  // Omitted for performance
  .sort({ createdAt: -1 })
  .skip((page - 1) * pageSize)
  .limit(pageSize)
  .toArray();

const total = await collection.countDocuments({ ... });
```

### Size Estimation

| Action | Document Size | Est. Monthly Volume | Est. Monthly Storage |
|--------|---------------|---------------------|----------------------|
| CREATE | ~400 bytes | 500 records | ~200 KB |
| UPDATE | ~600 bytes (avg 3-5 fields changed) | 2,000 updates | ~1.2 MB |
| DELETE | ~300 bytes | 100 records | ~30 KB |
| **Total** | | **~2,600 docs** | **~1.5 MB/month** |

> MongoDB handles this volume trivially — even 10x growth (< 15 MB/month) is negligible.
