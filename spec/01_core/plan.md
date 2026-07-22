# Core Module — Foundation + Auth Plan

> **Priority**: 🔴 MUST DO FIRST
> **Estimate**: 3-4 days
> **Depends on**: Nothing (start here)

---

## Overview

Foundation + Auth เป็น base layer ที่ทุก module ต้องพึ่งพา ประกอบด้วย:

| Layer | Components |
|-------|-----------|
| **Infra** | Docker Compose (MySQL, MongoDB, Redis, RabbitMQ) |
| **Backend** | Express 5 + TypeScript, DI wiring, Config |
| **Frontend** | Vite + React 19 + MUI + Tailwind |
| **Shared** | Errors, Response format, Pagination, Auth middleware |
| **Auth** | User CRUD, JWT login, Role-based access, Frontend login |

---

## Workflow Diagram

```
               ┌──────────────────────────┐
               │  1. Docker Compose Up     │
               │  MySQL, MongoDB, Redis,   │
               │  RabbitMQ                 │
               └──────────┬───────────────┘
                          ▼
               ┌──────────────────────────┐
               │  2. Backend Project Init  │
               │  npm init + Express 5     │
               │  TypeScript + ESLint      │
               └──────────┬───────────────┘
                          ▼
               ┌──────────────────────────┐
               │  3. Config + DI Layer     │
               │  factory functions        │
               │  (createDb, createRedis,  │
               │   createRabbitMQ)         │
               └──────────┬───────────────┘
                          ▼
               ┌──────────────────────────┐
               │  4. Database Schema       │
               │  Drizzle tables: users,   │
               │  customers, products...   │
               │  MongoDB indexes          │
               └──────────┬───────────────┘
                          ▼
               ┌──────────────────────────┐
               │  5. Shared Middleware     │
               │  errors/ response/        │
               │  pagination/ auth/        │
               │  validator/ mapper        │
               └──────────┬───────────────┘
                          ▼
               ┌──────────────────────────┐
               │  6. Auth Module (BE)      │
               │  POST /login             │
               │  GET /profile            │
               │  POST / (create user)    │
               └──────────┬───────────────┘
                          ▼
               ┌──────────────────────────┐
               │  7. Frontend Init         │
               │  Vite + MUI + Tailwind    │
               │  Layout shell             │
               └──────────┬───────────────┘
                          ▼
               ┌──────────────────────────┐
               │  8. Auth Module (FE)      │
               │  Login form + redirect    │
               │  Zustand store + JWT      │
               └──────────────────────────┘
```

---

## Task 1 — Docker Infra (0.5 day)

```bash
docker compose up -d
```

**Verify all services:**

| Service | Port | Verify Command |
|---------|------|---------------|
| MySQL | 3306 | `mysql -h 127.0.0.1 -u versus -pversus_dev versus_erp` |
| MongoDB | 27017 | `mongosh mongodb://versus:versus_dev@localhost:27017` |
| Redis | 6379 | `redis-cli -a versus_dev ping` |
| RabbitMQ | 5672, 15672 | Open `http://localhost:15672` (versus / versus_dev) |

**File**: `docker-compose.yml` (already created)

---

## Task 2 — Backend Project Init (1 day)

### 2.1 Install Dependencies

```bash
cd backend
npm init -y
npm install express@latest cors@latest helmet@latest pino@latest pino-pretty@latest
npm install drizzle-orm@latest mysql2@latest zod@latest bcrypt@latest jsonwebtoken@latest
npm install ioredis@latest amqplib@latest mongoose@latest uuid@latest
npm install -D typescript@latest tsx@latest jest@latest ts-jest@latest @types/jest@latest
npm install -D supertest@latest @types/supertest@latest @testcontainers/mysql@latest
npm install -D eslint@latest prettier@latest typescript-eslint@latest eslint-plugin-prettier@latest
npm install -D drizzle-kit@latest
```

### 2.2 TypeScript Config

```bash
npx tsc --init --strict
```

tsconfig.json key settings: `strict: true`, `target: ES2022`, `module: NodeNext`, `rootDir: src`, `outDir: dist`

### 2.3 ESLint Config

