import type {
  DeliveryPreference,
  NotificationDelivery,
  NotificationPermissionState,
  NotificationFailureOutcome,
  NotificationSuccessOutcome,
  NotificationMessageType,
} from './Notification.constants';

export interface WebNotificationAction {
  action: string;
  title: string;
  icon?: string;
  navigate?: string;
}

interface UnmodelledNotificationOptions {
  image?: string;
  renotify?: boolean;
  vibrate?: VibratePattern;
}

export interface WebNotificationOptions
  extends Omit<NotificationOptions, 'actions'>, UnmodelledNotificationOptions {
  actions?: WebNotificationAction[];
  navigate?: string;
  delivery?: DeliveryPreference;
  onClick?: (event: Event) => void;
  onClose?: (event: Event) => void;
  onError?: (event: Event) => void;
  onShow?: (event: Event) => void;
}

export interface NavigationHints {
  navigate?: string;
  actions?: Record<string, string>;
  wrapped?: unknown;
}

export interface NotificationHandle {
  readonly tag: string | undefined;
  readonly delivery: NotificationDelivery;
  close: () => Promise<void>;
}

export interface ShowSuccess {
  outcome: NotificationSuccessOutcome;
  delivery: NotificationDelivery;
  handle: NotificationHandle;
  clampedActions: WebNotificationAction[];
  actionsUnsupported: boolean;
  handlersUnsupported: boolean;
}

export interface ShowFailure {
  outcome: NotificationFailureOutcome;
  reason: string;
  error?: unknown;
}

export type ShowResult = ShowSuccess | ShowFailure;

export interface NotificationCapabilities {
  isSupported: boolean;
  isSecureContext: boolean;
  persistent: boolean;
  actions: boolean;
  navigate: boolean;
  image: boolean;
  vibrate: boolean;
  badge: boolean;
  renotify: boolean;
  requireInteraction: boolean;
  silent: boolean;
  maxActions: number;
}

export interface NotificationClickMessage {
  type: typeof NotificationMessageType.Click;
  action: string;
  tag: string | undefined;
  navigate: string | undefined;
  data: unknown;
}

export interface NotificationCloseMessage {
  type: typeof NotificationMessageType.Close;
  tag: string | undefined;
  data: unknown;
}

export type NotificationMessage = NotificationClickMessage | NotificationCloseMessage;

export interface UseNotificationPermissionReturn {
  permission: NotificationPermissionState;
  isSupported: boolean;
  isGranted: boolean;
  isDenied: boolean;
  request: () => Promise<NotificationPermissionState>;
}

export interface UseNotificationsOptions extends WebNotificationOptions {
  registration?: ServiceWorkerRegistration;
  closeOnUnmount?: boolean;
}

export interface UseNotificationsReturn extends UseNotificationPermissionReturn {
  show: (title: string, options?: WebNotificationOptions) => Promise<ShowResult>;
  close: (tag: string) => Promise<void>;
  closeAll: () => Promise<void>;
  maxActions: number;
}
