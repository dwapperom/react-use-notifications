import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { NotificationMessageType } from '../Notification.constants';
import { initNotificationHandlers } from './index';

import type { NotificationEventLike, NotificationHandlerOptions } from './index';

type Handler = (event: NotificationEventLike) => void;

interface FakeClient {
  url: string;
  focused?: boolean;
  focus: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
  postMessage: ReturnType<typeof vi.fn>;
}

const createClient = (url: string, focused = false): FakeClient => {
  const client: FakeClient = {
    url,
    focused,
    focus: vi.fn(async () => client),
    navigate: vi.fn(async () => client),
    postMessage: vi.fn(),
  };

  return client;
};

const installScope = (clients: FakeClient[]) => {
  const openWindow = vi.fn(async (): Promise<FakeClient | null> => null);
  vi.stubGlobal('ServiceWorkerGlobalScope', class {});
  vi.stubGlobal('clients', {
    matchAll: vi.fn(async () => clients),
    openWindow,
  });

  return {
    openWindow,
  };
};

const captureHandlers = (options: NotificationHandlerOptions = {}): Map<string, Handler> => {
  const handlers = new Map<string, Handler>();
  const spy = vi
    .spyOn(window, 'addEventListener')
    .mockImplementation((type: string, listener: unknown) => {
      handlers.set(type, listener as Handler);
    });

  initNotificationHandlers(options);
  spy.mockRestore();

  return handlers;
};

const createEvent = (overrides: {
  action?: string;
  actions?: Array<{ action: string; navigate?: string }>;
  navigate?: string;
  data?: unknown;
  tag?: string;
}) => {
  const pending: Array<Promise<unknown>> = [];
  const close = vi.fn();

  const event = {
    action: overrides.action ?? '',
    notification: {
      tag: overrides.tag ?? '',
      data: overrides.data,
      actions: overrides.actions,
      navigate: overrides.navigate,
      close,
    },
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
  } as unknown as NotificationEventLike;

  return {
    event,
    close,
    settle: () => Promise.all(pending),
  };
};

