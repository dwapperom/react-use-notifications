'use client';

import { forwardRef } from 'react';

import {
  NotificationPermissionBadge as HeadlessNotificationPermissionBadge,
  type NotificationPermissionBadgeProps,
} from 'react-use-notifications-ui';

import { cn } from '@/lib/utils';

export type { NotificationPermissionBadgeProps };

export const NotificationPermissionBadge = forwardRef<
  HTMLSpanElement,
  NotificationPermissionBadgeProps
>(({ className, ...spanProps }, ref) => {
  return (
    <HeadlessNotificationPermissionBadge
      {...spanProps}
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-muted text-muted-foreground',
        'data-[permission=granted]:bg-emerald-100 data-[permission=granted]:text-emerald-800',
        'dark:data-[permission=granted]:bg-emerald-950',
        'dark:data-[permission=granted]:text-emerald-300',
        'data-[permission=denied]:bg-destructive/10 data-[permission=denied]:text-destructive',
        'data-[permission=unsupported]:text-muted-foreground/60',
        className,
      )}
    />
  );
});

NotificationPermissionBadge.displayName = 'NotificationPermissionBadge';
