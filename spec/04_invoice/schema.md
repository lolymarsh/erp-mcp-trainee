# Invoice Module — Database Schema

> **Reference**: Drizzle table definitions in `backend/src/config/schema.ts`
> **Pattern**: All tables use UUID v4 primary keys, soft-delete support, and optimistic locking via `version` column.

---

## 1. Table: `quotations`

```sql
CREATE TABLE quotations (
  id          VARCHAR(36)  PRIMARY KEY,
  customer_id VARCHAR(36)  NOT NULL,
  vehicle_id  VARCHAR(36),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status      ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
  created_by  VARCHAR(36)  NOT NULL,
  version     INT          NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP    NULL,

  INDEX idx_quotations_customer (customer_id),
  INDEX idx_quotations_status (status),
  INDEX idx_quotations_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `customer_id` | VARCHAR(36) | NOT NULL, FK → customers(id) | |
| `vehicle_id` | VARCHAR(36) | FK → vehicles(id) | |
| `total_amount` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Before discount |
| `discount` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | |
| `status` | ENUM | NOT NULL, DEFAULT 'DRAFT' | DRAFT → SENT → ACCEPTED/REJECTED/EXPIRED |
| `created_by` | VARCHAR(36) | NOT NULL, FK → users(id) | |
| `version` | INT | NOT NULL, DEFAULT 1 | Optimistic lock |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | |
| `updated_at` | TIMESTAMP | NOT NULL, ON UPDATE NOW | |
| `deleted_at` | TIMESTAMP | NULL | Soft delete |

---

## 2. Table: `quotation_items`

```sql
CREATE TABLE quotation_items (
  id            VARCHAR(36)  PRIMARY KEY,
  quotation_id  VARCHAR(36)  NOT NULL,
  product_id    VARCHAR(36)  NOT NULL,
  quantity      INT          NOT NULL CHECK (quantity > 0),
  unit_price    DECIMAL(12,2) NOT NULL,
  total         DECIMAL(12,2) NOT NULL,

  INDEX idx_quotation_items_quotation (quotation_id),
  CONSTRAINT fk_quotation_items_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `quotation_id` | VARCHAR(36) | NOT NULL, FK → quotations(id) CASCADE | |
| `product_id` | VARCHAR(36) | NOT NULL, FK → products(id) | |
| `quantity` | INT | NOT NULL, CHECK > 0 | |
| `unit_price` | DECIMAL(12,2) | NOT NULL | Snapshot at time of quote |
| `total` | DECIMAL(12,2) | NOT NULL | quantity × unit_price |

---

## 3. Table: `invoices`

```sql
CREATE TABLE invoices (
  id              VARCHAR(36)  PRIMARY KEY,
  customer_id     VARCHAR(36)  NOT NULL,
  vehicle_id      VARCHAR(36),
  quotation_id    VARCHAR(36),
  invoice_number  VARCHAR(50)  NOT NULL UNIQUE,
  total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grand_total     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_status  ENUM('PENDING', 'PAID', 'PARTIAL', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  payment_method  ENUM('CASH', 'BANK_TRANSFER', 'CREDIT', 'PROMPTPAY') NULL,
  created_by      VARCHAR(36)  NOT NULL,
  version         INT          NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP    NULL,

  INDEX idx_invoices_customer (customer_id),
  INDEX idx_invoices_payment_status (payment_status),
  INDEX idx_invoices_payment_method (payment_method),
  INDEX idx_invoices_created_at (created_at),
  INDEX idx_invoices_invoice_number (invoice_number),
  INDEX idx_invoices_quotation (quotation_id),
  CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_invoices_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `customer_id` | VARCHAR(36) | NOT NULL, FK → customers(id) | |
| `vehicle_id` | VARCHAR(36) | FK → vehicles(id) | Optional vehicle reference |
| `quotation_id` | VARCHAR(36) | FK → quotations(id) | Optional quotation reference |
| `invoice_number` | VARCHAR(50) | NOT NULL, UNIQUE | Auto-generated (e.g. INV-20260718-001) |
| `total_amount` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Sum of items before discount/tax |
| `discount` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | |
| `tax` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | 7% VAT |
| `grand_total` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | total_amount - discount + tax |
| `payment_status` | ENUM | NOT NULL, DEFAULT 'PENDING' | PENDING → PAID/PARTIAL/REFUNDED |
| `payment_method` | ENUM | NULL | CASH, BANK_TRANSFER, CREDIT, PROMPTPAY |
| `created_by` | VARCHAR(36) | NOT NULL, FK → users(id) | |
| `version` | INT | NOT NULL, DEFAULT 1 | Optimistic lock |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | |
| `updated_at` | TIMESTAMP | NOT NULL, ON UPDATE NOW | |
| `deleted_at` | TIMESTAMP | NULL | Soft delete |

---

## 4. Table: `invoice_items`

```sql
CREATE TABLE invoice_items (
  id          VARCHAR(36)  PRIMARY KEY,
  invoice_id  VARCHAR(36)  NOT NULL,
  product_id  VARCHAR(36)  NOT NULL,
  quantity    INT          NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(12,2) NOT NULL,
  total       DECIMAL(12,2) NOT NULL,

  INDEX idx_invoice_items_invoice (invoice_id),
  CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `invoice_id` | VARCHAR(36) | NOT NULL, FK → invoices(id) CASCADE | |
| `product_id` | VARCHAR(36) | NOT NULL, FK → products(id) | |
| `quantity` | INT | NOT NULL, CHECK > 0 | |
| `unit_price` | DECIMAL(12,2) | NOT NULL | Snapshot at time of sale |
| `total` | DECIMAL(12,2) | NOT NULL | quantity × unit_price |

---

## 5. Transaction Pattern — Create Invoice

**Files**: `backend/src/modules/invoice/repo.ts`

```ts
// ⭐ ONE transaction — FOUR tables — ALL or NOTHING
async createInvoice(data: CreateInvoiceData): Promise<InvoiceEntity> {
  return await db.transaction(async (tx) => {
    // 1. Insert invoice header
    const [inv] = await tx.insert(invoices).values(data.invoice).$returningId();

    // 2. Insert invoice items (loop)
    for (const item of data.items) {
      await tx.insert(invoiceItems).values({ ...item, invoiceId: inv.id });
    }

    // 3. Deduct stock with row lock (FOR UPDATE)
    for (const item of data.items) {
      const [product] = await tx
        .select({ stock: products.currentStock, version: products.version })
        .from(products)
        .where(eq(products.id, item.productId))
        .for('update');  // ← PREVENTS RACE CONDITION

      if (!product || product.stock < item.quantity) {
        throw new AppError(400, `Stock insufficient for product ${item.productId}`);
      }

      await tx
        .update(products)
        .set({ currentStock: product.stock - item.quantity, version: product.version + 1 })
        .where(eq(products.id, item.productId));

      // 4. Log stock movement
      await tx.insert(stockMovements).values({
        productId: item.productId,
        type: 'OUT',
        quantity: item.quantity,
        referenceType: 'invoice',
        referenceId: inv.id,
      });
    }

    return inv as InvoiceEntity;
  });  // ← throw anywhere → FULL ROLLBACK
}
```

### Required Interfaces

```ts
interface CreateInvoiceData {
  invoice: typeof invoices.$inferInsert;
  items: (typeof invoiceItems.$inferInsert)[];
}

interface IInvoiceRepository {
  createInvoice(data: CreateInvoiceData): Promise<InvoiceEntity>;
  findById(id: string): Promise<InvoiceEntity | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<InvoiceEntity | null>;
  filter(params: FilterParams): Promise<{ data: InvoiceEntity[]; total: number }>;
  todaySummary(): Promise<{ totalSales: number; invoiceCount: number }>;
  updatePaymentStatus(id: string, data: { paymentStatus: string; paymentMethod: string | null }, version: number): Promise<InvoiceEntity | null>;
}
```

### Payment Status Update (Version Check)

```ts
// repo.ts
async updatePaymentStatus(
  id: string,
  data: { paymentStatus: string; paymentMethod: string | null },
  version: number,
): Promise<InvoiceEntity | null> {
  const [result] = await this.db
    .update(invoices)
    .set({
      paymentStatus: data.paymentStatus as 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED',
      paymentMethod: data.paymentMethod as 'CASH' | 'BANK_TRANSFER' | 'CREDIT' | 'PROMPTPAY' | null,
      version: version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, id), eq(invoices.version, version)));

  if (result.affectedRows === 0) return null;
  return this.findById(id);
}
```

---

## 6. Zod Schemas (Validation)

```ts
// backend/src/modules/invoice/schema.ts

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid().optional().nullable(),
  quotationId: z.string().uuid().optional().nullable(),
  discount: z.number().min(0).optional().default(0),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED']),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT', 'PROMPTPAY']).optional().nullable(),
  version: z.number().int().min(1),
});

export const filterInvoiceSchema = z.object({
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

export interface InvoiceResponse {
  id: string;
  customerId: string;
  customerName?: string;
  invoiceNumber: string;
  totalAmount: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentStatus: string;
  paymentMethod: string | null;
  createdBy: string;
  version: number;
  createdAt: string;
  items?: InvoiceItemResponse[];
}

export interface InvoiceItemResponse {
  id: string;
  invoiceId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
```

---

## 7. Enum Values

### payment_status
| Value | Description | Next States |
|-------|-------------|-------------|
| `PENDING` | รอชำระเงิน | PAID, PARTIAL, REFUNDED |
| `PAID` | ชำระแล้ว | REFUNDED |
| `PARTIAL` | ชำระบางส่วน | PAID, REFUNDED |
| `REFUNDED` | คืนเงิน | — (terminal) |

### payment_method
| Value | Description |
|-------|-------------|
| `CASH` | เงินสด |
| `BANK_TRANSFER` | โอนเงิน |
| `CREDIT` | เครดิต |
| `PROMPTPAY` | พร้อมเพย์ |

### quotation_status
| Value | Description |
|-------|-------------|
| `DRAFT` | ร่าง |
| `SENT` | ส่งถึงลูกค้าแล้ว |
| `ACCEPTED` | ลูกค้าตอบรับ |
| `REJECTED` | ลูกค้าปฏิเสธ |
| `EXPIRED` | หมดอายุ |
