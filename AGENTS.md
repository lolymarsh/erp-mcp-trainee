# AGENTS.md — Versus Thailand ERP Rules

> **สำหรับ AI (Claude/OpenCode)**: ทุกครั้งที่ implement โปรเจกต์นี้ ห้ามละเมิดกฎด้านล่าง

---

## Project Identity

| Field | Value |
|-------|-------|
| **Project** | Versus Thailand ERP (ติดตั้งแก๊สรถยนต์) |
| **Type** | Study/Learning — ไม่มี Deploy จริง |
| **Repo** | `/Users/lolymarsh/Desktop/versus_thailand_work/erp-mcp-trainee` |
| **VCS** | `jj` (Jujutsu) — NOT `git` |

---

## 1. Tech Stack (ห้ามเปลี่ยนเอง)

```
Frontend:  React 19 + Vite + TypeScript (strict)
           React Router v7, shadcn/ui + Tailwind CSS v4
           Lucide React (icons), Sonner (toasts)
           Zustand (global state), Recharts (charts)
           Zod (validation), Axios (HTTP)

Backend:   Node.js 22 + Express 5 + TypeScript (strict)
           Drizzle ORM (MySQL), Mongoose (MongoDB)
           Zod (validation), bcrypt (password), jsonwebtoken
           Jest + Supertest + Testcontainers (testing)
           RabbitMQ (amqplib), Redis (ioredis)

Infra:     Docker Compose — MySQL 8.4, MongoDB 7, Redis 7, RabbitMQ 3.13
           docker compose up -d  (start all)
           docker compose down    (stop all)
```

## 2. Architecture Pattern (ห้ามเปลี่ยน)

```
Backend:  Go-style Domain Modules
          backend/src/modules/{domain}/
            entity.ts    ← DB model interface
            schema.ts    ← Zod validation + DTOs
            handler.ts   ← Express handler class
            service.ts   ← Business logic (interface + impl)
            repo.ts      ← DB queries (interface + impl)
            route.ts     ← Router registration function
            {domain}.test.ts

Frontend: React MVC
          frontend/src/modules/{domain}/
            model.ts       ← API calls + types (NO React import)
            view.tsx        ← UI component (props only, NO API calls)
            controller.ts   ← useXxx() custom hook (state + logic)
```

## 3. Module List (What to Build)

| Module | Backend Path | Frontend Path | Phase |
|--------|-------------|---------------|-------|
| Auth/User | `modules/user/` | `modules/auth/` | 1 |
| Customers | `modules/customer/` | `modules/customer/` | 1 |
| Inventory | `modules/inventory/` | `modules/inventory/` | 1 |
| Invoices | `modules/invoice/` | `modules/invoice/` | 1 |
| Jobs | `modules/job/` | `modules/job/` | 1 |
| AI Chat | `modules/chat/` | `modules/chat/` | 1 |
| Dashboard | `modules/dashboard/` | `modules/dashboard/` | 1 |

## 4. Coding Rules — CRITICAL (ห้ามละเมิดเด็ดขาด)

### R1: Pagination — ทุก List Endpoint

```
✅ POST /api/customers/filter
   Body: { "page": 1, "page_size": 20, "sort_name": "created_at", "sort_by": "desc", "filters": [...] }
   Response: { "code": 200, "data": [...], "pagination": { "page":1, "page_size":20, "total_data":42, "total_page":3, "has_next_page":true, "has_previous_page":false } }

❌ GET /api/customers  (no pagination)
❌ return { data: [...] } without pagination object
```

PaginationResponse must include: `page`, `pageSize`, `totalData`, `totalPage`, `hasNextPage`, `hasPreviousPage`

### R2: Transaction — ทุก Multi-Table Write

เมื่อ API หนึ่งต้องเขียนหลายตาราง (เช่น invoice + items + stock) — **ห้ามใช้ query แยก** ต้อง wrap ด้วย `db.transaction()`:

```ts
await db.transaction(async (tx) => {
  const [inv] = await tx.insert(invoices).values(...);
  await tx.insert(invoiceItems).values(...);
  await tx.update(products).set(...).where(...);
  // ถ้า throw → rollback ทั้งหมด
});
```

ต้องมี `FOR UPDATE` เมื่อ read-before-write ใน transaction:
```ts
const [row] = await tx.select().from(products).where(eq(...)).for('update');
```

### R3: Version Check — ทุก PATCH / PUT / DELETE

ทุก PATCH/PUT/DELETE schema ต้องมี `version`:
```ts
export const updateCustomerSchema = z.object({
  firstName: z.string().optional(),
  phone: z.string().optional(),
  version: z.number().int().min(1), // ← REQUIRED
});
```

