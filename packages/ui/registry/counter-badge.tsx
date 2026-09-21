'use client';

import { forwardRef } from 'react';

import {
  CounterBadge as HeadlessCounterBadge,
  type CounterBadgeProps as HeadlessCounterBadgeProps,
} from 'react-use-notifications-ui';

import { cn } from '@/lib/utils';

const TONES = {
  danger: 'bg-destructive text-destructive-foreground',
  neutral: 'bg-foreground text-background',
};

export interface CounterBadgeProps extends HeadlessCounterBadgeProps {
  tone?: keyof typeof TONES;
}

export const CounterBadge = forwardRef<HTMLSpanElement, CounterBadgeProps>(({
  className,
  tone = 'danger',
  ...badgeProps
}, ref) => {
  return (
    <HeadlessCounterBadge
      {...badgeProps}
      ref={ref}
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full px-1.5',
        'text-[11px] font-medium leading-5 tabular-nums',
        'ring-2 ring-background',
        TONES[tone],
        className,
      )}
    />
  );
});

CounterBadge.displayName = 'CounterBadge';
