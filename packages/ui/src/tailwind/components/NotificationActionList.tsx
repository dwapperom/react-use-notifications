import { forwardRef } from 'react';

import {
  NotificationActionList as UnstyledNotificationActionList,
  type NotificationActionListClassNames,
  type NotificationActionListProps as UnstyledNotificationActionListProps,
} from '../../actions/components/NotificationActionList';
import { cn } from '../../lib/cn';
import { buttonVariants } from '../variants';

export interface NotificationActionListProps extends Omit<
  UnstyledNotificationActionListProps,
  'classNames'
> {
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
    action: cn(buttonVariants({ variant: 'secondary', size: 'sm' }), classNames?.action),
    clampedNotice: cn(
      'w-full text-xs text-amber-700 dark:text-amber-400',
      classNames?.clampedNotice,
    ),
  };

  return <UnstyledNotificationActionList {...listProps} ref={ref} classNames={styles} />;
});

NotificationActionList.displayName = 'NotificationActionList';
