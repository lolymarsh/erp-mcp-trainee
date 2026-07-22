# Versus Thailand ERP

ระบบ ERP สำหรับร้านติดตั้งแก๊สรถยนต์ (CNG/LPG) — โปรเจกต์ศึกษาก่อนทำงานจริง

## Tech Stack

```
Frontend:  React 19 + Vite + TypeScript (strict), MUI v6, Tailwind v4
           Zustand, Recharts, React Router v7, Zod, Axios

Backend:   Node.js 22 + Express 5 + TypeScript (strict)
           Drizzle ORM (MySQL), Mongoose (MongoDB)
           Zod, bcrypt, JWT, amqplib, ioredis
           Jest + Supertest + Testcontainers

Infra:     Docker Compose — MySQL 8.4, MongoDB 7, Redis 7, RabbitMQ 3.13
```

## Quick Start

```bash
# 1. Start infra
docker compose up -d

# 2. Backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

# 3. Frontend (อีก terminal)
cd frontend
npm install
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:5173` — เข้าระบบด้วย `admin / admin123`

## Modules

| # | Module | Backend | Frontend | Status |
|---|--------|---------|----------|--------|
| 01 | Core (Auth + Foundation) | `modules/user/` | `modules/auth/` | ✅ |
| 02 | Customer + Vehicle | `modules/customer/` | `modules/customer/` | ✅ |
| 03 | Inventory | `modules/inventory/` | `modules/inventory/` | ✅ |
| 04 | Invoice | `modules/invoice/` | `modules/invoice/` | ✅ |
| 05 | Job (Installation) | `modules/job/` | `modules/job/` | ✅ |
| 06 | AI Chatbot | `modules/chat/` | `modules/chat/` | ✅ |
| 07 | Dashboard | `modules/dashboard/` | `modules/dashboard/` | ✅ |
| 08 | Testing | — | `e2e/` | ✅ |
| 09 | DevOps | — | — | 📖 |
| 10 | Audit Log | `modules/audit/` | `modules/audit/` | ✅ |
| 11 | Admin (User Mgmt) | `modules/user/` | `modules/user/` | ✅ |

## Architecture

**Backend** — Go-style Domain Modules:
```
backend/src/modules/{domain}/
  entity.ts    ← DB model interface
  schema.ts    ← Zod validation + DTOs
  handler.ts   ← Express handler class
  service.ts   ← Business logic (interface + impl)
  repo.ts      ← DB queries (interface + impl)
  route.ts     ← Router registration
  *.test.ts    ← Tests
```

**Frontend** — React MVC:
```
frontend/src/modules/{domain}/
  model.ts       ← API calls + types (NO React import)
  view.tsx        ← UI component (props only, NO API calls)
  controller.ts   ← useXxx() custom hook (state + logic)
```

## Coding Rules

| Rule | Detail |
|------|--------|
| **Pagination** | ทุก list ใช้ `POST /{resource}/filter` + return `PaginationResponse` |
| **Transaction** | ทุก multi-table write ใช้ `db.transaction()` + `FOR UPDATE` |
| **Version Check** | ทุก PATCH/PUT ต้องมี `version` → mismatch → 409 Conflict |
| **Response** | `{ code, message, data, pagination? }` |
| **TypeScript** | ห้าม `any` ห้าม `as` — ใช้ Zod parse + type inference |
| **DI** | ห้าม global `db` — inject ผ่าน constructor เท่านั้น |
| **MVC** | model.ts ห้าม import React, view.tsx ห้าม call API |

## Project Structure

```
erp-mcp-trainee/
├── AGENTS.md              ← Rules สำหรับ AI (OpenCode)
├── docker-compose.yml     ← MySQL + MongoDB + Redis + RabbitMQ
├── spec/                  ← Specs แยกตาม Module
│   ├── 01_core/
│   ├── 02_customer/
│   ├── ...
│   └── 11_admin/
├── backend/
│   └── src/
│       ├── config/        ← DB pools, Redis, RabbitMQ
│       ├── shared/        ← Middleware, Errors, Response, Pagination
│       ├── modules/{domain}/
│       └── workers/       ← RabbitMQ consumers
├── frontend/
│   └── src/
│       ├── config/        ← Axios instance + JWT interceptor
│       ├── stores/        ← Zustand (auth)
│       ├── shared/        ← Components, Hooks, Utils
│       └── modules/{domain}/
├── database/
│   └── seeds/             ← Seed data
└── .agent/rules/          ← AI coding rules
```

## DB Strategy

| DB | Usage |
|----|-------|
| **MySQL** | Core business data — ACID transactions, JOINS |
| **MongoDB** | Chat history, activity logs, audit trail |
| **Redis** | Cache (dashboard, AI), sessions, rate limiting |
| **RabbitMQ** | Async jobs, audit log, notifications |

## Testing

```bash
cd backend && npm test              # Unit + Integration (Jest + Testcontainers)
cd frontend && npm test             # Unit + Component (Vitest + RTL)
cd frontend && npm run test:e2e     # E2E (Playwright)
```

## Specs

รายละเอียดแต่ละ module อยู่ใน `spec/XX_{module}/plan.md` (flow + tasks) และ `schema.md` (DB)

---

> **Project**: Study/Learning — ไม่มี Deploy จริง
> **Language**: ไทย (Thai) 
