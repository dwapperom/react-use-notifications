import { createContext, useContext } from 'react';

import type { ToastQueueActions } from '../hooks/useToastQueue';
import type { NotificationPresentation, ToastVariant } from '../Toast.constants';
import type { ToastItem } from '../Toast.types';
import type { Context } from 'react';

export interface ToasterDefaults {
  presentation?: NotificationPresentation;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToasterContextValue extends ToasterDefaults {
  actions: ToastQueueActions;
}

const CONTEXT_KEY = Symbol.for('react-use-notifications-ui.toaster-context');
const TOASTS_KEY = Symbol.for('react-use-notifications-ui.toaster-toasts');

type ContextHost = {
  [CONTEXT_KEY]?: Context<ToasterContextValue | null>;
  [TOASTS_KEY]?: Context<ToastItem[]>;
};

const host = globalThis as ContextHost;

export const ToasterContext: Context<ToasterContextValue | null> = (
  host[CONTEXT_KEY] ??= createContext<ToasterContextValue | null>(null)
);

export const useToasterContext = (): ToasterContextValue | null => {
  return useContext(ToasterContext);
};

export const ToasterToastsContext: Context<ToastItem[]> = (
  host[TOASTS_KEY] ??= createContext<ToastItem[]>([])
);
