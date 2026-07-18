# Versus Thailand ERP — Architecture

> **Project**: Study/Learning — No Production Deployment
> **Stack**: React 19 (MVC) + MUI + Tailwind / Node.js + Express 5 + TypeScript
> **Infra**: Docker — MySQL, MongoDB, Redis, RabbitMQ

---

## 1. Go → Node.js/TypeScript: ของที่ต้องปรับตัว

ในฐานะที่ถนัด Go (Echo + Bun ORM) มาดูว่าแต่ละ concept map ไปหา TypeScript ยังไง:

### 1.1 Concept Mapping

| Go Concept | TypeScript Equivalent | ความต่าง |
|------------|----------------------|----------|
| `type UserModel struct { ... }` | `interface UserModel { ... }` หรือ `type UserModel = { ... }` | เหมือนแทบ 100% |
| `bun.BaseModel` + struct tags | Drizzle schema (`mysqlTable`) | ไม่มี struct tags — ใช้ `mysqlTable('users', { ... })` |
| `goose` (database migration) | `drizzle-kit` | Schema = TypeScript → gen SQL → migrate |
| `bun.NewSelect().Model(&user).Where(...).Scan(ctx)` | `db.select().from(users).where(eq(...))` | Drizzle query builder — ใกล้เคียง Bun มาก |
| `*string` (nil pointer) | `string \| null` หรือ `?` ใน Zod | TypeScript มี optional/union types ละเอียดกว่า |
| `interface Repository { ... }` | `interface IUserRepository { ... }` | เหมือนกันเป๊ะ — duck typing |
| `func NewHandler(svc Service) *Handler` | `class Handler { constructor(svc: IService) {} }` | Go ใช้ function, TS ใช้ class constructor |
| `func (h *Handler) GetProfile(ctx echo.Context) error` | `async getProfile(req: Request, res: Response): Promise<void>` | TS ต้องใช้ `async/await` + `try/catch` แทน `if err != nil` |
| `ctx.Request().Context()` | `req` object (Express Request) | Express req มี req.params, req.query, req.body |
| `if err != nil { return ... }` | `try { ... } catch (err) { ... }` | ต้อง wrap ด้วย try/catch — ไม่มี explicit error return |
| `errors.Is(err, ErrUserNotFound)` | `err instanceof NotFoundError` หรือ check `err.code` | TS ใช้ custom Error class |
| `validator.Validate(struct)` | `zodSchema.parse(data)` | Zod = validator pack + type inference ในตัวเดียว |
| `go func() { ... }()` (goroutine) | `Promise.resolve().then(...)` หรือ Worker Thread | Node เป็น single-thread event loop — async/await ไม่ใช่ concurrency จริง |
| `bun.NewSelect().Model(&user).Where(...).Scan(ctx)` | `db.select().from(users).where(eq(...))` (Drizzle) — ใกล้เคียง Bun มาก |
| `RegisterRoutes(app, handler, mid)` | `userRoutes(handler, mid)` — export Router | Express ใช้ `express.Router()` แทน echo.Group |

### 1.2 อะไรที่ต้องปรับ mindset

| Go | Node.js | ทำไมต้องปรับ |
|----|---------|-------------|
| Compile-time type safety เต็ม 100% | TypeScript = compile-time types → หายไปตอน runtime (JS) | ต้องใช้ Zod validate ตอน runtime ด้วย อย่าชิลกับ type |
| Error handling explicit `if err != nil` | try/catch — ลืม catch ได้ | ต้อง discipline — ห้ามละเลย catch |
| Goroutine + Channel = concurrency จริง | Event loop — blocking code จะพังทั้ง server | ห้ามมี sync blocking (fs.readSync, crypto แบบ sync) |
| Zero-dependency mindset | npm = ไปรษณีย์ dependency (left-pad) | ต้องเลือก lib ดัง+มีคน maintain — เลือกผิด = technical debt |
| Struct method receiver | `this` ใน class method — context binding | Arrow function vs regular function matters |
| Interface satisfaction implicit | `implements` ชัดเจน ใน TS | TS ต้อง explicit `implements` หรือใช้ structural typing |

### 1.3 สรุป: ปรับตัวเยอะมั้ย?

**ไม่เยอะมาก** — เพราะ:
- TypeScript ให้ type system ที่ใกล้เคียง Go
- Interface, constructor injection, struct→interface map ได้ตรงๆ
- Zod (validation) + Drizzle (ORM) = โคตรใกล้เคียง `validate` tag + `bun` queries
- ปรับแค่ 2 เรื่องหลัก: try/catch mindset + async/await

---

## 2. Project Structure (Go-Style Domain Modules)

โครงสร้าง backend เลียนแบบ Go `internal/{module}/` pattern โดยตรง:

```
backend/
├── drizzle/                    # Drizzle migrations (auto-generated)
│   └── 0000_xxx.sql
├── drizzle.config.ts           # Drizzle Kit config
├── src/
│   ├── config/
│   │   ├── database.ts         # MySQL (Drizzle) + MongoDB connection
│   │   ├── schema.ts           # ⭐ ALL table definitions (single file)
│   │   ├── redis.ts            # Redis client
│   │   ├── rabbitmq.ts         # RabbitMQ connection + channel
│   │   └── index.ts            # Re-export all
│   │
│   ├── modules/                # ← "internal/" ใน Go — 1 folder = 1 domain module
│   │   │
│   │   ├── user/               # Authentication + User Management
│   │   │   ├── entity.ts       # DB model interface (≈ Go entity.go)
│   │   │   ├── schema.ts       # Zod schemas for request/response + validation (≈ Go request.go with validate tags)
│   │   │   ├── handler.ts      # HTTP handler class + constructor (≈ Go handler.go + user_handler.go)
│   │   │   ├── service.ts      # Business logic interface + impl (≈ Go service.go)
│   │   │   ├── repo.ts         # DB query interface + impl (≈ Go repo.go)
│   │   │   ├── route.ts        # Route registration function (≈ Go route.go)
│   │   │   └── user.test.ts    # Integration tests (≈ Go user_integration_test.go)
│   │   │
│   │   ├── customer/           # CRM: Customers + Vehicles
│   │   │   ├── entity.ts
│   │   │   ├── schema.ts
│   │   │   ├── handler.ts
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   ├── route.ts
│   │   │   └── customer.test.ts
│   │   │
│   │   ├── inventory/          # Products, Stock, Categories
│   │   │   ├── entity.ts
│   │   │   ├── schema.ts
│   │   │   ├── handler.ts
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   ├── route.ts
│   │   │   └── inventory.test.ts
│   │   │
│   │   ├── invoice/            # Sales, Quotations, Payments
│   │   │   ├── entity.ts
│   │   │   ├── schema.ts
│   │   │   ├── handler.ts
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   ├── route.ts
│   │   │   └── invoice.test.ts
│   │   │
│   │   ├── job/                # Installation Jobs, Queue, Technicians
│   │   │   ├── entity.ts
│   │   │   ├── schema.ts
│   │   │   ├── handler.ts
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   ├── route.ts
│   │   │   └── job.test.ts
│   │   │
│   │   ├── chat/               # AI Chatbot
│   │   │   ├── entity.ts       # Chat message (MongoDB document)
│   │   │   ├── schema.ts
│   │   │   ├── handler.ts
│   │   │   ├── service.ts      # LLM integration + SQL generation
│   │   │   ├── repo_mysql.ts   # Execute generated SQL on MySQL (read-only)
│   │   │   ├── repo_mongo.ts   # Chat history CRUD (MongoDB)
│   │   │   ├── sanitizer.ts    # SQL read-only guard
│   │   │   ├── formatter.ts    # Format results (CSV, HTML, JSON, Table)
│   │   │   ├── route.ts
│   │   │   └── chat.test.ts
│   │   │
│   │   └── dashboard/          # Summary, KPIs, Charts
│   │       ├── entity.ts
│   │       ├── schema.ts
│   │       ├── handler.ts
│   │       ├── service.ts      # Redis cache logic
│   │       ├── repo.ts
│   │       ├── route.ts
│   │       └── dashboard.test.ts
│   │
│   ├── shared/                 # Shared utilities (≈ Go pkg/)
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT + Redis session middleware
│   │   │   ├── rateLimit.ts    # Rate limiter (dev fallback — DevOps handles in prod)
│   │   │   └── validator.ts    # Zod validation middleware
│   │   ├── errors/
│   │   │   └── AppError.ts     # Custom error classes (≈ apperrors package)
│   │   ├── response/
│   │   │   └── handler.ts      # Unified response format (≈ response.HandleSuccess/HandleError)
│   │   ├── pagination/
│   │   │   └── helper.ts       # Pagination calculator (≈ common.CalculatePagination)
│   │   └── mapper/
│   │       └── map.ts          # Generic type mapper (≈ mapper.MapJSON)
│   │
│   ├── workers/                # RabbitMQ Consumers (Async Workers)
│   │   ├── reportWorker.ts     # erp.reports.generate queue
│   │   ├── notificationWorker.ts # erp.notifications.send queue
│   │   ├── aiWorker.ts         # erp.ai.expensive_query queue
│   │   └── auditWorker.ts      # erp.audit.log → MongoDB
│   │
│   ├── router.ts               # Central wiring (≈ internal/router/router.go)
│   └── app.ts                  # Express app entry (≈ main.go)
│
├── package.json
├── tsconfig.json
├── jest.config.ts
└── Dockerfile
```

