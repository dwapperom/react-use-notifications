import { NotificationPermissionState, useNotificationPermission } from 'react-use-notifications';

import type { ReactNode } from 'react';

export interface NotificationPermissionGateProps {
  children: ReactNode;
  unsupported?: ReactNode;
  denied?: ReactNode;
  prompt?: ReactNode;
}

export const NotificationPermissionGate = ({
  children,
  unsupported = null,
  denied = null,
  prompt = null,
}: NotificationPermissionGateProps) => {
  const { isSupported, permission } = useNotificationPermission();

  if (!isSupported) {
    return <>{unsupported}</>;
  }

  if (permission === NotificationPermissionState.Denied) {
    return <>{denied}</>;
  }

  if (permission === NotificationPermissionState.Default) {
    return <>{prompt}</>;
  }

  return <>{children}</>;
};
