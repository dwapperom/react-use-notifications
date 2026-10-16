export interface InboxItem {
  id: string;
  receivedAt: number;
  readAt: number | null;
  title: string;
  body?: string;
  icon?: string;
  href?: string;
  data?: unknown;
  tag?: string;
  category?: string;
}

export type NewInboxItem = Omit<InboxItem, 'id' | 'receivedAt' | 'readAt'>
  & Partial<Pick<InboxItem, 'id' | 'receivedAt'>>;

export interface InboxStore {
  list: () => Promise<InboxItem[]>;
  add: (item: InboxItem) => Promise<void>;
  markRead: (id: string, readAt: number) => Promise<void>;
  markAllRead: (readAt: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  subscribe?: (onChange: () => void) => () => void;
  limit?: number;
}
