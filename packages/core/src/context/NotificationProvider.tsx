import { useMemo } from 'react';

import { NotificationContext } from './NotificationContext';

import type { WebNotificationOptions } from '../Notification.types';
import type { ReactNode } from 'react';

export interface NotificationProviderProps {
  registration?: ServiceWorkerRegistration;
  defaultOptions?: WebNotificationOptions;
  children: ReactNode;
}

export const NotificationProvider = ({
  registration,
  defaultOptions,
  children,
}: NotificationProviderProps) => {
  const value = useMemo(() => {
    return {
      registration,
      defaultOptions,
    };
  }, [registration, defaultOptions]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
