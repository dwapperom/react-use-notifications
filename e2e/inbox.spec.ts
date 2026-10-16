import { expect, test } from '@playwright/test';

const toasts = 'ol[aria-label="Notifications"]';

test.describe('the inbox', () => {
  const inbox = 'ol[aria-label="Inbox"]';

  test('records silently and survives a reload', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Send silently', exact: true }).click();
    await expect(page.locator(`${toasts} li`)).toHaveCount(0);

    await page.getByRole('button', { name: 'Inbox', exact: true }).click();
    await expect(page.locator(inbox).locator('li')).toHaveCount(1);
    await expect(page.locator(inbox)).toContainText('Ada replied');

    await page.reload();
    await page.getByRole('button', { name: 'Inbox', exact: true }).click();
    await expect(page.locator(inbox).locator('li')).toHaveCount(1);
  });

  test('opening an item marks it read, follows its link and closes the panel', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Send silently', exact: true }).click();
    await page.getByRole('button', { name: 'Inbox', exact: true }).click();

    const row = page.locator(inbox).locator('li').first();
    await expect(row).toHaveAttribute('data-unread', 'true');

    await row.getByRole('button').click();
    await expect(page.getByTestId('route')).toHaveText('/threads/42');
    await expect(page.locator(inbox)).toHaveCount(0);

    await page.getByRole('button', { name: 'Inbox', exact: true }).click();
    await expect(page.locator(inbox).locator('li').first()).not.toHaveAttribute('data-unread', 'true');
  });

  test('the panel closes on a click outside and on Escape', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Inbox', exact: true }).click();
    await expect(page.getByText('You are all caught up.')).toBeVisible();

    await page.getByRole('heading', { name: 'Inbox' }).click();
    await expect(page.getByText('You are all caught up.')).toHaveCount(0);

    await page.getByRole('button', { name: 'Inbox', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByText('You are all caught up.')).toHaveCount(0);
  });

  test('the panel stays open while the server sends', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Inbox', exact: true }).click();
    await page.getByRole('button', { name: 'Send silently', exact: true }).click();
    await page.getByRole('button', { name: 'Send silently', exact: true }).click();

    await expect(page.locator(inbox).locator('li')).toHaveCount(2);
  });

  test('an edit from the server updates the item in place', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Send silently', exact: true }).click();
    await page.getByRole('button', { name: 'Edit last', exact: true }).click();
    await page.getByRole('button', { name: 'Inbox', exact: true }).click();

    await expect(page.locator(inbox)).toContainText('See you at 3 (edited)');
    await expect(page.locator(inbox).locator('li')).toHaveCount(1);
  });

  test('a save the server refuses leaves nothing behind', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Saving fails', exact: true }).click();
    await page.getByRole('button', { name: 'Send silently', exact: true }).click();

    await expect(page.getByText('"itemId": null')).toBeVisible();
    await page.getByRole('button', { name: 'Inbox', exact: true }).click();
    await expect(page.getByText('You are all caught up.')).toBeVisible();
  });
});
