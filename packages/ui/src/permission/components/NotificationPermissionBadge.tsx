import { forwardRef } from 'react';

import { useNotificationPermission } from 'react-use-notifications';

import { DEFAULT_PERMISSION_LABELS, PermissionBadgeState } from '../Permission.constants';

import type { HTMLAttributes } from 'react';

export interface NotificationPermissionBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  labels?: Partial<Record<PermissionBadgeState, string>>;
}

export const NotificationPermissionBadge = forwardRef<
  HTMLSpanElement,
  NotificationPermissionBadgeProps
>(({ labels, ...spanProps }, ref) => {
  const { isSupported, permission } = useNotificationPermission();
  const state: PermissionBadgeState = isSupported ? permission : PermissionBadgeState.Unsupported;

  return (
    <span role="status" {...spanProps} ref={ref} data-permission={state}>
      {labels?.[state] ?? DEFAULT_PERMISSION_LABELS[state]}
    </span>
  );
});

NotificationPermissionBadge.displayName = 'NotificationPermissionBadge';
