# Phase 01 — Foundation: Project Setup + Auth

> **Priority**: 🔴 MUST DO FIRST — ทุกอย่างขึ้นกับ phase นี้
> **Estimate**: 3-4 days
> **Depends on**: Nothing (start here)

---

## Task 1.1 — Docker Infra (0.5 day)

```bash
docker compose up -d
# Verify:
#   MySQL:    mysql -h 127.0.0.1 -u versus -pversus_dev versus_erp
#   MongoDB:  mongosh mongodb://versus:versus_dev@localhost:27017
#   Redis:    redis-cli -a versus_dev ping
#   RabbitMQ: open http://localhost:15672 (versus / versus_dev)
```

**Files**:
- `docker-compose.yml` ✅ (already created)

---

## Task 1.2 — Backend Project Init + Config via DI (1 day)

```bash
cd backend
npm init -y
npm install express@^5.2.1 cors helmet pino pino-pretty
npm install drizzle-orm mysql2 zod bcrypt jsonwebtoken
npm install ioredis amqplib mongoose uuid
npm install -D typescript @types/node @types/cors @types/bcrypt @types/jsonwebtoken @types/uuid
npm install -D tsx jest ts-jest @types/jest supertest @types/supertest @testcontainers/mysql
npm install -D eslint prettier typescript-eslint eslint-plugin-prettier
npm install -D drizzle-kit

# Express 5: no @types/express needed — types bundled
# Express 5: req.body available without body-parser
npx tsc --init --strict
```

### `.env` — Env Vars (ห้าม hardcode ในโค้ด)

```bash
# backend/.env
PORT=3000
NODE_ENV=development

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=versus
MYSQL_PASSWORD=versus_dev
MYSQL_DATABASE=versus_erp
MYSQL_CONN_MAX_IDLE_TIME=300
MYSQL_CONNECTION_MAX_LIFE_TIME=300
MYSQL_MAX_IDLE_CONNS=10
MYSQL_MAX_OPEN_CONNS=20

# MongoDB
MONGO_URI=mongodb://versus:versus_dev@localhost:27017/versus_erp?authSource=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=versus_dev
REDIS_DB=0

# RabbitMQ
RABBITMQ_URL=amqp://versus:versus_dev@localhost:5672

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=24h
```

### DI Pattern — Factory Functions (ห้าม export const)

**database.ts** — export factory function, NOT global variable:
```ts
// ✅ factory — no side effects at import time
export function createDb() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'versus',
    password: process.env.MYSQL_PASSWORD || 'versus_dev',
    database: process.env.MYSQL_DATABASE || 'versus_erp',
    connectionLimit: Number(process.env.MYSQL_MAX_OPEN_CONNS) || 20,
    maxIdle: Number(process.env.MYSQL_MAX_IDLE_CONNS) || 10,
    idleTimeout: Number(process.env.MYSQL_CONN_MAX_IDLE_TIME) * 1000 || 300000,
    queueLimit: 0,
  });
  return drizzle(pool);
}

// ❌ ห้าม: export const db = drizzle(pool);
```

**redis.ts** — same pattern:
```ts
export function createRedis() {
  return new Redis(process.env.REDIS_URI || 'redis://:versus_dev@localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) { ... },
  });
}
```

**rabbitmq.ts** — same pattern:
```ts
export async function createRabbitMQ() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://versus:versus_dev@localhost:5672');
  const channel = await conn.createChannel();
  await channel.assertQueue('erp.audit.log', { durable: true });
  await channel.assertQueue('erp.reports.generate', { durable: true });
  await channel.assertQueue('erp.ai.expensive_query', { durable: true });
  await channel.assertQueue('erp.notifications.send', { durable: true });
  await channel.assertQueue('erp.stock.alerts', { durable: true });
  return { conn, channel };
}
```

### `app.ts` — Create All Connections, Inject to Router

