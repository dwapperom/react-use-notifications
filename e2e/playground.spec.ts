import { expect, test } from '@playwright/test';

test.describe('playground', () => {
  test('registers the service worker and reports permission', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Notifications', level: 1 })).toBeVisible();
    await expect(page.getByText('service worker ready')).toBeVisible();

    await page.evaluate(() => navigator.serviceWorker.ready);

    await expect(page.getByRole('status').first()).toHaveAttribute('data-permission', 'granted');
  });
});
