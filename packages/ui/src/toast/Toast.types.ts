import type { FallbackReason, ToastVariant } from './Toast.constants';
import type { WebNotificationAction } from 'react-use-notifications';

export interface ToastItem {
  id: string;
  tag?: string;
  owner: string;
  duration: number;
  title: string;
  body?: string;
  icon?: string;
  variant: ToastVariant;
  actions: WebNotificationAction[];
  reason: FallbackReason;
}

export interface ToasterClassNames {
  region?: string;
  toast?: string;
  icon?: string;
  content?: string;
  title?: string;
  body?: string;
  actions?: string;
  action?: string;
  dismiss?: string;
}
