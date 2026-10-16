import { useContext, useMemo } from 'react';

import { InboxActionsContext, InboxListContext } from '../context/InboxContext';

import type { InboxActions, InboxList } from '../context/InboxContext';

export interface UseInboxReturn extends InboxActions, InboxList {
  unread: number;
}

const withoutProvider = (name: string) => {
  return (): never => {
    throw new Error(`${name} needs an <InboxProvider> above it.`);
  };
};

const ORPHAN: InboxActions = {
  add: withoutProvider('add'),
  markRead: withoutProvider('markRead'),
  markAllRead: withoutProvider('markAllRead'),
  remove: withoutProvider('remove'),
  clear: withoutProvider('clear'),
};

export const useInbox = (): UseInboxReturn => {
  const actions = useContext(InboxActionsContext) ?? ORPHAN;
  const list = useContext(InboxListContext);
  const { items } = list;

  const unread = useMemo(() => {
    return items.filter((item) => item.readAt === null).length;
  }, [items]);

  return {
    ...actions,
    ...list,
    unread,
  };
};
