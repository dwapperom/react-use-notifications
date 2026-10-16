import { createContext, useContext } from 'react';

import type { InboxItem, NewInboxItem } from '../Inbox.types';
import type { Context } from 'react';

export interface InboxActions {
  add: (item: NewInboxItem) => Promise<string | null>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface InboxList {
  items: InboxItem[];
  isLoading: boolean;
  loadFailed: boolean;
}

const ACTIONS_KEY = Symbol.for('react-use-notifications-ui.inbox-actions');
const LIST_KEY = Symbol.for('react-use-notifications-ui.inbox-list');

type ContextHost = {
  [ACTIONS_KEY]?: Context<InboxActions | null>;
  [LIST_KEY]?: Context<InboxList>;
};

const host = globalThis as ContextHost;

export const InboxActionsContext: Context<InboxActions | null> = (
  host[ACTIONS_KEY] ??= createContext<InboxActions | null>(null)
);

export const InboxListContext: Context<InboxList> = (
  host[LIST_KEY] ??= createContext<InboxList>({ items: [], isLoading: false, loadFailed: false })
);

export const useInboxActions = (): InboxActions | null => {
  return useContext(InboxActionsContext);
};
