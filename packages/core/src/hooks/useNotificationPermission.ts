import { useCallback, useSyncExternalStore } from 'react';

import { NotificationPermissionState } from '../Notification.constants';
import {
  getPermissionSnapshot,
  getServerPermissionSnapshot,
  requestPermission,
  subscribeToPermission,
} from '../utils/permissionStore';
import { useNotificationCapabilities } from './useNotificationCapabilities';

import type { UseNotificationPermissionReturn } from '../Notification.types';

export const useNotificationPermission = (): UseNotificationPermissionReturn => {
  const permission = useSyncExternalStore(
    subscribeToPermission,
    getPermissionSnapshot,
    getServerPermissionSnapshot,
  );
  const { isSupported } = useNotificationCapabilities();

  const request = useCallback(() => requestPermission(), []);

  return {
    permission,
    isSupported,
    isGranted: permission === NotificationPermissionState.Granted,
    isDenied: permission === NotificationPermissionState.Denied,
    request,
  };
};
