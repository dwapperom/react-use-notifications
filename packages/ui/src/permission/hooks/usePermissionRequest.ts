import { useCallback, useState } from 'react';

import { useNotificationPermission } from 'react-use-notifications';
import { useLatest } from 'react-use-notifications/internal';

import type { NotificationPermissionState } from 'react-use-notifications';

export interface UsePermissionRequestReturn {
  permission: NotificationPermissionState;
  isSupported: boolean;
  isRequesting: boolean;
  isDisabled: boolean;
  requestPermission: () => Promise<void>;
}

export const usePermissionRequest = (
  onPermissionChange?: (permission: NotificationPermissionState) => void,
): UsePermissionRequestReturn => {
  const { permission, isSupported, isDenied, isGranted, request } = useNotificationPermission();
  const [isRequesting, setIsRequesting] = useState(false);

  const onChangeRef = useLatest(onPermissionChange);

  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      const next = await request();
      onChangeRef.current?.(next);
    } catch (error) {
      console.error('[react-use-notifications-ui] requesting notification permission failed', error);
    } finally {
      setIsRequesting(false);
    }
  }, [onChangeRef, request]);

  return {
    permission,
    isSupported,
    isRequesting,
    isDisabled: !isSupported || isDenied || isGranted || isRequesting,
    requestPermission,
  };
};
