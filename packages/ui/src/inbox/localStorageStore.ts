import {
  limitItems,
  markAllItemsRead,
  markItemRead,
  removeItem,
  upsertItem,
} from './inboxItems';

import type { InboxItem, InboxStore } from './Inbox.types';

export interface LocalStorageStoreOptions {
  key?: string;
  limit?: number;
}

interface Backend {
  read: () => string | null;
  write: (raw: string) => void;
}

const DEFAULT_KEY = 'react-use-notifications.inbox';
const DEFAULT_LIMIT = 200;
const PROBE_KEY = 'react-use-notifications.probe';

const isInboxItem = (value: unknown): value is InboxItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { id, receivedAt, title } = value as Partial<InboxItem>;

  return typeof id === 'string' && typeof receivedAt === 'number' && typeof title === 'string';
};

const memoryBackend = (): Backend => {
  let raw: string | null = null;

  return {
    read: () => raw,
    write: (next) => {
      raw = next;
    },
  };
};

const openBackend = (key: string): Backend => {
  try {
    const storage = window.localStorage;
    storage.setItem(PROBE_KEY, PROBE_KEY);
    storage.removeItem(PROBE_KEY);

    return {
      read: () => storage.getItem(key),
      write: (raw) => storage.setItem(key, raw),
    };
  } catch (error) {
    console.warn(
      '[react-use-notifications-ui] localStorage is unavailable, so the inbox lives in memory for this session',
      error,
    );

    return memoryBackend();
  }
};

export const localStorageStore = (options: LocalStorageStoreOptions = {}): InboxStore => {
  const key = options.key ?? DEFAULT_KEY;
  const limit = options.limit ?? DEFAULT_LIMIT;

  let backend: Backend | null = null;
  const open = (): Backend => {
    backend ??= openBackend(key);

    return backend;
  };

  const read = (): InboxItem[] => {
    const raw = open().read();
    if (raw === null) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed.filter(isInboxItem)
        : [];
    } catch (error) {
      console.error('[react-use-notifications-ui] the stored inbox is not valid JSON, starting empty', error);

      return [];
    }
  };

  const write = (items: InboxItem[]): void => {
    open().write(JSON.stringify(limitItems(items, limit)));
  };

  return {
    limit,

    list: async () => read(),

    add: async (item) => {
      write(upsertItem(read(), item));
    },

    markRead: async (id, readAt) => {
      write(markItemRead(read(), id, readAt));
    },

    markAllRead: async (readAt) => {
      write(markAllItemsRead(read(), readAt));
    },

    remove: async (id) => {
      write(removeItem(read(), id));
    },

    clear: async () => {
      write([]);
    },

    subscribe: (onChange) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) {
          onChange();
        }
      };

      window.addEventListener('storage', handleStorage);

      return () => {
        window.removeEventListener('storage', handleStorage);
      };
    },
  };
};
