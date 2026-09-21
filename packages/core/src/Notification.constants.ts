export const NotificationPermissionState = {
  Default: 'default',
  Granted: 'granted',
  Denied: 'denied',
} as const;

export type NotificationPermissionState
  = (typeof NotificationPermissionState)[keyof typeof NotificationPermissionState];

export const NotificationDelivery = {
  Persistent: 'persistent',
  Transient: 'transient',
} as const;

export type NotificationDelivery = (typeof NotificationDelivery)[keyof typeof NotificationDelivery];

export const DeliveryPreference = {
  Auto: 'auto',
  Persistent: 'persistent',
  Transient: 'transient',
} as const;

export type DeliveryPreference = (typeof DeliveryPreference)[keyof typeof DeliveryPreference];

export const NotificationOutcome = {
  Shown: 'shown',
  Unsupported: 'unsupported',
  InsecureContext: 'insecure-context',
  PermissionDenied: 'permission-denied',
  PermissionDismissed: 'permission-dismissed',
  RegistrationRequired: 'registration-required',
  Failed: 'failed',
} as const;

export type NotificationOutcome = (typeof NotificationOutcome)[keyof typeof NotificationOutcome];

export type NotificationSuccessOutcome = typeof NotificationOutcome.Shown;
export type NotificationFailureOutcome = Exclude<NotificationOutcome, NotificationSuccessOutcome>;

export const NotificationMessageType = {
  Click: 'react-use-notifications/click',
  Close: 'react-use-notifications/close',
} as const;

export type NotificationMessageType
  = (typeof NotificationMessageType)[keyof typeof NotificationMessageType];

export const DEFAULT_NAVIGATE_URL = '/';

export const NAVIGATION_DATA_KEY = '__reactUseNotifications';