`eslint.config.mjs` with rules matching AGENTS.md:
- `max-lines-per-function: 40`
- `complexity: 15`
- `max-depth: 5`
- `no-else-return`
- `@typescript-eslint/no-explicit-any` (error)
- `@typescript-eslint/no-floating-promises`

### 2.4 Directory Structure

```
backend/
├── drizzle/                        # Auto-generated SQL migrations
├── drizzle.config.ts               # Drizzle Kit config
├── eslint.config.mjs
├── tsconfig.json
├── jest.config.ts
├── package.json
└── src/
    ├── app.ts                      # Entry point
    ├── router.ts                   # Central wiring (DI)
    ├── config/
    │   ├── index.ts                # Re-exports
    │   ├── database.ts             # createDb() + connectMongo()
    │   ├── schema.ts               # ALL Drizzle table definitions
    │   ├── redis.ts                # createRedis()
    │   └── rabbitmq.ts            # createRabbitMQ()
    ├── shared/
    │   ├── errors/
    │   │   └── AppError.ts         # Custom error classes
    │   ├── response/
    │   │   └── handler.ts          # sendSuccess, sendError, PaginationResponse
    │   ├── pagination/
    │   │   └── helper.ts           # calculatePagination
    │   └── middleware/
    │       ├── auth.ts             # JWT + Redis session verify
    │       ├── rateLimit.ts        # Dev fallback (production → Nginx)
    │       └── validator.ts        # Zod schema validation
    └── modules/
        └── user/
            ├── entity.ts
            ├── schema.ts
            ├── handler.ts
            ├── service.ts
            ├── repo.ts
            ├── route.ts
            └── user.test.ts
```

**Acceptance Criteria:**
- `npm run dev` starts Express on `:3000`
- `curl localhost:3000/health` → `{ "code": 200, "message": "healthy" }`
- `npm run lint` → no errors
- `npm run typecheck` → no errors

---

## Task 3 — Config + DI Wiring (1 day)

### 3.1 Environment Variables (`.env`)

```bash
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

### 3.2 Factory Functions (No Global Variables)

**RULE**: ห้าม `export const db = drizzle(pool)` — ใช้ factory function เท่านั้น

```ts
// database.ts — factory
export function createDb(): MySql2Database {
  const pool = mysql.createPool({ /* .env vars */ });
  return drizzle(pool);
}

// redis.ts — factory
export function createRedis(): Redis {
  return new Redis({ /* .env vars */ });
}

// rabbitmq.ts — factory
export async function createRabbitMQ() {
  const conn = await amqp.connect(/* .env */);
  const channel = await conn.createChannel();
  // Assert queues: erp.audit.log, erp.reports.generate, erp.ai.expensive_query, erp.notifications.send, erp.stock.alerts
  return { conn, channel };
}
```

### 3.3 Wire Up — `app.ts`

```ts
const db = createDb();
const redis = createRedis();

async function start() {
  await connectMongo();
  await initMongoIndexes();
  const rabbit = await createRabbitMQ();

  setupRoutes(app, db, redis);

  app.listen(PORT, () => logger.info(`Server running on :${PORT}`));
}
start();
```

### 3.4 Wire Up — `router.ts`

```ts
export function setupRoutes(app: Express, db: MySql2Database, redis: Redis) {
  const userRepo = new UserRepository(db);
  const userSvc = new UserService(userRepo);
  const userHandler = new UserHandler(userSvc);
  app.use('/api/auth', registerUserRoutes(userHandler));

  // Shared middleware (Redis-dependent):
  app.use(authMiddleware(redis));
}
```

### 3.5 DI Flow

```
createDb() → db (MySql2Database)
                → UserRepository(db)       → IUserRepository
                → CustomerRepository(db)   → ICustomerRepository
                → ...

createRedis() → redis (Redis)
                → authMiddleware(redis)
                → rateLimitMiddleware(redis)

router.ts:
  UserRepository(db) → UserService(repo) → UserHandler(svc) → registerUserRoutes(handler)
