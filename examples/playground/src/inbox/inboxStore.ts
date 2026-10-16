import { localStorageStore } from 'react-use-notifications-ui';

import type { InboxStore } from 'react-use-notifications-ui';

const local = localStorageStore();
const listeners = new Set<() => void>();

let refusingWrites = false;

export const isRefusingWrites = (): boolean => refusingWrites;

export const setRefusingWrites = (refusing: boolean): void => {
  refusingWrites = refusing;
  for (const listener of listeners) {
    listener();
  }
};

export const subscribeToRefusing = (onChange: () => void): (() => void) => {
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
  };
};

const refusable = <Args extends unknown[]>(write: (...args: Args) => Promise<void>) => {
  return (...args: Args): Promise<void> => {
    return refusingWrites
      ? Promise.reject(new Error('The demo server refused the write'))
      : write(...args);
  };
};

export const inboxStore: InboxStore = {
  ...local,
  add: refusable(local.add),
  markRead: refusable(local.markRead),
  markAllRead: refusable(local.markAllRead),
  remove: refusable(local.remove),
  clear: refusable(local.clear),
};
