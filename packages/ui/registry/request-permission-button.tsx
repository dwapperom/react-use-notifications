'use client';

import { forwardRef } from 'react';

import {
  RequestPermissionButton as HeadlessRequestPermissionButton,
  type RequestPermissionButtonProps as HeadlessRequestPermissionButtonProps,
} from 'react-use-notifications-ui';

import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};

export interface RequestPermissionButtonProps extends HeadlessRequestPermissionButtonProps {
  variant?: keyof typeof VARIANTS;
}

export const RequestPermissionButton = forwardRef<
  HTMLButtonElement,
  RequestPermissionButtonProps
>(({ className, variant = 'primary', ...buttonProps }, ref) => {
  return (
    <HeadlessRequestPermissionButton
      {...buttonProps}
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
        'transition-colors motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
    />
  );
});

RequestPermissionButton.displayName = 'RequestPermissionButton';
