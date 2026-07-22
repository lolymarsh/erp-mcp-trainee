# 11 — Admin Schema

> No new tables — User Management ใช้ `users` table จาก Phase 01 Core
> ไม่มี migration ใหม่ — เฉพาะ query patterns สำหรับ admin use cases

## Table: `users` (MySQL — defined in `config/schema.ts`)

### Schema (Reference)

```ts
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN']).notNull().default('STAFF'),
  isActive: boolean('is_active').notNull().default(true),
  version: int('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  deletedAt: timestamp('deleted_at'),   // soft delete
});
```

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| PRIMARY | `id` | PK lookup |
| UNIQUE | `username` | Login lookup |
| `idx_users_role` | `role` | Filter by role |
| `idx_users_is_active` | `isActive` | Filter active/inactive |
| `idx_users_deleted_at` | `deletedAt` | Filter soft-deleted |
| `idx_users_display_name` | `displayName` | Search by name |

### Query Patterns (Admin-Specific)

#### List all active users with pagination + filters

```sql
-- Exclude soft-deleted
SELECT id, username, display_name, role, is_active, version, created_at
FROM users
WHERE deleted_at IS NULL
  -- Optional filters:
  AND role = 'STAFF'                           -- filter by role
  AND is_active = true                         -- filter by status
  AND display_name LIKE '%สมชาย%'              -- search by name
  AND username LIKE '%staff%'                  -- search by username
ORDER BY created_at DESC                       -- sorting
LIMIT 20 OFFSET 0;                             -- pagination
```

#### Count for pagination total

```sql
SELECT COUNT(*) as total
FROM users
WHERE deleted_at IS NULL
  AND role = 'STAFF';
```

#### Soft delete

```sql
-- Version check (optimistic lock)
UPDATE users
SET deleted_at = NOW(),
    version = version + 1,
    updated_at = NOW()
WHERE id = 'uuid'
  AND version = :currentVersion;   -- returns affectedRows = 0 if conflict
```

#### Toggle active/inactive

```sql
UPDATE users
SET is_active = NOT is_active,
    version = version + 1,
    updated_at = NOW()
WHERE id = 'uuid'
  AND version = :currentVersion;
```

### Admin User Roles

| Role | Permissions |
|------|-------------|
| `ADMIN` | Full access — CRUD users, all modules |
| `MANAGER` | View users, cannot create/delete |
| `STAFF` | No access to admin area |
| `TECHNICIAN` | No access to admin area |

### Frontend Role Labels

```ts
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  STAFF: 'พนักงาน',
  TECHNICIAN: 'ช่าง',
};
```

### Audit Log Actions (on `users`)

| Action | Audit Log Entry |
|--------|-----------------|
| Admin creates user | `{ action: "CREATE", tableName: "users", changeDatas: [...] }` |
| Admin updates user | `{ action: "UPDATE", tableName: "users", changeDatas: [...] }` |
| Admin deletes user | `{ action: "DELETE", tableName: "users", changeDatas: [...] }` |
| Admin activates user | `{ action: "ACTIVATE", tableName: "users", changeDatas: [{ field: "isActive", old: "false", new: "true" }] }` |
| Admin deactivates user | `{ action: "DEACTIVATE", tableName: "users", changeDatas: [{ field: "isActive", old: "true", new: "false" }] }` |
