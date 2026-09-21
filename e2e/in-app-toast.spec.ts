import { expect, test } from '@playwright/test';

const region = 'ol[aria-label="Notifications"]';

test.describe('in-app toast', () => {
  test('renders, carries its variant and dismisses', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'in-app', exact: true }).click();

    const toast = page.locator(`${region} li`).first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Deploy finished');
    await expect(toast).toHaveAttribute('data-variant', 'success');
    await expect(toast).toHaveAttribute('data-reason', 'requested');

    await page.getByRole('button', { name: 'Dismiss: Deploy finished' }).click();
    await expect(page.locator(`${region} li`)).toHaveCount(0);
  });

  test('the Tailwind layer resolves shadcn tokens to real colours', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'in-app', exact: true }).click();

    const toast = page.locator(`${region} li`).first();
    await expect(toast).toBeVisible();

    const paint = await toast.evaluate((node) => {
      const style = getComputedStyle(node);

      return {
        background: style.backgroundColor,
        border: style.borderTopWidth,
      };
    });

    // jsdom computes nothing, so this is the only place the class strings are proven to resolve.
    expect(paint.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(paint.border).not.toBe('0px');
  });

  test('a shared tag replaces the toast instead of stacking', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Deploy dashboard' }).click();
    await page.getByRole('button', { name: 'Deploy succeeds' }).click();
    await expect(page.locator(`${region} li`)).toHaveCount(1);

    await page.getByRole('button', { name: 'Deploy succeeds' }).click();
    await expect(page.locator(`${region} li`)).toHaveCount(1);
  });

  test('the native path clears the in-app copy carrying the same tag', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Deploy dashboard' }).click();
    await page.getByRole('button', { name: 'Deploy succeeds' }).click();
    await expect(page.locator(`${region} li`)).toHaveCount(1);

    await page.getByRole('button', { name: 'Deploy fails' }).click();
    await expect(page.locator(`${region} li`)).toHaveCount(0);
  });
});
