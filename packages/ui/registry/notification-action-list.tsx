'use client';

import { forwardRef } from 'react';

import {
  NotificationActionList as HeadlessNotificationActionList,
  type NotificationActionListClassNames,
  type NotificationActionListProps as HeadlessNotificationActionListProps,
} from 'react-use-notifications-ui';

import { cn } from '@/lib/utils';

export interface NotificationActionListProps
  extends Omit<HeadlessNotificationActionListProps, 'classNames'> {
  className?: string;
  classNames?: NotificationActionListClassNames;
}

export const NotificationActionList = forwardRef<HTMLDivElement, NotificationActionListProps>(({
  className,
  classNames,
  ...listProps
}, ref) => {
  const styles: NotificationActionListClassNames = {
    root: cn('flex flex-wrap items-center gap-2', className, classNames?.root),
    action: cn(
      'inline-flex items-center justify-center gap-2 rounded-md px-2 py-1 text-xs font-medium',
      'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      'transition-colors motion-reduce:transition-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      classNames?.action,
    ),
    clampedNotice: cn(
      'w-full text-xs text-amber-700 dark:text-amber-400',
      classNames?.clampedNotice,
    ),
  };

  return <HeadlessNotificationActionList {...listProps} ref={ref} classNames={styles} />;
});

NotificationActionList.displayName = 'NotificationActionList';
