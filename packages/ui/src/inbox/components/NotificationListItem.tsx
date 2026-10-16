import type { InboxItem } from '../Inbox.types';
import type { NotificationListClassNames } from './NotificationList';

export interface NotificationListItemProps {
  item: InboxItem;
  onSelect: (item: InboxItem) => void;
  formatTime: (item: InboxItem) => string;
  classNames: NotificationListClassNames;
}

export const NotificationListItem = ({
  item,
  onSelect,
  formatTime,
  classNames,
}: NotificationListItemProps) => {
  const unread = item.readAt === null;

  return (
    <li className={classNames.item} data-unread={unread || undefined}>
      <button
        type="button"
        className={classNames.button}
        onClick={() => onSelect(item)}
        aria-current={unread || undefined}
      >
        {item.icon
          ? (
              <img
                src={item.icon}
                alt=""
                className={classNames.icon}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            )
          : null}

        <span className={classNames.content}>
          <span className={classNames.title}>{item.title}</span>
          {item.body ? <span className={classNames.body}>{item.body}</span> : null}
          <time
            className={classNames.time}
            dateTime={new Date(item.receivedAt).toISOString()}
            suppressHydrationWarning
          >
            {formatTime(item)}
          </time>
        </span>

        {unread ? <span className={classNames.unreadDot} aria-label="Unread" /> : null}
      </button>
    </li>
  );
};
