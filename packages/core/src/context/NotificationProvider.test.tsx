import { renderHook } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { useNotificationContext } from './NotificationContext';
import { NotificationProvider } from './NotificationProvider';

import type { ReactNode } from 'react';

describe('NotificationProvider', () => {
  it('hands its registration and defaults to every hook below it', () => {
    const registration = {} as ServiceWorkerRegistration;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NotificationProvider registration={registration} defaultOptions={{ icon: '/logo.png' }}>
        {children}
      </NotificationProvider>
    );

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    expect(result.current).toEqual({ registration, defaultOptions: { icon: '/logo.png' } });
  });

  it('keeps one context value while its props stay the same', () => {
    const registration = {} as ServiceWorkerRegistration;
    const defaultOptions = { icon: '/logo.png' };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NotificationProvider registration={registration} defaultOptions={defaultOptions}>
        {children}
      </NotificationProvider>
    );

    const { result, rerender } = renderHook(() => useNotificationContext(), { wrapper });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('hands out a new value when defaultOptions is a fresh literal every render', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NotificationProvider defaultOptions={{ icon: '/logo.png' }}>{children}</NotificationProvider>
    );

    const { result, rerender } = renderHook(() => useNotificationContext(), { wrapper });
    const first = result.current;

    rerender();

    expect(result.current).not.toBe(first);
  });

  it('reads as null without a provider, so every hook works standalone', () => {
    const { result } = renderHook(() => useNotificationContext());

    expect(result.current).toBeNull();
  });
});
