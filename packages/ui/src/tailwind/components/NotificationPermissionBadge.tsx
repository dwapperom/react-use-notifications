import { forwardRef } from 'react';

import { cn } from '../../lib/cn';
import {
  NotificationPermissionBadge as UnstyledNotificationPermissionBadge,
  type NotificationPermissionBadgeProps,
} from '../../permission/components/NotificationPermissionBadge';
import { permissionBadgeVariants } from '../variants';

export type { NotificationPermissionBadgeProps };

export const NotificationPermissionBadge = forwardRef<
  HTMLSpanElement,
  NotificationPermissionBadgeProps
>(({ className, ...spanProps }, ref) => {
  return (
    <UnstyledNotificationPermissionBadge
      {...spanProps}
      ref={ref}
      className={cn(permissionBadgeVariants(), className)}
    />
  );
});

NotificationPermissionBadge.displayName = 'NotificationPermissionBadge';
