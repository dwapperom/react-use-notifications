import { NotificationMessageType } from '../Notification.constants';
import { deliver, focusOrOpen, listWindows, pickRecipient } from './clients';
import { decodePayload } from './payload';
import { resolveNavigation } from './target';

import type { NotificationMessage } from '../Notification.types';
import type { Payload } from './payload';
import type {
  NotificationEventLike,
  NotificationHandlerOptions,
  ServiceWorkerGlobalScopeLike,
} from './ServiceWorker.types';
import type { Target } from './target';

export type {
  NotificationActionLike,
  NotificationEventLike,
  NotificationHandlerOptions,
  NotificationLike,
} from './ServiceWorker.types';

const getServiceWorkerScope = (): ServiceWorkerGlobalScopeLike | null => {
  if (typeof self === 'undefined' || !('ServiceWorkerGlobalScope' in self)) {
    return null;
  }

  return self as unknown as ServiceWorkerGlobalScopeLike;
};

const toClickMessage = (
  event: NotificationEventLike,
  payload: Payload,
  target: Target,
): NotificationMessage => {
  return {
    type: NotificationMessageType.Click,
    action: event.action,
    tag: event.notification.tag || undefined,
    navigate: target.explicit ? target.url : undefined,
    data: payload.userData,
  };
};

const runHandler = async (
  handler: ((event: NotificationEventLike) => void | Promise<void>) | undefined,
  event: NotificationEventLike,
): Promise<void> => {
  if (!handler) {
    return;
  }

  try {
    await handler(event);
  } catch (error) {
    console.error('[react-use-notifications] notification handler threw', error);
  }
};

const handleClick = (
  scope: ServiceWorkerGlobalScopeLike,
  event: NotificationEventLike,
  options: NotificationHandlerOptions,
): void => {
  event.notification.close();

  const openWindows = listWindows(scope);
  const payload = decodePayload(event.notification.data);
  const { navigateTo, reported } = resolveNavigation(event, payload, scope, options);
  const message = toClickMessage(event, payload, reported);

  event.waitUntil(
    Promise.all([runHandler(options.onClick, event), openWindows])
      .then(([, clients]) => focusOrOpen(scope, clients, navigateTo, reported.explicit))
      .then((windows) => deliver(message, windows)),
  );
};

const handleClose = (
  scope: ServiceWorkerGlobalScopeLike,
  event: NotificationEventLike,
  options: NotificationHandlerOptions,
): void => {
  const openWindows = listWindows(scope);

  const message: NotificationMessage = {
    type: NotificationMessageType.Close,
    tag: event.notification.tag || undefined,
    data: decodePayload(event.notification.data).userData,
  };

  event.waitUntil(
    Promise.all([runHandler(options.onClose, event), openWindows])
      .then(([, clients]) => pickRecipient(clients)?.postMessage(message)),
  );
};

export const initNotificationHandlers = (options: NotificationHandlerOptions = {}): void => {
  const scope = getServiceWorkerScope();
  if (!scope) {
    return;
  }

  scope.addEventListener('notificationclick', (event) => handleClick(scope, event, options));
  scope.addEventListener('notificationclose', (event) => handleClose(scope, event, options));
};
