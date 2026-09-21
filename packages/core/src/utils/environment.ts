import { NotificationPermissionState } from '../Notification.constants';

import type { NotificationCapabilities } from '../Notification.types';

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && typeof window.Notification === 'function';
};

export const isSecureContext = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.isSecureContext;
};

export const readPermission = (): NotificationPermissionState => {
  if (!isNotificationSupported()) {
    return NotificationPermissionState.Denied;
  }

  return Notification.permission;
};

export const readMaxActions = (): number => {
  if (!isNotificationSupported()) {
    return 0;
  }
  const { maxActions } = Notification as unknown as { maxActions?: number };

  return typeof maxActions === 'number'
    ? maxActions
    : 0;
};

const supportsNotificationProperty = (property: string): boolean => {
  if (!isNotificationSupported()) {
    return false;
  }

  return property in Notification.prototype;
};

export const supportsPersistentNotifications = (): boolean => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  return (
    typeof ServiceWorkerRegistration !== 'undefined'
    && 'showNotification' in ServiceWorkerRegistration.prototype
  );
};

export const supportsActions = (): boolean => {
  return supportsPersistentNotifications() && readMaxActions() > 0;
};

export const readCapabilities = (): NotificationCapabilities => {
  return {
    isSupported: isNotificationSupported(),
    isSecureContext: isSecureContext(),
    persistent: supportsPersistentNotifications(),
    actions: supportsActions(),
    navigate: supportsNotificationProperty('navigate'),
    image: supportsNotificationProperty('image'),
    vibrate: supportsNotificationProperty('vibrate'),
    badge: supportsNotificationProperty('badge'),
    renotify: supportsNotificationProperty('renotify'),
    requireInteraction: supportsNotificationProperty('requireInteraction'),
    silent: supportsNotificationProperty('silent'),
    maxActions: readMaxActions(),
  };
};
