import type { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').waitFor();
  await page.getByLabel('ชื่อผู้ใช้').fill('admin');
  await page.getByLabel('รหัสผ่าน').fill('admin123');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForURL('/');
}
