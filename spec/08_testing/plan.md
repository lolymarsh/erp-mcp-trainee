# Phase 08 — E2E Tests + Final Polish

> **Priority**: 🟢 Medium
> **Estimate**: 1 day
> **Depends on**: Phase 01-07 (all features complete)

---

## Overview

Testing strategy follows the testing pyramid: many unit tests, fewer integration tests, and a small set of critical E2E scenarios. The project uses Jest + Testcontainers for backend integration, Vitest + React Testing Library for frontend, and Playwright for E2E.

---

## Testing Pyramid

```
         ╱ E2E ╲          ← Playwright (5-8 critical paths)
        ╱─────────╲
       ╱Integration╲       ← Supertest + Testcontainers (all endpoints)
      ╱───────────────╲
     ╱   Unit Tests    ╲   ← Vitest (frontend) / Jest (backend) (many)
    ╱─────────────────────╲
```

---

## Coverage Targets

| Layer | Tool | Target |
|-------|------|--------|
| Backend Services | Jest (unit) | 80%+ |
| Backend API | Supertest + Testcontainers (integration) | 90%+ (all endpoints) |
| Frontend Components | Vitest + RTL (unit) | 70%+ |
| Frontend Pages | Vitest + MSW (integration) | 80%+ |
| Critical Flows | Playwright (E2E) | 5-8 scenarios |
| AI Chatbot | Jest (sanitizer, formatter) | 85%+ |

---

## Test Commands

```bash
# Backend
cd backend
npm test                 # Unit tests (Jest)
npm run test:integration # Integration tests (Supertest + Testcontainers — needs Docker)
npm run test:coverage    # Coverage report

# Frontend
cd frontend
npm test                 # Unit + Component tests (Vitest)
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright E2E tests (needs backend running)

# All together
npm run test:all         # Root script to run both
```

---

## Task 1 — Backend Unit Tests

### Files: `backend/src/modules/*/*.test.ts` and `*.test.ts`

| Test File | Scope | Examples |
|-----------|-------|----------|
| `chat/sanitizer.test.ts` | Sanitizer pure functions | ✅ accepts SELECT, ❌ rejects DROP/DELETE/UPDATE/INSERT |
| `chat/formatter.test.ts` | Formatter output | CSV, HTML, JSON, Table formats produce correct output |
| `chat/service.test.ts` | ChatService mocked | Cache hit returns cached, cache miss calls LLM |
| `user/service.test.ts` | UserService mocked | Login validates password, createUser hashes password |
| `invoice/service.test.ts` | InvoiceService mocked | Stock validation, total calculation |
| `job/service.test.ts` | JobService mocked | Status transition validation, technician assignment |
| `dashboard/service.test.ts` | DashboardService mocked | Aggregation logic, cache miss queries all repos |

### Test Pattern — Service with Mock Repo

```ts
// chat/sanitizer.test.ts
import { sanitizeSql } from './sanitizer';

describe('sanitizeSql', () => {
  it('allows SELECT queries', () => {
    const sql = 'SELECT * FROM invoices WHERE created_at = CURDATE()';
    expect(sanitizeSql(sql)).toBe(sql);
  });

  it('rejects DROP TABLE', () => {
    expect(() => sanitizeSql('DROP TABLE invoices')).toThrow('not allowed');
  });

  it('rejects DELETE', () => {
    expect(() => sanitizeSql('DELETE FROM invoices')).toThrow('not allowed');
  });

  it('rejects UPDATE', () => {
    expect(() => sanitizeSql('UPDATE invoices SET status = "PAID"')).toThrow('not allowed');
  });

  it('rejects INSERT', () => {
    expect(() => sanitizeSql('INSERT INTO invoices VALUES (...)')).toThrow('not allowed');
  });

  it('rejects non-SELECT queries', () => {
    expect(() => sanitizeSql('SHOW TABLES')).toThrow('Only SELECT queries are allowed');
  });
});
```

### Test Pattern — Service with Mocked Repository

```ts
// user/service.test.ts
import { UserService, IUserService } from './service';
import { IUserRepository } from './repo';

describe('UserService', () => {
  let svc: IUserService;
  let mockRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
    } as any;
    svc = new UserService(mockRepo);
  });

  describe('login', () => {
    it('should throw UnauthorizedError for invalid credentials', async () => {
      mockRepo.findByUsername.mockResolvedValue(null);
      await expect(svc.login({ username: 'admin', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
```

---

## Task 2 — Backend Integration Tests

### Files: `*.test.ts` alongside each handler

**Tools**: Supertest + Testcontainers

Testcontainers spins up a throwaway MySQL container for each test suite:

```ts
import { MySqlContainer } from '@testcontainers/mysql';
import request from 'supertest';
import { createApp } from '../../app';

describe('POST /api/customers', () => {
  let app: Express;
  let container: MySqlContainer;

  beforeAll(async () => {
    container = await new MySqlContainer()
      .withDatabase('versus_erp_test')
      .withUsername('test')
      .withUserPassword('test')
      .start();

    process.env.MYSQL_HOST = container.getHost();
    process.env.MYSQL_PORT = String(container.getPort());
    process.env.MYSQL_USER = 'test';
    process.env.MYSQL_PASSWORD = 'test';
    process.env.MYSQL_DATABASE = 'versus_erp_test';

    await runMigrations(container.getConnectionUri());
    app = createApp();
  });

  afterAll(async () => {
    await container.stop();
  });

  it('should create customer and return 201', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ firstName: 'สมชาย', lastName: 'ทดสอบ', phone: '0812345678' })
      .expect(201);

    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.firstName).toBe('สมชาย');
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ lastName: 'ทดสอบ' })
      .expect(400);
  });
});
```

### Integration Test Scenarios per Module

| Module | Test Scenarios |
|--------|---------------|
| **Auth** | Login success, login failure, token expiry, protected routes without token |
| **Customer** | Create, read, update (with version), filter with pagination, soft delete |
| **Inventory** | Create product, update stock, stock movement logging, low stock query |
| **Invoice** | Create with transaction (invoice + items + stock deduct), rollback on failure |
| **Job** | CRUD, status transition (QUEUED→IN_PROGRESS→COMPLETED), technician assignment |
| **Chat** | Valid query → SQL execution, blocked query → 403, cache hit → instant response, export formats |
| **Dashboard** | Summary returns all 5 sections, cache HIT vs MISS, cache invalidation on write |

---

## Task 3 — Frontend Unit Tests

### Files: `*.test.tsx` alongside each component

**Tools**: Vitest + React Testing Library + MSW

```tsx
// chat/__tests__/ChatPanel.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPanel } from '../view';

describe('<ChatPanel />', () => {
  it('should send message and display response', async () => {
    render(<ChatPanel onSend={jest.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'วันนี้ยอดขาย?');
    await userEvent.click(screen.getByRole('button', { name: 'ส่ง' }));
    // Wait for response bubble
    await waitFor(() => {
      expect(screen.getByText('85,000 บาท')).toBeVisible();
    });
  });

  it('should show loading indicator while waiting', async () => {
    render(<ChatPanel onSend={jest.fn(() => new Promise(() => {}))} />);
    await userEvent.type(screen.getByRole('textbox'), 'test');
    await userEvent.click(screen.getByRole('button', { name: 'ส่ง' }));
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should switch format when selector changes', async () => {
    render(<ChatPanel onSend={jest.fn()} />);
    await userEvent.click(screen.getByLabelText('รูปแบบ'));
    await userEvent.click(screen.getByText('CSV'));
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });
});
```

### Frontend Test Coverage Areas

| Component | Test Scenarios |
|-----------|---------------|
| **LoginForm** | Submit valid credentials, show error on invalid, disabled button while loading |
| **CustomerTable** | Render rows, pagination controls, search input fires callback |
| **CustomerForm** | Validation errors, submit with valid data, version field required |
| **InvoiceForm** | Add item row, calculate total, customer select, product select |
| **JobQueue** | Render status badges, filter by status, click to navigate |
| **ChatPanel** | Send message, receive response, format selector, loading state, export button, tool call blocks |
| **DashboardView** | Render KPI cards, bar charts render data, low stock table renders rows |
| **FormatSelector** | Toggle between Text/Table/CSV/HTML/JSON |

---

## Task 4 — Frontend Integration Tests

**Tools**: Vitest + MSW (Mock Service Worker)

```tsx
// customer/__tests__/CustomerPage.test.tsx
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/customers', () => {
    return HttpResponse.json({
      code: 200,
      data: [{ id: '1', firstName: 'สมชาย', lastName: 'ทดสอบ', phone: '0812345678' }],
      pagination: { page: 1, pageSize: 20, totalData: 1, totalPage: 1, hasNextPage: false, hasPreviousPage: false },
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('should load and display customers', async () => {
  render(<CustomerListPage />);
  await waitFor(() => {
    expect(screen.getByText('สมชาย')).toBeVisible();
  });
});
```

---

## Task 5 — Playwright E2E Tests

**Files**: `frontend/e2e/`

### Setup

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

### Test 1: Login → Dashboard → Logout

```ts
test('Login → Dashboard → Logout', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/login');

  await page.fill('[name="username"]', 'admin');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/');
  await expect(page.locator('.kpi-card')).toHaveCount(4);

  // Logout (if logout button exists)
  await page.click('text=ออกจากระบบ');
  await expect(page).toHaveURL('/login');
});
```

### Test 2: Customer CRUD

```ts
test('Create → Search → View Customer', async ({ page }) => {
  await loginAsAdmin(page);

  // Navigate to customers
  await page.click('text=ลูกค้า');

  // Create new
  await page.click('text=เพิ่มลูกค้า');
  await page.fill('[name="firstName"]', 'ทดสอบ');
  await page.fill('[name="lastName"]', 'ระบบ');
  await page.fill('[name="phone"]', '0899999999');
  await page.click('button:has-text("บันทึก")');
  await expect(page.locator('.success-toast')).toBeVisible();

  // Search
  await page.fill('[placeholder="ค้นหา"]', 'ทดสอบ');
  await expect(page.locator('text=ทดสอบ')).toBeVisible();
});
```

