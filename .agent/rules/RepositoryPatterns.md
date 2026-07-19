---
trigger: always_on
---

# Repository Layer Patterns

## 0. Dependency Injection — CRITICAL

**ห้าม import `db` global ใน repo — ต้อง inject ผ่าน constructor** (เหมือน Go `NewRepository(db *bun.DB)`)

```ts
// ✅ CORRECT — inject db
import type { MySql2Database } from 'drizzle-orm/mysql2';

export class CustomerRepository implements ICustomerRepository {
  constructor(private db: MySql2Database<Record<string, never>>) {}
  // ใช้ this.db.select()...
}

// ❌ WRONG — global import = test ไม่ได้
import { db } from '../../config/database';
export class CustomerRepository {
  async findById(id: string) {
    return db.select()...  // ← global = mock ไม่ได้
  }
}
```

**Wire in router.ts** (เหมือน `internal/router/router.go`):
```ts
import { db } from './config/database';
const repo = new CustomerRepository(db);       // inject db
const svc = new CustomerService(repo);
const handler = new CustomerHandler(svc);
```

## 1. Interface Definition

```ts
export interface ICustomerRepository {
  // Single entity
  findById(id: string): Promise<CustomerEntity | null>;
  findByPhone(phone: string): Promise<CustomerEntity | null>;

  // Filter + Pagination
  findByFilters(filters: FilterRequest): Promise<CustomerEntity[]>;
  countByFilters(filters: FilterRequest): Promise<number>;

  // Mutations
  create(data: CreateCustomerData): Promise<CustomerEntity>;
  update(id: string, data: Partial<CustomerEntity>, version: number): Promise<CustomerEntity | null>;
  softDelete(id: string, version: number): Promise<boolean>;
}
```

## 2. Find by ID

```ts
async findById(id: string): Promise<CustomerEntity | null> {
  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  return result[0] ?? null;
}
```

## 3. Filter with Drizzle

```ts
async findByFilters(filters: FilterRequest): Promise<CustomerEntity[]> {
  let query = db.select().from(customers);

  for (const filter of filters.filters ?? []) {
    switch (filter.field) {
      case 'search':
        query = query.where(
          or(
            like(customers.firstName, `%${filter.value}%`),
            like(customers.lastName, `%${filter.value}%`),
            like(customers.phone, `%${filter.value}%`),
            like(customers.licensePlate, `%${filter.value}%`),
          )
        );
        break;
      case 'is_active':
        query = query.where(eq(customers.isActive, filter.value === 'true'));
        break;
    }
  }

  // Pagination
  const offset = (filters.page - 1) * filters.pageSize;
  query = query.limit(filters.pageSize).offset(offset);

  // Sorting
  if (filters.sortName && filters.sortBy) {
    const column = customers[filters.sortName as keyof typeof customers];
    query = query.orderBy(filters.sortBy === 'desc' ? desc(column) : asc(column));
  } else {
    query = query.orderBy(desc(customers.createdAt));
  }

  return query;
}

async countByFilters(filters: FilterRequest): Promise<number> {
  // Same filter logic without pagination
  let query = db.select({ count: count() }).from(customers);
  // ... apply same filters ...
  const result = await query;
  return result[0]?.count ?? 0;
}
```

## 4. Create

```ts
async create(data: CreateCustomerData): Promise<CustomerEntity> {
  const [customer] = await db
    .insert(customers)
    .values({
      ...data,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();
  return customer as CustomerEntity;
}
```

## 5. Update with Optimistic Locking

```ts
async update(id: string, data: Partial<CustomerEntity>, version: number): Promise<CustomerEntity | null> {
  const [updated] = await db
    .update(customers)
    .set({
      ...data,
      version: version + 1,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .where(eq(customers.version, version))  // ← optimistic lock check
    .$returningId();

  return updated ?? null;  // null = version mismatch or not found
}
```

## 6. Soft Delete

```ts
async softDelete(id: string, version: number): Promise<boolean> {
  const result = await db
    .update(customers)
    .set({
      deletedAt: new Date(),
      version: version + 1,
    })
    .where(eq(customers.id, id))
    .where(eq(customers.version, version));

  return result.rowsAffected > 0;
}
```

## 7. Transaction (service starts, repo receives)

```ts
// Repo: accept optional tx, use db as fallback
import type { Tx } from "../../shared/transaction";

async createInvoice(data: CreateInvoiceData, tx?: Tx): Promise<InvoiceWithItemsResult> {
  const db = tx ?? this.db;
  // All queries use `db` — transaction-safe when tx is passed
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, item.productId))
    .for("update");
  // ...
}

// Service: start transaction, pass tx to repo
async create(input: CreateInvoiceInput, userId: string): Promise<InvoiceWithItemsResponse> {
  return this.db.transaction(async (tx) => {
    return this.repo.createInvoice(data, tx);
  });
}
```

## 8. MongoDB Repository (Chat History)

```ts
// modules/chat/repo_mongo.ts
import { ChatMessage } from './entity';

export class ChatMongoRepository {
  private collection;

  constructor() {
    this.collection = mongoDb.collection('chat_messages');
  }

  async save(message: ChatMessage): Promise<void> {
    await this.collection.insertOne({
      ...message,
      createdAt: new Date(),
    });
  }

  async getHistory(sessionId: string, limit = 50): Promise<ChatMessage[]> {
    return this.collection
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray() as unknown as ChatMessage[];
  }
}
```

## 9. Repository Rules

- ✅ Interface defines contract — service depends on interface
- ✅ Update MUST use optimistic locking (`WHERE version = ?`)
- ✅ Multi-table writes MUST use `db.transaction()`
- ✅ Read-before-write in transaction MUST use `.for('update')`
- ✅ Return `null` for not found — let service throw AppError
- ✅ Soft delete only — no hard delete
- ❌ No business logic in repo — just data access

## 10. Cross-Module Repository Queries

เมื่อ repo ต้อง query ตารางจาก module อื่น (เช่น InventoryRepo ต้องอ่าน invoice items) — มี 2 options:

### Option A: Service injects other repo interfaces (✅ preferred)

```ts
// Service layer — inject ทั้งสอง repo
export class InvoiceService implements IInvoiceService {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private inventoryRepo: IInventoryRepository,  // ✅ inject repo ของ module อื่น
  ) {}

  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceEntity> {
    // validate stock ผ่าน inventoryRepo
    for (const item of input.items) {
      const stock = await this.inventoryRepo.getStock(item.productId);
      if (stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${item.productId}`);
      }
    }
    return this.invoiceRepo.createInvoice(input);
  }
}
```

### Option B: Add cross-table methods to repo interface

เพิ่ม method ใน repo interface สำหรับ query ที่ต้อง join ข้าม module:

```ts
export interface IInvoiceRepository {
  // ... methods ปกติ

  // ✅ cross-table method — repo จัดการ join เอง
  findWithCustomerDetails(id: string): Promise<InvoiceWithCustomer>;
  getMonthlySales(year: number): Promise<MonthlySales[]>;
}
```

**ข้อควรจำ:**
- Option A: Service orchestrate repos → ดีที่สุดสำหรับ business logic ที่ต้อง validate หรือ transform ข้อมูลก่อน
- Option B: Repo จัดการ cross-table query → ใช้เมื่อต้องการ aggregate หรือ report ที่ซับซ้อน
- ❌ ห้าม inject repo เข้า repo อีกตัว — inject ที่ service layer เท่านั้น
