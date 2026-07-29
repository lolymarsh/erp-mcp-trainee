# Refactor Naming Convention — Go-style Plan

> **Priority**: 🟡 OPTIONAL (cosmetic — no functional impact)
> **Estimate**: 2-3 days full codebase
> **Depends on**: Nothing (can do anytime)

---

## Overview

เปลี่ยน naming convention จาก camelCase ทั่วไปเป็น Go-style:
- **Public/exported** functions/methods → PascalCase (ขึ้นต้นใหญ่)
- **Private/unexported** functions/methods → camelCase (ขึ้นต้นเล็ก)

### Example

```ts
// Before (old)
export class CustomerService {
  async getCustomer(id: string) { ... }           // public
  async filterCustomers(filters: Filter) { ... }  // public
  private toResponse(entity: CustomerEntity) { ... }  // private
}

// After (Go-style)
export class CustomerService {
  async GetCustomer(id: string) { ... }            // public
  async FilterCustomers(filters: Filter) { ... }   // public
  private toResponse(entity: CustomerEntity) { ... }  // private
}
```

---

## Workflow

```
                ┌──────────────────────────────┐
                │  1. Rules + Spec Updated      │
                │  Already done ✓               │
                └──────────┬───────────────────┘
                           ▼
                ┌──────────────────────────────┐
                │  2. ESLint Rule (optional)    │
                │  Add naming-convention rule   │
                └──────────┬───────────────────┘
                           ▼
                ┌──────────────────────────────┐
                │  3. Backend Refactor          │
                │  Per module:                  │
                │  service.ts → handler.ts      │
                │  repo.ts → route.ts           │
                └──────────┬───────────────────┘
                           ▼
                ┌──────────────────────────────┐
                │  4. Frontend Refactor         │
                │  model.ts → controller.ts    │
                └──────────┬───────────────────┘
                           ▼
                ┌──────────────────────────────┐
                │  5. Test Files Update         │
                │  All *.test.ts references    │
                └──────────┬───────────────────┘
                           ▼
                ┌──────────────────────────────┐
                │  6. Verify                    │
                │  npm run lint → 0 errors      │
                │  npm run typecheck → 0 errors │
                │  npm test → all pass          │
                └──────────────────────────────┘
```

---

## Task 1 — Add ESLint Naming Rule (0.5 day)

เพิ่ม `@typescript-eslint/naming-convention` rule ใน `eslint.config.mjs`:

```js
'@typescript-eslint/naming-convention': [
  'warn',
  {
    selector: 'method',
    modifiers: ['public'],
    format: ['PascalCase'],
  },
  {
    selector: 'method',
    modifiers: ['private'],
    format: ['camelCase'],
  },
  {
    selector: 'function',
    format: ['PascalCase', 'camelCase'],
  },
]
```

> **Note**: เปิดเป็น `warn` ก่อน (ไม่ error) — เพื่อไม่ให้ blocking dev workflow

---

## Task 2 — Backend: Module-by-Module Refactor (1.5 days)

### 2.1 Shared Layer (`backend/src/shared/`)

| File | Exported Name → New Name | Notes |
|------|--------------------------|-------|
| `errors/AppError.ts` | Classes are already PascalCase | No change needed (constructors only) |
| `response/handler.ts` | `calculatePagination` → `CalculatePagination` | Also update all imports |
| | `sendSuccess` → `SendSuccess` | |
| | `sendError` → `SendError` | |
| `middleware/auth.ts` | `createAuthMiddleware` → `CreateAuthMiddleware` | Inner `authMiddleware` stays camelCase (local) |
| `middleware/validator.ts` | `validate` → `Validate` | |
| `middleware/auditMeta.ts` | `auditMetaMiddleware` → `AuditMetaMiddleware` | |
| `pagination/helper.ts` | Re-exports from handler.ts | Auto-updates with handler rename |
| `pagination/schema.ts` | No change | Zod schema exports only |
| `mapper/map.ts` | `mapEntity` → `MapEntity` | |
| | `mapEntities` → `MapEntities` | |
| | `pick` → `Pick` | |
| | `omit` → `Omit` | |
| `transaction.ts` | No change | Type export only (`Tx`) |

**Shared test files also need updating:**
- `shared/errors/AppError.test.ts` — test descriptions only (no function names)
- `shared/response/handler.test.ts` — `sendSuccess`/`sendError`/`calculatePagination` calls
- `shared/middleware/auth.test.ts` — `createAuthMiddleware` calls
- `shared/middleware/validator.test.ts` — `validate` calls
- `shared/mapper/map.test.ts` — `mapEntity`/`mapEntities`/`pick`/`omit` calls

