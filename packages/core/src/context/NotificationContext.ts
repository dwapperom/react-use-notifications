import { createContext, useContext } from 'react';

import type { WebNotificationOptions } from '../Notification.types';

export interface NotificationContextValue {
  registration?: ServiceWorkerRegistration;
  defaultOptions?: WebNotificationOptions;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotificationContext = (): NotificationContextValue | null => {
  return useContext(NotificationContext);
};
