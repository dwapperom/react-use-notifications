import { forwardRef } from 'react';

import { usePermissionRequest } from '../hooks/usePermissionRequest';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { NotificationPermissionState } from 'react-use-notifications';

export interface RequestPermissionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'children' | 'aria-busy'
> {
  children?: ReactNode;
  onPermissionChange?: (permission: NotificationPermissionState) => void;
}

export const RequestPermissionButton = forwardRef<HTMLButtonElement, RequestPermissionButtonProps>(
  ({ children = 'Enable notifications', onPermissionChange, disabled, ...buttonProps }, ref) => {
    const { permission, isDisabled, isRequesting, requestPermission }
      = usePermissionRequest(onPermissionChange);

    return (
      <button
        type="button"
        {...buttonProps}
        ref={ref}
        onClick={() => void requestPermission()}
        disabled={disabled ?? isDisabled}
        data-permission={permission}
        data-requesting={isRequesting || undefined}
        aria-busy={isRequesting}
      >
        {children}
      </button>
    );
  },
);

RequestPermissionButton.displayName = 'RequestPermissionButton';