### 2.1 เทียบกับ Go Structure

| Go (ของคุณ) | Node.js (ของเรา) | หน้าที่ |
|------------|------------------|--------|
| `internal/user/entity.go` | `modules/user/entity.ts` | DB model interface |
| `internal/user/request.go` | `modules/user/schema.ts` | Request DTO + Zod validation |
| `internal/user/handler.go` + `*_handler.go` | `modules/user/handler.ts` | HTTP handlers (all methods in one class) |
| `internal/user/service.go` | `modules/user/service.ts` | Business logic |
| `internal/user/repo.go` | `modules/user/repo.ts` | DB queries |
| `internal/user/route.go` | `modules/user/route.ts` | Route registration |
| `internal/router/router.go` | `src/router.ts` | Central wiring |
| `pkg/middleware/` | `shared/middleware/` | Cross-cutting |
| `pkg/apperrors/` | `shared/errors/` | Custom errors |
| `pkg/response/` | `shared/response/` | Response formatter |
| `pkg/common/` | `shared/pagination/` + `shared/mapper/` | Utilities |
| `goose` migration | `drizzle-kit` | Schema = TS → gen SQL → migrate |

### 2.3 Drizzle Schema + Migrations

#### schema.ts — Source of Truth (ไฟล์เดียวทั้งโปรเจกต์)

```ts
// backend/src/config/schema.ts
// ≈ Go: entity.go structs with bun tags — BUT all in ONE file for Drizzle
import { mysqlTable, varchar, text, int, decimal, timestamp, mysqlEnum, boolean, index } from 'drizzle-orm/mysql-core';

// ⭐ All table definitions — Drizzle uses this to gen migrations
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN']).notNull().default('STAFF'),
  isActive: boolean('is_active').notNull().default(true),
  version: int('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
});

export const customers = mysqlTable('customers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  version: int('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
},
(table) => [
  index('idx_customers_phone').on(table.phone),
  index('idx_customers_name').on(table.firstName, table.lastName),
]);

// ... products, invoices, invoice_items, jobs, job_status_logs, stock_movements, etc.
```

#### database.ts — Factory Function (NOT global)

```ts
// backend/src/config/database.ts
// ⭐ Factory — no side effects at import time
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

export function createDb() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'versus',
    password: process.env.MYSQL_PASSWORD || 'versus_dev',
    database: process.env.MYSQL_DATABASE || 'versus_erp',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_MAX_OPEN_CONNS) || 20,
    maxIdle: Number(process.env.MYSQL_MAX_IDLE_CONNS) || 10,
    idleTimeout: Number(process.env.MYSQL_CONN_MAX_IDLE_TIME) * 1000 || 300000,
    queueLimit: 0,
  });
  return drizzle(pool);
}

// ❌ ห้าม: export const db = drizzle(pool);  ← side effect at import = test ไม่ได้
```

#### app.ts — Create & Inject (เหมือน Go main.go)

```ts
import { createDb, createRedis, createRabbitMQ, connectMongo } from './config';
import { setupRoutes } from './router';

const db = createDb();         // factory — safe to call
const redis = createRedis();

async function start() {
  await connectMongo();
  const rabbit = await createRabbitMQ();

  setupRoutes(app, db, redis);  // inject all connections → router → repos
  app.listen(3000, () => console.log('ready'));
}
```

#### router.ts — Receive & Wire (เหมือน internal/router/router.go)

#### drizzle.config.ts

```ts
// backend/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/config/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    port: 3306,
    user: 'versus',
    password: 'versus_dev',
    database: 'versus_erp',
  },
});
```

#### Commands

```bash
npx drizzle-kit generate    # gen SQL migrations ลง drizzle/ (≈ goose create)
npx drizzle-kit migrate     # run migrations (≈ goose up)
npx drizzle-kit push        # push schema ตรงๆ (dev mode, ข้าม gen ไฟล์)
npx drizzle-kit studio      # GUI ดู/แก้ไขข้อมูล (≈ TablePlus)
npx drizzle-kit drop        # drop all tables (ระวัง!)
```

#### Flow: Add New Table

```
1. เพิ่ม table ใน schema.ts
2. npx drizzle-kit generate  → สร้าง drizzle/0001_xxx.sql
3. npx drizzle-kit migrate   → apply ลง DB
4. ใช้ใน repo: db.select().from(newTable)...
```

#### MongoDB — No Migration Needed

```ts
// backend/src/config/database.ts — MongoDB setup
import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient(process.env.MONGO_URI!);
await mongoClient.connect();
export const mongoDb = mongoClient.db('versus_erp');

// Create indexes on startup (run once)
await mongoDb.collection('chat_messages').createIndex({ sessionId: 1, createdAt: -1 });
await mongoDb.collection('activity_logs').createIndex({ userId: 1, createdAt: -1 });
```

MongoDB สร้าง collection + index อัตโนมัติเมื่อ insert ครั้งแรก — ไม่ต้องมี migration tool

### 2.4 Database Folder Structure

```
backend/
├── drizzle/                  ← auto-generated SQL files (ห้ามแก้มือ)
│   ├── 0000_users.sql
│   ├── 0001_customers.sql
│   └── ...
├── drizzle.config.ts         ← Drizzle Kit config
└── src/
    └── config/
        ├── schema.ts         ← ⭐ ALL table definitions (source of truth)
        └── database.ts       ← MySQL (Drizzle) + MongoDB connection
```

## 3. Module Template — มาตรฐานโค้ดแต่ละไฟล์

### 3.1 entity.ts — "เทียบเท่า entity.go"

```ts
// modules/user/entity.ts
// ≈ Go: type UserModel struct { bun.BaseModel `bun:"table:users"` ... }

export interface UserEntity {
  userId: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}
```

### 3.2 schema.ts — "เทียบเท่า request.go (struct + validate tags)"