Repo update ต้อง check:
```ts
const [updated] = await db
  .update(customers)
  .set({ ...data, version: version + 1 })
  .where(eq(customers.id, id))
  .where(eq(customers.version, version));
if (!updated) throw new ConflictError('Version mismatch');
```

Version mismatch → HTTP 409 Conflict

### R4: Unified Response Format

```ts
// Success
{ "code": 200, "message": "success", "data": { ... } }
// List with pagination
{ "code": 200, "message": "success", "data": [...], "pagination": { ... } }
// Error
{ "code": 400, "message": "error description" }
```

### R5: TypeScript Strict

- ห้ามใช้ `any` — ใช้ `unknown` + type guard
- ห้ามใช้ `as` type assertion — ใช้ Zod parse + type inference
- ทุกฟังก์ชันต้องมี return type
- Entity ใช้ `interface`, Schema ใช้ `z.object()`, Handler/service ใช้ `class`

### R6: Error Handling

```ts
// Backend — custom error classes
throw new NotFoundError('Customer not found');
throw new ConflictError('Version mismatch', { currentVersion: 5 });
throw new UnauthorizedError('Invalid credentials');

// Handler — try/catch every async (public = PascalCase)
try {
  const result = await this.svc.DoSomething(req.body);
  return sendSuccess(res, 200, 'success', { data: result });
} catch (err) {
  if (err instanceof AppError) return sendError(res, err.statusCode, err.message);
  logger.error('Handler error', err);
  return sendError(res, 500, 'Internal server error');
}
```

### R7: Frontend MVC Separation

```
model.ts        → NO React imports, NO JSX, pure TS + API calls
view.tsx        → NO API calls, NO useState for business data, props only
controller.ts   → useXxx() hook: state, logic, calls model, returns data for view
```

## 5. File Naming

```
✓ entity.ts    ✗ CustomerEntity.ts    (module folder = namespace)
✓ schema.ts    ✗ customer.schema.ts   (context from folder)
✓ handler.ts   ✗ customerHandler.ts   (context from folder)
✓ service.ts   ✗ CustomerService.ts   (context from folder)
✓ repo.ts      ✗ customerRepo.ts      (context from folder)
✓ route.ts     ✗ customerRoutes.ts    (context from folder)
✓ model.ts     ✗ CustomerModel.ts     (frontend — same rule)
✓ view.tsx     ✗ CustomerView.tsx     (frontend — same rule)
✓ controller.ts ✗ useCustomer.ts      (frontend — same rule)
```

### Function Naming — Go-style

ใช้ Go convention: **Public = PascalCase (ขึ้นต้นใหญ่), Private = camelCase (ขึ้นต้นเล็ก)**

```
Backend:
  ✅ Interface methods     → PascalCase    → GetCustomer, CreateInvoice
  ✅ Public class methods  → PascalCase    → GetById, UpdateCustomer
  ✅ Private helpers       → camelCase     → toResponse, buildFilter
  ✅ Module-scoped fns     → camelCase     → formatError, extractId

Frontend:
  ✅ React hooks          → useXxx        (React rules-of-hooks)
  ✅ Model API methods    → PascalCase    → GetAll, Create
  ✅ Helper functions     → camelCase     → formatDate, parseInput
  ✅ Component functions  → PascalCase    → CustomerListView
```

```ts
// ✅ Public = PascalCase
export class CustomerService implements ICustomerService {
  async GetById(id: string): Promise<CustomerEntity | null> {
    const customer = await this.repo.FindById(id);
    return customer;
  }

  // Private = camelCase
  private toResponse(entity: CustomerEntity): CustomerResponse {
    return { id: entity.id, name: entity.displayName };
  }
}
```

## 6. Testing

```
Backend:
  npm test                 → Jest unit + integration
  npm run test:integration → Supertest + Testcontainers (real MySQL in Docker)

Frontend:
  npm test       → Vitest + React Testing Library
  npm run test:e2e → Playwright

Rule: Every handler must have at least 1 integration test. Every service must have unit tests.
```

## 7. Spec Files (Read Before Coding)

```
spec/plan.md          — Full project plan, modules, endpoints, roadmap
spec/ARCHITECTURE.md  — Architecture, Go→TS mapping, templates, coding rules
spec/2026-07-18_core/ — Phase-by-phase implementation tasks (01-09)
```

**Always read `spec/ARCHITECTURE.md` before starting any module** — all templates are there.

**Read the relevant `spec/core/XX_NAME.md` for the phase you're implementing.**

