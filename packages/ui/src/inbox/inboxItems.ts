import type { InboxItem } from './Inbox.types';

const byNewest = (a: InboxItem, b: InboxItem): number => b.receivedAt - a.receivedAt;

export const newestFirst = (items: InboxItem[]): InboxItem[] => [...items].sort(byNewest);

export const upsertItem = (items: InboxItem[], item: InboxItem): InboxItem[] => {
  const previous = items.find((entry) => entry.id === item.id);
  const kept = items.filter((entry) => {
    return entry !== previous && (!item.tag || entry.tag !== item.tag);
  });

  return newestFirst([{ ...item, readAt: previous?.readAt ?? item.readAt }, ...kept]);
};

export const markItemRead = (items: InboxItem[], id: string, readAt: number): InboxItem[] => {
  return items.map((entry) => {
    return entry.id === id && entry.readAt === null
      ? { ...entry, readAt }
      : entry;
  });
};

export const markAllItemsRead = (items: InboxItem[], readAt: number): InboxItem[] => {
  return items.map((entry) => {
    return entry.readAt === null
      ? { ...entry, readAt }
      : entry;
  });
};

export const limitItems = (items: InboxItem[], limit: number | undefined): InboxItem[] => {
  return limit !== undefined && limit > 0 && items.length > limit
    ? items.slice(0, limit)
    : items;
};

export const removeItem = (items: InboxItem[], id: string): InboxItem[] => {
  return items.filter((entry) => entry.id !== id);
};
