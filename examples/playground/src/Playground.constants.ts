import type { WebNotificationAction } from 'react-use-notifications';

export const BASE = import.meta.env.BASE_URL;

export const ACTIONS: WebNotificationAction[] = [
  { action: 'reply', title: 'Reply', navigate: `${BASE}?from=reply` },
  { action: 'archive', title: 'Archive' },
  { action: 'snooze', title: 'Snooze' },
];
