import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Invoice Workflow', () => {
  test('should create an invoice and display it in the list', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: 'ใบแจ้งหนี้' }).click();
    await page.waitForURL('/sales/invoices');

    await page.getByRole('button', { name: 'New Invoice' }).click();
    await expect(page.getByText('Create Invoice')).toBeVisible();

    await page.getByLabel('Customer').click();
    await page.waitForTimeout(500);
    await page.locator('[role="listbox"] [role="option"]').first().click();

    await page.getByLabel('Payment Method').click();
    await page.getByRole('option', { name: 'Cash' }).click();

    await page.getByLabel('Product').click();
    await page.waitForTimeout(500);
    await page.locator('[role="listbox"] [role="option"]').first().click();

    await page.getByLabel('Qty').fill('1');
    await page.getByRole('button', { name: 'Add Item' }).click();

    await page.getByRole('button', { name: 'Create Invoice' }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('INV-').first()).toBeVisible();

    await page.getByRole('button', { name: 'สินค้า' }).click();
    await page.waitForURL('/inventory');
    await expect(page.getByText('สินค้า').first()).toBeVisible();
  });
});