```ts
// modules/user/schema.ts
// ≈ Go: type PatchProfileRequest struct { ... `validate:"..."` }
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1).max(255),
  password: z.string().min(6).max(128),
});

export const createUserSchema = z.object({
  username: z.string().min(1).max(255),
  password: z.string().min(6).max(128),
  displayName: z.string().min(1).max(255),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN']),
});

export const patchProfileSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).optional(),
  version: z.number().int().min(1), // optimistic lock
});

// Zod infers types automatically — เทียบเท่า Go response struct
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type PatchProfileInput = z.infer<typeof patchProfileSchema>;

// Response DTO
export interface UserResponse {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}
```

### 3.3 handler.ts — "เทียบเท่า handler.go + user_handler.go"

```ts
// modules/user/handler.ts
// ≈ Go:
//   type Handler struct { svc Service; validate *validator.Validate; logger *zap.Logger }
//   func NewHandler(svc Service, ...) *Handler { ... }
//   func (h *Handler) GetProfile(ctx echo.Context) error { ... }
import { Request, Response, NextFunction } from 'express';
import { IUserService } from './service';
import { createUserSchema, loginSchema, patchProfileSchema } from './schema';
import { sendSuccess, sendError } from '../../shared/response/handler';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../config/logger';

export class UserHandler {
  constructor(private svc: IUserService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = loginSchema.parse(req.body); // ≈ validate.Struct(req)
      const result = await this.svc.login(input);
      return sendSuccess(res, 200, 'success', { data: result });
    } catch (err) {
      // ≈ response.HandleError(ctx, err)
      if (err instanceof AppError) {
        return sendError(res, err.statusCode, err.message);
      }
      logger.error('login failed', err);
      return sendError(res, 500, 'Internal server error');
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId; // from auth middleware
      const profile = await this.svc.getProfile(userId);
      return sendSuccess(res, 200, 'success', { data: profile });
    } catch (err) {
      if (err instanceof AppError) return sendError(res, err.statusCode, err.message);
      logger.error('getProfile failed', err);
      return sendError(res, 500, 'Internal server error');
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createUserSchema.parse(req.body);
      const user = await this.svc.createUser(input);
      return sendSuccess(res, 201, 'created', { data: user });
    } catch (err) {
      if (err instanceof AppError) return sendError(res, err.statusCode, err.message);
      logger.error('createUser failed', err);
      return sendError(res, 500, 'Internal server error');
    }
  };
}
```

### 3.4 service.ts — "เทียบเท่า service.go"

```ts
// modules/user/service.ts
// ≈ Go:
//   type Service interface { GetProfile(...) (*UserResponse, error); ... }
//   type service struct { repo Repository; logger *zap.Logger }
//   func NewService(repo Repository, ...) Service { ... }
//   func (s *service) GetProfile(...) (*UserResponse, error) { ... }
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository } from './repo';
import { LoginInput, CreateUserInput, PatchProfileInput, UserResponse } from './schema';
import { UserEntity } from './entity';
import { NotFoundError, UnauthorizedError, AppError } from '../../shared/errors/AppError';
import { logger } from '../../config/logger';

export interface IUserService {
  login(input: LoginInput): Promise<{ token: string; user: UserResponse }>;
  getProfile(userId: string): Promise<UserResponse>;
  createUser(input: CreateUserInput): Promise<UserResponse>;
  updateProfile(userId: string, input: PatchProfileInput): Promise<UserResponse>;
}

export class UserService implements IUserService {
  constructor(private repo: IUserRepository) {}

  async login(input: LoginInput): Promise<{ token: string; user: UserResponse }> {
    // ≈ Go: user, err := s.repo.GetUserByEmail(ctx, email)
    const user = await this.repo.findByUsername(input.username);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return { token, user: this.toResponse(user) };
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return this.toResponse(user);
  }

  async createUser(input: CreateUserInput): Promise<UserResponse> {
    const existing = await this.repo.findByUsername(input.username);
    if (existing) throw new AppError(409, 'Username already exists');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.repo.create({
      ...input,
      passwordHash,
      isActive: true,
      version: 1,
    });
    return this.toResponse(user);
  }

  private toResponse(user: UserEntity): UserResponse {
    return {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
```

### 3.5 repo.ts — "เทียบเท่า repo.go"

```ts
// modules/user/repo.ts
// ≈ Go:
//   type Repository interface { GetUserByID(...) (*UserModel, error); ... }
//   type repository struct { db *bun.DB }
//   func NewRepository(db *bun.DB) Repository { ... }
//   func (r *repository) GetUserByID(...) (*UserModel, error) { ... }
import { eq } from 'drizzle-orm';
import { db } from '../../config/database';         // MySQL pool
import { users } from '../../config/schema';         // Drizzle table definitions
import { UserEntity } from './entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  create(data: Partial<UserEntity>): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>, version: number): Promise<UserEntity | null>;
  softDelete(id: string, version: number): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    // ≈ Go: r.db.NewSelect().Model(&user).Where("user_id = ?", id).Scan(ctx)
    const result = await db.select().from(users).where(eq(users.userId, id)).limit(1);
    return result[0] ?? null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] ?? null;
  }

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const [user] = await db.insert(users).values(data).$returningId();
    return user as UserEntity;
  }

  async update(id: string, data: Partial<UserEntity>, version: number): Promise<UserEntity | null> {
    // ≈ Go: r.db.NewUpdate().Model(user).Where("version = ?", currentVersion).Exec(ctx)
    const [updated] = await db
      .update(users)
      .set({ ...data, version: version + 1, updatedAt: new Date() })
      .where(eq(users.userId, id))
      .where(eq(users.version, version)) // optimistic lock
      .$returningId();

    return updated as UserEntity ?? null;
  }
}
```

### 3.6 route.ts — "เทียบเท่า route.go"

```ts
// modules/user/route.ts
// ≈ Go:
//   func RegisterRoutes(app *echo.Echo, h *Handler, mid *middleware.Middleware) {
//     user := app.Group("/api/user", mid.IsHaveTokenMiddleware())
//     user.GET("/profile", h.GetProfile)
//   }
import { Router } from 'express';
import { UserHandler } from './handler';
import { authMiddleware } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validator';
import { createUserSchema, loginSchema, patchProfileSchema } from './schema';

export function registerUserRoutes(handler: UserHandler): Router {
  const router = Router();

  // Public
  router.post('/login', validate(loginSchema), handler.login);

  // Authenticated
  router.get('/profile', authMiddleware, handler.getProfile);
  router.patch('/profile', authMiddleware, validate(patchProfileSchema), handler.updateProfile);

  // Admin only
  router.post('/', authMiddleware('ADMIN'), validate(createUserSchema), handler.createUser);

  return router;
}
```

---

## 4. Central Wiring — Router

`router.ts` — เทียบเท่า `internal/router/router.go`:

```ts
// src/router.ts
// ≈ Go: func Setup(app *echo.Echo, mid *middleware.Middleware, userHandler *user.Handler, ...) { ... }
import { Express } from 'express';
import { UserHandler } from './modules/user/handler';
import { UserService } from './modules/user/service';
import { UserRepository } from './modules/user/repo';
import { registerUserRoutes } from './modules/user/route';
// ... import all modules

export function setupRoutes(app: Express): void {
  // Instantiate → exactly like Go's dependency injection
  const userRepo = new UserRepository();
  const userSvc = new UserService(userRepo);
  const userHandler = new UserHandler(userSvc);
  app.use('/api/auth', registerUserRoutes(userHandler));

  // Repeat for all modules:
  // customerRepo → customerSvc → customerHandler → app.use('/api/customers', ...)
  // inventoryRepo → inventorySvc → inventoryHandler → app.use('/api/inventory', ...)
  // invoiceRepo → invoiceSvc → invoiceHandler → app.use('/api/sales', ...)
  // jobRepo → jobSvc → jobHandler → app.use('/api/jobs', ...)
  // chatService → chatHandler → app.use('/api/chat', ...)
  // dashboardSvc → dashboardHandler → app.use('/api/dashboard', ...)
}
```

