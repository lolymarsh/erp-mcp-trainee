# Customer Module — Database Schema

> **Engine**: MySQL 8.4 (InnoDB)
> **ORM**: Drizzle ORM (defined in `backend/src/config/schema.ts`)
> **Migration**: `npx drizzle-kit generate` → `npx drizzle-kit migrate`

---

## Table: `customers`

Stores customer/CRM profiles.

### Columns

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `first_name` | `VARCHAR(255)` | `NOT NULL` | |
| `last_name` | `VARCHAR(255)` | `NOT NULL` | |
| `phone` | `VARCHAR(50)` | `NOT NULL` | |
| `email` | `VARCHAR(255)` | | Nullable |
| `address` | `TEXT` | | Nullable |
| `version` | `INT` | `NOT NULL DEFAULT 1` | Optimistic locking |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |
| `deleted_at` | `TIMESTAMP` | | Nullable — soft delete marker |

### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_customers_phone` | `phone` | BTREE | Search by phone |
| `idx_customers_name` | `first_name, last_name` | BTREE | Search by customer name |

### Drizzle Definition

```ts
export const customers = mysqlTable('customers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  version: int('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('idx_customers_phone').on(table.phone),
  index('idx_customers_name').on(table.firstName, table.lastName),
]);
```

### Entity Interface

```ts
export interface CustomerEntity {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

---

## Table: `vehicles`

Stores vehicle registrations linked to a customer.

### Columns

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `customer_id` | `VARCHAR(36)` | `NOT NULL`, `FOREIGN KEY → customers(id)` | Parent customer |
| `license_plate` | `VARCHAR(50)` | `NOT NULL` | ทะเบียนรถ |
| `brand` | `VARCHAR(255)` | | Nullable — ยี่ห้อ (Toyota, Honda) |
| `model` | `VARCHAR(255)` | | Nullable — รุ่น (Camry, Civic) |
| `year` | `INT` | | Nullable — ปีผลิต |
| `engine_type` | `VARCHAR(50)` | | Nullable — ประเภทเครื่องยนต์ (CNG, LPG, etc.) |
| `fuel_type` | `VARCHAR(50)` | | Nullable — ประเภทเชื้อเพลิง |
| `version` | `INT` | `NOT NULL DEFAULT 1` | Optimistic locking |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |
| `deleted_at` | `TIMESTAMP` | | Nullable — soft delete marker |

### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_vehicles_customer_id` | `customer_id` | BTREE | Find all vehicles for a customer |
| `idx_vehicles_license_plate` | `license_plate` | BTREE | Search by license plate (unique lookup) |

### Drizzle Definition

```ts
export const vehicles = mysqlTable('vehicles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  customerId: varchar('customer_id', { length: 36 }).notNull(),
  licensePlate: varchar('license_plate', { length: 50 }).notNull(),
  brand: varchar('brand', { length: 255 }),
  model: varchar('model', { length: 255 }),
  year: int('year'),
  engineType: varchar('engine_type', { length: 50 }),
  fuelType: varchar('fuel_type', { length: 50 }),
  version: int('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('idx_vehicles_customer_id').on(table.customerId),
  index('idx_vehicles_license_plate').on(table.licensePlate),
]);
```

### Entity Interface

```ts
export interface VehicleEntity {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  engineType: string | null;
  fuelType: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

---

## Relationships

```
customers 1 ──── * vehicles

customers.id = vehicles.customer_id
```
