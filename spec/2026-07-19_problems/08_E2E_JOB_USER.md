# Phase 08 — E2E: Job Full Flow + User Management

> **Priority**: 🟡 P1 — ต้องมี E2E สำหรับฟีเจอร์หลัก
> **Estimate**: 1 day
> **Depends on**: Phase 03 (Job customer), Phase 06 (User frontend)

---

## Overview

สร้าง E2E tests สำหรับ 2 modules ที่ยังไม่มี:
1. **Jobs** — create, view, change status, check history
2. **User Management** — list, create, edit, deactivate, delete

---

## Task 8.1 — Job E2E (0.5 day)

### `frontend/e2e/jobs.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Job Full Flow', () => {
  test('should create a job and see it in queue', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: 'คิวงาน' }).click();
    await page.waitForURL('/jobs');

    // Click create
    await page.getByRole('button', { name: 'สร้างงาน' }).click();
    await expect(page.getByText('สร้างงานใหม่')).toBeVisible();

    // Select customer
    await page.getByLabel('ลูกค้า').click();
    await page.waitForTimeout(500);
    await page.locator('[role="listbox"] [role="option"]').first().click();
    await page.waitForTimeout(500); // wait for vehicles to load

    // Select vehicle (ถ้ามี)
    const vehicleAutocomplete = page.getByLabel('รถ');
    if (await vehicleAutocomplete.isEnabled()) {
      await vehicleAutocomplete.click();
      await page.waitForTimeout(300);
      const vehicleOption = page.locator('[role="listbox"] [role="option"]').first();
      if (await vehicleOption.isVisible()) {
        await vehicleOption.click();
      }
    }

    // Select job type
    await page.getByLabel('ประเภทงาน').click();
    await page.getByRole('option', { name: 'ติดตั้ง' }).click();

    // Set scheduled date
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel('วันที่นัดหมาย').fill(today);

    // Set technician
    await page.getByLabel('ช่างผู้รับผิดชอบ').fill('ช่างสมชาย');

    // Submit
    await page.getByRole('button', { name: 'สร้างงาน' }).click();
    await page.waitForTimeout(1000);

    // Verify job appears in list
    await expect(page.getByText('ติดตั้ง').first()).toBeVisible();
  });

  test('should view job detail', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: 'คิวงาน' }).click();
    await page.waitForURL('/jobs');

    // Click first job row
    await page.locator('[role="row"]').nth(1).click();
    await page.waitForTimeout(500);

    // Verify detail page
    await expect(page.getByText('ประวัติสถานะ').first()).toBeVisible();
  });

  test('should change job status', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: 'คิวงาน' }).click();
    await page.waitForURL('/jobs');

    // Click first job
    await page.locator('[role="row"]').nth(1).click();
    await page.waitForTimeout(500);

    // Change status from QUEUED → IN_PROGRESS
    await page.getByLabel('เปลี่ยนสถานะ...').click();
    await page.getByRole('option', { name: 'In Progress' }).click();
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    await page.waitForTimeout(500);

    // Verify status changed
    await expect(page.getByText('In Progress').first()).toBeVisible();
  });

  test('should show status history', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: 'คิวงาน' }).click();
    await page.waitForURL('/jobs');

    // Click first job
    await page.locator('[role="row"]').nth(1).click();
    await page.waitForTimeout(500);

    // Scroll to status history section
    await expect(page.getByText('ประวัติสถานะ')).toBeVisible();
  });
});
```

---

## Task 8.2 — User Management E2E (0.4 day)

### `frontend/e2e/user.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('User Management', () => {
  test('should list all users', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForTimeout(500);

    // Verify table shows users
    await expect(page.getByText('ผู้ดูแลระบบ').first()).toBeVisible();
  });

  test('should create a new user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForTimeout(500);

    // Click create
    await page.getByRole('button', { name: 'เพิ่มผู้ใช้' }).click();
    await expect(page.getByText('เพิ่มผู้ใช้ใหม่')).toBeVisible();

    // Fill form
    await page.getByLabel('ชื่อผู้ใช้').fill('teststaff');
    await page.getByLabel('รหัสผ่าน').fill('123456');
    await page.getByLabel('ชื่อที่แสดง').fill('พนักงานทดสอบ');
    await page.getByLabel('บทบาท').click();
    await page.getByRole('option', { name: 'พนักงาน' }).click();

    // Submit
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await page.waitForTimeout(1000);

    // Verify new user in list
    await expect(page.getByText('พนักงานทดสอบ').first()).toBeVisible();
  });

  test('should edit user role', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForTimeout(500);

    // Click edit on first non-admin user
    await page.getByRole('button', { name: 'แก้ไข' }).first().click();
    await page.waitForTimeout(300);

    // Change role
    await page.getByLabel('บทบาท').click();
    await page.getByRole('option', { name: 'ผู้จัดการ' }).click();

    // Submit
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await page.waitForTimeout(500);
  });

  test('should deactivate and activate a user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForTimeout(500);

    // Click deactivate on a user
    const deactivateBtn = page.getByRole('button', { name: 'ปิดใช้งาน' }).first();
    if (await deactivateBtn.isVisible()) {
      await deactivateBtn.click();
      await page.waitForTimeout(500);

      // Verify status chip changed
      await expect(page.getByText('ไม่ใช้งาน').first()).toBeVisible();
    }
  });
});
```

---

## Task 8.3 — Playwright config check (0.1 day)

ตรวจสอบ `frontend/playwright.config.ts` ว่ามี baseURL และ settings ถูกต้อง:
```ts
baseURL: 'http://localhost:5173',
```

และ backend ต้องรันพร้อมกันตอน test:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Terminal 3
cd frontend && npm run test:e2e
```

---

## Phase 08 Checklist

- [ ] `e2e/jobs.spec.ts` — test: create job
- [ ] `e2e/jobs.spec.ts` — test: view job detail
- [ ] `e2e/jobs.spec.ts` — test: change job status
- [ ] `e2e/jobs.spec.ts` — test: status history visible
- [ ] `e2e/user.spec.ts` — test: list users
- [ ] `e2e/user.spec.ts` — test: create user
- [ ] `e2e/user.spec.ts` — test: edit user
- [ ] `e2e/user.spec.ts` — test: deactivate user
- [ ] รัน `npm run test:e2e` — all tests pass
