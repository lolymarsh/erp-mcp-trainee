import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Customer Page', () => {
  test('should navigate to customers and search for a customer', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: 'ลูกค้า' }).click();
    await page.waitForURL('/customers');

    await expect(page.getByText('รายชื่อลูกค้า')).toBeVisible();

    const searchInput = page.getByLabel('ค้นหาชื่อหรือเบอร์โทร');
    await searchInput.fill('สม');
    await page.waitForTimeout(500);

    await expect(searchInput).toHaveValue('สม');
  });
});
