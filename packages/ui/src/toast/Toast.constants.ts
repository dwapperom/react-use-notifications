export const ToastVariant = {
  Default: 'default',
  Success: 'success',
  Warning: 'warning',
  Danger: 'danger',
} as const;

export type ToastVariant = (typeof ToastVariant)[keyof typeof ToastVariant];

export const ToastPosition = {
  TopLeft: 'top-left',
  TopRight: 'top-right',
  BottomLeft: 'bottom-left',
  BottomRight: 'bottom-right',
} as const;

export type ToastPosition = (typeof ToastPosition)[keyof typeof ToastPosition];

export const NotificationPresentation = {
  Auto: 'auto',
  InApp: 'in-app',
  Native: 'native',
} as const;

export type NotificationPresentation
  = (typeof NotificationPresentation)[keyof typeof NotificationPresentation];

export const FallbackReason = {
  DocumentVisible: 'document-visible',
  NativeUnavailable: 'native-unavailable',
  Requested: 'requested',
} as const;

export type FallbackReason = (typeof FallbackReason)[keyof typeof FallbackReason];

export const DEFAULT_TOAST_DURATION_MS = 6000;
