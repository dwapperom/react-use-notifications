import { useEffect } from 'react';

import { NotificationMessageType } from '../Notification.constants';
import { useLatest } from './useLatest';

import type { NotificationClickMessage, NotificationMessage } from '../Notification.types';

const isNotificationMessage = (value: unknown): value is NotificationMessage => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { type } = value as { type?: unknown };

  return type === NotificationMessageType.Click || type === NotificationMessageType.Close;
};

const getServiceWorkerContainer = (): ServiceWorkerContainer | undefined => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  return navigator.serviceWorker;
};

export const useNotificationEvents = (onMessage: (message: NotificationMessage) => void): void => {
  const handlerRef = useLatest(onMessage);

  useEffect(() => {
    const container = getServiceWorkerContainer();
    if (!container) {
      return;
    }

    const handleMessage = (event: MessageEvent<unknown>): void => {
      if (!isNotificationMessage(event.data)) {
        return;
      }
      handlerRef.current(event.data);
    };
    container.addEventListener('message', handleMessage);

    return () => {
      container.removeEventListener('message', handleMessage);
    };
  }, [handlerRef]);
};

export const useNotificationClick = (
  onClick: (message: NotificationClickMessage) => void,
): void => {
  useNotificationEvents((message) => {
    if (message.type !== NotificationMessageType.Click) {
      return;
    }
    onClick(message);
  });
};
