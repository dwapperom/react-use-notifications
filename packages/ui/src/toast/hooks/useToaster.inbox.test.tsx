import {
  act,
  renderHook as renderHookBare,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { InboxProvider } from '../../inbox/context/InboxProvider';
import { useInbox } from '../../inbox/hooks/useInbox';
import { localStorageStore } from '../../inbox/localStorageStore';
import { FakeNotification, installFakeNotification } from '../../test/fakes';
import { ToasterProvider } from '../context/ToasterProvider';
import { NotificationPresentation } from '../Toast.constants';
import { useToaster } from './useToaster';
import { useToasts } from './useToasts';

import type { InboxStore } from '../../inbox/Inbox.types';
import type { RenderHookOptions } from '@testing-library/react';
import type { ReactNode } from 'react';

const useToasterWithToasts = () => {
  return {
    ...useToaster(),
    toasts: useToasts(),
  };
};

const DefaultWrapper = ({ children }: { children: ReactNode }) => (
  <ToasterProvider>{children}</ToasterProvider>
);

const renderHook = <TResult, TProps>(
  render: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>,
) => {
  return renderHookBare(render, { wrapper: DefaultWrapper, ...options });
};

describe('useToaster with an inbox', () => {
  beforeEach(() => {
    installFakeNotification();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const inboxWrapper = ({ children }: { children: ReactNode }) => (
    <InboxProvider store={localStorageStore()}>
      <ToasterProvider>{children}</ToasterProvider>
    </InboxProvider>
  );

  const renderInbox = () => {
    return renderHook(
      () => ({ toaster: useToasterWithToasts(), inbox: useInbox() }),
      { wrapper: inboxWrapper },
    );
  };

  it('records the item without touching the Notifications API', async () => {
    window.localStorage.clear();
    const { result } = renderInbox();

    await act(async () => {
      await result.current.toaster.show('Ada replied', {
        inbox: true,
        presentation: NotificationPresentation.None,
        navigate: '/threads/42',
        body: 'See you at 3',
      });
    });

    expect(FakeNotification.instances).toHaveLength(0);
    expect(FakeNotification.requestPermission).not.toHaveBeenCalled();
    expect(result.current.toaster.toasts).toHaveLength(0);

    expect(result.current.inbox.unread).toBe(1);
    expect(result.current.inbox.items[0]).toMatchObject({
      title: 'Ada replied',
      body: 'See you at 3',
      href: '/threads/42',
      readAt: null,
    });
  });

  it('records the item and draws a toast', async () => {
    window.localStorage.clear();
    const { result } = renderInbox();

    let outcome;
    await act(async () => {
      outcome = await result.current.toaster.show('Deploy finished', {
        inbox: { category: 'deploy' },
        presentation: NotificationPresentation.InApp,
      });
    });

    expect(outcome).toMatchObject({ native: null, itemId: expect.any(String) });
    expect(result.current.toaster.toasts).toHaveLength(1);
    expect(result.current.inbox.items[0]?.category).toBe('deploy');
  });

  it('records the item and raises the OS notification', async () => {
    window.localStorage.clear();
    const { result } = renderInbox();

    let outcome;
    await act(async () => {
      outcome = await result.current.toaster.show('Build broke', {
        inbox: true,
        presentation: NotificationPresentation.Native,
      });
    });

    expect(outcome).toMatchObject({ toastId: null, itemId: expect.any(String) });
    expect(FakeNotification.instances).toHaveLength(1);
    expect(result.current.inbox.unread).toBe(1);
  });

  it('files the item under the id the server gave it', async () => {
    window.localStorage.clear();
    const { result } = renderInbox();

    let outcome;
    await act(async () => {
      outcome = await result.current.toaster.show('Ada replied', {
        inbox: { id: 'srv-9', receivedAt: 1 },
        presentation: NotificationPresentation.None,
      });
    });

    expect(outcome).toMatchObject({ itemId: 'srv-9' });
    expect(result.current.inbox.items[0]).toMatchObject({ id: 'srv-9', receivedAt: 1 });
  });

  it('presents without waiting for the store, and survives it failing', async () => {
    window.localStorage.clear();
    const onError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let rejectAdd = (_error: Error) => {};
    const store: InboxStore = {
      ...localStorageStore(),
      add: () => new Promise((_resolve, reject) => {
        rejectAdd = reject;
      }),
    };

    const { result } = renderHook(
      () => ({ toaster: useToasterWithToasts(), inbox: useInbox() }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <InboxProvider store={store}>
            <ToasterProvider>{children}</ToasterProvider>
          </InboxProvider>
        ),
      },
    );

    let shown: Promise<unknown> = Promise.resolve();
    await act(async () => {
      shown = result.current.toaster.show('Deploy finished', {
        inbox: true,
        presentation: NotificationPresentation.InApp,
      });
    });

    expect(result.current.toaster.toasts).toHaveLength(1);

    await act(async () => {
      rejectAdd(new Error('offline'));
    });

    await expect(shown).resolves.toMatchObject({ itemId: null, toastId: expect.any(String) });
    expect(onError).toHaveBeenCalledWith(
      '[react-use-notifications-ui] could not save the inbox, undoing the change',
      expect.any(Error),
    );
    await waitFor(() => expect(result.current.inbox.items).toHaveLength(0));
    onError.mockRestore();
  });

  it('keeps presenting without an inbox provider', async () => {
    const onError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useToasterWithToasts());

    let outcome;
    await act(async () => {
      outcome = await result.current.show('Nowhere to put this', {
        inbox: true,
        presentation: NotificationPresentation.InApp,
      });
    });

    expect(outcome).toMatchObject({ itemId: null, toastId: expect.any(String) });
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('<InboxProvider>'));
    onError.mockRestore();
  });
});