### Wire-Up Diagram

```
                      src/app.ts
                           │
                    src/router.ts
                           │
    ┌──────────┬───────────┼───────────┬──────────┐
    ▼          ▼           ▼           ▼          ▼
  user/     customer/  inventory/  invoice/    chat/
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
          handler.ts  service.ts  repo.ts
              │           │           │
              ▼           ▼           ▼
          Express      Business      MySQL
          Request      Logic         Queries
```

---

## 5. Full System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React 19 + Vite)                   │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Login    │ │Customers │ │Inventory │ │ Chat Panel            │ │
│  │ Page     │ │ CRM      │ │ Stock    │ │ • Streaming (SSE)     │ │
│  │          │ │ • List   │ │ • List   │ │ • Format Selector     │ │
│  │          │ │ • Detail │ │ • Detail │ │ • Polling (async)     │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┬───────────┘ │
│                                                     │             │
│  ┌──────────────────────────────────────────────────┼───────────┐ │
│  │ Dashboard (Recharts)         │ reports/download  │           │ │
│  │ • Today Sales                │ (poll job status) │           │ │
│  │ • Job Queue                  │                   │           │ │
│  │ • Low Stock Alerts           │                   │           │ │
│  └──────────────────────────────┴───────────────────┴───────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP REST + SSE (streaming)
┌───────────────────────────▼─────────────────────────────────────┐
│                    Backend (Express + TypeScript)                 │
│                                                                   │
│  ┌──────────────────── src/router.ts ────────────────────────┐   │
│  │  Wire all modules: handler → service → repo               │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌────── src/shared/middleware ──────┐                           │
│  │ auth.ts   → JWT + Redis session   │                           │
│  │ rateLimit.ts → Redis-based        │                           │
│  │ validator.ts → Zod schema parser  │                           │
│  └───────────────────────────────────┘                           │
│                                                                   │
│  ┌──────────────── src/workers ──────────────────────────────┐   │
│  │ RabbitMQ Consumers:                                        │   │
│  │  reportWorker.ts       → erp.reports.generate              │   │
│  │  notificationWorker.ts → erp.notifications.send            │   │
│  │  aiWorker.ts           → erp.ai.expensive_query            │   │
│  │  auditWorker.ts        → erp.audit.log                     │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────┬──────────────┬──────────────┬──────────────┬──────────────┘
       │              │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼───────────┐ ┌▼──────────────┐
│   MySQL 8.4 │ │  Redis 7   │ │ RabbitMQ 3.13 │ │  MongoDB 7    │
│   Port 3306 │ │  Port 6379 │ │ Port 5672     │ │  Port 27017   │
│             │ │            │ │ Port 15672    │ │               │
│ • Users     │ │ • Sessions │ │ • reports     │ │ • Chat Msgs   │
│ • Customers│ │ • Dashboard│ │ • notif       │ │ • Audit Logs  │
│ • Products │ │ • Rate     │ │ • ai.expensive│ │               │
│ • Invoices │ │ • AI Cache │ │ • stock.alert │ │               │
│ • Jobs     │ │ • Job Queue│ │ • audit.log   │ │               │
└─────────────┘ └────────────┘ └───────────────┘ └───────────────┘
```

---

## 6. DevOps Layer (Reverse Proxy Strategy)

อ่านเต็มที่ `spec/phase/09_DEVOPS.md`

### Philosophy: App Server บางที่สุด

```
สิ่งที่ App Server (Express) ทำ:
  ✅ CORS allow all (origin: '*')       ← DevOps ค่อย filter ที่ reverse proxy
  ✅ JSON parsing (Express 5 built-in)   ← ไม่ต้อง body-parser
  ✅ Health check
  ✅ Business routes

สิ่งที่ DevOps (Nginx/Traefik) ทำ:
  🔒 Rate Limiting
  🔒 CORS (actual restriction)
  🔒 Security Headers (CSP, HSTS, X-Frame)
  🔒 HTTPS/TLS Termination
  🔒 Static File Serving (frontend build)
  🔒 Compression (gzip/brotli)
  🔒 Access Logs
```

### Express 5 — What Changed from v4

| v4 | v5 | Impact |
|----|----|--------|
| `npm i express @types/express body-parser` | `npm i express` | Types in-box, JSON parsing built-in |
| `app.use(express.json())` | Same | No change |
| `app.use(cors({ origin: '*' }))` | Same | ยัง allow all — Nginx filter จริง |
| `helmet()` | Optional (Nginx handles) | ถ้ามี reverse proxy = disable helmet |
| `rateLimit.ts` middleware | Remove (Nginx handles) | ลดโค้ดใน app server |
| Error: 4-arg handler | Same | `(err, req, res, next)` |
| `req.query` prototype pollution | Fixed in v5 | ปลอดภัยกว่า |

### App Server Middleware (Minimal)

```ts
// app.ts — Express 5, บางที่สุด
import express from 'express';
import cors from 'cors';
import { setupRoutes } from './router';

const app = express();

app.use(cors({ origin: '*' }));  // allow all — Nginx filters origins
app.use(express.json());         // Express 5 built-in

app.get('/health', (_req, res) => res.json({ code: 200, message: 'healthy' }));

setupRoutes(app);

export default app;
```

> **Note**: ถ้า dev โดยตรง (ไม่มี reverse proxy) — helmet + rateLimit ยังมีอยู่เป็น fallback
> ถ้ามี Nginx/Traefik หน้าบ้าน → helmet + rateLimit ปิดได้ ย้ายไป DevOps layer

---

## 7. Frontend MVC Architecture

### 6.1 MVC in React — วิธีคิด

React ไม่ใช่ MVC framework โดยธรรมชาติ — ต้องประยุกต์:

| MVC | React Equivalent | ไฟล์ | หน้าที่ |
|-----|-----------------|------|--------|
| **Model** | API service + TypeScript types | `model.ts` | fetch/send data, type definitions — **ห้าม import React** |
| **View** | React Component (presentation only) | `view.tsx` | JSX rendering, props รับจาก controller — **ไม่เรียก API โดยตรง** |
| **Controller** | Custom Hook (useXxx) | `controller.ts` | state, logic, orchestrates Model ↔ View — "สมอง" ของ module |

### 6.2 Mapping กับ Backend Go-Style

```
Backend (Go-style)              Frontend (MVC)
─────────────────────────────    ─────────────────────────────
modules/user/                    modules/auth/
  entity.ts   → DB model          model.ts    → API types + API calls
  schema.ts   → Zod validation    model.ts    → (รวม types + api ในไฟล์เดียว)
  handler.ts  → HTTP handler      view.tsx    → Component (รับ props, render JSX)
  service.ts  → Business logic    controller.ts → Hook (state, logic, call model)
  repo.ts     → DB queries        model.ts    → (api call = remote "repo")
  route.ts    → Route reg         router.tsx  → (อยู่แยกที่ root, map route → view)
