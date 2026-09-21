import type { WebNotificationAction } from 'react-use-notifications';

export interface ClampedActionsNoticeProps {
  clamped: WebNotificationAction[];
  maxActions: number;
  className?: string;
}

export const ClampedActionsNotice = ({
  clamped,
  maxActions,
  className,
}: ClampedActionsNoticeProps) => {
  const limitDescription
    = maxActions === 0
      ? 'This browser does not support notification actions'
      : `This browser shows at most ${maxActions} actions`;

  const hiddenTitles = clamped.map((action) => action.title).join(', ');

  return (
    <p className={className} role="note">
      {`${limitDescription}. ${clamped.length} hidden: ${hiddenTitles}`}
    </p>
  );
};