### Test 3: Invoice Workflow

```ts
test('Create Invoice → Check Stock Deducted', async ({ page }) => {
  await loginAsAdmin(page);

  // Navigate to invoices → create
  await page.click('text=ใบแจ้งหนี้');
  await page.click('text=สร้างใหม่');

  // Select customer
  await page.click('[role="combobox"]');
  await page.click('text=สมชาย');

  // Add product
  await page.click('button:has-text("เพิ่มรายการ")');
  await page.fill('[name="quantity"]', '1');

  // Save
  await page.click('button:has-text("บันทึก")');
  await expect(page.locator('.invoice-number')).toBeVisible();

  // Check stock deducted
  await page.click('text=คลังสินค้า');
  // Verify stock count decreased
});
```

### Test 4: Job Status Flow

```ts
test('Job Queue → Change Status → Verify', async ({ page }) => {
  await loginAsAdmin(page);

  await page.click('text=งานติดตั้ง');
  await expect(page.locator('.job-card')).toHaveCount.greaterThan(0);

  // Click first job → change status to IN_PROGRESS
  await page.click('.job-card:first-child');
  await page.click('button:has-text("เริ่มทำงาน")');
  await expect(page.locator('.status-badge')).toContainText('กำลังดำเนินการ');

  // Change to COMPLETED
  await page.click('button:has-text("เสร็จสิ้น")');
  await expect(page.locator('.status-badge')).toContainText('เสร็จแล้ว');
});
```

### Test 5: AI Chat

```ts
test('Chat: Ask today sales → Get response', async ({ page }) => {
  await loginAsAdmin(page);
  await page.click('text=แชท');

  await page.fill('[placeholder="ถามอะไรก็ได้..."]', 'วันนี้ยอดขายเท่าไหร่');
  await page.click('button[aria-label="ส่ง"]');

  await expect(page.locator('.message-ai')).toBeVisible({ timeout: 15000 });
});
```

### Test 6: Dashboard

```ts
test('Dashboard shows correct data after invoice creation', async ({ page }) => {
  await loginAsAdmin(page);

  // Record initial sales count
  await page.goto('/');
  const initialSalesText = await page.locator('.kpi-sales').textContent();

  // Create invoice
  await page.click('text=ใบแจ้งหนี้');
  // ... create invoice steps

  // Check dashboard updated
  await page.goto('/');
  const newSalesText = await page.locator('.kpi-sales').textContent();
  expect(newSalesText).not.toBe(initialSalesText);
});
```

### Test 7: Responsive Layout

```ts
test('Dashboard layout is responsive', async ({ page }) => {
  await loginAsAdmin(page);

  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.kpi-card')).toHaveCount(4);

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('.kpi-card')).toHaveCount(4);

  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('.kpi-card')).toHaveCount(4);
});
```

---

## Task 6 — Coverage Report

```bash
# Backend coverage
cd backend
npm run test:coverage
# Target: 80%+

# Frontend coverage
cd frontend
npm run test:coverage
# Target: 70%+

# E2E report
npx playwright test --reporter=html
npx playwright show-report
```

---

## Task 7 — Final Polish

```
[ ] ESLint: no errors
[ ] TypeScript: npx tsc --noEmit clean
[ ] All tests: backend + frontend + e2e pass
[ ] README.md for project
[ ] .gitignore updated
[ ] Verify all AGENTS.md rules are followed
[ ] License file (MIT)
```

---

## Task Checklist

```
[ ] Backend unit tests for sanitizer, formatter, all services
[ ] Backend integration tests for all API endpoints
[ ] Frontend unit tests for all components
[ ] Frontend integration tests (MSW) for all pages
[ ] Playwright: Login → Dashboard → Logout
[ ] Playwright: Customer CRUD
[ ] Playwright: Invoice create → stock deducted
[ ] Playwright: Job status flow
[ ] Playwright: AI Chat question → answer
[ ] Playwright: Dashboard reflects real operations
[ ] Backend coverage ≥ 80%
[ ] Frontend coverage ≥ 70%
[ ] TypeScript compiles clean (npx tsc --noEmit)
[ ] ESLint clean (npm run lint)
```

---

## Phases Summary

| # | Phase | Days | Dependencies |
|---|-------|------|-------------|
| 01 | Foundation + Auth | 3-4 | None |
| 02 | Customers | 1-2 | 01 |
| 03 | Inventory | 1-2 | 01 |
| 04 | Invoices | 2-3 | 02, 03 |
| 05 | Jobs | 1-2 | 02, 04 |
| 06 | AI Chatbot | 4-5 | 01-05 |
| 07 | Dashboard | 1-2 | 02-05 |
| 08 | E2E + Polish | 1 | 01-07 |
| **Total** | | **14-19 days** | |