```

**เทียบตรงๆ**:
- Backend `handler.ts` ≈ Frontend `controller.ts` — รับ input → call logic → return output
- Backend `repo.ts` ≈ Frontend `model.ts` (ส่วน API call) — ต่อ external data source
- Backend `service.ts` ≈ Frontend `controller.ts` (ส่วน logic) — business rules

### 6.3 Frontend Project Structure

```
frontend/src/
├── modules/                      ← MVC per domain
│   ├── auth/
│   │   ├── model.ts              ← authApi.login(), LoginInput, AuthResponse
│   │   ├── view.tsx              ← LoginForm, (receives props from controller)
│   │   └── controller.ts         ← useAuth() hook: state, login(), logout()
│   │
│   ├── customer/
│   │   ├── model.ts              ← customerApi.getAll(), CustomerEntity
│   │   ├── view.tsx              ← CustomerTable, CustomerDetailCard
│   │   └── controller.ts         ← useCustomerList(), useCustomerDetail()
│   │
│   ├── inventory/
│   │   ├── model.ts              ← inventoryApi, ProductEntity, StockMovement
│   │   ├── view.tsx              ← ProductTable, StockBadge, CategoryFilter
│   │   └── controller.ts         ← useInventory(), useLowStockAlert()
│   │
│   ├── invoice/
│   │   ├── model.ts              ← invoiceApi, InvoiceEntity, PaymentInput
│   │   ├── view.tsx              ← InvoiceForm, InvoiceTable, PaymentDialog
│   │   └── controller.ts         ← useInvoiceCreate(), useTodaySummary()
│   │
│   ├── job/
│   │   ├── model.ts              ← jobApi, JobEntity, QueueItem
│   │   ├── view.tsx              ← JobQueue, JobKanban, StatusBadge
│   │   └── controller.ts         ← useJobQueue(), useJobStatusUpdate()
│   │
│   ├── chat/
│   │   ├── model.ts              ← chatApi.send(), SSE stream, ChatMessage (Mongo doc)
│   │   ├── view.tsx              ← ChatPanel, MessageBubble, FormatSelector
│   │   └── controller.ts         ← useChat(): send, streaming, poll async, export
│   │
│   └── dashboard/
│       ├── model.ts              ← dashboardApi.getSummary(), KpiData
│       ├── view.tsx              ← KpiCards, SalesChart, JobQueueWidget
│       └── controller.ts         ← useDashboard(): cache-aware, auto-refresh
│
├── shared/                       ← Cross-module (ไม่ใช่ MVC)
│   ├── components/               ← UI primitives (Button, Table, Modal, Layout)
│   ├── hooks/                    ← Generic hooks (useAuth, useDebounce, usePagination)
│   └── utils/                    ← formatCurrency(), formatDate(), downloadCsv()
│
├── config/
│   └── api.ts                    ← Axios instance + JWT interceptor + error handler
│
├── stores/                       ← Zustand global state (auth store, UI theme)
│
├── router.tsx                    ← React Router config (path → module view)
├── App.tsx
└── main.tsx
```

### 6.4 MVC Template — Butละไฟล์

#### `model.ts` — Data Layer

```ts
// modules/customer/model.ts
// = Model: API calls + TypeScript types
// ห้าม import React หรือ JSX

import { api } from '../../config/api';

// —— Types ——
export interface CustomerEntity {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: string;
}

export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// —— API Calls ——
export const customerApi = {
  getAll: async (params: CustomerListParams): Promise<PaginatedResponse<CustomerEntity>> => {
    const { data } = await api.get('/customers', { params });
    return data;
  },

  getById: async (id: string): Promise<CustomerEntity> => {
    const { data } = await api.get(`/customers/${id}`);
    return data.data;
  },

  create: async (input: Partial<CustomerEntity>): Promise<CustomerEntity> => {
    const { data } = await api.post('/customers', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CustomerEntity>): Promise<CustomerEntity> => {
    const { data } = await api.put(`/customers/${id}`, input);
    return data.data;
  },
};
```

#### `controller.ts` — Logic + State

```ts
// modules/customer/controller.ts
// = Controller: Custom hook — state, logic, call model
// เปรียบเสมือน service.go + handler.go รวมกัน

import { useState, useEffect, useCallback } from 'react';
import { customerApi, CustomerEntity, CustomerListParams, PaginatedResponse } from './model';

interface UseCustomerListReturn {
  customers: CustomerEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResponse<CustomerEntity>['pagination'] | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
}

export function useCustomerList(): UseCustomerListReturn {
  const [customers, setCustomers] = useState<CustomerEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<CustomerEntity>['pagination'] | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerApi.getAll({ page, pageSize: 20, search: search || undefined });
      setCustomers(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return { customers, loading, error, pagination, refetch: fetchCustomers, setPage, setSearch };
}
```

#### `view.tsx` — Presentation Only

```tsx
// modules/customer/view.tsx
// = View: UI component — presentation only
// รับ props จาก controller, ห้าม import model หรือ call API
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, Box, CircularProgress, Alert } from '@mui/material';
import type { CustomerEntity, PaginatedResponse } from './model';

interface CustomerListViewProps {
  customers: CustomerEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResponse<CustomerEntity>['pagination'] | null;
  onSearch: (q: string) => void;
  onPageChange: (page: number) => void;
  onSelectCustomer: (customer: CustomerEntity) => void;
}

export function CustomerListView({
  customers, loading, error, pagination,
  onSearch, onPageChange, onSelectCustomer,
}: CustomerListViewProps) {
  // View = JSX only, no API calls, no useState for data
  const columns = [
    { field: 'firstName', headerName: 'ชื่อ', width: 150 },
    { field: 'lastName', headerName: 'นามสกุล', width: 150 },
    { field: 'phone', headerName: 'เบอร์โทร', width: 150 },
  ];

  return (
    <Box>
      <TextField label="ค้นหา" onChange={(e) => onSearch(e.target.value)} />

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <DataGrid
          rows={customers}
          columns={columns}
          paginationModel={{
            page: (pagination?.page ?? 1) - 1,
            pageSize: pagination?.pageSize ?? 20,
          }}
          onPaginationModelChange={(m) => onPageChange(m.page + 1)}
          rowCount={pagination?.total ?? 0}
          onRowClick={(row) => onSelectCustomer(row.row)}
        />
      )}
    </Box>
  );
}
```

#### Wiring View + Controller (ใน Router)

```tsx
// router.tsx — ไม่ใช่ไฟล์ใน module แต่เป็น root file
// = Maps URL → View, connects controller to view
import { CustomerListView } from './modules/customer/view';
import { useCustomerList } from './modules/customer/controller';

function CustomerListPage() {
  // Controller = hook → state + logic
  const { customers, loading, error, pagination, setPage, setSearch } = useCustomerList();

  // View = component → receives props from controller
  return (
    <CustomerListView
      customers={customers}
      loading={loading}
      error={error}
      pagination={pagination}
      onSearch={setSearch}
      onPageChange={setPage}
      onSelectCustomer={(c) => navigate(`/customers/${c.id}`)}
    />
  );
}
```

### 6.5 MVC Data Flow

```
User Action (click, type)
        │
        ▼
  view.tsx                     ← Presentation: renders UI, captures events
  onSearch("สมชาย")             ← Calls callback prop from controller
        │
        ▼
  controller.ts                ← Controller: sets state, triggers model
  setSearch("สมชาย")            ← Updates state → triggers useEffect
  fetchCustomers()             ← Calls model.getAll()
        │
        ▼
  model.ts                     ← Model: HTTP request
  customerApi.getAll({search}) ← axios → GET /api/customers?search=สมชาย
        │
        ▼
  Backend API                  ← Express handler → service → repo → MySQL
        │
        ▼ (response)
  model.ts ← JSON              ← Receives data → returns to controller
        │
        ▼
  controller.ts                ← Sets customers state → triggers re-render
  setCustomers(result.data)
        │
        ▼
  view.tsx                     ← Re-renders with new data
  <DataGrid rows={customers}>