```

**Acceptance:**
- `npm run dev` starts Express on `:3000`
- `curl localhost:3000/health` → 200
- No `export const db` anywhere — all factories

---

## Task 4 — Database Schema + Migrations (1 day)

### 4.1 Core Tables (`backend/src/config/schema.ts`)

| Table | Purpose |
|-------|---------|
| `users` | Auth + User management |
| `customers` | CRM data |
| `vehicles` | Customer vehicles |
| `categories` | Product categories |
| `products` | Inventory items |
| `stock_movements` | Stock change log |
| `invoices` | Sales documents |
| `invoice_items` | Invoice line items |
| `jobs` | Installation jobs |
| `job_status_logs` | Job status audit trail |

### 4.2 MongoDB Collections

| Collection | Indexes |
|-----------|---------|
| `chat_messages` | `{ sessionId: 1, createdAt: -1 }` |
| `activity_logs` | `{ userId: 1, createdAt: -1 }`, `{ entityType: 1, entityId: 1 }` |

### 4.3 Seed Data

`database/seeds/seed.ts`:
- 1 admin user (admin / admin123)
- 5 sample customers + 5 vehicles
- 10 sample products (gas tanks, ECU, injectors, hoses)
- 3 sample invoices with items

### 4.4 Drizzle Commands

```bash
npx drizzle-kit generate    # Generate SQL migrations
npx drizzle-kit migrate     # Apply migrations
npx drizzle-kit push        # Push schema directly (dev)
npx drizzle-kit studio      # GUI data browser
```

**Acceptance:**
- `npm run db:migrate` creates all tables
- `npm run db:seed` inserts test data
- `npm run db:studio` shows data

---

## Task 5 — Shared Utilities (1 day)

### 5.1 Errors (`shared/errors/AppError.ts`)

```ts
class AppError extends Error { statusCode: number; data?: unknown }
class NotFoundError extends AppError       // 404
class ConflictError extends AppError       // 409
class UnauthorizedError extends AppError   // 401
class ForbiddenError extends AppError      // 403
class BadRequestError extends AppError     // 400
```

### 5.2 Response Format (`shared/response/handler.ts`)

```ts
// Success
sendSuccess(res, 200, 'success', { data: result })
// → { "code": 200, "message": "success", "data": { ... } }

// Success with pagination
sendSuccess(res, 200, 'success', { data: [...], pagination })
// → { "code": 200, "message": "success", "data": [...], "pagination": { page, pageSize, totalData, totalPage, hasNextPage, hasPreviousPage } }

// Error
sendError(res, 400, 'error description')
// → { "code": 400, "message": "error description" }
```

### 5.3 Pagination (`shared/pagination/helper.ts`)

```ts
export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function calculatePagination(page: number, pageSize: number, totalData: number): PaginationResponse {
  const totalPage = Math.ceil(totalData / pageSize);
  return {
    page, pageSize, totalData, totalPage,
    hasNextPage: page < totalPage,
    hasPreviousPage: page > 1,
  };
}
```

Filter request schema (shared by all list endpoints):
```ts
export const filterRequestSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  sortName: z.string().optional(),
  sortBy: z.enum(['asc', 'desc']).optional(),
  filters: z.array(z.object({
    field: z.string(),
    value: z.string().optional(),
    values: z.array(z.string()).optional(),
    greaterThan: z.number().optional(),
    lessThan: z.number().optional(),
    fromDate: z.number().optional(),
    toDate: z.number().optional(),
  })).max(20).optional(),
});
```

### 5.4 Auth Middleware (`shared/middleware/auth.ts`)

```ts
// JWT verify + Redis session check
export function authMiddleware(redis: Redis) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedError('No token provided');

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const session = await redis.get(`session:${payload.userId}`);
    if (!session) throw new UnauthorizedError('Session expired');

    req.user = payload;
    next();
  };
}
```

### 5.5 Rate Limit Middleware (`shared/middleware/rateLimit.ts`)

- Dev fallback only — comment: "production: use Nginx/Traefik instead"
- Uses Redis for counter

### 5.6 Validation Middleware (`shared/middleware/validator.ts`)

```ts
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return sendError(res, 400, result.error.message);
    req.body = result.data;
    next();
  };
}
```

**Acceptance:**
- Unit tests for AppError classes
- Unit tests for calculatePagination
- Unit tests for auth middleware (mock JWT)

---

## Task 6 — Auth Module Backend (1 day)

### 6.1 Module Structure

```
backend/src/modules/user/
├── entity.ts         → UserEntity interface
├── schema.ts         → loginSchema, createUserSchema, UserResponse DTO
├── handler.ts        → AuthHandler (login, getProfile, createUser)
├── service.ts        → AuthService (bcrypt + JWT logic)
├── repo.ts           → UserRepository (findByUsername, findById, create)
├── route.ts          → POST /login, GET /profile, POST /
└── user.test.ts      → Integration tests
```

### 6.2 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Login → JWT token |
| GET | `/api/auth/profile` | JWT | Get current user profile |
| POST | `/api/auth/` | Admin | Create new user |

### 6.3 Data Flow — Login

```
Client                     Backend
  │                          │
  │ POST /api/auth/login     │
  │ { username, password }   │
  │─────────────────────────►│
  │                          │  validate(loginSchema)
  │                          │  UserRepo.findByUsername(username)
  │                          │  bcrypt.compare(password, user.passwordHash)
  │                          │  jwt.sign({ userId, role }, JWT_SECRET, { expiresIn })
  │                          │  Redis.set(`session:${userId}`, token, 'EX', 86400)
  │◄── 200 { token, user } ──│
