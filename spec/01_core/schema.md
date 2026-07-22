# Core Module — Database Schema

> **Engine**: MySQL 8.4 via Drizzle ORM
> **Schema file**: `backend/src/config/schema.ts`

---

## Overview

Core module มี 2 ตารางหลักสำหรับ Authentication + Authorization:

| Table | Type | Purpose |
|-------|------|---------|
| `users` | MySQL (InnoDB) | User accounts, authentication, profile |
| `roles` | MySQL (InnoDB) | Role definitions, permission matrix |

---

## Table: `users`

```sql
CREATE TABLE users (
    id           VARCHAR(36)     NOT NULL PRIMARY KEY,
    username     VARCHAR(255)    NOT NULL,
    password_hash VARCHAR(255)   NOT NULL,
    display_name VARCHAR(255)    NOT NULL,
    role         ENUM('ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN') NOT NULL DEFAULT 'STAFF',
    version      INT             NOT NULL DEFAULT 1,
    created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP       NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `VARCHAR(36)` | `PRIMARY KEY`, `NOT NULL` | UUID v4 — unique user identifier |
| `username` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Login username — unique per user |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | bcrypt hash (salt rounds: 12) |
| `display_name` | `VARCHAR(255)` | `NOT NULL` | Full name shown in UI |
| `role` | `ENUM` | `NOT NULL`, `DEFAULT 'STAFF'` | Access level |
| `version` | `INT` | `NOT NULL`, `DEFAULT 1` | Optimistic locking — increment on every update |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Account creation time |
| `deleted_at` | `TIMESTAMP` | `NULL` | Soft-delete timestamp — `NULL` = active account |

### Indexes

```sql
CREATE UNIQUE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_deleted_at ON users (deleted_at);
CREATE INDEX idx_users_role_deleted ON users (role, deleted_at);
```

| Index | Type | Columns | Purpose |
|-------|------|---------|---------|
| `idx_users_username` | UNIQUE | `username` | Fast login lookup + uniqueness enforcement |
| `idx_users_role` | BTREE | `role` | Filter users by role (admin pages) |
| `idx_users_deleted_at` | BTREE | `deleted_at` | Exclude soft-deleted users from queries |
| `idx_users_role_deleted` | BTREE | `role, deleted_at` | Composite filter for active users by role |

### Constraints

- `username` — `UNIQUE`: ห้าม username ซ้ำ
- `role` — `ENUM`: จำกัดค่าที่กำหนดเท่านั้น (`ADMIN`, `MANAGER`, `STAFF`, `TECHNICIAN`)
- `id` — UUID v4: ป้องกัน enumeration attack (ไม่ใช้ auto-increment)

### Drizzle Definition

```ts
import { mysqlTable, varchar, mysqlEnum, int, timestamp, index, uniqueIndex } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN']).notNull().default('STAFF'),
  version: int('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('idx_users_role').on(table.role),
  index('idx_users_deleted_at').on(table.deletedAt),
  index('idx_users_role_deleted').on(table.role, table.deletedAt),
]);
```

---

## Table: `roles`

```sql
CREATE TABLE roles (
    id          VARCHAR(36)     NOT NULL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    permissions JSON            NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `VARCHAR(36)` | `PRIMARY KEY`, `NOT NULL` | UUID v4 |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Role display name (e.g. "Admin", "Manager") |
| `permissions` | `JSON` | `NOT NULL` | Array of permission strings |

### Indexes

```sql
CREATE UNIQUE INDEX idx_roles_name ON roles (name);
```

| Index | Type | Columns | Purpose |
|-------|------|---------|---------|
| `idx_roles_name` | UNIQUE | `name` | Fast lookup by role name |

### Permissions JSON Structure

```json
[
  "user:read",
  "user:create",
  "user:update",
  "user:delete",
  "customer:read",
  "customer:create",
  "customer:update",
  "customer:delete",
  "inventory:read",
  "inventory:create",
  "inventory:update",
  "inventory:delete",
  "invoice:read",
  "invoice:create",
  "invoice:update",
  "invoice:delete",
  "job:read",
  "job:create",
  "job:update",
  "job:delete",
  "report:read",
  "report:export",
  "settings:read",
  "settings:update"
]
```

**Convention**: `{resource}:{action}` format:
- Actions: `read`, `create`, `update`, `delete`, `export`, `approve`
- Resources: `user`, `customer`, `inventory`, `invoice`, `job`, `report`, `settings`

### Drizzle Definition

```ts
import { mysqlTable, varchar, json, uniqueIndex } from 'drizzle-orm/mysql-core';

export const roles = mysqlTable('roles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  permissions: json('permissions').notNull().$type<string[]>(),
}, (table) => [
  uniqueIndex('idx_roles_name').on(table.name),
]);
```

---

## Entity Relationships

```
┌─────────┐          ┌─────────┐
│  users  │          │  roles  │
├─────────┤          ├─────────┤
│ id      │──FK──>   │ id      │
│ role    │          │ name    │
│         │          │ perms   │
└─────────┘          └─────────┘
```

- `users.role` → lookup in `roles.name` (application-level foreign key)
- No database-level FK constraint on `users.role` to allow flexible role assignment
- Relationship enforced in application layer via `UserService.validateRole()`

### Role → Permission Mapping

| Role | Permissions |
|------|-------------|
| `ADMIN` | All permissions |
| `MANAGER` | All `read`, `create`, `update` on customer/inventory/invoice/job; `report:*`; no `delete` |
| `STAFF` | Customer/inventory/invoice `read`, `create`; job `read`, `update`; no `delete`, no `settings` |
| `TECHNICIAN` | Job `read`, `update`; inventory `read`; no customer/invoice write |

> **Note**: `roles` table มีไว้สำหรับ future expansion — Phase 1 ใช้ role-based guard ด้วย `ENUM` ใน `users` table โดยตรง
> เมื่อระบบโตขึ้น → migrate การ check permission ไปใช้ `roles` table แทน

---

## Query Patterns

### Active Users Only

```sql
SELECT * FROM users WHERE deleted_at IS NULL;
```

ใน Drizzle:
```ts
const activeUsers = await db.select()
  .from(users)
  .where(isNull(users.deletedAt));
```

### Login Lookup

```sql
SELECT * FROM users WHERE username = ? AND deleted_at IS NULL LIMIT 1;
```

```ts
const [user] = await db.select()
  .from(users)
  .where(and(eq(users.username, username), isNull(users.deletedAt)))
  .limit(1);
```

### Version Check (Optimistic Lock)

```sql
UPDATE users SET version = version + 1, display_name = ?
WHERE id = ? AND version = ?;
-- ถ้า affectedRows = 0 → version mismatch → 409 Conflict
```

```ts
const [updated] = await db.update(users)
  .set({ displayName: newName, version: sql`version + 1` })
  .where(and(eq(users.id, id), eq(users.version, currentVersion)));
```

### Soft Delete

```sql
UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL AND version = ?;
```

```ts
const [updated] = await db.update(users)
  .set({ deletedAt: new Date(), version: sql`version + 1` })
  .where(and(eq(users.id, id), isNull(users.deletedAt), eq(users.version, currentVersion)));
```

---

## Seed Data

```sql
-- Admin user (password: admin123)
INSERT INTO users (id, username, password_hash, display_name, role, version)
VALUES (
  UUID(),
  'admin',
  '$2b$12$...',  -- bcrypt hash of 'admin123'
  'Admin',
  'ADMIN',
  1
);

-- Default roles
INSERT INTO roles (id, name, permissions)
VALUES
  (UUID(), 'ADMIN',     '["*"]'),
  (UUID(), 'MANAGER',   '["customer:*", "inventory:*", "invoice:*", "job:*", "report:*"]'),
  (UUID(), 'STAFF',     '["customer:read", "customer:create", "inventory:read", "invoice:read", "invoice:create", "job:read", "job:update"]'),
  (UUID(), 'TECHNICIAN','["job:read", "job:update", "inventory:read"]');
```

---

## Migration Commands

```bash
# Generate migration SQL from schema.ts
npx drizzle-kit generate

# Apply migrations to MySQL
npx drizzle-kit migrate

# Push schema directly (dev only)
npx drizzle-kit push

# Rollback (if needed — Drizzle supports down migrations)
npx drizzle-kit drop
```

---

## Migration History

| File | Description |
|------|-------------|
| `drizzle/0000_initial.sql` | Initial schema — `users`, `roles`, `customers`, `vehicles`, `products`, `categories`, `stock_movements`, `invoices`, `invoice_items`, `jobs`, `job_status_logs` |