```

### 6.6 MVC Rules

| Rule | รายละเอียด |
|------|-----------|
| **Model ห้าม import React** | `model.ts` = pure TypeScript, API calls only |
| **View ห้าม call API** | `view.tsx` รับ data ผ่าน props, เรียก callback เมื่อ user interact |
| **Controller เป็น hook** | `controller.ts` = `useXxx()` hook, เก็บ state, logic, refetch |
| **1 module = 3 files** | `model.ts` + `view.tsx` + `controller.ts` — เทียบเท่า Go `entity.go` + `handler.go` + `service.go` |
| **Shared components** | `Button`, `Table`, `Modal` อยู่ `shared/components/` — ไม่ใช่ MVC |

---

## 8. Data Flows

### 8.1 Standard CRUD Flow (Customer Example)

```
Frontend                  Backend                     MySQL
   │                         │                          │
   │  GET /api/customers     │                          │
   │────────────────────────►│                          │
   │                         │  authMiddleware          │
   │                         │  ├─ verify JWT           │
   │                         │  └─ check Redis session  │
   │                         │                          │
   │                         │  CustomerHandler.list()  │
   │                         │  └─ svc.listCustomers()  │
   │                         │                          │
   │                         │  CustomerRepo.findAll()  │
   │                         │─────────────────────────►│
   │                         │◄─────────────────────────│
   │                         │                          │
   │◄── 200 { data: [...] }─│                          │
```

### 8.2 AI Chat Flow (Synchronous)

```
Frontend                  Backend                     LLM API        MySQL        Redis
   │                         │                          │              │            │
   │  POST /api/chat/send    │                          │              │            │
   │  { question: "วันนี้     │                          │              │            │
   │    ยอดขายเท่าไหร่" }     │                          │              │            │
   │────────────────────────►│                          │              │            │
   │                         │  ChatService.ask()       │              │            │
   │                         │                          │              │            │
   │                         │  1. Check Redis cache    │              │            │
   │                         │─────────────────────────────────────────────────────►│
   │                         │◄───────────── cache miss ─────────────────────────────│
   │                         │                          │              │            │
   │                         │  2. Build prompt +       │              │            │
   │                         │     DB schema context    │              │            │
   │                         │─────────────────────────►│              │            │
   │                         │◄── SQL query ────────────│              │            │
   │                         │                          │              │            │
   │                         │  3. Sanitize SQL         │              │            │
   │                         │     (read-only check)    │              │            │
   │                         │                          │              │            │
   │                         │  4. Execute on MySQL     │              │            │
   │                         │────────────────────────────────────────►│            │
   │                         │◄─────────── rows ───────────────────────│            │
   │                         │                          │              │            │
   │                         │  5. Cache result         │              │            │
   │                         │─────────────────────────────────────────────────────►│
   │                         │                          │              │            │
   │                         │  6. Format + Return      │              │            │
   │◄── SSE: { answer,       │                          │              │            │
   │     data, format }      │                          │              │            │
   │                         │                          │              │            │
   │                         │  7. Fire-and-forget →    │              │            │
   │                         │     audit.log queue      │              │            │
   │                         │─────────────────────────────────────────────┐        │
   │                         │                          │              │   │        │
   │                         │                          │    ┌─────────▼───────────┐
   │                         │                          │    │ auditWorker.ts      │
   │                         │                          │    │ → MongoDB           │
   │                         │                          │    └─────────────────────┘
```

### 8.3 AI Chat Flow (Async — Heavy Query / Export)

```
Frontend            Backend                   RabbitMQ          Worker              Redis
   │                   │                         │                │                  │
   │  POST /chat/send  │                         │                │                  │
   │  "export ยอดทั้ง   │                         │                │                  │
   │   ปีเป็น CSV"      │                         │                │                  │
   │──────────────────►│                         │                │                  │
   │                   │  ChatService detects     │                │                  │
   │                   │  heavy query →           │                │                  │
   │                   │  publish to queue        │                │                  │
   │                   │─────────────────────────►│                │                  │
   │                   │                         │                │                  │
   │◄── 202 { jobId }──│                         │  aiWorker.ts   │                  │
   │                   │                         │  picks up msg  │                  │
   │                   │                         │───────────────►│                  │
   │                   │                         │                │  Execute query    │
   │                   │                         │                │  Generate CSV     │
   │                   │                         │                │                  │
   │  GET /chat/job/   │                         │                │  Store result     │
   │      :jobId       │                         │                │─────────────────►│
   │  (poll every 2s)  │                         │                │                  │
   │──────────────────►│  Read Redis             │                │                  │
   │                   │───────────────────────────────────────────────────────────►│
   │                   │◄────── status: "done" ──────────────────────────────────────│
   │◄── 200 { status:  │                         │                │                  │
   │     "done",        │                         │                │                  │
   │     downloadUrl }  │                         │                │                  │
```

### 8.4 Report Generation Flow (RabbitMQ)

```
Frontend            Backend                   RabbitMQ          reportWorker       MySQL
   │                   │                         │                │                  │
   │  POST /reports    │                         │                │                  │
   │  /monthly-sales   │                         │                │                  │
   │──────────────────►│                         │                │                  │
   │                   │  publish →              │                │                  │
   │                   │  erp.reports.generate   │                │                  │
   │                   │─────────────────────────►│                │                  │
   │◄── 202 { jobId }──│                         │                │                  │
   │                   │                         │───────────────►│                  │
   │                   │                         │                │  Query DB         │
   │                   │                         │                │─────────────────►│
   │                   │                         │                │◄────────────────│
   │                   │                         │                │  Build PDF        │
   │                   │                         │                │                  │
   │                   │                         │                │  Publish →        │
   │                   │                         │                │  notif queue      │
   │                   │                         │◄───────────────│                  │
   │                   │◄── notification ────────│                                  │
   │                   │  (via SSE/Long Poll)    │                                  │
   │◄── download link ─│                         │                                  │
```

---

## 9. Key Design Patterns

### 9.1 Dependency Injection (Go-style → TypeScript)

```
Go:
  handler := user.NewHandler(svc, validate, logger)
  service := user.NewService(repo, logger, auditService)
  repo := user.NewRepository(db)

TypeScript:
  const repo = new UserRepository();
  const svc = new UserService(repo);
  const handler = new UserHandler(svc);
  // all wired in src/router.ts — same as internal/router/router.go
```

### 9.2 Interface-based Design (เหมือน Go เป๊ะ)

```ts
// repo.ts — interface defines contract
export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  create(data: Partial<UserEntity>): Promise<UserEntity>;
}

// service.ts — depends on interface, not implementation
export class UserService implements IUserService {
  constructor(private repo: IUserRepository) {} // ← interface injection
}

// Test can mock:
const mockRepo: IUserRepository = {
  findById: jest.fn().mockResolvedValue(mockUser),
  create: jest.fn().mockResolvedValue(mockUser),
};
const svc = new UserService(mockRepo); // ← swap real for mock in tests
```

### 9.3 Optimistic Locking (Version Check)

```ts
// repo.ts — same pattern as your Go code (version column)
async update(id: string, data: Partial<UserEntity>, version: number) {
  const [updated] = await db
    .update(users)
    .set({ ...data, version: version + 1 })
    .where(eq(users.userId, id))
    .where(eq(users.version, version)); // ← version check
  return updated ?? null; // null = version mismatch
}

