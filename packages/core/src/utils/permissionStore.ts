import { NotificationPermissionState } from '../Notification.constants';
import { isNotificationSupported, readPermission } from './environment';

const listeners = new Set<() => void>();

let detachPermissionStatus: (() => void) | null = null;

let watchGeneration = 0;

const notifyListeners = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const attachPermissionStatus = async (generation: number): Promise<void> => {
  if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
    return;
  }

  try {
    const status = await navigator.permissions.query({ name: 'notifications' });

    if (generation !== watchGeneration) {
      return;
    }

    status.addEventListener('change', notifyListeners);
    detachPermissionStatus = () => status.removeEventListener('change', notifyListeners);
  } catch (error) {
    console.error('[react-use-notifications] the Permissions API refused the notifications descriptor', error);
  }
};

const startWatching = (): void => {
  watchGeneration += 1;

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', notifyListeners);
  }
  void attachPermissionStatus(watchGeneration);
};

const stopWatching = (): void => {
  watchGeneration += 1;

  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', notifyListeners);
  }
  detachPermissionStatus?.();
  detachPermissionStatus = null;
};

export const subscribeToPermission = (onStoreChange: () => void): (() => void) => {
  const isFirstListener = listeners.size === 0;
  listeners.add(onStoreChange);

  if (isFirstListener) {
    startWatching();
  }

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      stopWatching();
    }
  };
};

export const getPermissionSnapshot = (): NotificationPermissionState => {
  return readPermission();
};

export const getServerPermissionSnapshot = (): NotificationPermissionState => {
  return NotificationPermissionState.Default;
};

const requestFromPlatform = (): Promise<NotificationPermissionState> => {
  return new Promise((resolve) => {
    const settle = (status?: NotificationPermission) => resolve(status ?? readPermission());

    try {
      const returned = Notification.requestPermission(settle) as
        Promise<NotificationPermission> | undefined;

      void returned?.then(settle, () => settle());
    } catch (error) {
      console.error('[react-use-notifications] Notification.requestPermission() threw', error);
      settle();
    }
  });
};

export const requestPermission = async (): Promise<NotificationPermissionState> => {
  if (!isNotificationSupported()) {
    return NotificationPermissionState.Denied;
  }

  const status = await requestFromPlatform();
  notifyListeners();

  return status;
};

export const ensurePermission = async (): Promise<NotificationPermissionState> => {
  const current = readPermission();
  if (current !== NotificationPermissionState.Default) {
    return current;
  }

  return requestPermission();
};