```ts
import { createDb, createRedis, createRabbitMQ, connectMongo, initMongoIndexes } from './config';
import { setupRoutes } from './router';

const db = createDb();
const redis = createRedis();

async function start() {
  await connectMongo();            // MongoDB (factory pattern optional — only 1 consumer)
  await initMongoIndexes();
  const rabbit = await createRabbitMQ();

  setupRoutes(app, db, redis);     // ← inject!

  app.listen(PORT, () => logger.info(`Server running on :${PORT}`));
}
start();
```

### `router.ts` — Receive Dependencies, Inject into Repos

```ts
export function setupRoutes(app: Express, db: MySql2Database, redis: Redis) {
  const userRepo = new UserRepository(db);         // db inject
  const userSvc = new UserService(userRepo);
  const userHandler = new UserHandler(userSvc);
  app.use('/api/auth', registerUserRoutes(userHandler));

  // Redis inject ลง middleware:
  app.use(authMiddleware(redis));
  app.use(rateLimitMiddleware(redis));
}
```

### `repo.ts` — Receive db via Constructor

```ts
export class UserRepository implements IUserRepository {
  constructor(private db: MySql2Database<Record<string, never>>) {}
  // ใช้ this.db — ห้าม import db global
}
```

**Acceptance**:
- `npm run dev` starts Express on :3000
- `curl localhost:3000/health` → 200
- `npm run lint` → no errors
- `npm run typecheck` → no errors
- No `export const db` anywhere — all factories

---

## Task 1.3 — Frontend Project Init (0.5 day)

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom zustand axios recharts
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Files to create**:
```
frontend/
├── vite.config.ts              ← Tailwind v4 plugin
├── tsconfig.json
├── tailwind.config.ts
└── src/
    ├── main.tsx                ← Entry
    ├── App.tsx                 ← Router + Layout
    ├── router.tsx              ← All routes
    ├── config/
    │   └── api.ts              ← Axios instance + JWT interceptor
    └── shared/
        └── components/
            └── Layout.tsx      ← App shell (sidebar + header + content)
```

**Acceptance**:
- `npm run dev` starts Vite on :5173
- Blank page with sidebar layout visible

---

## Task 1.4 — Database Schema + Migrations (1 day)

Create Drizzle schema for ALL tables (even Phase 2-3 tables):

**Files**: `backend/src/config/schema.ts`

**Tables**:
- `users` (id, username, password_hash, display_name, role, is_active, version, created_at, updated_at, deleted_at)
- `customers` (id, first_name, last_name, phone, email, address, version, created_at, updated_at, deleted_at)
- `vehicles` (id, customer_id FK, license_plate, brand, model, year, engine_type, fuel_type)
- `categories` (id, name, description)
- `products` (id, category_id FK, sku, name, description, unit, cost_price, sell_price, min_stock, current_stock, version, created_at, updated_at, deleted_at)
- `stock_movements` (id, product_id, type ENUM IN/OUT/ADJUST, quantity, reference_type, reference_id, created_by, note, created_at)
- `invoices` (id, invoice_number, customer_id FK, vehicle_id FK, total_amount, discount, tax, grand_total, payment_status, payment_method, version, created_by, created_at, updated_at)
- `invoice_items` (id, invoice_id FK, product_id FK, quantity, unit_price, total)
- `jobs` (id, customer_id FK, vehicle_id FK, invoice_id FK, job_type ENUM, status ENUM, scheduled_date, technician_id, notes, version, created_at, updated_at)
- `job_status_logs` (id, job_id, from_status, to_status, changed_by, note, created_at)

**MongoDB collections** (create indexes):
- `chat_messages` — index: `{ sessionId: 1, createdAt: -1 }`
- `activity_logs` — index: `{ userId: 1, createdAt: -1 }`, `{ entityType: 1, entityId: 1 }`

**Seed data** (`database/seeds/seed.ts`):
- 1 admin user (admin / admin123)
- 5 sample customers + 5 vehicles
- 10 sample products (gas tanks, ECU, injectors, hoses)
- 3 sample invoices with items

