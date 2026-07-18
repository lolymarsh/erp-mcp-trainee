# Prompt — Phase 01: Foundation + Auth

```
implement phase 01 ตาม spec/2026-07-18_core/01_FOUNDATION.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: factory functions (no export const), DI (constructor), eslint, connection pool env vars

สิ่งที่ต้องทำ:
  docker compose up -d
  backend init (Express 5 + TypeScript + Drizzle + ESLint)
  frontend init (Vite + React 19 + MUI + Tailwind + Router)
  config: .env, database.ts (factory), redis.ts (factory), rabbitmq.ts (factory), logger.ts, schema.ts
  drizzle-kit generate → drizzle-kit migrate → drizzle-kit studio
  seed data (admin, customers, products, invoices)
  shared: errors/AppError.ts, response/handler.ts, pagination/schema.ts + helper.ts
  middleware: auth.ts, rateLimit.ts (dev fallback), validator.ts
  backend: modules/user/ (entity, schema, handler, service, repo, route, test)
  frontend: modules/auth/ (model, controller, view), stores/authStore.ts, config/api.ts
  tests: unit + integration

อย่าลืม:
  - configs เป็น factory functions (createDb, createRedis, createRabbitMQ) — ห้าม export const
  - app.ts สร้างทุก connection → inject เข้า setupRoutes(app, db, redis)
  - router.ts รับ db + redis → inject เข้า repo constructor
  - repo รับ db ผ่าน constructor — ห้าม import db global
  - Express 5: ไม่ต้อง @types/express, ไม่ต้อง body-parser
  - npm install ใช้ @latest ทุกตัว
  - .env ไฟล์มีครบทุก connection vars
  - npm run lint + npm run typecheck ผ่าน
```
