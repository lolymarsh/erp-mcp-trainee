---
trigger: always_on
description: |
  Versus Thailand ERP — OpenCode AI Coding Standards (Node.js + TypeScript)
  Based on plan.md + ARCHITECTURE.md patterns
---

# Versus Thailand ERP — OpenCode AI Standards

## CRITICAL Rules

### 1. Error Handling

**MUST use custom error classes from `shared/errors/AppError.ts`:**

```ts
// ✅ GOOD — service.ts
import { NotFoundError, ConflictError, AppError } from '../../shared/errors/AppError';

async getCustomer(id: string): Promise<CustomerEntity> {
  const customer = await this.repo.findById(id);
  if (!customer) throw new NotFoundError('Customer not found');
  return customer;
}

async updateCustomer(id: string, data: Partial<CustomerEntity>, version: number): Promise<CustomerEntity> {
  const updated = await this.repo.update(id, data, version);
  if (!updated) throw new ConflictError('Version mismatch', { currentVersion: version });
  return updated;
}
```

Error types:
- `NotFoundError('msg')` → 404
- `ConflictError('msg', data?)` → 409
- `UnauthorizedError('msg')` → 401
- `ForbiddenError('msg')` → 403
- `BadRequestError('msg')` → 400
- `AppError(statusCode, 'msg')` → custom

### 2. Handler Pattern

```ts
// ✅ Standard handler flow: validate → call service → return response
class CustomerHandler {
  constructor(private svc: ICustomerService) {}

  filterCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = filterRequestSchema.parse(req.body);
      const { data, total } = await this.svc.filterCustomers(filters);
      const pagination = calculatePagination(filters.page, filters.pageSize, total);
      return sendSuccess(res, 200, 'success', { data, pagination });
    } catch (err) {
      if (err instanceof AppError) return sendError(res, err.statusCode, err.message);
      logger.error('filterCustomers failed', err);
      return sendError(res, 500, 'Internal server error');
    }
  };
}
```

### 3. Service Layer Pattern

```ts
// ✅ Interface + Implementation — same as Go
export interface ICustomerService {
  filterCustomers(filters: FilterRequest): Promise<{ data: CustomerEntity[]; total: number }>;
  getById(id: string): Promise<CustomerEntity>;
  create(input: CreateCustomerInput): Promise<CustomerEntity>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity>;
}

export class CustomerService implements ICustomerService {
  constructor(private repo: ICustomerRepository) {}

  async filterCustomers(filters: FilterRequest): Promise<{ data: CustomerEntity[]; total: number }> {
    const [data, total] = await Promise.all([
      this.repo.findByFilters(filters),
      this.repo.countByFilters(filters),
    ]);
    return { data, total };
  }
}
```

### 4. Repository Layer Pattern

```ts
// ✅ Interface + Implementation
export interface ICustomerRepository {
  findById(id: string): Promise<CustomerEntity | null>;
  findByFilters(filters: FilterRequest): Promise<CustomerEntity[]>;
  countByFilters(filters: FilterRequest): Promise<number>;
  create(data: CreateCustomerData): Promise<CustomerEntity>;
  update(id: string, data: Partial<CustomerEntity>, version: number): Promise<CustomerEntity | null>;
  softDelete(id: string, version: number): Promise<boolean>;
}

export class CustomerRepository implements ICustomerRepository {
  async update(id: string, data: Partial<CustomerEntity>, version: number): Promise<CustomerEntity | null> {
    const [updated] = await db
      .update(customers)
      .set({ ...data, version: version + 1, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .where(eq(customers.version, version)); // ← optimistic lock
    return updated ?? null;
  }
}
```

### 5. Transaction Pattern

```ts
// ✅ Multi-table write — MUST use db.transaction()
async createInvoice(data: CreateInvoiceData): Promise<InvoiceEntity> {
  return await db.transaction(async (tx) => {
    const [inv] = await tx.insert(invoices).values(data.invoice).$returningId();

    for (const item of data.items) {
      await tx.insert(invoiceItems).values({ ...item, invoiceId: inv.id });

      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .for('update'); // ← lock row

      if (product.currentStock < item.quantity) {
        throw new BadRequestError(`Stock insufficient for ${item.productId}`);
      }

      await tx
        .update(products)
        .set({ currentStock: product.currentStock - item.quantity })
        .where(eq(products.id, item.productId));

      await tx.insert(stockMovements).values({
        productId: item.productId, type: 'OUT', quantity: item.quantity,
        referenceType: 'invoice', referenceId: inv.id,
      });
    }
    return inv as InvoiceEntity;
  });
}
```

### 6. Pagination Pattern

```ts
// ✅ Every list endpoint MUST use POST /filter with pagination
// Body: { page: 1, page_size: 20, sort_name: ..., sort_by: ..., filters: [...] }
// Response: { code: 200, data: [...], pagination: { page, pageSize, totalData, totalPage, hasNextPage, hasPreviousPage } }
```

### 7. Frontend MVC Pattern

```ts
// model.ts    → NO React imports, API calls only
// view.tsx     → Props only, NO API calls, NO useState for data
// controller.ts → useXxx() hook: state + logic + calls model
```

### 8. TypeScript Rules

- ❌ `any` — use `unknown` + type guard
- ❌ `as` type assertion — use Zod `.parse()`
- ✅ every function has return type
- ✅ entity → `interface`, schema → `z.object()`

### 9. Dependency Injection — DB ต้อง Inject

```ts
// ✅ Repo receives db via constructor (เหมือน Go)
export class CustomerRepository implements ICustomerRepository {
  constructor(private db: MySql2Database<Record<string, never>>) {}
}

// Wire in router.ts
const repo = new CustomerRepository(db);  // db from config
```

**ห้าม**: `import { db } from '../../config/database'` ใน repo — test ไม่ได้

### 10. Connection Pool — Env Vars

ห้าม hardcode connection string — ต้องอ่านจาก `process.env`:
```bash
MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
MYSQL_CONN_MAX_IDLE_TIME, MYSQL_CONNECTION_MAX_LIFE_TIME
MYSQL_MAX_IDLE_CONNS, MYSQL_MAX_OPEN_CONNS
```

### 11. Lint + TypeCheck

```bash
npm run lint        # ESLint (= golangci-lint)
npm run typecheck   # tsc --noEmit (= go vet)
```

Rules: max-lines-per-function=40, complexity=15, max-depth=5, no-any, no-floating-promises

### 12. Dependencies — Latest Stable

เมื่อ setup project หรือเพิ่ม dependency — ใช้ `@latest` เสมอ:
```bash
npm install express@latest drizzle-orm@latest zod@latest
npm install -D typescript@latest eslint@latest drizzle-kit@latest
```

ก่อน commit: `npm outdated` → `npm update` → ทดสอบ

### 13. Middleware Strategy

```
App Server:         CORS allow all + Auth + Validator
DevOps (Nginx):     Rate Limiting, CORS restriction, Security Headers
```

rateLimit.ts เก็บไว้เป็น dev fallback — comment บอกว่าย้ายไป Nginx ใน production
