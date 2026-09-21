import { forwardRef } from 'react';

import { useClampedActions } from '../hooks/useClampedActions';
import { ClampedActionsNotice } from './ClampedActionsNotice';

import type { ReactNode } from 'react';
import type { WebNotificationAction } from 'react-use-notifications';

export interface NotificationActionListClassNames {
  root?: string;
  action?: string;
  clampedNotice?: string;
}

export interface NotificationActionListProps {
  actions: WebNotificationAction[];
  onAction?: (action: WebNotificationAction) => void;
  classNames?: NotificationActionListClassNames;
  clampedNotice?: ReactNode;
}

export const NotificationActionList = forwardRef<HTMLDivElement, NotificationActionListProps>(({
  actions,
  onAction,
  classNames = {},
  clampedNotice,
}, ref) => {
  const { accepted, clamped, maxActions } = useClampedActions(actions);

  if (actions.length === 0) {
    return null;
  }

  const hasHiddenActions = clamped.length > 0;

  return (
    <div ref={ref} className={classNames.root} data-clamped={hasHiddenActions || undefined}>
      {accepted.map((action) => (
        <button
          key={action.action}
          type="button"
          className={classNames.action}
          onClick={() => onAction?.(action)}
        >
          {action.title}
        </button>
      ))}

      {hasHiddenActions
        ? (clampedNotice ?? (
            <ClampedActionsNotice
              clamped={clamped}
              maxActions={maxActions}
              className={classNames.clampedNotice}
            />
          ))
        : null}
    </div>
  );
});

NotificationActionList.displayName = 'NotificationActionList';
