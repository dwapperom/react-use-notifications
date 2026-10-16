import { forwardRef } from 'react';

import {
  NotificationList as UnstyledNotificationList,
  type NotificationListClassNames,
  type NotificationListProps as UnstyledNotificationListProps,
} from '../../inbox/components/NotificationList';
import { cn } from '../../lib/cn';

export interface NotificationListProps extends Omit<UnstyledNotificationListProps, 'classNames'> {
  className?: string;
  classNames?: NotificationListClassNames;
}

export const NotificationList = forwardRef<HTMLOListElement, NotificationListProps>(({
  className,
  classNames,
  ...listProps
}, ref) => {
  const styles: NotificationListClassNames = {
    list: cn('divide-y divide-border', className, classNames?.list),
    item: cn('data-[unread]:bg-accent/40', classNames?.item),
    button: cn(
      'flex w-full items-start gap-3 px-3 py-2.5 text-left',
      'transition-colors hover:bg-accent motion-reduce:transition-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'focus-visible:ring-inset',
      classNames?.button,
    ),
    icon: cn('size-8 shrink-0 rounded-full', classNames?.icon),
    content: cn('flex min-w-0 flex-1 flex-col gap-0.5', classNames?.content),
    title: cn('truncate text-sm font-medium text-foreground', classNames?.title),
    body: cn('truncate text-sm text-muted-foreground', classNames?.body),
    time: cn('text-xs text-muted-foreground', classNames?.time),
    unreadDot: cn('mt-1.5 size-2 shrink-0 rounded-full bg-primary', classNames?.unreadDot),
    empty: cn('px-3 py-6 text-center text-sm text-muted-foreground', classNames?.empty),
  };

  return <UnstyledNotificationList {...listProps} ref={ref} classNames={styles} />;
});

NotificationList.displayName = 'NotificationList';
