---
trigger: always_on
---

# Service Layer Patterns

## 1. Interface + Implementation

```ts
export interface ICustomerService {
  filterCustomers(filters: FilterRequest): Promise<{ data: CustomerEntity[]; total: number }>;
  getById(id: string): Promise<CustomerEntity>;
  create(input: CreateCustomerInput): Promise<CustomerEntity>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity>;
  softDelete(id: string, version: number): Promise<void>;
}

export class CustomerService implements ICustomerService {
  constructor(private repo: ICustomerRepository) {}

  // ... methods
}
```

## 2. CRUD Pattern

```ts
async getById(id: string): Promise<CustomerEntity> {
  const customer = await this.repo.findById(id);
  if (!customer) throw new NotFoundError('Customer not found');
  return customer;
}

async create(input: CreateCustomerInput): Promise<CustomerEntity> {
  const existing = await this.repo.findByPhone(input.phone);
  if (existing) throw new ConflictError('Customer with this phone already exists');
  return this.repo.create(input);
}

async update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity> {
  const existing = await this.repo.findById(id);
  if (!existing) throw new NotFoundError('Customer not found');

  const updated = await this.repo.update(id, input, input.version);
  if (!updated) throw new ConflictError('Version mismatch');

  return updated;
}
```

## 3. Filter with Pagination

```ts
async filterCustomers(filters: FilterRequest): Promise<{ data: CustomerEntity[]; total: number }> {
  // Count and fetch in parallel — same as Go's pattern
  const [data, total] = await Promise.all([
    this.repo.findByFilters(filters),
    this.repo.countByFilters(filters),
  ]);
  return { data, total };
}
```

## 4. Transaction Pattern (service starts, repo executes)

```ts
// Service: validate → start transaction → pass tx to repo
async createInvoice(input: CreateInvoiceInput): Promise<InvoiceEntity> {
  const customer = await this.customerSvc.getById(input.customerId);

  for (const item of input.items) {
    const stock = await this.inventoryRepo.getStock(item.productId);
    if (stock < item.quantity) {
      throw new BadRequestError(`Insufficient stock for product ${item.productId}`);
    }
  }

  // Service declares transaction → passes tx to repo
  return this.db.transaction(async (tx) => {
    return this.repo.createInvoice(input, tx);
  });
}
```

```ts
// Repo: receives optional tx, uses db if not passed
async createInvoice(data: CreateInvoiceData, tx?: Tx): Promise<InvoiceEntity> {
  const db = tx ?? this.db;
  // ... use db (transaction-aware or standalone)
}
```

## 5. Private Helpers

```ts
// Decompose long methods into private helpers (max 50 lines/public method)
private applyCustomerChanges(existing: CustomerEntity, input: UpdateCustomerInput): Partial<CustomerEntity> {
  const changes: Partial<CustomerEntity> = {};

  if (input.firstName !== undefined) changes.firstName = input.firstName;
  if (input.lastName !== undefined) changes.lastName = input.lastName;
  if (input.phone !== undefined) changes.phone = input.phone;
  if (input.address !== undefined) changes.address = input.address;

  return changes;
}
```

## 6. Service Rules

- ✅ Public functions: map errors to AppError classes
- ✅ Guard clauses first — check existence, permissions early
- ✅ Deep copy before mutation (prevent side effects on input objects)
- ✅ Max 50 lines per public function
- ❌ No direct DB queries in service — go through repo
- ✅ Service may inject db for `db.transaction()` only (no query builders: select/insert/update/delete)
- ❌ No `console.log` — use `logger`

## 7. Service MUST NOT access DB directly

**Service ห้ามเข้าถึง Database โดยตรง** — ต้องผ่าน Repository เท่านั้น

```ts
// ❌ WRONG — inject db เข้า service
import type { MySql2Database } from 'drizzle-orm/mysql2';

export class CustomerService implements ICustomerService {
  constructor(
    private repo: ICustomerRepository,
    private db: MySql2Database<Record<string, never>>, // ← ❌ ห้าม
  ) {}
}

// ❌ WRONG — import drizzle helpers ใน service
import { eq, and, isNull } from 'drizzle-orm'; // ← ❌ ห้าม

// ❌ WRONG — import schema tables จาก module อื่น
import { invoices } from '../invoice/entity'; // ← ❌ ห้าม
```

```ts
// ✅ CORRECT — inject repo interfaces
export class InvoiceService implements IInvoiceService {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private customerSvc: ICustomerService,      // ✅ inject service interface
    private inventoryRepo: IInventoryRepository, // ✅ inject repo interface
  ) {}
}
```

### Exception: Chat Module

Chat module สามารถใช้ raw `mysql2` Pool ได้ — เพราะต้อง execute AI-generated SQL:
```ts
import type { Pool } from 'mysql2/promise';

export class ChatService implements IChatService {
  constructor(
    private pool: Pool,  // ✅ exception: raw mysql2 pool for AI SQL
  ) {}
}
```

**สรุปต้องห้าม:**
- ❌ Inject `MySql2Database` เข้า service constructor
- ❌ Import `eq`, `and`, `isNull` จาก `drizzle-orm` ใน service
- ❌ Import schema tables จาก module อื่น
- ✅ Cross-module → inject repo interface
- ✅ Chat module exception: raw mysql2 Pool
