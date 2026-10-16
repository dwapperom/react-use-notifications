import { forwardRef } from 'react';

import { useInbox } from '../hooks/useInbox';
import { relativeTime } from '../relativeTime';
import { NotificationListItem } from './NotificationListItem';

import type { InboxItem } from '../Inbox.types';

export interface NotificationListClassNames {
  list?: string;
  item?: string;
  button?: string;
  icon?: string;
  content?: string;
  title?: string;
  body?: string;
  time?: string;
  unreadDot?: string;
  empty?: string;
}

const toRelativeLabel = (item: InboxItem): string => {
  return relativeTime(item.receivedAt);
};

export interface NotificationListProps {
  onSelect?: (item: InboxItem) => void;
  formatTime?: (item: InboxItem) => string;
  classNames?: NotificationListClassNames;
  label?: string;
  emptyLabel?: string;
}

export const NotificationList = forwardRef<HTMLOListElement, NotificationListProps>(({
  onSelect,
  formatTime = toRelativeLabel,
  classNames = {},
  label = 'Notifications',
  emptyLabel = 'Nothing here yet',
}, ref) => {
  const { items, markRead } = useInbox();

  if (items.length === 0) {
    return <p className={classNames.empty}>{emptyLabel}</p>;
  }

  const handleSelect = (item: InboxItem) => {
    void markRead(item.id);
    onSelect?.(item);
  };

  return (
    <ol ref={ref} className={classNames.list} aria-label={label}>
      {items.map((item) => (
        <NotificationListItem
          key={item.id}
          item={item}
          onSelect={handleSelect}
          formatTime={formatTime}
          classNames={classNames}
        />
      ))}
    </ol>
  );
});

NotificationList.displayName = 'NotificationList';
