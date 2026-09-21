import { forwardRef } from 'react';

import { ToastCard } from './ToastCard';

import type { ToastItem, ToasterClassNames } from '../Toast.types';
import type { WebNotificationAction } from 'react-use-notifications';

export type { ToasterClassNames };

export interface NotificationToasterProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onAction?: (toast: ToastItem, action: WebNotificationAction) => void;
  classNames?: ToasterClassNames;
  label?: string;
  dismissLabel?: string;
}

export const NotificationToaster = forwardRef<HTMLOListElement, NotificationToasterProps>(({
  toasts,
  onDismiss,
  onAction,
  classNames = {},
  label = 'Notifications',
  dismissLabel = 'Dismiss',
}, ref) => {
  return (
    <ol
      ref={ref}
      className={classNames.region}
      aria-live="polite"
      aria-relevant="additions text"
      aria-label={label}
      data-empty={toasts.length === 0 || undefined}
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onAction={onAction}
          classNames={classNames}
          dismissLabel={dismissLabel}
        />
      ))}
    </ol>
  );
});

NotificationToaster.displayName = 'NotificationToaster';
