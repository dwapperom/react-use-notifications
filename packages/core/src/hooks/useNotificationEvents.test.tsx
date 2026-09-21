import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { NotificationMessageType } from '../Notification.constants';
import { useNotificationClick, useNotificationEvents } from './useNotificationEvents';

import type { NotificationClickMessage, NotificationMessage } from '../Notification.types';

type Listener = (event: MessageEvent<unknown>) => void;

const installServiceWorkerContainer = () => {
  const listeners = new Set<Listener>();

  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
    },
    configurable: true,
  });

  return {
    post: (data: unknown) => {
      for (const listener of listeners) {
        listener({ data } as MessageEvent<unknown>);
      }
    },
    listenerCount: () => listeners.size,
  };
};

const clickMessage: NotificationClickMessage = {
  type: NotificationMessageType.Click,
  action: 'reply',
  tag: 'thread-1',
  navigate: '/inbox',
  data: { id: 1 },
};

describe('useNotificationEvents', () => {
  let container: ReturnType<typeof installServiceWorkerContainer>;

  beforeEach(() => {
    container = installServiceWorkerContainer();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('receives the messages the service worker posts', () => {
    const onMessage = vi.fn();
    renderHook(() => useNotificationEvents(onMessage));

    act(() => container.post(clickMessage));

    expect(onMessage).toHaveBeenCalledWith(clickMessage);
  });

  it('ignores unrelated traffic on the shared message channel', () => {
    const onMessage = vi.fn();
    renderHook(() => useNotificationEvents(onMessage));

    act(() => {
      container.post({ type: 'workbox-broadcast-update' });
      container.post('a string');
      container.post(null);
    });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it('does not resubscribe when the handler identity changes', () => {
    const { rerender } = renderHook<void, { handler: (message: NotificationMessage) => void }>(
      ({ handler }) => useNotificationEvents(handler),
      { initialProps: { handler: vi.fn() } },
    );

    rerender({ handler: vi.fn() });

    expect(container.listenerCount()).toBe(1);
  });

  it('detaches on unmount', () => {
    const { unmount } = renderHook(() => useNotificationEvents(vi.fn()));

    unmount();

    expect(container.listenerCount()).toBe(0);
  });

  it('narrows to click messages with useNotificationClick', () => {
    const onClick = vi.fn();
    renderHook(() => useNotificationClick(onClick));

    act(() => {
      container.post({ type: NotificationMessageType.Close, tag: 'thread-1', data: undefined });
      container.post(clickMessage);
    });

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith(clickMessage);
  });

  it('does nothing in a browser with no service worker container', () => {
    vi.stubGlobal('navigator', {});
    const onMessage = vi.fn();

    expect(() => renderHook(() => useNotificationEvents(onMessage))).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();
  });
});
