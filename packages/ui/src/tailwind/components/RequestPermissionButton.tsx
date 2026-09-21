import { forwardRef } from 'react';

import { cn } from '../../lib/cn';
import {
  RequestPermissionButton as UnstyledRequestPermissionButton,
  type RequestPermissionButtonProps as UnstyledRequestPermissionButtonProps,
} from '../../permission/components/RequestPermissionButton';
import { buttonVariants } from '../variants';

import type { VariantProps } from 'class-variance-authority';

export interface RequestPermissionButtonProps
  extends UnstyledRequestPermissionButtonProps, VariantProps<typeof buttonVariants> {}

export const RequestPermissionButton = forwardRef<HTMLButtonElement, RequestPermissionButtonProps>(
  ({ className, variant, ...buttonProps }, ref) => {
    return (
      <UnstyledRequestPermissionButton
        {...buttonProps}
        ref={ref}
        className={cn(buttonVariants({ variant }), className)}
      />
    );
  },
);

RequestPermissionButton.displayName = 'RequestPermissionButton';