describe('initNotificationHandlers', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing outside a service worker scope', () => {
    const spy = vi.spyOn(window, 'addEventListener');

    initNotificationHandlers();

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  describe('navigate resolution order', () => {
    it('prefers the activated action navigate URL', async () => {
      const client = createClient('http://localhost:3000/other');
      installScope([client]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({
        action: 'reply',
        actions: [
          { action: 'reply', navigate: '/inbox/reply' },
          { action: 'archive', navigate: '/archive' },
        ],
        navigate: '/inbox',
        data: { url: '/data' },
      });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(client.navigate).toHaveBeenCalledWith('http://localhost:3000/inbox/reply');
    });

    it('falls back to the notification navigate URL', async () => {
      const client = createClient('http://localhost:3000/other');
      installScope([client]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ navigate: '/inbox', data: { url: '/data' } });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(client.navigate).toHaveBeenCalledWith('http://localhost:3000/inbox');
    });

    it('falls back to data.url', async () => {
      const client = createClient('http://localhost:3000/other');
      installScope([client]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ data: { url: '/from-data' } });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(client.navigate).toHaveBeenCalledWith('http://localhost:3000/from-data');
    });

    it('focuses without navigating when the notification names no target', async () => {
      const client = createClient('http://localhost:3000/orders/new');
      installScope([client]);
      const handlers = captureHandlers({ defaultUrl: '/fallback' });

      const { event, settle } = createEvent({});
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(client.navigate).not.toHaveBeenCalled();
      expect(client.focus).toHaveBeenCalled();
    });

    it('opens the default URL when there is no window at all', async () => {
      const { openWindow } = installScope([]);
      const handlers = captureHandlers({ defaultUrl: '/fallback' });

      const { event, settle } = createEvent({});
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(openWindow).toHaveBeenCalledWith('http://localhost:3000/fallback');
    });

    it('ignores an action id that only exists on Object.prototype', async () => {
      const client = createClient('http://localhost:3000/');
      installScope([client]);
      const handlers = captureHandlers({ defaultUrl: '/inbox' });

      const { event, settle } = createEvent({
        action: 'toString',
        data: { __reactUseNotifications: { actions: { reply: '/threads/42' } } },
      });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(client.navigate).not.toHaveBeenCalled();
      expect(client.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ navigate: undefined }),
      );
    });

    it('ignores a non-string target, whatever survived the structured clone', async () => {
      const client = createClient('http://localhost:3000/');
      installScope([client]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({
        action: 'reply',
        data: { __reactUseNotifications: { actions: { reply: 42 } } },
      });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(client.navigate).not.toHaveBeenCalled();
    });
  });

  describe('client targeting', () => {
    it('focuses a client already showing the target URL instead of navigating it', async () => {
      const match = createClient('http://localhost:3000/inbox');
      const other = createClient('http://localhost:3000/elsewhere');
      installScope([other, match]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ navigate: '/inbox' });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(match.focus).toHaveBeenCalled();
      expect(match.navigate).not.toHaveBeenCalled();
      expect(other.focus).not.toHaveBeenCalled();
    });

    it('opens a window when no client is available', async () => {
      const { openWindow } = installScope([]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ navigate: '/inbox' });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(openWindow).toHaveBeenCalledWith('http://localhost:3000/inbox');
    });

    it('opens a window when navigating an uncontrolled client rejects', async () => {
      const client = createClient('http://localhost:3000/other');
      client.navigate.mockRejectedValue(new Error('not controlled'));
      const { openWindow } = installScope([client]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ navigate: '/inbox' });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(openWindow).toHaveBeenCalledWith('http://localhost:3000/inbox');
    });
  });

  it('delivers the click message to the window it just navigated', async () => {
    const before = createClient('http://localhost:3000/other');
    const after = createClient('http://localhost:3000/inbox');
    before.navigate.mockResolvedValue(after);
    installScope([before]);
    const handlers = captureHandlers();

    const { event, settle } = createEvent({ navigate: '/inbox', tag: 'thread-1' });
    handlers.get('notificationclick')?.(event);
    await settle();

    expect(after.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationMessageType.Click, tag: 'thread-1' }),
    );
  });

  it('delivers the click message to a window it had to open', async () => {
    const opened = createClient('http://localhost:3000/inbox');
    const { openWindow } = installScope([]);
    openWindow.mockResolvedValue(opened);
    const handlers = captureHandlers();

    const { event, settle } = createEvent({ navigate: '/inbox' });
    handlers.get('notificationclick')?.(event);
    await settle();

    expect(opened.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationMessageType.Click }),
    );
  });

  it('closes the notification and reports no navigate when none was named', async () => {
    const first = createClient('http://localhost:3000/a');
    const second = createClient('http://localhost:3000/b');
    installScope([first, second]);
    const handlers = captureHandlers();

    const { event, close, settle } = createEvent({
      action: 'reply',
      tag: 'thread-1',
      data: { id: 7 },
    });
    handlers.get('notificationclick')?.(event);
    await settle();

    expect(close).toHaveBeenCalledOnce();
    expect(first.postMessage).toHaveBeenCalledWith({
      type: NotificationMessageType.Click,
      action: 'reply',
      tag: 'thread-1',
      navigate: undefined,
      data: { id: 7 },
    });
    expect(second.postMessage).not.toHaveBeenCalled();
  });

  it('tells every window about a click no window took', async () => {
    const orphan = createClient('http://localhost:3000/a');
    orphan.navigate.mockRejectedValue(new Error('not controlled'));
    const { openWindow } = installScope([orphan]);
    openWindow.mockResolvedValue(null);
    const handlers = captureHandlers();

    const { event, settle } = createEvent({ navigate: '/inbox', tag: 'thread-1' });
    handlers.get('notificationclick')?.(event);
    await settle();

    expect(orphan.postMessage).toHaveBeenCalledWith({
      type: NotificationMessageType.Click,
      action: '',
      tag: 'thread-1',
      navigate: '/inbox',
      data: undefined,
    });
  });

  describe('resilience', () => {
    it('still navigates when a user click handler throws', async () => {
      const client = createClient('http://localhost:3000/other');
      installScope([client]);
      const onClick = vi.fn(() => {
        throw new Error('handler blew up');
      });
      const handlers = captureHandlers({ onClick });

      const { event, settle } = createEvent({ navigate: '/inbox' });
      handlers.get('notificationclick')?.(event);
      await expect(settle()).resolves.toBeDefined();

      expect(client.navigate).toHaveBeenCalledWith('http://localhost:3000/inbox');
    });

    it('still navigates when a user click handler rejects', async () => {
      const client = createClient('http://localhost:3000/other');
      installScope([client]);
      const handlers = captureHandlers({ onClick: vi.fn(async () => Promise.reject(new Error())) });

      const { event, settle } = createEvent({ navigate: '/inbox' });
      handlers.get('notificationclick')?.(event);
      await expect(settle()).resolves.toBeDefined();

      expect(client.navigate).toHaveBeenCalledWith('http://localhost:3000/inbox');
    });

    it('refuses an unparseable navigate target instead of substituting the default', async () => {
      const client = createClient('http://localhost:3000/other');
      installScope([client]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ navigate: 'http://[not a url' });
      handlers.get('notificationclick')?.(event);
      await expect(settle()).resolves.toBeDefined();

      expect(client.navigate).not.toHaveBeenCalled();
      expect(client.focus).toHaveBeenCalled();
      expect(client.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ navigate: undefined }),
      );
    });

    it('still delivers the click when focusing and opening both fail', async () => {
      const orphan = createClient('http://localhost:3000/a');
      orphan.navigate.mockRejectedValue(new Error('not controlled'));
      orphan.focus.mockRejectedValue(new Error('not allowed'));
      const { openWindow } = installScope([orphan]);
      openWindow.mockRejectedValue(new Error('blocked'));
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ navigate: '/inbox', tag: 'thread-1' });
      handlers.get('notificationclick')?.(event);
      await expect(settle()).resolves.toBeDefined();

      expect(orphan.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationMessageType.Click, navigate: '/inbox' }),
      );
    });
  });

  describe('navigation origin gate', () => {
    it('refuses a cross-origin target and opens the default instead', async () => {
      const { openWindow } = installScope([]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ navigate: 'https://evil.example/login' });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(openWindow).toHaveBeenCalledWith('http://localhost:3000/');
    });

    it('refuses a javascript: target', async () => {
      const { openWindow } = installScope([]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ navigate: 'javascript:alert(1)' });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(openWindow).toHaveBeenCalledWith('http://localhost:3000/');
    });

    it('tells the page nothing was asked for when the target was refused', async () => {
      const client = createClient('http://localhost:3000/a');
      installScope([client]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ navigate: 'https://evil.example/login' });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(client.navigate).not.toHaveBeenCalled();
      expect(client.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ navigate: undefined }),
      );
    });

    it('allows an origin the consumer listed', async () => {
      const { openWindow } = installScope([]);
      const handlers = captureHandlers({ allowedOrigins: ['https://docs.example'] });

      const { event, settle } = createEvent({ navigate: 'https://docs.example/guide' });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(openWindow).toHaveBeenCalledWith('https://docs.example/guide');
    });

    it('still refuses a javascript: target when isAllowedUrl approves everything', async () => {
      const { openWindow } = installScope([]);
      const handlers = captureHandlers({ isAllowedUrl: () => true });

      const { event, settle } = createEvent({ navigate: 'javascript:alert(1)' });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(openWindow).toHaveBeenCalledWith('http://localhost:3000/');
    });

    it('lets isAllowedUrl replace the origin check entirely', async () => {
      const { openWindow } = installScope([]);
      const isAllowedUrl = vi.fn(() => true);
      const handlers = captureHandlers({ isAllowedUrl });

      const { event, settle } = createEvent({ navigate: 'https://anywhere.example/x' });
      handlers.get('notificationclick')?.(event);
      await settle();

      expect(isAllowedUrl).toHaveBeenCalled();
      expect(openWindow).toHaveBeenCalledWith('https://anywhere.example/x');
    });
  });

  it('reports dismissals through notificationclose', async () => {
    const client = createClient('http://localhost:3000/a');
    installScope([client]);
    const onClose = vi.fn();
    const handlers = captureHandlers({ onClose });

    const { event, settle } = createEvent({ tag: 'thread-1', data: { id: 7 } });
    handlers.get('notificationclose')?.(event);
    await settle();

    expect(onClose).toHaveBeenCalledOnce();
    expect(client.postMessage).toHaveBeenCalledWith({
      type: NotificationMessageType.Close,
      tag: 'thread-1',
      data: { id: 7 },
    });
  });

  it('treats a foreign value under our data key as plain data instead of crashing', async () => {
    const client = createClient('http://localhost:3000/');
    installScope([client]);
    const handlers = captureHandlers();

    const { event, settle } = createEvent({
      action: 'reply',
      data: { __reactUseNotifications: 'not ours' },
    });
    handlers.get('notificationclick')?.(event);
    await settle();

    expect(client.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ data: { __reactUseNotifications: 'not ours' } }),
    );
  });

  describe('notificationclose', () => {
    it('tells one window, not all of them', async () => {
      const first = createClient('http://localhost:3000/a');
      const second = createClient('http://localhost:3000/b');
      installScope([first, second]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ tag: 'thread-1', data: { id: 7 } });
      handlers.get('notificationclose')?.(event);
      await settle();

      const posted = [first, second].filter((c) => c.postMessage.mock.calls.length > 0);
      expect(posted).toHaveLength(1);
    });

    it('prefers the window the user is actually looking at', async () => {
      const background = createClient('http://localhost:3000/a');
      const foreground = createClient('http://localhost:3000/b', true);
      installScope([background, foreground]);
      const handlers = captureHandlers();

      const { event, settle } = createEvent({ tag: 'thread-1' });
      handlers.get('notificationclose')?.(event);
      await settle();

      expect(foreground.postMessage).toHaveBeenCalled();
      expect(background.postMessage).not.toHaveBeenCalled();
    });
  });
});
