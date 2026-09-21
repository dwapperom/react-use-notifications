import { forwardRef } from 'react';

import type { HTMLAttributes } from 'react';

export interface CounterBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  count: number;
  max?: number;
  showZero?: boolean;
}

export const CounterBadge = forwardRef<HTMLSpanElement, CounterBadgeProps>(({
  count,
  max = 99,
  showZero = false,
  ...spanProps
}, ref) => {
  const isEmpty = count <= 0 && !showZero;
  if (isEmpty) {
    return null;
  }

  const display = count > max ? `${max}+` : String(count);

  return (
    <span
      role="status"
      aria-label={`${display} unread`}
      {...spanProps}
      ref={ref}
      data-count={display}
      data-overflowing={count > max || undefined}
    >
      {display}
    </span>
  );
});

CounterBadge.displayName = 'CounterBadge';