// service.ts — handle like Go:
// if strings.Contains(err.Error(), "version mismatch") { return apperrors.Conflict(...) }
if (!updated) {
  throw new ConflictError('Version mismatch — data was modified by another user');
}
```

### 9.4 Fire-and-Forget Audit Log (Non-blocking)

```ts
// Go: _ = s.auditService.InsertAuditLog(...)  // ignore error, non-blocking
// TS: Same pattern
try {
  await publishToQueue('erp.audit.log', { action, entity, changes });
} catch (err) {
  logger.warn('audit log publish failed, continuing...', err);
  // Don't throw — audit failure must not block main request
}
```

---

## 10. Coding Rules — ห้ามละเมิด

อิงจาก `/Users/lolymarsh/Desktop/project/be-go-echo/pkg/request/request.go` และ `pkg/common/pagination_helper.go`

### 10.1 Pagination — ทุก List/GET/Filter ต้องมี

**Rule**: ทุก endpoint ที่ return รายการ (list) ต้องรับ pagination params และ return pagination metadata

#### Backend — Request Schema

```ts
// shared/schema/pagination.ts
// ≈ Go: pkg/request/request.go#FilterRequest
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number().int().min(1),             // ต้อง > 0
  pageSize: z.number().int().min(1).max(100), // 1-100
  sortName: z.string().optional(),            // ชื่อ field ที่จะ sort
  sortBy: z.enum(['asc', 'desc']).optional(), // asc หรือ desc
});

export const filterSchema = z.object({
  field: z.string().min(1).max(50),
  value: z.string().max(255).optional(),
  values: z.array(z.string()).max(100).optional(),
  greaterThan: z.number().optional(),
  lessThan: z.number().optional(),
  fromDate: z.number().optional(),   // unix ms
  toDate: z.number().optional(),     // unix ms
});

export const filterRequestSchema = paginationSchema.extend({
  filters: z.array(filterSchema).max(20).optional(),
});

export type FilterRequest = z.infer<typeof filterRequestSchema>;
export type Filter = z.infer<typeof filterSchema>;
```

#### Backend — Pagination Response

```ts
// shared/response/handler.ts — add PaginationResponse
// ≈ Go: pkg/response/response.go#PaginationResponse
export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  pagination?: PaginationResponse;  // ← ต้องมีทุก list endpoint
}

export function calculatePagination(page: number, pageSize: number, totalData: number): PaginationResponse {
  // ≈ Go: pkg/common/pagination_helper.go#CalculatePagination
  const totalPage = Math.ceil(totalData / pageSize);
  return {
    page,
    pageSize,
    totalData,
    totalPage,
    hasNextPage: page < totalPage,
    hasPreviousPage: page > 1,
  };
}
```

#### Example — Handler ต้อง return pagination เสมอ

```ts
// modules/customer/handler.ts — list endpoint
filterCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = filterRequestSchema.parse(req.body);
    const { data, total } = await this.svc.filterCustomers(filters);
    const pagination = calculatePagination(filters.page, filters.pageSize, total);

    return sendSuccess(res, 200, 'success', {
      data,
      pagination,  // ← ต้องมีทุก list
    });
  } catch (err) { /* ... */ }
};
```

#### ❌ Anti-patterns

```ts
// ❌ ห้าม: ไม่รับ pagination
app.get('/customers', handler.getAll);  // ดึงหมด = ระเบิดเมื่อมี 10,000 rows

// ❌ ห้าม: ไม่ return pagination
return res.json({ data: customers });  // หน้าบ้านไม่รู้ว่ามีอีกกี่หน้า

// ❌ ห้าม: ใช้ query string แทน body ใน filter
app.get('/customers?page=1&pageSize=10&filters=[...]');  // URL ยาวเกิน
```

#### ✅ Correct Pattern

```ts
// ✅ POST /api/customers/filter — filter + pagination ใน body
app.post('/customers/filter', authMiddleware, handler.filterCustomers);
// Body: { "page": 1, "page_size": 10, "sort_name": "created_at", "sort_by": "desc", "filters": [...] }
// Response: { "code": 200, "data": [...], "pagination": { "page": 1, "page_size": 10, "total_data": 42, "total_page": 5, "has_next_page": true, "has_previous_page": false } }

// ✅ GET /api/customers/:id — single record, no pagination needed
app.get('/customers/:id', authMiddleware, handler.getById);
// Response: { "code": 200, "data": { "id": "...", ... } }
```

### 10.2 Transaction — Multi-Table Writes ต้องใช้ DB Transaction

**Rule**: เมื่อ API หนึ่งต้อง insert/update/delete หลายตารางพร้อมกัน — **ห้าม execute ทีละ query** ต้อง wrap ด้วย transaction

#### ตัวอย่างกรณีต้องใช้ Transaction

| Scenario | Tables Affected | ทำไมต้อง Transaction |
|----------|----------------|---------------------|
| สร้าง Invoice | `invoices` + `invoice_items` + `stock_movements` + ลด `products.current_stock` | ถ้าตัดสต็อกแล้วแต่ออกบิลไม่สำเร็จ = สต็อกหาย |
| เปลี่ยนสถานะ Job เป็น COMPLETED | `jobs` + `job_status_logs` + `stock_movements` (ถ้ามีของใช้เพิ่ม) | status เปลี่ยนแต่ log ไม่เขียน = audit trail พัง |
| รับของเข้า Purchase Order | `purchase_orders` + `stock_movements` + `products.current_stock` | ของเข้าระบบแต่สต็อกไม่เพิ่ม |
| Soft Delete User | `users` + revoke sessions in Redis | user ถูกลบแต่ session ยังใช้ได้ |

#### Implementation — Repo Layer

```ts
// modules/invoice/repo.ts
// ≈ Go: repo.go ใช้ tx.NewSelect(), tx.NewInsert() ใน bun
import { db } from '../../config/database';
import { invoices, invoiceItems, stockMovements, products } from '../../config/schema';
import { eq } from 'drizzle-orm';

export interface CreateInvoiceData {
  invoice: typeof invoices.$inferInsert;
  items: (typeof invoiceItems.$inferInsert)[];
}

export class InvoiceRepository implements IInvoiceRepository {

  async createInvoice(data: CreateInvoiceData): Promise<InvoiceEntity> {
    // ⭐ Transaction: invoice + items + stock — all or nothing
    return await db.transaction(async (tx) => {
      // 1. Insert invoice
      const [inv] = await tx.insert(invoices).values(data.invoice).$returningId();

      // 2. Insert invoice items
      for (const item of data.items) {
        await tx.insert(invoiceItems).values({ ...item, invoiceId: inv.id });
      }

      // 3. Deduct stock + log stock movement
      for (const item of data.items) {
        // Get current stock with row lock
        const [product] = await tx
          .select({ stock: products.currentStock, version: products.version })
          .from(products)
          .where(eq(products.id, item.productId))
          .for('update');  // ← lock row ป้องกัน race condition

        if (!product || product.stock < item.quantity) {
          throw new AppError(400, `Stock insufficient for product ${item.productId}`);
        }

        await tx
          .update(products)
          .set({ currentStock: product.stock - item.quantity, version: product.version + 1 })
          .where(eq(products.id, item.productId));

        await tx.insert(stockMovements).values({
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          referenceType: 'invoice',
          referenceId: inv.id,
        });
      }

      return inv as InvoiceEntity;
    });  // ← ถ้า throw ทุกอย่าง rollback อัตโนมัติ
  }
}
```

#### ❌ Anti-patterns

```ts
// ❌ ห้าม: insert ทีละ query ไม่มี transaction
async createInvoice(data) {
  const inv = await db.insert(invoices).values(data.invoice);      // query 1
  await db.insert(invoiceItems).values(...);                        // query 2 — ถ้าพัง = orphan invoice
  await db.update(products).set(...).where(...);                     // query 3 — ถ้าพัง = stock mismatch
}
// Chaos: invoice อาจถูกสร้างแต่ items ไม่ครบ, หรือ items ครบแต่ stock ไม่ตรง