### 2.2 Module: User

| File | Public → PascalCase | Private → camelCase (keep) |
|------|---------------------|---------------------------|
| `service.ts` | `login`, `getProfile`, `createUser`, `filter`, `update`, `softDelete`, `deactivate` | `toResponse` ✓ |
| `handler.ts` | `login`, `getProfile`, `createUser`, `filter`, `update`, `softDelete`, `deactivate` | `formatZodError`, `extractId` ✓ |
| `repo.ts` | `findById`, `findByUsername`, `create`, `update`, `findFiltered`, `softDelete`, `findAll` | `buildFilterConditions`, `resolveColumn`, `resolveSort` ✓ |
| `route.ts` | `registerUserRoutes` → `RegisterUserRoutes` | — |
| `schema.ts` | No change (Zod schema names are PascalCase already) | — |
| `entity.ts` | No change (interface) | — |

### 2.3 Module: Customer (same pattern)

| File | Public → PascalCase |
|------|---------------------|
| `service.ts` | `filter`, `getById`, `create`, `update`, `softDelete`, `createVehicle`, `updateVehicle`, `deleteVehicle` |
| `handler.ts` | `filter`, `getById`, `create`, `update`, `softDelete`, `createVehicle`, `updateVehicle`, `deleteVehicle` |
| `repo.ts` | `findById`, `findByPhone`, `create`, `update`, `softDelete`, `findFiltered`, `findAll`, `findVehiclesByCustomerId`, `findVehicleById`, `createVehicle`, `updateVehicle`, `deleteVehicle` |
| `route.ts` | `registerCustomerRoutes` → `RegisterCustomerRoutes` |

### 2.4 Module: Inventory

| File | Public → PascalCase |
|------|---------------------|
| `service.ts` | `filter`, `getById`, `create`, `update`, `softDelete`, `getStock`, `adjustStock` |
| `handler.ts` | `filter`, `getById`, `create`, `update`, `softDelete`, `getStock`, `adjustStock` |
| `repo.ts` | `findById`, `findByFilters`, `countByFilters`, `create`, `update`, `softDelete`, `getStock`, `createMovement` |
| `route.ts` | `registerInventoryRoutes` |

### 2.5 Module: Invoice

| File | Public → PascalCase |
|------|---------------------|
| `service.ts` | `filter`, `getById`, `create`, `update`, `softDelete`, `getInvoiceItems` |
| `handler.ts` | `filter`, `getById`, `create`, `update`, `softDelete`, `getItems` |
| `repo.ts` | `findById`, `create`, `update`, `softDelete`, `findFiltered`, `createItem`, `findItemsByInvoiceId` |
| `route.ts` | `registerInvoiceRoutes` |

### 2.6 Module: Job

| File | Public → PascalCase |
|------|---------------------|
| `service.ts` | `filter`, `getById`, `create`, `update`, `softDelete`, `updateStatus` |
| `handler.ts` | `filter`, `getById`, `create`, `update`, `softDelete`, `updateStatus` |
| `repo.ts` | `findById`, `create`, `update`, `softDelete`, `findFiltered`, `createStatusLog` |
| `route.ts` | `registerJobRoutes` |

### 2.7 Module: Chat

| File | Public → PascalCase |
|------|---------------------|
| `service.ts` | `sendMessage`, `getHistory`, `getSession`, `executeAiQuery` |
| `handler.ts` | `sendMessage`, `getHistory`, `getSession` |
| `repo_mongo.ts` | `save`, `getHistory`, `getSession`, `deleteSession` |
| `route.ts` | `registerChatRoutes` |
| `sanitizer.ts` | Exported functions → PascalCase |
| `formatter.ts` | Exported functions → PascalCase |

### 2.8 Module: Dashboard

| File | Public → PascalCase |
|------|---------------------|
| `service.ts` | `getSummary`, `getSalesChart`, `getTopProducts` |
| `handler.ts` | `getSummary`, `getSalesChart`, `getTopProducts` |
| `repo.ts` | `getTotalSales`, `getCustomerCount`, `getJobStatusCounts`, `getMonthlySales` |
| `route.ts` | `registerDashboardRoutes` |

### 2.9 Module: Audit

| File | Public → PascalCase |
|------|---------------------|
| `service.ts` | `filter`, `insertAuditLog` |
| `handler.ts` | `filter` |
| `repo_mongo.ts` | `insert`, `findFiltered`, `countByFilters` |
| `route.ts` | `registerAuditRoutes` |

### 2.10 Workers

