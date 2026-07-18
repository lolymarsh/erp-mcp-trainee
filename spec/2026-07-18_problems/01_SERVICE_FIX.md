# Phase 01 — Backend Service Layer Refactor

> **Priority**: 🔴 P0 — ห้ามข้าม (ทุกอย่างขึ้นกับ phase นี้)
> **Estimate**: 1.25 days
> **Depends on**: Nothing (start here)

---

## Problem Summary

`InvoiceService` และ `JobService` รับ `db: MySql2Database` ใน constructor และเรียก `this.db.select()` โดยตรง — ละเมิด `ServicePatterns.md` Rule 7: "No direct DB access in service"

**Violation locations:**
- `backend/src/modules/invoice/service.ts:75-104` — `this.db.select().from(customers)` + `this.db.select().from(products)`
- `backend/src/modules/job/service.ts:82-96` — `this.db.select().from(customers)` + `this.db.select().from(vehicles)`
- Services import `eq`, `and`, `isNull` from `drizzle-orm` — ORM leak
- Services import `customers`, `products`, `vehicles` from `../../config/schema` — tight coupling

**Modules affected:** `invoice`, `job` (2 of 7)
**Modules clean:** `user`, `customer`, `inventory`, `dashboard`, `chat` (5 of 7 — chat is special case)

---

## Task 1.1 — Fix InvoiceService (0.5 day)

### Before
```ts
// invoice/service.ts
export class InvoiceService implements IInvoiceService {
  constructor(
    private repo: IInvoiceRepository,
    private db: MySql2Database,     // ❌ remove
    private redis: Redis,
  ) {}

  async create(input, userId) {
    const [customer] = await this.db           // ❌ direct DB
      .select().from(customers)
      .where(...).limit(1);
    // ...
    const productRows = await this.db          // ❌ direct DB
      .select().from(products)
      .where(...);
  }
}
```

### After
```ts
// invoice/service.ts
export class InvoiceService implements IInvoiceService {
  constructor(
    private repo: IInvoiceRepository,
    private customerRepo: ICustomerRepository,  // ✅ inject repo
    private inventoryRepo: IInventoryRepository, // ✅ inject repo
    private redis: Redis,
  ) {}

  async create(input, userId) {
    const customer = await this.customerRepo.findById(input.customerId);  // ✅ via repo
    if (!customer) throw new BadRequestError("Customer not found");

    const products = await this.inventoryRepo.findByIds(
      input.items.map(i => i.productId)                     // ✅ via repo
    );
    // validate stock...
    // delegate to repo.createInvoice (transaction inside repo) ✅
  }
}
```

### Required additions to other repos
- `ICustomerRepository.findById(id)` — มีอยู่แล้ว ✅
- `IInventoryRepository.findByIds(ids[])` — **ต้องเพิ่ม** (batch lookup หลาย product)

```ts
// inventory/repo.ts — เพิ่ม method
async findByIds(ids: string[]): Promise<ProductEntity[]> {
  return this.db
    .select()
    .from(products)
    .where(and(inArray(products.id, ids), isNull(products.deletedAt)));
}
```

---

## Task 1.2 — Fix JobService (0.5 day)

### Before
```ts
// job/service.ts
export class JobService implements IJobService {
  constructor(
    private repo: IJobRepository,
    private db: MySql2Database,     // ❌ remove
    private redis: Redis,
  ) {}

  async create(input) {
    const [customer] = await this.db       // ❌
      .select().from(customers).where(...);
    const [vehicle] = await this.db        // ❌
      .select().from(vehicles).where(...);
  }
}
```

### After
```ts
export class JobService implements IJobService {
  constructor(
    private repo: IJobRepository,
    private customerRepo: ICustomerRepository,  // ✅
    private vehicleRepo: IVehicleRepository,    // ✅ new interface
    private redis: Redis,
  ) {}

  async create(input) {
    const customer = await this.customerRepo.findById(input.customerId);  // ✅
    if (!customer) throw new BadRequestError("Customer not found");

    const vehicle = await this.vehicleRepo.findById(input.vehicleId);  // ✅
    if (!vehicle) throw new BadRequestError("Vehicle not found");
  }
}
```

### Required: `IVehicleRepository` interface
- ปัจจุบัน vehicle queries ฝังอยู่ใน `CustomerRepository`
- ต้องแยกเป็น `IVehicleRepository` หรือเพิ่ม `findVehicleById` ใน `ICustomerRepository`

```ts
// customer/repo.ts — เพิ่ม method
async findVehicleById(id: string): Promise<VehicleEntity | null> {
  const result = await this.db
    .select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result[0] ?? null;
}
```

---

## Task 1.3 — Verify Transaction Pattern (0.25 day)

ตรวจว่า transaction ยังทำงานถูกต้องหลัง refactor:

- ✅ `InvoiceRepository.createInvoice()` — wraps `db.transaction()` กับ 4 tables + `FOR UPDATE` — ไม่ต้องแก้
- ✅ `InventoryRepository.adjustStock()` — wraps `db.transaction()` + `FOR UPDATE` — ไม่ต้องแก้
- ✅ `JobRepository.updateStatus()` — wraps `db.transaction()` + version check — ไม่ต้องแก้

Service ไม่ต้องจัดการ transaction — แค่ validate pre-conditions แล้ว delegate ให้ repo

---

## Phase 01 Checklist

- [ ] `InvoiceService` — remove `db` parameter, inject `ICustomerRepository` + `IInventoryRepository`
- [ ] `InvoiceService` — replace `this.db.select()` with `this.customerRepo.findById()` + `this.inventoryRepo.findByIds()`
- [ ] `InvoiceService` — remove `drizzle-orm` imports (`eq`, `and`, `isNull`)
- [ ] `InvoiceService` — remove schema imports (`customers`, `products`)
- [ ] `IInventoryRepository` — add `findByIds(ids[])` method
- [ ] `JobService` — remove `db` parameter, inject `ICustomerRepository`
- [ ] `JobService` — add vehicle validation via repo (add `findVehicleById` or new `IVehicleRepository`)
- [ ] `JobService` — remove `drizzle-orm` + schema imports
- [ ] All DI wiring in `route.ts` updated
- [ ] Run `npm run typecheck` — pass
- [ ] Run `npm test` — all existing tests pass
- [ ] Run `npm run lint` — no new errors
