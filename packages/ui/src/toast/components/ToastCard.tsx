import type { ToastItem, ToasterClassNames } from '../Toast.types';
import type { WebNotificationAction } from 'react-use-notifications';

export interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  onAction?: (toast: ToastItem, action: WebNotificationAction) => void;
  classNames: ToasterClassNames;
  dismissLabel: string;
}

const SAFE_ICON_PROTOCOLS = ['https:', 'http:', 'blob:'];

const toSafeIcon = (icon: string | undefined): string | undefined => {
  if (icon === undefined) {
    return undefined;
  }

  try {
    const { protocol } = new URL(icon, window.location.href);

    return SAFE_ICON_PROTOCOLS.includes(protocol)
      ? icon
      : undefined;
  } catch (error) {
    console.error('[react-use-notifications-ui] could not parse the notification icon URL', error);

    return undefined;
  }
};

export const ToastCard = ({
  toast,
  onDismiss,
  onAction,
  classNames,
  dismissLabel,
}: ToastCardProps) => {
  const icon = toSafeIcon(toast.icon);

  return (
    <li className={classNames.toast} data-variant={toast.variant} data-reason={toast.reason}>
      {icon
        ? (
            <img
              src={icon}
              alt=""
              className={classNames.icon}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          )
        : null}

      <div className={classNames.content}>
        <p className={classNames.title}>{toast.title}</p>
        {toast.body ? <p className={classNames.body}>{toast.body}</p> : null}

        {toast.actions.length > 0
          ? (
              <div className={classNames.actions}>
                {toast.actions.map((action) => (
                  <button
                    key={action.action}
                    type="button"
                    className={classNames.action}
                    onClick={() => onAction?.(toast, action)}
                  >
                    {action.title}
                  </button>
                ))}
              </div>
            )
          : null}
      </div>

      <button
        type="button"
        className={classNames.dismiss}
        onClick={() => onDismiss(toast.id)}
        aria-label={`${dismissLabel}: ${toast.title}`}
      >
        &times;
      </button>
    </li>
  );
};
