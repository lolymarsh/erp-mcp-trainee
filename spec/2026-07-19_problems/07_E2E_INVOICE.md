# Phase 07 — E2E: Invoice Full Flow

> **Priority**: 🟡 P1 — ต้องมี E2E ครบ flow
> **Estimate**: 0.5 day
> **Depends on**: Phase 01 (Invoice modal fix), Phase 04 (Seed data)

---

## Problem Summary

`frontend/e2e/invoice.spec.ts` มี test เดียว — แค่ create invoice + กลับไป inventory — ไม่ครบ flow

ต้องการ: "test ครบ flow สร้างลบแก้ไขได้ ประวัติขึ้นมั้ย"

> **หมายเหตุ**: ปัจจุบัน Invoice module ไม่มี PATCH/DELETE endpoint — เลยแก้ไข/ลบ invoice ไม่ได้
> วิธีแก้: ทดสอบเท่าที่มี (create + view + history) + เพิ่ม test สำหรับ process ที่มีอยู่จริง

---

## Task 7.1 — เขียน E2E test ใหม่ (0.4 day)

### `frontend/e2e/invoice.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Invoice Full Flow', () => {
  test('should create invoice and see it in list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: 'ใบแจ้งหนี้' }).click();
    await page.waitForURL('/sales/invoices');

    // Click create
    await page.getByRole('button', { name: 'สร้างใบแจ้งหนี้' }).click();
    await expect(page.getByText('สร้างใบแจ้งหนี้')).toBeVisible();

    // Select customer
    await page.getByLabel('ลูกค้า').click();
    await page.waitForTimeout(500);
    await page.locator('[role="listbox"] [role="option"]').first().click();

    // Select payment method
    await page.getByLabel('วิธีการชำระ').click();
    await page.getByRole('option', { name: 'เงินสด' }).click();

    // Select product
    await page.getByLabel('สินค้า').click();
    await page.waitForTimeout(500);
    await page.locator('[role="listbox"] [role="option"]').first().click();

    // Set quantity and add
    await page.getByLabel('จำนวน').fill('2');
    await page.getByRole('button', { name: 'เพิ่มสินค้า' }).click();

    // Submit
    await page.getByRole('button', { name: 'สร้างใบแจ้งหนี้' }).click();
    await page.waitForTimeout(1000);

    // Verify invoice appears in list
    await expect(page.getByText('INV-').first()).toBeVisible();
  });

  test('should view invoice detail', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: 'ใบแจ้งหนี้' }).click();
    await page.waitForURL('/sales/invoices');

    // Click first invoice row
    await page.locator('[role="row"]').nth(1).click();
    await page.waitForTimeout(500);

    // Verify detail page shows invoice data
    await expect(page.getByText('INV-').first()).toBeVisible();
    await expect(page.getByText('ยอดสุทธิ').first()).toBeVisible();
  });

  test('should show history on invoice detail', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: 'ใบแจ้งหนี้' }).click();
    await page.waitForURL('/sales/invoices');

    // Click first invoice
    await page.locator('[role="row"]').nth(1).click();
    await page.waitForTimeout(500);

    // Click history button
    await page.getByRole('button', { name: 'ประวัติการแก้ไข' }).click();
    await page.waitForTimeout(500);

    // Verify audit dialog appears
    await expect(page.getByText('ประวัติการแก้ไข')).toBeVisible();
  });
});
```

---

## Task 7.2 — Update helpers หากจำเป็น (0.1 day)

ตรวจสอบ `frontend/e2e/helpers.ts` — `loginAsAdmin` ควร login ด้วย `admin` / `admin123` (ตาม seed)

---

## Phase 07 Checklist

- [ ] `invoice.spec.ts` — test: create invoice with customer + product
- [ ] `invoice.spec.ts` — test: view invoice detail
- [ ] `invoice.spec.ts` — test: history/audit log shows
- [ ] รัน `npm run test:e2e` — invoice tests pass