## 8. Implementation Order (Core Track)

```
1. Docker compose up -d              (infra running)
2. Database schema + migrations      (MySQL + MongoDB indexes)
3. Seed data                         (test customers, products)
4. Backend shared/                   (middleware, errors, response, pagination)
5. Backend modules/user/             (auth first — other modules depend on it)
6. Backend modules/customer/         (CRM)
7. Backend modules/inventory/        (Products + Stock)
8. Backend modules/invoice/          (Sales)
9. Backend modules/job/              (Installation)
10. Backend modules/chat/            (AI — depends on all modules for schema context)
11. Backend modules/dashboard/       (Summary — depends on all modules)
12. Frontend setup                   (Vite + Router + MUI + Tailwind config)
13. Frontend modules/auth/           (Login → token)
14. Frontend modules/*               (follow backend order: customer → inventory → ...)
15. E2E tests                        (Playwright)
```

> See `spec/2026-07-18_core/` for detailed tasks per phase. New features → create `spec/{YYYY-MM-DD}_{feature}/` folder.

## 9. Database Connection Strings

```
MySQL:    mysql://versus:versus_dev@localhost:3306/versus_erp
MongoDB:  mongodb://versus:versus_dev@localhost:27017/versus_erp?authSource=admin
Redis:    redis://:versus_dev@localhost:6379
RabbitMQ: amqp://versus:versus_dev@localhost:5672
```

## 10. Dependency Injection — DB ต้อง Inject ผ่าน Constructor

```ts
// ✅ repo.ts — inject db via constructor (เหมือน Go: NewRepository(db *bun.DB))
export class UserRepository implements IUserRepository {
  constructor(private db: MySql2Database<Record<string, never>>) {}
  // this.db.select()...  ← ใช้ this.db ห้าม import db global
}

// ✅ router.ts — wire manually
const userRepo = new UserRepository(db);
const userSvc = new UserService(userRepo);
const userHandler = new UserHandler(userSvc);

// ❌ ห้าม: import db จาก module level
import { db } from '../../config/database';
// repo ใช้ db.select() โดยตรง = test ไม่ได้ = architecture violation
```

## 11. Linting (เทียบเท่า golangci.yml)

```bash
npm run lint          # ESLint check
npm run typecheck     # tsc --noEmit
```

Config ที่ `eslint.config.mjs`:
- `max-lines-per-function: 40` (≈ funlen: 40)
- `complexity: 15` (≈ gocyclo: 15)
- `max-depth: 5` (≈ nestif: 5)
- `no-else-return` (≈ early-return)
- `@typescript-eslint/no-floating-promises` (≈ errcheck)
- `@typescript-eslint/no-explicit-any` (ห้าม any)
- `no-restricted-syntax` (≈ forbidigo: ห้าม `== ""`)

## 12. Dependencies — Use Latest Stable

เมื่อ implement Phase 01 (project init) หรือเพิ่ม dependency ใหม่:

```bash
# ✅ ติดตั้ง latest stable เสมอ — ใช้ @latest
npm install express@latest cors@latest helmet@latest
npm install drizzle-orm@latest mysql2@latest zod@latest
npm install ioredis@latest amqplib@latest mongoose@latest

# ✅ Dev deps latest
npm install -D typescript@latest tsx@latest jest@latest
npm install -D eslint@latest prettier@latest drizzle-kit@latest

# ❌ ห้าม: ใช้ caret (^) แล้วลืม — npm outdated เช็คก่อน
# ❌ ห้าม: ใช้เวอร์ชั่นเก่าติด project — npm update ทุกครั้งที่ setup
```

ก่อน commit: `npm outdated` → ถ้ามีแพ็กเกจเก่า → `npm update` → ทดสอบว่าไม่พัง → commit

## 13. Middleware Strategy

```
App Server (Express):
  ✅ CORS allow all      (origin: '*')
  ✅ JSON parsing        (Express 5 built-in)
  ✅ JWT Auth            (business logic — อยู่ที่ app)

DevOps (Nginx/Traefik — Phase 09):
  🔒 Rate Limiting       (ย้ายจาก rateLimit.ts → Nginx limit_req_zone)
  🔒 CORS restriction    (filter origins ที่ reverse proxy)
  🔒 Security Headers    (CSP, HSTS, X-Frame-Options)
```

rateLimit.ts เก็บไว้เป็น dev fallback — comment ว่า "production: use Nginx instead"

## 14. Speak Thai

ตอบเป็นภาษาไทย — เพราะ user และ codebase นี้เป็นภาษาไทย
