import { vi } from 'vitest';

import { resetCapabilitiesCache } from '../hooks/useNotificationCapabilities';

import type { WebNotificationAction } from '../Notification.types';

type Listener = (event: Event) => void;

export class FakeNotification {
  static permission: NotificationPermission = 'default';
  static maxActions = 2;
  static instances: FakeNotification[] = [];
  static requestPermission = vi.fn(async (): Promise<NotificationPermission> => {
    return FakeNotification.permission;
  });

  readonly tag: string;
  readonly data: unknown;
  readonly close = vi.fn(() => this.dispatch('close'));

  private readonly listeners = new Map<string, Set<Listener>>();

  constructor(
    readonly title: string,
    readonly options: NotificationOptions = {},
  ) {
    if ('actions' in options) {
      throw new TypeError(
        'Failed to construct \'Notification\': actions are only supported for persistent notifications',
      );
    }

    this.tag = options.tag ?? '';
    this.data = options.data;
    FakeNotification.instances.push(this);
  }

  addEventListener(type: string, listener: Listener): void {
    const existing = this.listeners.get(type) ?? new Set<Listener>();
    existing.add(listener);
    this.listeners.set(type, existing);
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new Event(type));
    }
  }

  static reset(): void {
    FakeNotification.permission = 'default';
    FakeNotification.maxActions = 2;
    FakeNotification.instances = [];
    FakeNotification.requestPermission.mockClear();
  }
}

export const installFakeNotification = (): typeof FakeNotification => {
  FakeNotification.reset();
  vi.stubGlobal('Notification', FakeNotification);
  resetCapabilitiesCache();

  return FakeNotification;
};

export const setSecureContext = (value: boolean): void => {
  Object.defineProperty(window, 'isSecureContext', { value, configurable: true });
};

export interface FakePermissions {
  fireChange: () => void;
  liveListenerCount: () => number;
  queryCount: () => number;
}

export const installFakePermissions = (initialState: PermissionState): FakePermissions => {
  const issued: Array<Set<Listener>> = [];

  const query = vi.fn(async () => {
    const listeners = new Set<Listener>();
    issued.push(listeners);

    return {
      state: initialState,
      addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
    };
  });

  Object.defineProperty(navigator, 'permissions', { value: { query }, configurable: true });

  return {
    fireChange: () => {
      for (const listeners of issued) {
        for (const listener of listeners) {
          listener(new Event('change'));
        }
      }
    },
    liveListenerCount: () => issued.reduce((total, listeners) => total + listeners.size, 0),
    queryCount: () => query.mock.calls.length,
  };
};

export const removePermissionsApi = (): void => {
  Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true });
};

type RecordedOptions = NotificationOptions & {
  actions?: WebNotificationAction[];
  navigate?: string;
  image?: string;
  renotify?: boolean;
  vibrate?: VibratePattern;
};

export interface FakeRegistration {
  registration: ServiceWorkerRegistration;
  shown: Array<{ title: string; options: RecordedOptions }>;
  open: Array<{ tag: string; close: ReturnType<typeof vi.fn> }>;
}

export const createFakeRegistration = (): FakeRegistration => {
  const shown: FakeRegistration['shown'] = [];
  const open: FakeRegistration['open'] = [];

  const registration = {
    showNotification: vi.fn(async (title: string, options: RecordedOptions = {}) => {
      shown.push({ title, options });
      open.push({ tag: options.tag ?? '', close: vi.fn() });
    }),
    getNotifications: vi.fn(async (filter: { tag?: string } = {}) => {
      if (filter.tag === undefined) {
        return open;
      }

      return open.filter((notification) => notification.tag === filter.tag);
    }),
  } as unknown as ServiceWorkerRegistration;

  return {
    registration,
    shown,
    open,
  };
};
