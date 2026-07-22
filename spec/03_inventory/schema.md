# Inventory Module — Database Schema

> **Engine**: MySQL 8.4 (InnoDB)
> **ORM**: Drizzle ORM (defined in `backend/src/config/schema.ts`)
> **Migration**: `npx drizzle-kit generate` → `npx drizzle-kit migrate`

---

## Table: `categories`

Product categories (e.g., ถังแก๊ส, หัวฉีด, ECU, สายท่อ, ขายึด).

### Columns

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `name` | `VARCHAR(255)` | `NOT NULL` | Category name |
| `description` | `TEXT` | | Nullable |
| `version` | `INT` | `NOT NULL DEFAULT 1` | Optimistic locking |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |
| `deleted_at` | `TIMESTAMP` | | Nullable — optional soft delete |

### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_categories_name` | `name` | BTREE | Search/filter by category name |

### Drizzle Definition

```ts
export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  version: int('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('idx_categories_name').on(table.name),
]);
```

### Entity Interface

```ts
export interface CategoryEntity {
  id: string;
  name: string;
  description: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

---

## Table: `products`

Product catalog with stock tracking. Specs stored as JSON for flexible product-type-specific attributes.

### Columns

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `category_id` | `VARCHAR(36)` | `NOT NULL`, `FOREIGN KEY → categories(id)` | Product category |
| `sku` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Stock Keeping Unit (รหัสสินค้า) |
| `name` | `VARCHAR(255)` | `NOT NULL` | Product name |
| `description` | `TEXT` | | Nullable |
| `unit` | `VARCHAR(50)` | `NOT NULL` | Unit of measure (ชิ้น, ใบ, เส้น, ลูก) |
| `cost_price` | `DECIMAL(12,2)` | `NOT NULL DEFAULT 0` | ต้นทุน |
| `sell_price` | `DECIMAL(12,2)` | `NOT NULL DEFAULT 0` | ราคาขาย |
| `min_stock` | `INT` | `NOT NULL DEFAULT 0` | Minimum stock level for alerts |
| `current_stock` | `INT` | `NOT NULL DEFAULT 0` | Current stock quantity |
| `specs` | `JSON` | | Flexible product specs (e.g., capacity, pressure, firmware version) |
| `version` | `INT` | `NOT NULL DEFAULT 1` | Optimistic locking |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |
| `deleted_at` | `TIMESTAMP` | | Nullable — soft delete marker |

### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_products_category_id` | `category_id` | BTREE | Filter by category, JOIN with categories |
| `idx_products_sku` | `sku` | UNIQUE | SKU lookup (unique identifier) |
| `idx_products_name` | `name` | BTREE | Search by product name |

### Drizzle Definition

```ts
export const products = mysqlTable('products', {
  id: varchar('id', { length: 36 }).primaryKey(),
  categoryId: varchar('category_id', { length: 36 }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  unit: varchar('unit', { length: 50 }).notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  sellPrice: decimal('sell_price', { precision: 12, scale: 2 }).notNull().default('0'),
  minStock: int('min_stock').notNull().default(0),
  currentStock: int('current_stock').notNull().default(0),
  specs: json('specs'),
  version: int('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('idx_products_category_id').on(table.categoryId),
  index('idx_products_name').on(table.name),
]);
```

### Entity Interface

```ts
export interface ProductEntity {
  id: string;
  categoryId: string;
  categoryName?: string;         // From JOIN in queries
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  minStock: number;
  currentStock: number;
  specs: Record<string, unknown> | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Specs JSON Examples

```json
// ถังแก๊ส (Gas Tank)
{ "capacity": 58, "capacityUnit": "liters", "material": "steel", "pressure": 20 }

// ECU (Electronic Control Unit)
{ "firmwareVersion": "2.1.0", "supportedEngines": ["4-cylinder", "6-cylinder"], "brand": "HANA" }

// หัวฉีด (Injector)
{ "nozzleSize": "1.8mm", "flowRate": "300cc/min", "type": "CNG" }
```

---

## Table: `stock_movements`

Audit trail for every stock change. Append-only log — records are never updated or deleted.

### Columns

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `product_id` | `VARCHAR(36)` | `NOT NULL`, `FOREIGN KEY → products(id)` | Product being moved |
| `type` | `ENUM('IN', 'OUT', 'ADJUST')` | `NOT NULL` | Movement type |
| `quantity` | `INT` | `NOT NULL` | Positive integer |
| `reference_type` | `VARCHAR(50)` | | Nullable — source document type (invoice, purchase_order, adjustment) |
| `reference_id` | `VARCHAR(36)` | | Nullable — source document ID |
| `created_by` | `VARCHAR(36)` | | Nullable — user who performed the movement |
| `note` | `TEXT` | | Nullable — reason or note |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_stock_product_id` | `product_id` | BTREE | Find all movements for a product |
| `idx_stock_created_at` | `created_at` | BTREE | Sort by date (newest first) |
| `idx_stock_reference` | `reference_type, reference_id` | BTREE | Lookup by source document |

### Drizzle Definition

```ts
export const stockMovements = mysqlTable('stock_movements', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  type: mysqlEnum('type', ['IN', 'OUT', 'ADJUST']).notNull(),
  quantity: int('quantity').notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: varchar('reference_id', { length: 36 }),
  createdBy: varchar('created_by', { length: 36 }),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_stock_product_id').on(table.productId),
  index('idx_stock_created_at').on(table.createdAt),
  index('idx_stock_reference').on(table.referenceType, table.referenceId),
]);
```

### Entity Interface

```ts
export interface StockMovementEntity {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string | null;
  note: string | null;
  createdAt: Date;
}
```

---

## Relationships

```
categories 1 ──── * products
products   1 ──── * stock_movements

categories.id  = products.category_id
products.id    = stock_movements.product_id
```
