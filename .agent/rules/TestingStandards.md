---
trigger: always_on
---

# Testing Standards

## 1. Testing Levels

```
E2E          ← Playwright (critical flows, 5-8 scenarios)
Integration  ← Supertest + Testcontainers (all endpoints)
Unit         ← Jest/Vitest (services, utils, pure functions)
```

## 2. Backend Integration Test Template

```ts
// modules/customer/customer.test.ts
import request from 'supertest';
import { MySqlContainer } from '@testcontainers/mysql';
import { app } from '../../app';
import { migrate } from '../../config/database';

describe('Customer API', () => {
  let mysqlContainer: MySqlContainer;
  let authToken: string;

  beforeAll(async () => {
    mysqlContainer = await new MySqlContainer('mysql:8.4')
      .withDatabase('versus_erp_test')
      .start();

    process.env.MYSQL_HOST = mysqlContainer.getHost();
    process.env.MYSQL_PORT = String(mysqlContainer.getPort());
    await migrate(); // run Drizzle migrations

    // Seed auth token for testing
    authToken = await getTestToken();
  }, 30000);

  afterAll(async () => {
    await mysqlContainer.stop();
  });

  describe('POST /api/customers', () => {
    it('should create customer and return 201', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678' })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.firstName).toBe('สมชาย');
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // missing required fields
        .expect(400);

      expect(res.body.code).toBe(400);
    });
  });

  describe('POST /api/customers/filter', () => {
    it('should return paginated customers', async () => {
      const res = await request(app)
        .post('/api/customers/filter')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ page: 1, pageSize: 10 })
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.totalData).toBeGreaterThanOrEqual(0);
    });
  });

  describe('PATCH /api/customers/:id', () => {
    it('should return 409 on version mismatch', async () => {
      // Create customer first
      const { body: created } = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Version', lastName: 'Test', phone: '0800000000' });

      // Update with wrong version
      const res = await request(app)
        .patch(`/api/customers/${created.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Updated', version: 999 }) // wrong version
        .expect(409);
    });
  });
});

async function getTestToken(): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'test_admin', password: 'test123' });
  return res.body.data.token;
}
```

## 3. Frontend Component Test Template

```ts
// modules/customer/CustomerListView.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerListView } from './view';

const mockCustomers = [
  { id: '1', firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678' },
  { id: '2', firstName: 'สมหญิง', lastName: 'รักดี', phone: '0823456789' },
];

describe('CustomerListView', () => {
  it('should render customer rows', () => {
    render(
      <CustomerListView
        customers={mockCustomers}
        loading={false}
        error={null}
        onSearch={jest.fn()}
        onPageChange={jest.fn()}
        onSelectCustomer={jest.fn()}
      />
    );

    expect(screen.getByText('สมชาย')).toBeInTheDocument();
    expect(screen.getByText('สมหญิง')).toBeInTheDocument();
  });

  it('should show loading spinner', () => {
    render(
      <CustomerListView
        customers={[]} loading={true} error={null}
        onSearch={jest.fn()} onPageChange={jest.fn()} onSelectCustomer={jest.fn()}
      />
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

## 4. E2E Test (Playwright)

```ts
// tests/critical-flows.spec.ts
import { test, expect } from '@playwright/test';

test('Login → Create Invoice → Check Dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');

  await page.click('text=ใบแจ้งหนี้');
  await page.click('text=สร้างใหม่');
  // ... fill invoice form
  await page.click('button:has-text("บันทึก")');
  await expect(page.locator('.success-toast')).toBeVisible();
});
```

## 5. Coverage Requirements

| Layer | Target |
|-------|--------|
| Backend Services | 80%+ |
| Backend API Endpoints | 90%+ (all endpoints) |
| Frontend Components | 70%+ |
| Critical Flows (E2E) | 5-8 scenarios |

## 6. Testing Rules

- ✅ 100% CRUD coverage: every create, read, update, delete endpoint must have test
- ✅ Version mismatch test: every PATCH/PUT must test 409 scenario
- ✅ Pagination test: every list endpoint must verify pagination response
- ✅ Transaction test: multi-table writes must verify rollback on failure
- ✅ Use Testcontainers — real MySQL, not mock
- ❌ No hardcoded test data that depends on production DB
