import { useSyncExternalStore } from 'react';

import { readCapabilities } from '../utils/environment';

import type { NotificationCapabilities } from '../Notification.types';

const CACHE_KEY = Symbol.for('react-use-notifications.capabilities');

type CacheHost = { [CACHE_KEY]?: NotificationCapabilities | null };

const SERVER_CAPABILITIES: NotificationCapabilities = {
  isSupported: false,
  isSecureContext: false,
  persistent: false,
  actions: false,
  navigate: false,
  image: false,
  vibrate: false,
  badge: false,
  renotify: false,
  requireInteraction: false,
  silent: false,
  maxActions: 0,
};

const subscribeToNothing = (): (() => void) => {
  return () => {};
};

const getCapabilitiesSnapshot = (): NotificationCapabilities => {
  const host = globalThis as CacheHost;
  host[CACHE_KEY] ??= readCapabilities();

  return host[CACHE_KEY];
};

const getServerCapabilitiesSnapshot = (): NotificationCapabilities => {
  return SERVER_CAPABILITIES;
};

export const resetCapabilitiesCache = (): void => {
  (globalThis as CacheHost)[CACHE_KEY] = null;
};

export const useNotificationCapabilities = (): NotificationCapabilities => {
  return useSyncExternalStore(
    subscribeToNothing,
    getCapabilitiesSnapshot,
    getServerCapabilitiesSnapshot,
  );
};