**Acceptance**:
- `npm run db:migrate` creates all tables
- `npm run db:seed` inserts test data
- `npm run db:studio` (Drizzle Studio) shows data

---

## Task 1.5 — Shared Utilities (1 day)

**Files**:
```
backend/src/shared/
├── errors/
│   └── AppError.ts          ← NotFoundError, ConflictError, UnauthorizedError, ForbiddenError, BadRequestError, AppError
├── response/
│   └── handler.ts           ← sendSuccess(), sendError(), PaginationResponse, calculatePagination()
├── pagination/
│   └── schema.ts            ← paginationSchema, filterSchema, filterRequestSchema, FilterRequest type
├── middleware/
│   ├── auth.ts              ← JWT + Redis session verify
│   ├── rateLimit.ts         ← Dev fallback (production → Nginx/Traefik)
│   └── validator.ts         ← Zod schema validation middleware
└── mapper/
    └── map.ts               ← Generic type mapper utility
```

**Acceptance**:
- Unit tests for AppError classes
- Unit tests for calculatePagination
- Unit tests for auth middleware (mock JWT)

---

## Task 1.6 — Auth Module (Backend) (1 day)

**Files**: `backend/src/modules/user/`

| File | Responsibility |
|------|---------------|
| `entity.ts` | UserEntity interface |
| `schema.ts` | loginSchema, createUserSchema, UserResponse |
| `handler.ts` | AuthHandler class: login(), getProfile(), createUser() |
| `service.ts` | AuthService: login (bcrypt + JWT), getProfile, createUser |
| `repo.ts` | UserRepository: findByUsername, findById, create |
| `route.ts` | POST /login, GET /profile, POST / (admin create user) |

**Acceptance**:
- `POST /api/auth/login` with admin/admin123 → 200 + JWT token
- `GET /api/auth/profile` with valid token → 200 + user data
- `GET /api/auth/profile` without token → 401
- Integration tests for all 3 endpoints

---

## Task 1.7 — Auth Module (Frontend) (0.5 day)

**Files**: `frontend/src/modules/auth/`

| File | Responsibility |
|------|---------------|
| `model.ts` | authApi.login(), LoginInput, AuthState |
| `controller.ts` | useAuth() hook: login, logout, isAuthenticated |
| `view.tsx` | LoginForm component (username, password, submit) |

**Files**: `frontend/src/stores/authStore.ts`
- Zustand store: token, user, isAuthenticated, login(), logout()

**Acceptance**:
- Login form renders
- Enter admin/admin123 → redirect to Dashboard
- Invalid credentials → error message
- Logout → redirect to Login

---

## Phase 01 Checklist

```
[ ] docker compose up -d — all 4 services healthy
[ ] .env file created with all connection vars (no hardcodes)
[ ] Config uses factory functions: createDb(), createRedis(), createRabbitMQ()
[ ] app.ts creates all connections, injects to router
[ ] router.ts receives db + redis, injects to repos
[ ] repo.ts uses constructor(db) — no import db global
[ ] Backend starts on :3000, /health returns 200
[ ] Frontend starts on :5173, blank layout visible
[ ] MySQL: all 11 tables created (Drizzle migrate)
[ ] Seed data: admin user, 5 customers, 10 products, 3 invoices
[ ] POST /api/auth/login → 200 + JWT
[ ] GET /api/auth/profile → 200 (with token)
[ ] GET /api/auth/profile → 401 (without token)
[ ] Frontend: login flow works end-to-end
[ ] All unit + integration tests pass
[ ] TypeScript compiles: npx tsc --noEmit
[ ] ESLint passes: npm run lint
[ ] No `export const db` anywhere in codebase
```

> **After Phase 01**: You have a working app skeleton — login works, DB has data, infra runs.
> **Next**: Phase 02 — Customers module
