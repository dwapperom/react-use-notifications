import { useCallback, useEffect, useState } from 'react';

import { useNotificationContext } from '../context/NotificationContext';
import { createNotificationRegistry } from '../utils/registry';
import { showNotification } from '../utils/show';
import { useLatest } from './useLatest';
import { useNotificationCapabilities } from './useNotificationCapabilities';
import { useNotificationPermission } from './useNotificationPermission';

import type {
  ShowResult,
  UseNotificationsOptions,
  UseNotificationsReturn,
  WebNotificationOptions,
} from '../Notification.types';

export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const permissionApi = useNotificationPermission();
  const capabilities = useNotificationCapabilities();
  const context = useNotificationContext();

  const [registry] = useState(createNotificationRegistry);

  const {
    registration: registrationOption,
    closeOnUnmount: closeOnUnmountOption,
    ...notificationDefaults
  } = options;

  const registration = registrationOption ?? context?.registration;
  const settingsRef = useLatest({
    registration,
    closeOnUnmount: closeOnUnmountOption ?? false,
    defaults: { ...context?.defaultOptions, ...notificationDefaults },
  });

  const show = useCallback((
    title: string,
    overrides: WebNotificationOptions = {},
  ): Promise<ShowResult> => {
    const { defaults, registration: currentRegistration } = settingsRef.current;

    return showNotification(
      title,
      { ...defaults, ...overrides },
      { registration: currentRegistration, registry },
    );
  }, [registry, settingsRef]);

  const releaseAndClose = useCallback(async (tag?: string): Promise<void> => {
    registry.closeTransient(tag);

    const { registration: currentRegistration } = settingsRef.current;

    if (!currentRegistration) {
      return;
    }

    const tags = registry.takePersistent(tag);
    if (tags.length === 0) {
      return;
    }

    const owned = new Set(tags);
    const open = await currentRegistration.getNotifications();
    for (const notification of open) {
      if (owned.has(notification.tag)) {
        notification.close();
      }
    }
  }, [registry, settingsRef]);

  const close = useCallback((tag: string) => releaseAndClose(tag), [releaseAndClose]);
  const closeAll = useCallback(() => releaseAndClose(), [releaseAndClose]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (!settingsRef.current.closeOnUnmount) {
        return;
      }
      registry.dispose();
      releaseAndClose().catch((error: unknown) => {
        console.error('[react-use-notifications] closing on unmount failed', error);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...permissionApi,
    show,
    close,
    closeAll,
    maxActions: capabilities.maxActions,
  };
};
