import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Login Flow', () => {
  test('redirects to login when unauthenticated, then allows login and logout', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/login');

    await loginAsAdmin(page);
    await page.waitForURL('/');

    await expect(page.getByText('ยอดขายวันนี้')).toBeVisible();
    await expect(page.getByText('คิวงานวันนี้')).toBeVisible();
    await expect(page.getByText('สต็อกใกล้หมด')).toBeVisible();
    await expect(page.getByText('รายได้เดือนนี้')).toBeVisible();

    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('/login');
  });
});
