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
  createFakeRegistration,
  FakeNotification,
  installFakeNotification,
  installFakePermissions,
  setSecureContext,
} from '../test/fakes';
import { resetCapabilitiesCache } from './useNotificationCapabilities';
import { useNotifications } from './useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    installFakeNotification();
    installFakePermissions('granted');
    setSecureContext(true);
    resetCapabilitiesCache();
    FakeNotification.permission = 'granted';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps show() referentially stable across renders', () => {
    const { result, rerender } = renderHook(({ body }) => useNotifications({ body }), {
      initialProps: { body: 'first' },
    });

    const initialShow = result.current.show;
    rerender({ body: 'first' });

    expect(result.current.show).toBe(initialShow);
  });

  it('still uses the newest options despite the stable identity', async () => {
    const { result, rerender } = renderHook(({ body }) => useNotifications({ body }), {
      initialProps: { body: 'first' },
    });

    rerender({ body: 'second' });
    await act(async () => {
      await result.current.show('Title');
    });

    expect(FakeNotification.instances.at(-1)?.options.body).toBe('second');
  });

  it('closes transient notifications without a service worker', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.show('One');
      await result.current.show('Two');
    });
    const created = [...FakeNotification.instances];

    await act(async () => {
      await result.current.closeAll();
    });

    expect(created).toHaveLength(2);
    expect(created.every((instance) => instance.close.mock.calls.length > 0)).toBe(true);
  });

  it('closes a single tag across both transient and persistent delivery', async () => {
    const { registration, open } = createFakeRegistration();
    const { result } = renderHook(() => useNotifications({ registration }));

    await act(async () => {
      await result.current.show('Keep', { tag: 'keep' });
      await result.current.show('Drop', { tag: 'drop' });
      await result.current.show('Persistent', {
        tag: 'drop',
        actions: [{ action: 'a', title: 'A' }],
      });
    });

    await act(async () => {
      await result.current.close('drop');
    });

    const transient = FakeNotification.instances;
    expect(transient.find((instance) => instance.tag === 'keep')?.close).not.toHaveBeenCalled();
    expect(transient.find((instance) => instance.tag === 'drop')?.close).toHaveBeenCalled();
    expect(open.filter((n) => n.tag === 'drop').every((n) => n.close.mock.calls.length > 0)).toBe(
      true,
    );
  });

  it('keeps hook-level options out of the platform call', async () => {
    const { registration, shown } = createFakeRegistration();
    const { result } = renderHook(() =>
      useNotifications({ registration, closeOnUnmount: true, body: 'Body' }),
    );

    await act(async () => {
      await result.current.show('Persistent', { actions: [{ action: 'a', title: 'A' }] });
      await result.current.show('Transient');
    });

    for (const options of [shown.at(0)?.options, FakeNotification.instances.at(-1)?.options]) {
      expect(options).toBeDefined();
      expect(options).not.toHaveProperty('registration');
      expect(options).not.toHaveProperty('closeOnUnmount');
      expect(options).toMatchObject({ body: 'Body' });
    }
  });

  it('leaves notifications this hook did not open alone', async () => {
    const { registration, open } = createFakeRegistration();
    open.push({ tag: 'from-somewhere-else', close: vi.fn() });

    const { result } = renderHook(() => useNotifications({ registration }));
    await act(async () => {
      await result.current.show('Mine', { actions: [{ action: 'a', title: 'A' }] });
    });

    await act(async () => {
      await result.current.closeAll();
    });

    expect(open.find((n) => n.tag === 'from-somewhere-else')?.close).not.toHaveBeenCalled();
  });

  it('closes persistent notifications on unmount, not just transient ones', async () => {
    const { registration, open } = createFakeRegistration();
    const { result, unmount } = renderHook(() =>
      useNotifications({ registration, closeOnUnmount: true }),
    );

    await act(async () => {
      await result.current.show('Upload done', { actions: [{ action: 'a', title: 'A' }] });
    });

    unmount();
    await act(async () => {});

    expect(open.at(0)?.close).toHaveBeenCalled();
  });

  it('does not close anything when closeOnUnmount is switched off mid-life', async () => {
    const { result, rerender } = renderHook(
      ({ closeOnUnmount }) => useNotifications({ closeOnUnmount }),
      {
        initialProps: { closeOnUnmount: true },
      },
    );

    await act(async () => {
      await result.current.show('Still relevant');
    });
    const created = FakeNotification.instances.at(-1);

    rerender({ closeOnUnmount: false });

    expect(created?.close).not.toHaveBeenCalled();
  });

  describe('a show() still in flight at unmount', () => {
    it('closes the transient notification it eventually creates', async () => {
      const { result, unmount } = renderHook(() => useNotifications({ closeOnUnmount: true }));

      let pending!: Promise<unknown>;
      act(() => {
        pending = result.current.show('Late arrival');
      });
      unmount();
      await act(async () => {
        await pending;
      });

      expect(FakeNotification.instances.at(-1)?.close).toHaveBeenCalled();
    });

    it('closes the persistent notification it eventually creates', async () => {
      const { registration, open } = createFakeRegistration();
      const { result, unmount } = renderHook(() =>
        useNotifications({ registration, closeOnUnmount: true }),
      );

      let pending!: Promise<unknown>;
      act(() => {
        pending = result.current.show('Late arrival', { actions: [{ action: 'a', title: 'A' }] });
      });
      unmount();
      await act(async () => {
        await pending;
      });

      expect(open.at(0)?.close).toHaveBeenCalled();
    });

    it('leaves it up when closeOnUnmount was never asked for', async () => {
      const { result, unmount } = renderHook(() => useNotifications());

      let pending!: Promise<unknown>;
      act(() => {
        pending = result.current.show('Still relevant');
      });
      unmount();
      await act(async () => {
        await pending;
      });

      expect(FakeNotification.instances.at(-1)?.close).not.toHaveBeenCalled();
    });
  });

  it('keeps persistent tags when there is no registration to close them with', async () => {
    const { registration, open } = createFakeRegistration();
    const { result, rerender } = renderHook(
      ({ withRegistration }: { withRegistration: boolean }) =>
        useNotifications({ registration: withRegistration ? registration : undefined }),
      { initialProps: { withRegistration: true } },
    );

    await act(async () => {
      await result.current.show('Upload done', { actions: [{ action: 'a', title: 'A' }] });
    });

    rerender({ withRegistration: false });
    await act(async () => {
      await result.current.closeAll();
    });
    rerender({ withRegistration: true });
    await act(async () => {
      await result.current.closeAll();
    });

    expect(open.at(0)?.close).toHaveBeenCalled();
  });

  it('swallows a failing close on unmount rather than leaving a rejection loose', async () => {
    const { registration } = createFakeRegistration();
    vi.spyOn(registration, 'getNotifications').mockRejectedValue(new Error('worker is gone'));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = renderHook(() =>
      useNotifications({ registration, closeOnUnmount: true }),
    );
    await act(async () => {
      await result.current.show('Upload done', { actions: [{ action: 'a', title: 'A' }] });
    });

    unmount();
    await act(async () => {});

    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  it('exposes maxActions synchronously on the first render', () => {
    FakeNotification.maxActions = 3;
    resetCapabilitiesCache();

    const { result } = renderHook(() => useNotifications());

    expect(result.current.maxActions).toBe(3);
  });
});
