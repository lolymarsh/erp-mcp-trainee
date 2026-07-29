---
trigger: always_on
---

# Versus Thailand ERP — TypeScript Coding Standards

## 1. TypeScript Strict Rules

### 1.1 No `any`
```ts
// ❌ BAD
function process(data: any): any { return data; }

// ✅ GOOD — use unknown + type guard
function process(data: unknown): ProcessResult {
  if (typeof data !== 'object' || data === null) throw new BadRequestError('invalid');
  const parsed = processSchema.parse(data);
  return { id: parsed.id };
}
```

### 1.2 No `as` Type Assertion — Use Zod
```ts
// ❌ BAD
const user = data as UserEntity;

// ✅ GOOD
const user = userSchema.parse(data);  // Zod validates + infers type
```

### 1.3 Return Types Required
```ts
// ❌ BAD
async function GetCustomer(id: string) { ... }

// ✅ GOOD
async function GetCustomer(id: string): Promise<CustomerEntity | null> { ... }
```

### 1.4 Nullable Types
```ts
// ✅ Use optional or null union
phone?: string | null;
deletedAt: Date | null;
```

## 2. Function Length

- **Maximum 50 lines** per public function
- Decompose into private helpers if exceeding
- Guard clauses first — happy path at left margin:

```ts
// ✅ GOOD — guard clause at top
async GetCustomer(id: string): Promise<CustomerEntity> {
  const customer = await this.repo.FindById(id);
  if (!customer) throw new NotFoundError('Customer not found');
  if (!customer.isActive) throw new ForbiddenError('Customer is inactive');
  return customer;
}

// ❌ BAD — nested if
async GetCustomer(id: string): Promise<CustomerEntity> {
  const customer = await this.repo.FindById(id);
  if (customer) {
    if (customer.isActive) {
      return customer;
    } else {
      throw new ForbiddenError('Customer is inactive');
    }
  } else {
    throw new NotFoundError('Customer not found');
  }
}
```

## 3. No Hardcoding

```ts
// ❌ BAD
setTimeout(() => {}, 5000);
res.status(401).json({ message: 'Unauthorized' });

// ✅ GOOD
const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds
res.status(HttpStatus.UNAUTHORIZED).json({ message: ERROR_MSGS.UNAUTHORIZED });
```

## 4. Naming Conventions — Go-style

| Element | Convention | Example |
|---------|-----------|---------|
| Interfaces | `I` prefix | `ICustomerService` |
| Classes | PascalCase | `CustomerHandler` |
| Public functions/methods | PascalCase (exported = uppercase) | `GetCustomer`, `CreateInvoice` |
| Private functions/methods | camelCase (unexported = lowercase) | `toResponse`, `buildFilterConditions` |
| Files | kebab-case in folder, PascalCase for component files | `entity.ts`, `CustomerView.tsx` |
| DB columns | snake_case | `created_at`, `first_name` |
| JSON keys | camelCase | `createdAt`, `firstName` |
| Env vars | UPPER_SNAKE | `MYSQL_HOST`, `JWT_SECRET` |

### Go-style Public/Private Rule

```ts
// ✅ Public methods — PascalCase (exported, like Go)
export interface ICustomerService {
  GetCustomer(id: string): Promise<CustomerEntity | null>;
  CreateCustomer(input: CreateCustomerInput): Promise<CustomerEntity>;
}

// Private helpers — camelCase (unexported, like Go)
class CustomerService implements ICustomerService {
  async CreateCustomer(input: CreateCustomerInput): Promise<CustomerEntity> {
    const existing = await this.repo.FindByPhone(input.phone);
    const hash = this.hashPassword(input.password); // ← private helper
    return this.repo.Create({ ...input, passwordHash: hash });
  }

  private hashPassword(password: string): string { // ← camelCase
    return bcrypt.hashSync(password, 12);
  }
}

// Local module-scoped functions — camelCase (not exported)
function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues.map(i => i.message).join(', ');
  return 'Unknown error';
}
```

## 5. Imports Order

```ts
// 1. Node built-ins
import path from 'path';

// 2. Third-party
import express from 'express';
import { z } from 'zod';

// 3. Project shared
import { sendSuccess } from '../../shared/response/handler';
import { NotFoundError } from '../../shared/errors/AppError';

// 4. Project modules (relative to current)
import { CustomerEntity } from './entity';
```

## 6. Logging

```ts
import { logger } from '../../../config/logger';

// ✅ Log: errors, batch operations, critical business logic
logger.error('createInvoice failed', err);

// ❌ Don't log: normal CRUD success, validation errors (Zod handles)
```

## 7. Connection Pool Configuration

**ใช้ Env Vars สำหรับทุก connection** — pattern เดียวกับ Go:

```bash
# backend/.env
# ===== MySQL =====
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=versus
MYSQL_PASSWORD=versus_dev
MYSQL_DATABASE=versus_erp
MYSQL_CONN_MAX_IDLE_TIME=300       # idle connection timeout (seconds)
MYSQL_CONNECTION_MAX_LIFE_TIME=300  # max connection lifetime (seconds)
MYSQL_MAX_IDLE_CONNS=10             # max idle connections in pool
MYSQL_MAX_OPEN_CONNS=20             # max open connections

# ===== MongoDB =====
MONGO_URI=mongodb://versus:versus_dev@localhost:27017/versus_erp?authSource=admin
MONGO_MAX_POOL_SIZE=10
MONGO_CONNECT_TIMEOUT_MS=5000

# ===== Redis =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=versus_dev
REDIS_DB=0

# ===== RabbitMQ =====
RABBITMQ_URL=amqp://versus:versus_dev@localhost:5672
```

**database.ts — ใช้ env vars** (ไม่ hardcode):
```ts
import mysql from 'mysql2/promise';

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
  // connection pool settings — prevents connection leaks
});

export const db = drizzle(pool);
```

**Rule**: ห้าม hardcode connection string ในโค้ด — ต้องอ่านจาก `process.env` เสมอ (มี fallback สำหรับ dev)
