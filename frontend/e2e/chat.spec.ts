import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('AI Chat', () => {
  test('should send a message and receive AI response', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: 'AI Chat' }).click();
    await page.waitForURL('/chat');

    const chatInput = page.getByPlaceholder('ถามคำถาม...');
    await chatInput.fill('ยอดขายวันนี้เท่าไหร่');
    await chatInput.press('Enter');

    await expect(page.getByText('ยอดขายวันนี้เท่าไหร่')).toBeVisible({ timeout: 5000 });
  });
});