```

### 6.4 Data Flow — Get Profile

```
Client                     Backend
  │                          │
  │ GET /api/auth/profile    │
  │ Authorization: Bearer    │
  │─────────────────────────►│
  │                          │  authMiddleware(redis):
  │                          │    verify JWT
  │                          │    check Redis session
  │                          │  UserService.getProfile(userId)
  │                          │  UserRepo.findById(userId)
  │◄── 200 { user } ────────│
```

### 6.5 Service-Layer Rules

- Service MUST NOT access DB directly (no `db`, no Drizzle helpers, no schema imports)
- Cross-module validation → inject repo interfaces
- Transaction → delegate to repo

### 6.6 Coding Rules Applied

| Rule | Implementation |
|------|---------------|
| **Repository Pattern** | `UserRepository(db)` via constructor — no global `db` |
| **Interface-based** | `IUserRepository`, `IUserService` — mockable |
| **Error Classes** | `UnauthorizedError`, `NotFoundError`, `AppError(409)` |
| **Version Check** | `update` method uses `WHERE version = ?` |
| **Unified Response** | `sendSuccess` / `sendError` |

**Acceptance:**
- `POST /api/auth/login` with admin/admin123 → 200 + JWT token
- `GET /api/auth/profile` with valid token → 200 + user data
- `GET /api/auth/profile` without token → 401
- Integration tests for all 3 endpoints

---

## Task 7 — Frontend Init (0.5 day)

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @mui/material@latest @mui/icons-material@latest @emotion/react@latest @emotion/styled@latest
npm install tailwindcss@latest @tailwindcss/vite@latest
npm install react-router-dom@latest zustand@latest axios@latest recharts@latest
npm install -D vitest@latest @testing-library/react@latest @testing-library/jest-dom@latest
```

### Frontend Structure

```
frontend/
├── vite.config.ts          ← Tailwind v4 plugin
├── tsconfig.json
└── src/
    ├── main.tsx            ← Entry point
    ├── App.tsx             ← Router + Layout wrapper
    ├── router.tsx          ← All route mappings
    ├── config/
    │   └── api.ts          ← Axios instance + JWT interceptor
    ├── stores/
    │   └── authStore.ts   ← Zustand store (token, user, isAuthenticated)
    └── shared/
        └── components/
            └── Layout.tsx ← App shell (sidebar + header + content area)
```

**Acceptance:**
- `npm run dev` starts Vite on `:5173`
- Blank page with sidebar layout visible

---

## Task 8 — Auth Module Frontend (0.5 day)

### 8.1 Module Structure

```
frontend/src/modules/auth/
├── model.ts         ← authApi.login(), LoginInput, AuthState types
├── controller.ts    ← useAuth() hook (login, logout, isAuthenticated)
└── view.tsx         ← LoginForm component (username, password, submit button)
```

### 8.2 Component Architecture

```
┌─────────────────────────────────────┐
│           Layout.tsx                 │
│  ┌──────────┬──────────────────────┐ │
│  │ Sidebar  │  Content             │ │
│  │          │  ┌────────────────┐  │ │
│  │          │  │  LoginForm     │  │ │
│  │          │  │  ┌──────────┐  │  │ │
│  │          │  │  │ Username │  │  │ │
│  │          │  │  ├──────────┤  │  │ │
│  │          │  │  │ Password │  │  │ │
│  │          │  │  ├──────────┤  │  │ │
│  │          │  │  │ [Submit] │  │  │ │
│  │          │  │  └──────────┘  │  │ │
│  │          │  └────────────────┘  │ │
│  └──────────┴──────────────────────┘ │
└─────────────────────────────────────┘
```

