import { useNotificationCapabilities, type WebNotificationAction } from 'react-use-notifications';

export interface ClampedActions {
  accepted: WebNotificationAction[];
  clamped: WebNotificationAction[];
  maxActions: number;
}

export const useClampedActions = (actions: WebNotificationAction[]): ClampedActions => {
  const { maxActions, isSupported } = useNotificationCapabilities();

  if (!isSupported || actions.length <= maxActions) {
    return {
      accepted: actions,
      clamped: [],
      maxActions,
    };
  }

  return {
    accepted: actions.slice(0, maxActions),
    clamped: actions.slice(maxActions),
    maxActions,
  };
};
