import { useInbox } from 'react-use-notifications-ui';
import { NotificationList } from 'react-use-notifications-ui/tailwind';

import type { InboxItem } from 'react-use-notifications-ui';

const ACTION = 'text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground';

export const InboxPanel = ({ onSelect }: { onSelect: (item: InboxItem) => void }) => {
  const { items, unread, loadFailed, markAllRead, clear } = useInbox();

  return (
    <div className="w-80 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2">
        <span className="text-[14px] font-medium">Notifications</span>
        <span className="text-[12px] text-muted-foreground">{`${unread} unread`}</span>
        <span className="ml-auto flex gap-3">
          <button
            type="button"
            className={ACTION}
            disabled={unread === 0}
            onClick={() => void markAllRead()}
          >
            Mark all read
          </button>
          <button
            type="button"
            className={ACTION}
            disabled={items.length === 0}
            onClick={() => void clear()}
          >
            Clear
          </button>
        </span>
      </div>

      {loadFailed
        ? (
            <p className="border-b border-border px-3 py-2 text-[12px] text-destructive">
              Could not reach the inbox. Showing what was loaded before.
            </p>
          )
        : null}

      <NotificationList
        label="Inbox"
        emptyLabel="You are all caught up."
        onSelect={onSelect}
        className="max-h-72 overflow-y-auto"
      />
    </div>
  );
};