| File | Public → PascalCase |
|------|---------------------|
| `aiWorker.ts` | `processMessage`, `handleQueue` |
| `auditWorker.ts` | `processAuditLog`, `handleQueue` |

### 2.11 Router & App

| File | Public → PascalCase |
|------|---------------------|
| `router.ts` | `setupRoutes` → `SetupRoutes` |
| `app.ts` | `start` → `Start` |

---

## Task 3 — Frontend: Module-by-Module Refactor (1 day)

### 3.1 All Frontend Modules (same pattern)

| File | Public → PascalCase |
|------|---------------------|
| `model.ts` | `login`, `getAll`, `getById`, `create`, `update`, `delete` → `Login`, `GetAll`, `GetById`, `Create`, `Update`, `Delete` |
| `controller.ts` | Keep `useXxx` (React rule — exception) |

### 3.2 Specific Frontend Files

| Module | model.ts methods |
|--------|-----------------|
| `auth/model.ts` | `login`, `getProfile`, `createUser` |
| `customer/model.ts` | `getAll`, `getById`, `create`, `update`, `delete` |
| `inventory/model.ts` | `getAll`, `getById`, `create`, `update`, `delete`, `getStock` |
| `invoice/model.ts` | `getAll`, `getById`, `create`, `update`, `delete`, `getItems` |
| `job/model.ts` | `getAll`, `getById`, `create`, `update`, `delete`, `updateStatus` |
| `chat/model.ts` | `sendMessage`, `getHistory`, `getSession` |
| `dashboard/model.ts` | `getSummary`, `getSalesChart`, `getTopProducts` |
| `user/model.ts` | `getAll`, `getById`, `create`, `update`, `delete` |

### 3.3 Shared Frontend Files

| File | Public → PascalCase |
|------|---------------------|
| `config/api.ts` | Exported functions |
| `stores/authStore.ts` | Store actions (keep camelCase — Zustand convention) |
| `shared/hooks/useDebouncedValue.ts` | Keep `useXxx` |

---

## Task 4 — Update Test Files (1 day)

ทุก test file ที่อ้างอิง method names เก่า → ต้องอัปเดตเป็น PascalCase:

```ts
// Before
const result = await svc.getCustomer('123');
const res = await request(app).post('/api/customers/filter').send({ ... });

// After
const result = await svc.GetCustomer('123');
const res = await request(app).post('/api/customers/filter').send({ ... });
```

**Additional files with shared imports to update:**
- `backend/src/router.ts` — import `createAuthMiddleware` → `CreateAuthMiddleware`
- `backend/src/app.ts` — import from `./router`

### Backend test files

| File |
|------|
| `shared/response/handler.test.ts` |
| `shared/middleware/auth.test.ts`, `validator.test.ts` |
| `shared/mapper/map.test.ts` |
| `shared/errors/AppError.test.ts` |
| `modules/user/user.test.ts`, `user.repo.test.ts`, `user.handler.test.ts`, `route.test.ts`, `schema.test.ts` |
| `modules/customer/customer.test.ts`, `customer.repo.test.ts`, `customer.handler.test.ts`, `route.test.ts`, `schema.test.ts` |
| `modules/inventory/inventory.test.ts`, `inventory.repo.test.ts`, `inventory.repo.extra.test.ts`, `inventory.handler.test.ts`, `route.test.ts`, `schema.test.ts` |
| `modules/invoice/invoice.test.ts`, `invoice.repo.test.ts`, `invoice.repo.extra.test.ts`, `invoice.handler.test.ts`, `route.test.ts`, `schema.test.ts` |
| `modules/job/job.test.ts`, `job.repo.test.ts`, `job.handler.test.ts`, `route.test.ts`, `schema.test.ts` |
| `modules/chat/chat.test.ts`, `chat.handler.test.ts`, `repo_mongo.test.ts`, `route.test.ts`, `schema.test.ts` |
| `modules/dashboard/dashboard.test.ts`, `dashboard.repo.test.ts`, `dashboard.handler.test.ts`, `route.test.ts` |
| `workers/aiWorker.test.ts`, `auditWorker.test.ts` |

### Frontend test files

| File |
|------|
| `modules/auth/auth.test.ts`, `AuthView.test.tsx` |
| `modules/customer/customer.test.ts`, `controller.test.ts`, `CustomerView.test.tsx` |
| `modules/inventory/inventory.test.ts`, `controller.test.ts`, `InventoryView.test.tsx` |
| `modules/invoice/invoice.test.ts`, `create.test.ts`, `controller.test.ts` |
| `modules/job/job.test.ts`, `controller.test.ts`, `JobView.test.tsx` |
| `modules/chat/controller.test.ts`, `model.test.ts` |
| `modules/dashboard/dashboard.test.ts`, `DashboardView.test.tsx` |
| `App.test.tsx`, `Layout.test.tsx` |
| `authStore.test.ts` |
| `shared/hooks/*` |

