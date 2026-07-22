# 08 Testing — Infrastructure Note

> Testing phase has **no database schema**. Tests use throwaway Docker containers via Testcontainers for integration tests, and mocking for unit tests.

---

## Database Strategy by Test Level

| Level | Database | Approach |
|-------|----------|----------|
| **Unit** | None | All external dependencies mocked (jest.fn()) |
| **Integration** | MySQL (Testcontainers) | Throwaway MySQL 8.4 container per test suite, auto-migrated |
| **E2E** | MySQL (persistent) | Connected to the running Docker Compose stack |

### Testcontainers Setup

Integration tests spin up a **throwaway MySQL container** that is created before the test suite and destroyed after:

```ts
import { MySqlContainer } from '@testcontainers/mysql';

let container: MySqlContainer;

beforeAll(async () => {
  container = await new MySqlContainer()
    .withDatabase('versus_erp_test')
    .withUsername('test')
    .withUserPassword('test')
    .start();

  // Point app to throwaway DB
  process.env.MYSQL_HOST = container.getHost();
  process.env.MYSQL_PORT = String(container.getPort());
  process.env.MYSQL_USER = 'test';
  process.env.MYSQL_PASSWORD = 'test';
  process.env.MYSQL_DATABASE = 'versus_erp_test';

  // Run Drizzle migrations
  await runMigrations(container.getConnectionUri());
});

afterAll(async () => {
  await container.stop(); // Container destroyed — no cleanup needed
});
```

### MongoDB in Tests

MongoDB can either be:
1. **Mocked** (unit tests) — mock `mongoose` or native MongoDB driver
2. **Testcontainers** (integration tests) — `MongoDBContainer` from `@testcontainers/mongodb`
3. **Shared Docker instance** (E2E) — connected to the existing `docker compose` stack

### Redis & RabbitMQ in Tests

| Service | Approach |
|---------|----------|
| **Redis** | Mock `ioredis` in unit tests; Testcontainers `RedisContainer` for integration |
| **RabbitMQ** | Mock `amqplib` in unit tests; Testcontainers `RabbitMQContainer` for integration |

---

## Test File Naming Convention

| Level | Pattern | Location |
|-------|---------|----------|
| **Backend Unit** | `*.test.ts` | Alongside file being tested (e.g., `sanitizer.test.ts` next to `sanitizer.ts`) |
| **Backend Integration** | `*.test.ts` | In module folder (e.g., `chat.test.ts`, `customer.test.ts`) |
| **Frontend Unit** | `*.test.tsx` | In `__tests__/` folder next to view/component |
| **E2E** | `*.spec.ts` | `frontend/e2e/` |

---

## Test Dependencies

```bash
# Backend (devDependencies)
npm install -D jest @types/jest ts-jest
npm install -D supertest @types/supertest
npm install -D @testcontainers/mysql @testcontainers/mongodb
npm install -D @testcontainers/redis @testcontainers/rabbitmq

# Frontend (devDependencies)
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event msw
npm install -D @playwright/test
```

---

## Jest Configuration (backend/jest.config.ts)

```ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000, // Testcontainers need longer timeout
};
```

---

## Vitest Configuration (frontend/vitest.config.ts)

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

---

## Playwright Configuration (frontend/playwright.config.ts)

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
```

---

## Key Testing Patterns

| Pattern | Description |
|---------|-------------|
| **Repository mocks** | Implement interface with jest.fn() for service-level testing |
| **Testcontainers lifecycle** | `beforeAll` → start container → migrate → run tests → `afterAll` → stop |
| **Token fixtures** | Generate JWT tokens for authenticated endpoint tests |
| **Seed data** | Minimal seed data inserted before integration tests (not full DB dump) |
| **Clean state** | Each test suite starts fresh — no shared state between suites |
| **Parallel isolation** | Testcontainers ensures each CI worker gets isolated DB |
