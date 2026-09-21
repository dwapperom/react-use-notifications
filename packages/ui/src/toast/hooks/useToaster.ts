import { useCallback, useId } from 'react';

import {
  NotificationOutcome,
  useNotificationContext,
  useNotifications,
  type ShowResult,
  type UseNotificationsOptions,
  type UseNotificationsReturn,
  type WebNotificationOptions,
} from 'react-use-notifications';
import { closePersistent, useLatest } from 'react-use-notifications/internal';

import { useToasterContext } from '../context/ToasterContext';
import {
  DEFAULT_TOAST_DURATION_MS,
  FallbackReason,
  NotificationPresentation,
  ToastVariant,
} from '../Toast.constants';
import { useToastQueue } from './useToastQueue';

import type { ToastItem } from '../Toast.types';

export type { ToastItem };

export interface UseToasterOptions extends UseNotificationsOptions {
  presentation?: NotificationPresentation;
  duration?: number;
  variant?: ToastVariant;
}

export interface ToasterShowOptions extends WebNotificationOptions {
  variant?: ToastVariant;
  presentation?: NotificationPresentation;
}

export interface ToasterShowResult {
  native: ShowResult | null;
  toastId: string | null;
}

export interface UseToasterReturn extends Omit<UseNotificationsReturn, 'show'> {
  show: (title: string, options?: ToasterShowOptions) => Promise<ToasterShowResult>;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const isDocumentFocused = (): boolean => {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.visibilityState === 'visible' && document.hasFocus();
};

export const useToaster = (options: UseToasterOptions = {}): UseToasterReturn => {
  const context = useToasterContext();
  const localQueue = useToastQueue();
  const actions = context?.actions ?? localQueue.actions;

  const {
    presentation: presentationOption,
    duration: durationOption,
    variant: variantOption,
    ...notificationOptions
  } = options;

  const presentation = presentationOption ?? context?.presentation ?? NotificationPresentation.Auto;
  const duration = durationOption ?? context?.duration ?? DEFAULT_TOAST_DURATION_MS;
  const variant = variantOption ?? context?.variant ?? ToastVariant.Default;

  const owner = useId();
  const notifications = useNotifications(notificationOptions);
  const { push, dismiss, dismissByTag, dismissAll } = actions;

  const { show: showNative, close: closeNative, closeAll: closeAllNative } = notifications;

  const notificationContext = useNotificationContext();
  const registration = notificationOptions.registration ?? notificationContext?.registration;

  const reconcileNative = useCallback(async (tag: string) => {
    await closeNative(tag);

    if (registration) {
      await closePersistent(registration, tag);
    }
  }, [closeNative, registration]);

  const defaultsRef = useLatest({
    ...notificationContext?.defaultOptions,
    ...notificationOptions,
  });

  const pushToast = useCallback((
    title: string,
    merged: ToasterShowOptions,
    reason: FallbackReason,
  ): string => {
    return push({
      title,
      owner,
      duration,
      tag: merged.tag,
      body: merged.body,
      icon: merged.icon,
      variant: merged.variant ?? variant,
      actions: merged.actions ?? [],
      reason,
    });
  }, [push, duration, variant, owner]);

  const show = useCallback(async (
    title: string,
    showOptions: ToasterShowOptions = {},
  ): Promise<ToasterShowResult> => {
    const mode = showOptions.presentation ?? presentation;

    const merged: ToasterShowOptions = { ...defaultsRef.current, ...showOptions };
    const { tag } = merged;

    const drawInApp = mode === NotificationPresentation.InApp
      || (mode === NotificationPresentation.Auto && isDocumentFocused());

    if (drawInApp) {
      if (tag) {
        await reconcileNative(tag);
      }

      const reason = mode === NotificationPresentation.InApp
        ? FallbackReason.Requested
        : FallbackReason.DocumentVisible;

      return {
        native: null,
        toastId: pushToast(title, merged, reason),
      };
    }

    const { variant: _variant, presentation: _presentation, ...nativeOptions } = showOptions;
    const native = await showNative(title, nativeOptions);
    if (native.outcome === NotificationOutcome.Shown) {
      if (tag) {
        dismissByTag(tag);
      }

      return {
        native,
        toastId: null,
      };
    }

    return {
      native,
      toastId: pushToast(title, merged, FallbackReason.NativeUnavailable),
    };
  }, [showNative, reconcileNative, dismissByTag, presentation, pushToast, defaultsRef]);

  const close = useCallback(async (tag: string) => {
    dismissByTag(tag);
    await reconcileNative(tag);
  }, [dismissByTag, reconcileNative]);

  const closeAll = useCallback(async () => {
    dismissAll(owner);
    await closeAllNative();
  }, [dismissAll, closeAllNative, owner]);

  const dismissOwn = useCallback(() => dismissAll(owner), [dismissAll, owner]);

  return {
    ...notifications,
    show,
    close,
    closeAll,
    dismiss,
    dismissAll: dismissOwn,
  };
};
