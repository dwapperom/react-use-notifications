import { renderToString } from 'react-dom/server';

import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  FakeNotification,
  installFakeNotification,
  installFakePermissions,
  removePermissionsApi,
  setSecureContext,
} from '../test/fakes';
import { resetCapabilitiesCache } from './useNotificationCapabilities';
import { useNotificationPermission } from './useNotificationPermission';

describe('useNotificationPermission', () => {
  beforeEach(() => {
    installFakeNotification();
    setSecureContext(true);
    resetCapabilitiesCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tracks permission changes made outside the hook', async () => {
    const permissions = installFakePermissions('prompt');
    const { result } = renderHook(() => useNotificationPermission());

    expect(result.current.permission).toBe('default');

    await act(async () => {});

    FakeNotification.permission = 'granted';
    act(() => permissions.fireChange());

    expect(result.current.permission).toBe('granted');
    expect(result.current.isGranted).toBe(true);
  });

  it('falls back to visibilitychange when the Permissions API rejects the descriptor', async () => {
    removePermissionsApi();
    const { result } = renderHook(() => useNotificationPermission());

    await act(async () => {});

    FakeNotification.permission = 'denied';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.permission).toBe('denied');
    expect(result.current.isDenied).toBe(true);
  });

  it('renders a neutral value on the server even when the client would say granted', () => {
    FakeNotification.permission = 'granted';

    const Probe = () => {
      const { permission } = useNotificationPermission();

      return <span>{permission}</span>;
    };

    expect(renderToString(<Probe />)).toContain('default');
  });

  it('keeps exactly one permission listener across a remount', async () => {
    const permissions = installFakePermissions('prompt');

    const first = renderHook(() => useNotificationPermission());
    first.unmount();
    const second = renderHook(() => useNotificationPermission());
    await act(async () => {});

    expect(permissions.liveListenerCount()).toBe(1);

    second.unmount();
    expect(permissions.liveListenerCount()).toBe(0);
  });

  it('resolves a permission state on engines whose requestPermission takes a callback', async () => {
    FakeNotification.requestPermission.mockImplementation(((
      callback?: (status: NotificationPermission) => void,
    ) => {
      setTimeout(() => {
        FakeNotification.permission = 'granted';
        callback?.('granted');
      }, 0);

      return undefined;
    }) as unknown as () => Promise<NotificationPermission>);

    const { result } = renderHook(() => useNotificationPermission());

    let resolved: NotificationPermission | undefined;
    await act(async () => {
      resolved = await result.current.request();
    });

    expect(resolved).toBe('granted');
  });

  it('reports denied without throwing when the API is missing entirely', () => {
    vi.stubGlobal('Notification', undefined);
    resetCapabilitiesCache();

    const { result } = renderHook(() => useNotificationPermission());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe('denied');
  });
});