// ❌ ห้าม: ไม่ lock row ก่อน update stock
const [product] = await db.select().from(products).where(...);     // no FOR UPDATE
// ... some delay ...
await db.update(products).set({ stock: product.stock - qty });     // race condition!
```

### 10.3 Optimistic Locking — Version Check ทุก PATCH/PUT

**Rule**: ทุก PATCH/PUT/DELETE ต้องรับ `version` จากหน้าบ้าน หลังบ้าน query เช็ค version ตรงกัน — ถ้าไม่ตรง = มีคนแก้ไขไปแล้ว → return 409 Conflict

#### Why

```
User A และ User B เปิดหน้า customer เดียวกัน พร้อมกัน (version=5)
User A กด save → version 5 ตรง → update สำเร็จ → version เป็น 6
User B กด save → version 5 ไม่ตรง (ตอนนี้เป็น 6 แล้ว) → 409 Conflict
→ User B ต้อง refresh แล้วแก้ใหม่ — ป้องกันข้อมูลถูกทับ
```

#### Schema — ทุก PATCH/PUT schema ต้องมี version

```ts
// modules/customer/schema.ts
// ≈ Go: type SoftDeletedRequest struct { Version *int `json:"version" validate:"required"` }

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  version: z.number().int().min(1),  // ← บังคับ! ห้ามลืม
});

export const deleteCustomerSchema = z.object({
  version: z.number().int().min(1),  // ← soft delete ก็ต้องมี
});
```

#### Repo — Update with version check

```ts
// modules/customer/repo.ts
// ≈ Go: repo.go#UpdateUser — Where("version = ?", currentVersion), rowsAffected check

async update(id: string, data: Partial<CustomerEntity>, version: number): Promise<CustomerEntity> {
  const [updated] = await db
    .update(customers)
    .set({
      ...data,
      version: version + 1,          // increment version
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .where(eq(customers.version, version))  // ← version check
    .$returningId();

  if (!updated) {
    throw new ConflictError(
      'Version mismatch — data was modified by another user. Please refresh and try again.',
      { currentVersion: version }
    );
  }

  return updated as CustomerEntity;
}
```

#### Service — Handle version conflict

```ts
// modules/customer/service.ts
async updateCustomer(id: string, input: UpdateCustomerInput): Promise<CustomerEntity> {
  // Check exists first
  const existing = await this.repo.findById(id);
  if (!existing) throw new NotFoundError('Customer not found');

  try {
    return await this.repo.update(id, input, input.version);
  } catch (err) {
    if (err instanceof ConflictError) throw err;  // re-throw → HTTP 409
    throw new AppError(500, 'Failed to update customer');
  }
}
```

#### Handler — Return 409

```ts
// modules/customer/handler.ts
updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateCustomerSchema.parse(req.body);  // Zod validates version present
    const result = await this.svc.updateCustomer(req.params.id, input);
    return sendSuccess(res, 200, 'updated', { data: result });
  } catch (err) {
    if (err instanceof ConflictError) {
      return sendError(res, 409, err.message, err.data);  // 409 — หน้าบ้าน refresh
    }
    // ...
  }
};
```

#### Frontend — ส่ง version ทุกครั้งที่ PATCH/PUT

```ts
// frontend/src/modules/customer/model.ts
export const customerApi = {
  update: async (id: string, input: Partial<CustomerEntity> & { version: number }) => {
    const { data } = await api.patch(`/customers/${id}`, input);  // version ส่งไปใน body
    return data.data;
  },
};

// frontend/src/modules/customer/controller.ts
export function useCustomerDetail(id: string) {
  const [customer, setCustomer] = useState<CustomerEntity | null>(null);

  const updateCustomer = async (input: Partial<CustomerEntity>) => {
    if (!customer) return;
    try {
      const updated = await customerApi.update(id, {
        ...input,
        version: customer.version,  // ← ส่ง version ปัจจุบันที่หน้าบ้านถืออยู่
      });
      setCustomer(updated);
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Version conflict → refresh ข้อมูลใหม่
        alert('ข้อมูลถูกแก้ไขโดยผู้ใช้อื่น กรุณาลองใหม่');
        await fetchCustomer();  // refetch ข้อมูลล่าสุด (พร้อม version ใหม่)
      }
    }
  };
}
```

### 10.4 Rules Summary

| # | Rule | Scope | Penalty |
|---|------|-------|---------|
| 1 | **Pagination Required** | ทุก list/filter endpoint | PR ไม่ผ่าน review |
| 2 | **Pagination Response** | ทุก list response ต้องมี `pagination` object | PR ไม่ผ่าน review |
| 3 | **Transaction Required** | ทุก multi-table write | Data corruption |
| 4 | **Row Lock** | ทุก read-before-write ใน transaction ต้อง `FOR UPDATE` | Race condition |
| 5 | **Version Field** | ทุก PATCH/PUT/DELETE schema ต้องมี `version` | Data overwrite |
| 6 | **Version Check** | Repo update ต้อง `WHERE version = ?` + check `rowsAffected` | Lost update |
| 7 | **409 on Conflict** | Version mismatch → HTTP 409 Conflict | หน้าบ้านไม่รู้ต้อง refresh |

---

## 11. Environment Variables (`.env`)

```bash
# ===== Server =====
PORT=3000
NODE_ENV=development

# ===== MySQL =====
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=versus
MYSQL_PASSWORD=versus_dev
MYSQL_DATABASE=versus_erp

# ===== MongoDB =====
MONGO_URI=mongodb://versus:versus_dev@localhost:27017/versus_erp?authSource=admin

# ===== Redis =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=versus_dev

# ===== RabbitMQ =====
RABBITMQ_URL=amqp://versus:versus_dev@localhost:5672

# ===== JWT =====
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=24h

# ===== LLM (AI Chatbot) =====
LLM_PROVIDER=gemini    # gemini | openai | anthropic
LLM_API_KEY=your-api-key
LLM_MODEL=gemini-1.5-flash
```

---

## 12. Development Commands

```bash
# Start all infrastructure
docker compose up -d

# Backend
cd backend
npm install
npm run dev           # Start Express with hot reload (tsx --watch)
npm test              # Jest unit + integration
npm run test:e2e      # Playwright E2E

# Frontend
cd frontend
npm install
npm run dev           # Vite dev server on :5173
npm test              # Vitest
npm run test:e2e      # Playwright

# URLs
# Frontend:  http://localhost:5173
# Backend:   http://localhost:3000
# RabbitMQ:  http://localhost:15672  (versus / versus_dev)
# MySQL:     localhost:3306           (versus / versus_dev)
# MongoDB:   localhost:27017
# Redis:     localhost:6379           (password: versus_dev)
```

---

## 13. Testing Architecture

```
backend/src/modules/user/
├── user.test.ts         # Integration tests (Supertest + Testcontainers)
├── service.test.ts      # Unit tests (mock repo)
└── sanitizer.test.ts    # Unit tests (pure functions)

frontend/src/pages/
└── ChatPanel.test.tsx   # Component tests (Vitest + RTL)

e2e/
└── critical-flows.spec.ts # Playwright
```

---

> **Status**: Architecture v1.0 — 2026-07-18
> **สำหรับ**: ต่อยอดจาก plan.md → ลงมือ setup project ได้เลย
