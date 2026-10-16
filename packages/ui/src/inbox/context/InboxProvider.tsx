import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createId } from 'react-use-notifications/internal';

import {
  limitItems,
  markAllItemsRead,
  markItemRead,
  newestFirst,
  removeItem,
  upsertItem,
} from '../inboxItems';
import { InboxActionsContext, InboxListContext } from './InboxContext';

import type { InboxItem, InboxStore, NewInboxItem } from '../Inbox.types';
import type { ReactNode } from 'react';

type Change = (items: InboxItem[]) => InboxItem[];

export interface InboxProviderProps {
  store: InboxStore;
  initialItems?: InboxItem[];
  children: ReactNode;
}

export const InboxProvider = ({
  store,
  initialItems,
  children,
}: InboxProviderProps) => {
  const [confirmed, setConfirmed] = useState<InboxItem[]>(() => newestFirst(initialItems ?? []));
  const [pending, setPending] = useState<Change[]>([]);
  const [isLoading, setIsLoading] = useState(initialItems === undefined);
  const [loadFailed, setLoadFailed] = useState(false);

  const storeRef = useRef(store);
  storeRef.current = store;

  const writes = useRef<Promise<void>>(Promise.resolve());

  const reload = useCallback(async (): Promise<void> => {
    const settled = writes.current;
    await settled;

    try {
      const stored = await storeRef.current.list();

      if (writes.current !== settled) {
        return reload();
      }

      setConfirmed(newestFirst(stored));
      setLoadFailed(false);
    } catch (error) {
      console.error('[react-use-notifications-ui] could not load the inbox', error);
      setLoadFailed(true);
    }
  }, []);

  const commit = useCallback((
    change: Change,
    remote: (current: InboxStore) => Promise<void>,
  ): Promise<boolean> => {
    setPending((current) => [...current, change]);

    const settle = (saved: boolean): boolean => {
      if (saved) {
        setConfirmed(change);
      }
      setPending((current) => current.filter((entry) => entry !== change));

      return saved;
    };

    const run = writes.current
      .then(() => remote(storeRef.current))
      .then(() => settle(true), (error: unknown) => {
        console.error('[react-use-notifications-ui] could not save the inbox, undoing the change', error);

        return settle(false);
      });
    writes.current = run.then(() => undefined);

    return run;
  }, []);

  const items = useMemo(() => {
    return pending.reduce((current, change) => change(current), confirmed);
  }, [confirmed, pending]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      await reload();

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    void hydrate();

    const unsubscribe = storeRef.current.subscribe?.(() => void reload());

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [reload]);

  const actions = useMemo(() => {
    return {
      add: async (item: NewInboxItem): Promise<string | null> => {
        const stored: InboxItem = {
          ...item,
          id: item.id ?? createId('inbox'),
          receivedAt: item.receivedAt ?? Date.now(),
          readAt: null,
        };

        const saved = await commit(
          (items) => limitItems(upsertItem(items, stored), storeRef.current.limit),
          (current) => current.add(stored),
        );

        return saved
          ? stored.id
          : null;
      },

      markRead: async (id: string): Promise<void> => {
        const readAt = Date.now();

        await commit(
          (items) => markItemRead(items, id, readAt),
          (current) => current.markRead(id, readAt),
        );
      },

      markAllRead: async (): Promise<void> => {
        const readAt = Date.now();

        await commit(
          (items) => markAllItemsRead(items, readAt),
          (current) => current.markAllRead(readAt),
        );
      },

      remove: async (id: string): Promise<void> => {
        await commit((items) => removeItem(items, id), (current) => current.remove(id));
      },

      clear: async (): Promise<void> => {
        await commit(() => [], (current) => current.clear());
      },
    };
  }, [commit]);

  const list = useMemo(() => {
    return {
      items,
      isLoading,
      loadFailed,
    };
  }, [items, isLoading, loadFailed]);

  return (
    <InboxActionsContext.Provider value={actions}>
      <InboxListContext.Provider value={list}>{children}</InboxListContext.Provider>
    </InboxActionsContext.Provider>
  );
};