### 8.3 Data Flow — Frontend Login

```
LoginForm (view.tsx)
  │ user types username + password, clicks Submit
  ▼
useAuth().login(input)  (controller.ts)
  │
  ▼
authApi.login(input)    (model.ts)
  │ POST /api/auth/login
  ▼
Backend → validate → verify → JWT
  │
  ▼ (response with token)
Controller:
  │ localStorage.setItem('token', token)
  │ zustandStore.login(token, user)
  │ navigate('/dashboard')
  ▼
View re-renders with authenticated layout
```

### 8.4 Zustand Auth Store

```ts
interface AuthState {
  token: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### 8.5 Axios JWT Interceptor

```ts
// config/api.ts — auto-attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout(); // auto-redirect to login
    }
    return Promise.reject(err);
  }
);
```

**Acceptance:**
- Login form renders at `/login`
- Enter admin/admin123 → redirect to Dashboard
- Invalid credentials → error message
- Logout → redirect to Login

---

## Implementation Checklist

```
[x] Task 1: Docker Infra
    [x] docker-compose.yml created
    [x] docker compose up -d — all 4 services healthy
[x] Task 2: Backend Init
    [x] npm install — all dependencies
    [x] TypeScript compiled without errors
    [x] ESLint configured
    [x] Express starts on :3000
    [x] /health returns 200
[x] Task 3: Config + DI
    [x] .env created (no hardcoded values)
    [x] createDb() factory — no global export
    [x] createRedis() factory
    [x] createRabbitMQ() factory
    [x] app.ts creates connections, injects to router
    [x] router.ts wires repos → services → handlers
    [x] Repos use constructor(db) — no import db global
[x] Task 4: Schema + Migrations
    [x] MySQL: all tables created
    [x] MongoDB: indexes created
    [x] Seed data inserted
[x] Task 5: Shared Middleware
    [x] AppError classes (NotFound, Conflict, Unauthorized, etc.)
    [x] sendSuccess/sendError with unified format
    [x] PaginationResponse + calculatePagination
    [x] authMiddleware (JWT + Redis session)
    [x] validatorMiddleware (Zod schema)
    [ ] rateLimitMiddleware (dev fallback)
    [x] Unit tests for all shared utils
[x] Task 6: Auth Backend
    [x] POST /api/auth/login → 200 + JWT
    [x] GET /api/auth/profile → 200 (with token)
    [x] GET /api/auth/profile → 401 (without token)
    [x] POST /api/auth/ → 201 (admin creates user)
    [x] Integration tests pass
[x] Task 7: Frontend Init
    [x] Vite + React 19 setup
    [x] MUI + Tailwind v4 configured
    [x] Layout shell (sidebar + header)
    [x] Frontend starts on :5173
[x] Task 8: Auth Frontend
    [x] Login form renders
    [x] Login with valid credentials → redirect to /
    [x] Login with invalid credentials → error message
    [x] Logout → redirect to /login
    [x] Zustand store persists token
    [x] Axios interceptor auto-attaches JWT
[x] Quality Gates
    [x] npm run lint — 0 issues
    [x] npm run typecheck — no errors
    [x] No export const db in codebase
    [x] 43+ tests, 5+ suites passing
```

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Factory functions** over global exports | Testability — no side effects at import time |
| **DI via constructor** | Same pattern as Go `NewRepository(db *bun.DB)` |
| **Interfaces for services/repos** | Mock injection in unit tests |
| **POST /filter** over GET for lists | URL length limit for complex filters |
| **Redis session** on top of JWT | Immediate session revocation |
| **Rate limit at Nginx**, not Express | App server stays thin — DevOps handles |
| **Version column** for all updates | Optimistic locking — prevent lost updates |

---

> **After Foundation + Auth**: You have a working app skeleton — login works, DB has data, infra runs.
> **Next**: Customer module (CRUD + Vehicles)
