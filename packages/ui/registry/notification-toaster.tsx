'use client';

import { forwardRef } from 'react';

import {
  NotificationToaster as HeadlessNotificationToaster,
  type NotificationToasterProps as HeadlessNotificationToasterProps,
  type ToastPosition,
  type ToasterClassNames,
} from 'react-use-notifications-ui';

import { cn } from '@/lib/utils';

const REGION: Record<ToastPosition, string> = {
  'top-left': 'left-0 top-0',
  'top-right': 'right-0 top-0',
  'bottom-left': 'bottom-0 left-0 flex-col-reverse',
  'bottom-right': 'bottom-0 right-0 flex-col-reverse',
};

const CARD = [
  'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg',
  'bg-popover text-popover-foreground',
  'data-[variant=danger]:border-destructive/50',
  'data-[variant=danger]:bg-destructive/10',
  'data-[variant=danger]:text-destructive',
  'data-[variant=success]:border-emerald-300 data-[variant=success]:bg-emerald-50',
  'data-[variant=success]:text-emerald-950',
  'dark:data-[variant=success]:border-emerald-900 dark:data-[variant=success]:bg-emerald-950',
  'dark:data-[variant=success]:text-emerald-50',
  'data-[variant=warning]:border-amber-300 data-[variant=warning]:bg-amber-50',
  'data-[variant=warning]:text-amber-950',
  'dark:data-[variant=warning]:border-amber-900 dark:data-[variant=warning]:bg-amber-950',
  'dark:data-[variant=warning]:text-amber-50',
].join(' ');

const BUTTON = [
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium',
  'transition-colors motion-reduce:transition-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'disabled:pointer-events-none disabled:opacity-50',
].join(' ');

export interface NotificationToasterProps
  extends Omit<HeadlessNotificationToasterProps, 'classNames'> {
  position?: ToastPosition;
  className?: string;
  classNames?: ToasterClassNames;
}

export const NotificationToaster = forwardRef<HTMLOListElement, NotificationToasterProps>(({
  position = 'bottom-right',
  className,
  classNames,
  ...toasterProps
}, ref) => {
  const styles: ToasterClassNames = {
    region: cn(
      'pointer-events-none fixed z-50 flex w-full max-w-sm flex-col gap-2 p-4',
      REGION[position],
      className,
      classNames?.region,
    ),
    toast: cn(CARD, classNames?.toast),
    icon: cn('size-8 shrink-0 rounded', classNames?.icon),
    content: cn('flex min-w-0 flex-1 flex-col gap-1', classNames?.content),
    title: cn('text-sm font-semibold leading-tight', classNames?.title),
    body: cn('text-sm leading-snug opacity-80', classNames?.body),
    actions: cn('mt-1 flex flex-wrap gap-2', classNames?.actions),
    action: cn(
      BUTTON,
      'bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80',
      classNames?.action,
    ),
    dismiss: cn(
      BUTTON,
      'shrink-0 px-1.5 py-0.5 text-base leading-none hover:bg-accent hover:text-accent-foreground',
      classNames?.dismiss,
    ),
  };

  return <HeadlessNotificationToaster {...toasterProps} ref={ref} classNames={styles} />;
});

NotificationToaster.displayName = 'NotificationToaster';
