import { isSamePage } from './target';

import type { NotificationMessage } from '../Notification.types';
import type { ServiceWorkerGlobalScopeLike, WindowClientLike } from './ServiceWorker.types';

export interface FocusResult {
  clients: WindowClientLike[];
  focused: WindowClientLike | null;
}

const attempt = async <T>(operation: () => Promise<T>): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    console.error('[react-use-notifications] notification click step failed', error);

    return undefined;
  }
};

export const listWindows = async (
  scope: ServiceWorkerGlobalScopeLike,
): Promise<WindowClientLike[]> => {
  const clients = await attempt(() =>
    scope.clients.matchAll({ type: 'window', includeUncontrolled: true }),
  );

  return clients ?? [];
};

export const focusOrOpen = async (
  scope: ServiceWorkerGlobalScopeLike,
  clients: WindowClientLike[],
  absoluteUrl: string,
  hasExplicitTarget: boolean,
): Promise<FocusResult> => {
  const alreadyOpen = clients.find((client) => isSamePage(client.url, absoluteUrl));
  if (alreadyOpen) {
    await attempt(() => alreadyOpen.focus());

    return {
      clients,
      focused: alreadyOpen,
    };
  }

  const [firstClient] = clients;
  if (firstClient && !hasExplicitTarget) {
    await attempt(() => firstClient.focus());

    return {
      clients,
      focused: firstClient,
    };
  }

  if (firstClient) {
    const navigated = await attempt(() => firstClient.navigate(absoluteUrl));
    if (navigated !== undefined) {
      await attempt(() => firstClient.focus());

      return {
        clients,
        focused: navigated ?? firstClient,
      };
    }
  }

  const opened = await attempt(() => scope.clients.openWindow(absoluteUrl));

  return {
    clients,
    focused: opened ?? null,
  };
};

export const pickRecipient = (clients: WindowClientLike[]): WindowClientLike | undefined => {
  return clients.find((client) => client.focused) ?? clients[0];
};

export const deliver = (message: NotificationMessage, { clients, focused }: FocusResult): void => {
  if (focused) {
    focused.postMessage(message);

    return;
  }

  for (const client of clients) {
    client.postMessage(message);
  }
};
