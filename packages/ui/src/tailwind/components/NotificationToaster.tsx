import { forwardRef } from 'react';

import { cn } from '../../lib/cn';
import {
  NotificationToaster as UnstyledNotificationToaster,
  type NotificationToasterProps as UnstyledNotificationToasterProps,
  type ToasterClassNames,
} from '../../toast/components/NotificationToaster';
import { buttonVariants, toastCardVariants, toastRegionVariants } from '../variants';

import type { ToastPosition } from '../../toast/Toast.constants';

export interface NotificationToasterProps extends Omit<
  UnstyledNotificationToasterProps,
  'classNames'
> {
  position?: ToastPosition;
  className?: string;
  classNames?: ToasterClassNames;
}

export const NotificationToaster = forwardRef<HTMLOListElement, NotificationToasterProps>(({
  position,
  className,
  classNames,
  ...toasterProps
}, ref) => {
  const styles: ToasterClassNames = {
    region: cn(toastRegionVariants({ position }), className, classNames?.region),
    toast: cn(toastCardVariants(), classNames?.toast),
    icon: cn('size-8 shrink-0 rounded', classNames?.icon),
    content: cn('flex min-w-0 flex-1 flex-col gap-1', classNames?.content),
    title: cn('text-sm font-semibold leading-tight', classNames?.title),
    body: cn('text-sm leading-snug opacity-80', classNames?.body),
    actions: cn('mt-1 flex flex-wrap gap-2', classNames?.actions),
    action: cn(buttonVariants({ variant: 'secondary', size: 'sm' }), classNames?.action),
    dismiss: cn(
      buttonVariants({ variant: 'ghost' }),
      'shrink-0 px-1.5 py-0.5 text-base leading-none',
      classNames?.dismiss,
    ),
  };

  return <UnstyledNotificationToaster {...toasterProps} ref={ref} classNames={styles} />;
});

NotificationToaster.displayName = 'NotificationToaster';
