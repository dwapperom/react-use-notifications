import { useEffect } from 'react';

import {
  act,
  render,
  renderHook as renderHookBare,
  screen,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { NotificationPermissionState, NotificationProvider } from 'react-use-notifications';
import { resetNotificationCapabilitiesCache } from 'react-use-notifications/testing';

import { createFakeRegistration, FakeNotification, installFakeNotification } from '../../test/fakes';
import { ToasterProvider } from '../context/ToasterProvider';
import { FallbackReason, NotificationPresentation, ToastVariant } from '../Toast.constants';
import { useToaster } from './useToaster';
import { useToasts } from './useToasts';

import type { UseToasterOptions } from './useToaster';
import type { RenderHookOptions } from '@testing-library/react';
import type { ReactNode } from 'react';

const useToasterWithToasts = (options?: UseToasterOptions) => {
  return {
    ...useToaster(options),
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

describe('useToaster', () => {
  beforeEach(() => {
    installFakeNotification();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('keeps a focused tab in-app instead of raising an OS notification', async () => {
    const { result } = renderHook(() => useToasterWithToasts());

    await act(async () => {
      await result.current.show('Focused');
    });

    expect(FakeNotification.instances).toHaveLength(0);
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Focused',
      reason: FallbackReason.DocumentVisible,
    });
  });

  it('falls back to a toast when the platform refuses the notification', async () => {
    installFakeNotification(NotificationPermissionState.Denied);

    const { result } = renderHook(() =>
      useToasterWithToasts({ presentation: NotificationPresentation.Native }),
    );

    let outcome;
    await act(async () => {
      outcome = await result.current.show('Denied');
    });

    expect(outcome).toMatchObject({ toastId: expect.any(String) });
    expect(result.current.toasts[0]).toMatchObject({
      reason: FallbackReason.NativeUnavailable,
    });
  });

  it('does not toast when the OS accepted the notification', async () => {
    const { result } = renderHook(() =>
      useToasterWithToasts({ presentation: NotificationPresentation.Native }),
    );

    await act(async () => {
      await result.current.show('Native');
    });

    expect(FakeNotification.instances).toHaveLength(1);
    expect(result.current.toasts).toHaveLength(0);
  });

  it('carries every action into the toast, past the OS maxActions limit', async () => {
    FakeNotification.maxActions = 2;
    resetNotificationCapabilitiesCache();
    const { result } = renderHook(() => useToasterWithToasts());

    await act(async () => {
      await result.current.show('With actions', {
        actions: [
          { action: 'a', title: 'A' },
          { action: 'b', title: 'B' },
          { action: 'c', title: 'C' },
        ],
      });
    });

    expect(result.current.toasts[0]?.actions).toHaveLength(3);
  });

  describe('presentation: in-app', () => {
    it('never touches the Notifications API, so nothing is ever prompted', async () => {
      installFakeNotification(NotificationPermissionState.Default);

      const { result } = renderHook(() =>
        useToasterWithToasts({ presentation: NotificationPresentation.InApp }),
      );

      await act(async () => {
        await result.current.show('Purely in-app');
      });

      expect(FakeNotification.requestPermission).not.toHaveBeenCalled();
      expect(FakeNotification.instances).toHaveLength(0);
      expect(result.current.toasts[0]).toMatchObject({
        title: 'Purely in-app',
        reason: FallbackReason.Requested,
      });
    });

    it('works with permission denied', async () => {
      installFakeNotification(NotificationPermissionState.Denied);

      const { result } = renderHook(() =>
        useToasterWithToasts({ presentation: NotificationPresentation.InApp }),
      );

      let outcome;
      await act(async () => {
        outcome = await result.current.show('Still fine');
      });

      expect(outcome).toMatchObject({ native: null, toastId: expect.any(String) });
      expect(result.current.toasts).toHaveLength(1);
    });

    it('works with no Notifications API at all', async () => {
      vi.stubGlobal('Notification', undefined);
      resetNotificationCapabilitiesCache();

      const { result } = renderHook(() =>
        useToasterWithToasts({ presentation: NotificationPresentation.InApp }),
      );

      await act(async () => {
        await result.current.show('Unsupported browser');
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('stays in-app even when the tab is hidden', async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      const { result } = renderHook(() =>
        useToasterWithToasts({ presentation: NotificationPresentation.InApp }),
      );

      await act(async () => {
        await result.current.show('Backgrounded');
      });

      expect(FakeNotification.instances).toHaveLength(0);
      expect(result.current.toasts).toHaveLength(1);

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
    });
  });

  it('keeps show() referentially stable across renders', () => {
    const { result, rerender } = renderHook(() =>
      useToasterWithToasts({ presentation: NotificationPresentation.InApp }),
    );
    const first = result.current.show;

    rerender();

    expect(result.current.show).toBe(first);
  });

  it('applies hook defaults to in-app toasts, like the native path does', async () => {
    const { result } = renderHook(() =>
      useToasterWithToasts({
        presentation: NotificationPresentation.InApp,
        body: 'Tap to open',
        icon: '/logo.png',
      }),
    );

    await act(async () => {
      await result.current.show('New message');
    });

    expect(result.current.toasts[0]).toMatchObject({
      title: 'New message',
      body: 'Tap to open',
      icon: '/logo.png',
    });
  });

  it('applies provider defaults too, so both paths render the same call the same way', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NotificationProvider defaultOptions={{ body: 'From the provider', icon: '/logo.png' }}>
        <ToasterProvider>{children}</ToasterProvider>
      </NotificationProvider>
    );
    const options = { wrapper };

    const { result } = renderHook(() => {
      return useToasterWithToasts({ presentation: NotificationPresentation.InApp });
    }, options);

    await act(async () => {
      await result.current.show('New message');
    });

    expect(result.current.toasts[0]).toMatchObject({
      body: 'From the provider',
      icon: '/logo.png',
    });
  });

  it('uses the operating system when the window is visible but not focused', async () => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    const { result } = renderHook(() =>
      useToasterWithToasts({ presentation: NotificationPresentation.Auto }),
    );

    await act(async () => {
      await result.current.show('Ada replied');
    });

    expect(FakeNotification.instances).toHaveLength(1);
    expect(result.current.toasts).toHaveLength(0);
  });

  it('lets each toast pick its own variant', async () => {
    const { result } = renderHook(() => useToasterWithToasts({ variant: ToastVariant.Default }));

    await act(async () => {
      await result.current.show('Plain');
      await result.current.show('Broke', { variant: ToastVariant.Danger });
    });

    expect(result.current.toasts[0]?.variant).toBe(ToastVariant.Default);
    expect(result.current.toasts[1]?.variant).toBe(ToastVariant.Danger);
  });

  it('keeps variant and presentation out of the platform options', async () => {
    const { result } = renderHook(() =>
      useToasterWithToasts({ presentation: NotificationPresentation.Native }),
    );

    await act(async () => {
      await result.current.show('Native', {
        body: 'Body',
        variant: ToastVariant.Success,
        presentation: NotificationPresentation.Native,
      });
    });

    const created = FakeNotification.instances.at(-1);
    expect(created?.options).toEqual({ body: 'Body' });
  });

  it('lets a single call override the hook presentation', async () => {
    const { result } = renderHook(() =>
      useToasterWithToasts({ presentation: NotificationPresentation.Native }),
    );

    await act(async () => {
      await result.current.show('Forced in-app', { presentation: NotificationPresentation.InApp });
    });

    expect(FakeNotification.instances).toHaveLength(0);
    expect(result.current.toasts[0]).toMatchObject({ reason: FallbackReason.Requested });
  });

  it('dismisses on request and after the duration elapses', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToasterWithToasts({ duration: 1000 }));

    await act(async () => {
      await result.current.show('First');
      await result.current.show('Second');
    });
    expect(result.current.toasts).toHaveLength(2);

    const firstId = result.current.toasts[0]?.id ?? '';
    act(() => result.current.dismiss(firstId));
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('closes another component\'s OS copy when replacing a shared tag in the page', async () => {
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    const { registration, open } = createFakeRegistration();

    const wrapper = ({ children }: { children: ReactNode }) => (
      <NotificationProvider registration={registration}>
        <ToasterProvider>{children}</ToasterProvider>
      </NotificationProvider>
    );

    const { result } = renderHook(
      () => ({ a: useToasterWithToasts(), b: useToasterWithToasts() }),
      { wrapper },
    );

    await act(async () => {
      await result.current.a.show('Deploying api', {
        tag: 'deploy-1',
        actions: [{ action: 'cancel', title: 'Cancel' }],
      });
    });

    const osCopy = open.find((entry) => entry.tag === 'deploy-1');
    expect(osCopy).toBeDefined();

    hasFocus.mockReturnValue(true);
    await act(async () => {
      await result.current.b.show('api is live', { tag: 'deploy-1' });
    });

    expect(osCopy?.close).toHaveBeenCalled();
    expect(result.current.b.toasts.map((toast) => toast.title)).toEqual(['api is live']);
  });

  it('does not re-render a consumer that only fires toasts', async () => {
    const publisherRendered = vi.fn();

    const Publisher = () => {
      const { show } = useToaster();
      publisherRendered();

      return (
        <button
          type="button"
          onClick={() => void show('Ping', { presentation: NotificationPresentation.InApp })}
        >
          fire
        </button>
      );
    };

    const Display = () => <span data-testid="count">{useToasts().length}</span>;

    render(
      <ToasterProvider>
        <Publisher />
        <Display />
      </ToasterProvider>,
    );

    const before = publisherRendered.mock.calls.length;

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(publisherRendered).toHaveBeenCalledTimes(before);
  });

  describe('a tag spans both channels', () => {
    it('closes the OS copy when the replacement is drawn in the page', async () => {
      const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
      const { result } = renderHook(() => useToasterWithToasts());

      await act(async () => {
        await result.current.show('Deploying api', { tag: 'deploy-1' });
      });

      const [notification] = FakeNotification.instances;

      hasFocus.mockReturnValue(true);
      await act(async () => {
        await result.current.show('api is live', { tag: 'deploy-1' });
      });

      expect(notification?.close).toHaveBeenCalled();
      expect(result.current.toasts.map((toast) => toast.title)).toEqual(['api is live']);
    });

    it('dismisses the toast when the replacement goes to the operating system', async () => {
      const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
      const { result } = renderHook(() => useToasterWithToasts());

      await act(async () => {
        await result.current.show('Deploying api', { tag: 'deploy-1' });
      });

      expect(result.current.toasts).toHaveLength(1);

      hasFocus.mockReturnValue(false);
      await act(async () => {
        await result.current.show('api is live', { tag: 'deploy-1' });
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('close', () => {
    it('dismisses the toast that stood in for a notification', async () => {
      const { result } = renderHook(() => useToasterWithToasts());

      await act(async () => {
        await result.current.show('Upload done', { tag: 'upload' });
        await result.current.show('Message', { tag: 'chat' });
      });

      await act(async () => {
        await result.current.close('upload');
      });

      expect(result.current.toasts.map((toast) => toast.title)).toEqual(['Message']);
    });

    it('leaves untagged toasts alone, matching the notification rule', async () => {
      const { result } = renderHook(() => useToasterWithToasts());

      await act(async () => {
        await result.current.show('No tag');
      });

      await act(async () => {
        await result.current.close('');
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('closes the operating system copy too, not only the toast', async () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(false);
      const { result } = renderHook(() => useToasterWithToasts());

      await act(async () => {
        await result.current.show('Upload done', { tag: 'upload' });
      });

      const [notification] = FakeNotification.instances;
      expect(notification).toBeDefined();

      await act(async () => {
        await result.current.close('upload');
      });

      expect(notification?.close).toHaveBeenCalled();
    });

    it('clears the whole list on closeAll', async () => {
      const { result } = renderHook(() => useToasterWithToasts());

      await act(async () => {
        await result.current.show('First');
        await result.current.show('Second');
      });

      await act(async () => {
        await result.current.closeAll();
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  it('replaces a tagged toast instead of stacking, the way the OS does', async () => {
    const { result } = renderHook(() => useToasterWithToasts());

    await act(async () => {
      await result.current.show('Uploading 10%', { tag: 'upload' });
      await result.current.show('Uploading 50%', { tag: 'upload' });
      await result.current.show('Uploading 90%', { tag: 'upload' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({ title: 'Uploading 90%' });
  });

  it('still stacks untagged toasts, which have nothing to replace', async () => {
    const { result } = renderHook(() => useToasterWithToasts());

    await act(async () => {
      await result.current.show('First');
      await result.current.show('Second');
    });

    expect(result.current.toasts).toHaveLength(2);
  });

  describe('a queue shared through the provider', () => {
    const renderTwoConsumers = () => {
      return renderHook(() => ({ upload: useToasterWithToasts(), chat: useToasterWithToasts() }), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ToasterProvider>{children}</ToasterProvider>
        ),
      });
    };

    it('leaves the other consumer toasts alone on closeAll', async () => {
      const { result } = renderTwoConsumers();

      await act(async () => {
        await result.current.upload.show('Upload failed');
        await result.current.chat.show('Ada replied');
      });
      expect(result.current.upload.toasts).toHaveLength(2);

      await act(async () => {
        await result.current.chat.closeAll();
      });

      expect(result.current.upload.toasts.map((toast) => toast.title)).toEqual(['Upload failed']);
    });

    it('scopes dismissAll the same way', async () => {
      const { result } = renderTwoConsumers();

      await act(async () => {
        await result.current.upload.show('Upload failed');
        await result.current.chat.show('Ada replied');
      });

      act(() => result.current.chat.dismissAll());

      expect(result.current.upload.toasts.map((toast) => toast.title)).toEqual(['Upload failed']);
    });
  });

  it('keeps toasts indefinitely when the duration is zero', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToasterWithToasts({ duration: 0 }));

    await act(async () => {
      await result.current.show('Sticky');
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  describe('auto-dismiss timers', () => {
    it('lets go of the timer belonging to a replaced toast', async () => {
      vi.useFakeTimers();
      const cleared = vi.spyOn(globalThis, 'clearTimeout');
      const { result } = renderHook(() => useToasterWithToasts({ duration: 1000 }));

      await act(async () => {
        await result.current.show('Uploading 10%', { tag: 'upload' });
      });
      cleared.mockClear();

      await act(async () => {
        await result.current.show('Uploading 90%', { tag: 'upload' });
      });

      expect(cleared).toHaveBeenCalled();
      expect(result.current.toasts).toHaveLength(1);
      cleared.mockRestore();
    });

    it('lets go of the timer when a toast is closed by tag', async () => {
      vi.useFakeTimers();
      const cleared = vi.spyOn(globalThis, 'clearTimeout');
      const { result } = renderHook(() => useToasterWithToasts({ duration: 1000 }));

      await act(async () => {
        await result.current.show('Upload done', { tag: 'upload' });
      });
      cleared.mockClear();

      await act(async () => {
        await result.current.close('upload');
      });

      expect(cleared).toHaveBeenCalled();
      expect(result.current.toasts).toHaveLength(0);
      cleared.mockRestore();
    });

    it('leaves the surviving toast on its own schedule', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useToasterWithToasts({ duration: 1000 }));

      await act(async () => {
        await result.current.show('First', { tag: 'a' });
      });
      act(() => {
        vi.advanceTimersByTime(600);
      });
      await act(async () => {
        await result.current.show('Second', { tag: 'a' });
      });

      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  it('still auto-dismisses a toast pushed from a child mount effect', async () => {
    vi.useFakeTimers();

    const Child = () => {
      const { show } = useToasterWithToasts({ duration: 1000 });

      useEffect(() => {
        void show('From a mount effect');
      }, [show]);

      return null;
    };

    const Reader = () => {
      const { toasts } = useToasterWithToasts();

      return <span data-testid="count">{toasts.length}</span>;
    };

    render(
      <ToasterProvider>
        <Child />
        <Reader />
      </ToasterProvider>,
    );

    await act(async () => {});
    expect(screen.getByTestId('count')).toHaveTextContent('1');

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
