import { forwardRef } from 'react';

import {
  CounterBadge as UnstyledCounterBadge,
  type CounterBadgeProps as UnstyledCounterBadgeProps,
} from '../../badge/components/CounterBadge';
import { cn } from '../../lib/cn';
import { counterBadgeVariants } from '../variants';

import type { VariantProps } from 'class-variance-authority';

export interface CounterBadgeProps
  extends UnstyledCounterBadgeProps,
  VariantProps<typeof counterBadgeVariants> {}

export const CounterBadge = forwardRef<HTMLSpanElement, CounterBadgeProps>(({
  className,
  tone,
  ...badgeProps
}, ref) => {
  return (
    <UnstyledCounterBadge
      {...badgeProps}
      ref={ref}
      className={cn(counterBadgeVariants({ tone }), className)}
    />
  );
});

CounterBadge.displayName = 'CounterBadge';
