import { NotificationPermissionState } from 'react-use-notifications';

export const PermissionBadgeState = {
  Default: NotificationPermissionState.Default,
  Granted: NotificationPermissionState.Granted,
  Denied: NotificationPermissionState.Denied,
  Unsupported: 'unsupported',
} as const;

export type PermissionBadgeState = (typeof PermissionBadgeState)[keyof typeof PermissionBadgeState];

export const DEFAULT_PERMISSION_LABELS: Record<PermissionBadgeState, string> = {
  [PermissionBadgeState.Unsupported]: 'Unavailable',
  [NotificationPermissionState.Default]: 'Not enabled',
  [NotificationPermissionState.Granted]: 'Enabled',
  [NotificationPermissionState.Denied]: 'Blocked',
};
