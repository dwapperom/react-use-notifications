import { NotificationDelivery } from '../Notification.constants';

import type { NotificationHandle } from '../Notification.types';

export const closePersistent = async (
  registration: ServiceWorkerRegistration,
  tag?: string,
): Promise<void> => {
  const notifications = await registration.getNotifications(tag === undefined ? {} : { tag });
  for (const notification of notifications) {
    notification.close();
  }
};

export const createTransientHandle = (instance: Notification): NotificationHandle => {
  return {
    tag: instance.tag || undefined,
    delivery: NotificationDelivery.Transient,
    close: async () => instance.close(),
  };
};

export const createPersistentHandle = (
  registration: ServiceWorkerRegistration,
  tag: string,
): NotificationHandle => {
  return {
    tag,
    delivery: NotificationDelivery.Persistent,
    close: () => closePersistent(registration, tag),
  };
};
