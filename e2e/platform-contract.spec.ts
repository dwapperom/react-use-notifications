import { expect, test } from '@playwright/test';

/*
 * These assert what jsdom cannot: what a real engine does with the option bag. Every design
 * decision in packages/core/src/utils/options.ts rests on the answers, so a browser change that
 * flips one of them should break the build rather than a user's notification.
 */
test.describe('platform contract', () => {
  test('the engine keeps actions on a stored notification', async ({ page }) => {
    await page.goto('/');

    const stored = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Stored', {
        tag: 'e2e-actions',
        actions: [
          { action: 'reply', title: 'Reply' },
          { action: 'mute', title: 'Mute' },
        ],
      } as NotificationOptions);

      const [shown] = await registration.getNotifications({ tag: 'e2e-actions' });
      const actions = (shown as Notification & { actions?: { title: string }[] }).actions ?? [];
      shown?.close();

      return {
        count: actions.length,
        titles: actions.map((action) => action.title),
      };
    });

    expect(stored.count).toBe(2);
    expect(stored.titles).toEqual(['Reply', 'Mute']);
  });

  test('the engine drops a per-action navigate, which is why hints ride inside data', async ({
    page,
  }) => {
    await page.goto('/');

    const stored = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Hints', {
        tag: 'e2e-navigate',
        data: { __reactUseNotifications: { actions: { open: '/threads/42' } } },
        actions: [{ action: 'open', title: 'Open', navigate: '/threads/42' }],
      } as NotificationOptions);

      const [shown] = await registration.getNotifications({ tag: 'e2e-navigate' });
      const action = (shown as Notification & { actions?: Record<string, unknown>[] }).actions?.[0];
      const data = shown?.data as { __reactUseNotifications?: unknown } | undefined;
      shown?.close();

      return {
        navigateSurvived: action !== undefined && 'navigate' in action,
        hintsSurvived: data?.__reactUseNotifications !== undefined,
      };
    });

    expect(stored.navigateSurvived).toBe(false);
    expect(stored.hintsSurvived).toBe(true);
  });

  test('the Notification constructor refuses actions', async ({ page }) => {
    await page.goto('/');

    const threw = await page.evaluate(() => {
      try {
        new Notification('Transient', { actions: [{ action: 'a', title: 'A' }] } as
          NotificationOptions);

        return false;
      } catch {
        return true;
      }
    });

    expect(threw).toBe(true);
  });
});