---

## Task 5 — Verify (0.5 day)

```bash
# Backend
cd backend
npm run lint        # 0 errors
npm run typecheck   # 0 errors
npm test            # all pass

# Frontend
cd frontend
npm run lint        # 0 errors
npm run typecheck   # 0 errors
npm test            # all pass

# E2E
npm run test:e2e    # all pass
```

---

## Mapping: Old → New Names

### Backend Shared

| File | Old Name | New Name |
|------|----------|----------|
| `response/handler.ts` | `sendSuccess(res, code, msg, payload)` | `SendSuccess(res, code, msg, payload)` |
| | `sendError(res, code, msg, details)` | `SendError(res, code, msg, details)` |
| | `calculatePagination(page, size, total)` | `CalculatePagination(page, size, total)` |
| `middleware/auth.ts` | `createAuthMiddleware(redis)` | `CreateAuthMiddleware(redis)` |
| `middleware/validator.ts` | `validate(schema, source?)` | `Validate(schema, source?)` |
| `middleware/auditMeta.ts` | `auditMetaMiddleware(req, res, next)` | `AuditMetaMiddleware(req, res, next)` |
| `mapper/map.ts` | `mapEntity(entity, mapper)` | `MapEntity(entity, mapper)` |
| | `mapEntities(entities, mapper)` | `MapEntities(entities, mapper)` |
| | `pick(obj, keys)` | `Pick(obj, keys)` |
| | `omit(obj, keys)` | `Omit(obj, keys)` |

**Call sites ที่ต้องอัปเดต imports:**
- ทุก module ที่ import `sendSuccess`, `sendError`, `calculatePagination`
- `router.ts` ที่ import `createAuthMiddleware`
- ทุก route ที่ import `validate`
- ทุก handler/service ที่ import mapper functions

### Backend Services (pattern per module)

| Old Name | New Name |
|----------|----------|
| `filter(input)` | `Filter(input)` |
| `getById(id)` | `GetById(id)` |
| `create(input)` | `Create(input)` |
| `update(id, input)` | `Update(id, input)` |
| `softDelete(id, ver)` | `SoftDelete(id, ver)` |
| `findById(id)` | `FindById(id)` |
| `findByUsername(name)` | `FindByUsername(name)` |
| `findFiltered(input)` | `FindFiltered(input)` |
| `findAll()` | `FindAll()` |

### Frontend Model (pattern per module)

| Old Name | New Name |
|----------|----------|
| `getAll(params)` | `GetAll(params)` |
| `getById(id)` | `GetById(id)` |
| `create(input)` | `Create(input)` |
| `update(id, input)` | `Update(id, input)` |
| `delete(id, input)` | `Delete(id, input)` |

---

## Exception List (ไม่ต้อง refactor)

| Element | Reason |
|---------|--------|
| React hooks (`useXxx`) | React rules-of-hooks requires `use` prefix |
| Zustand store actions | Zustand convention is camelCase |
| Drizzle ORM methods | Third-party library (`eq`, `and`, `like`, etc.) |
| Zod schema names | Already PascalCase (`createCustomerSchema`) |
| Interface names | Already `I` prefix (`ICustomerService`) |
| Class names | Already PascalCase (`CustomerHandler`) |
| File names | Already correct (`entity.ts`, `handler.ts`) |
| DB column names | snake_case (Go convention already) |
| Env var names | UPPER_SNAKE (Go convention already) |
| JSON keys | camelCase (API response format) |

---

## Implementation Checklist

```
[ ] Task 1: ESLint rule (@typescript-eslint/naming-convention)
[ ] Task 2.1: Backend shared/ layer
[ ] Task 2.2: Backend modules/user/
[ ] Task 2.3: Backend modules/customer/
[ ] Task 2.4: Backend modules/inventory/
[ ] Task 2.5: Backend modules/invoice/
[ ] Task 2.6: Backend modules/job/
[ ] Task 2.7: Backend modules/chat/
[ ] Task 2.8: Backend modules/dashboard/
[ ] Task 2.9: Backend modules/audit/
[ ] Task 2.10: Backend workers/
[ ] Task 2.11: Backend router.ts + app.ts
[ ] Task 3.1: Frontend modules/model.ts (all)
[ ] Task 3.3: Frontend shared/
[ ] Task 4: All test files updated
[ ] Task 5: lint + typecheck + test = all pass
```
