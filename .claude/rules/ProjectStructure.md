---
trigger: always_on
---

# Versus Thailand ERP — Project Structure

## 1. Top-Level Layout

```
erp-mcp-trainee/
├── docker-compose.yml          ← MySQL, MongoDB, Redis, RabbitMQ
├── AGENTS.md                   ← Overall AI rules
├── spec/
│   ├── plan.md                 ← Master plan
│   └── ARCHITECTURE.md         ← Full architecture + templates
├── .agent/rules/               ← OpenCode rules (this folder)
├── .claude/rules/              ← Claude rules
├── frontend/                   ← React 19 + Vite + TypeScript
├── backend/                    ← Node.js + Express + TypeScript
└── database/
    ├── migrations/             ← Drizzle migrations
    └── seeds/                  ← Test data
```

## 2. Backend — Go-style Domain Modules

```
backend/src/
├── config/                     ← DB pools, Redis, RabbitMQ, env
│   ├── database.ts, redis.ts, rabbitmq.ts
│   └── index.ts
│
├── modules/                    ← 1 folder = 1 domain
│   ├── user/                   ← Auth + User Management
│   │   ├── entity.ts           ← DB model interface
│   │   ├── schema.ts           ← Zod validation + DTOs
│   │   ├── handler.ts          ← Express handler class
│   │   ├── service.ts          ← Business logic (interface + impl)
│   │   ├── repo.ts             ← DB queries (interface + impl)
│   │   ├── route.ts            ← Express Router
│   │   └── user.test.ts        ← Integration tests
│   ├── customer/
│   │   └── (same 6 files + customer.test.ts)
│   ├── inventory/
│   ├── invoice/
│   ├── job/
│   ├── chat/                   ← + sanitizer.ts, formatter.ts, repo_mongo.ts
│   └── dashboard/
│
├── shared/                     ← Cross-cutting
│   ├── middleware/              ← auth, rateLimit, validator
│   ├── errors/AppError.ts      ← Custom error classes
│   ├── response/handler.ts     ← sendSuccess, sendError + PaginationResponse
│   └── pagination/helper.ts    ← calculatePagination
│
├── workers/                    ← RabbitMQ consumers
│   ├── reportWorker.ts, notificationWorker.ts
│   └── aiWorker.ts, auditWorker.ts
│
├── router.ts                   ← Central wiring
└── app.ts                      ← Express entry
```

## 3. Frontend — React MVC

```
frontend/src/
├── modules/                    ← 1 folder = 1 domain
│   ├── auth/
│   │   ├── model.ts            ← API calls + types (NO React)
│   │   ├── view.tsx            ← UI component (props only)
│   │   └── controller.ts       ← useAuth() hook
│   ├── customer/
│   │   └── (model.ts, view.tsx, controller.ts)
│   ├── inventory/
│   ├── invoice/
│   ├── job/
│   ├── chat/
│   └── dashboard/
│
├── shared/                     ← Shared across modules
│   ├── components/             ← Button, Table, Modal, Layout (MUI)
│   └── hooks/                  ← useAuth, usePagination, useDebounce
│
├── config/api.ts               ← Axios instance + JWT interceptor
├── stores/                     ← Zustand (auth store, UI theme)
├── router.tsx                  ← React Router config
├── App.tsx
└── main.tsx
```

## 4. Module File Responsibilities

| File | Layer | Responsibility |
|------|-------|---------------|
| `entity.ts` | Data | DB model interface — what a record looks like |
| `schema.ts` | Validation | Zod schemas for requests + DTO types for responses |
| `handler.ts` | HTTP | Parse input → call service → format response |
| `service.ts` | Business | Logic, validation, orchestration, error wrapping |
| `repo.ts` | Data | DB queries — raw CRUD, no business logic |
| `route.ts` | Routing | Register Express Router with middleware |
| `{module}.test.ts` | Test | Integration tests for the module |

## 5. Naming Rules

```
✓ entity.ts    ✗ CustomerEntity.ts    (folder gives namespace)
✓ schema.ts    ✗ customer.schema.ts
✓ handler.ts   ✗ customerHandler.ts
✓ service.ts   ✗ CustomerService.ts
✓ repo.ts      ✗ customerRepo.ts
✓ route.ts     ✗ customerRoutes.ts
✓ model.ts     ✗ CustomerModel.ts     (frontend — same rule)
✓ view.tsx     ✗ CustomerView.tsx
✓ controller.ts ✗ useCustomer.ts
```
