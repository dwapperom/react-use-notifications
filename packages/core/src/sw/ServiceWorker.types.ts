export interface WindowClientLike {
  readonly url: string;
  readonly focused?: boolean;
  focus: () => Promise<WindowClientLike>;
  navigate: (url: string) => Promise<WindowClientLike | null>;
  postMessage: (message: unknown) => void;
}

export interface NotificationActionLike {
  readonly action: string;
  readonly navigate?: string;
}

export interface NotificationLike {
  readonly tag: string;
  readonly data: unknown;
  readonly actions?: readonly NotificationActionLike[];
  readonly navigate?: string;
  close: () => void;
}

export interface NotificationEventLike extends Event {
  readonly action: string;
  readonly notification: NotificationLike;
  waitUntil: (f: Promise<unknown>) => void;
}

export interface ServiceWorkerGlobalScopeLike {
  readonly location: { href: string };
  readonly clients: {
    matchAll: (options?: {
      type?: string;
      includeUncontrolled?: boolean;
    }) => Promise<WindowClientLike[]>;
    openWindow: (url: string) => Promise<WindowClientLike | null>;
  };
  addEventListener: (
    type: 'notificationclick' | 'notificationclose',
    listener: (event: NotificationEventLike) => void,
  ) => void;
}

export interface NotificationHandlerOptions {
  defaultUrl?: string;
  allowedOrigins?: string[];
  isAllowedUrl?: (url: URL) => boolean;
  onClick?: (event: NotificationEventLike) => void | Promise<void>;
  onClose?: (event: NotificationEventLike) => void | Promise<void>;
}
