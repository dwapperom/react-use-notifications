import {
  DeliveryPreference,
  NotificationDelivery,
  NotificationPermissionState,
  NotificationOutcome,
} from '../Notification.constants';
import {
  isNotificationSupported,
  isSecureContext,
  readMaxActions,
  readPermission,
} from './environment';
import {
  closePersistent,
  createAutoTag,
  createPersistentHandle,
  createTransientHandle,
} from './handles';
import { clampActions, toPersistentOptions, toStandardOptions } from './options';
import { ensurePermission } from './permissionStore';

import type {
  ShowFailure,
  ShowResult,
  WebNotificationAction,
  WebNotificationOptions,
} from '../Notification.types';
import type { NotificationRegistry } from './registry';

export interface ShowContext {
  registration?: ServiceWorkerRegistration;
  registry: NotificationRegistry;
}

const failure = (outcome: ShowFailure['outcome'], reason: string, error?: unknown): ShowFailure => {
  return error === undefined
    ? { outcome, reason }
    : { outcome, reason, error };
};

const wantsNavigation = (
  options: WebNotificationOptions,
  actions: WebNotificationAction[],
): boolean => {
  return Boolean(options.navigate) || actions.some((action) => Boolean(action.navigate));
};

const resolveDelivery = (
  preference: DeliveryPreference,
  options: WebNotificationOptions,
  actions: WebNotificationAction[],
  registration: ServiceWorkerRegistration | undefined,
): NotificationDelivery => {
  if (preference === DeliveryPreference.Persistent) {
    return NotificationDelivery.Persistent;
  }
  if (preference === DeliveryPreference.Transient) {
    return NotificationDelivery.Transient;
  }

  if (registration === undefined) {
    return NotificationDelivery.Transient;
  }

  const actionsNeedWorker = actions.length > 0 && readMaxActions() > 0;
  const needsPersistent = actionsNeedWorker || wantsNavigation(options, actions);

  return needsPersistent
    ? NotificationDelivery.Persistent
    : NotificationDelivery.Transient;
};

const hasHandlers = (options: WebNotificationOptions): boolean => {
  return Boolean(options.onClick ?? options.onClose ?? options.onError ?? options.onShow);
};

const attachTransientHandlers = (instance: Notification, options: WebNotificationOptions): void => {
  const handlers = [
    ['click', options.onClick],
    ['close', options.onClose],
    ['error', options.onError],
    ['show', options.onShow],
  ] as const;

  for (const [eventName, handler] of handlers) {
    if (!handler) {
      continue;
    }
    instance.addEventListener(eventName, handler);
  }
};

const showTransient = (
  title: string,
  options: WebNotificationOptions,
  registry: NotificationRegistry,
  hadActions: boolean,
): ShowResult => {
  try {
    const instance = new Notification(title, toStandardOptions(options));
    attachTransientHandlers(instance, options);

    if (!registry.trackTransient(instance)) {
      instance.close();
    }

    return {
      outcome: NotificationOutcome.Shown,
      delivery: NotificationDelivery.Transient,
      handle: createTransientHandle(instance),
      clampedActions: [],
      actionsUnsupported: hadActions,
      handlersUnsupported: false,
    };
  } catch (error) {
    return failure(NotificationOutcome.Failed, 'The Notification constructor threw.', error);
  }
};

const showPersistent = async (
  title: string,
  options: WebNotificationOptions,
  registration: ServiceWorkerRegistration,
  registry: NotificationRegistry,
  requestedActions: WebNotificationAction[],
): Promise<ShowResult> => {
  const { accepted, clamped } = clampActions(requestedActions);
  const tag = options.tag || createAutoTag();

  try {
    await registration.showNotification(title, toPersistentOptions({ ...options, tag }, accepted));
  } catch (error) {
    return failure(NotificationOutcome.Failed, 'registration.showNotification() rejected.', error);
  }

  const { tracked, evicted } = registry.trackPersistent(tag);

  const cleanup = tracked ? [] : [closePersistent(registration, tag)];

  cleanup.push(...evicted.map((old) => closePersistent(registration, old)));

  await Promise.all(cleanup).catch((error: unknown) => {
    console.error('[react-use-notifications] closing a superseded notification failed', error);
  });

  return {
    outcome: NotificationOutcome.Shown,
    delivery: NotificationDelivery.Persistent,
    handle: createPersistentHandle(registration, tag),
    clampedActions: clamped,
    actionsUnsupported: false,
    handlersUnsupported: hasHandlers(options),
  };
};

const refusedPermission = async (): Promise<ShowFailure | null> => {
  const permission = await ensurePermission();
  if (permission === NotificationPermissionState.Denied) {
    return failure(NotificationOutcome.PermissionDenied, 'Notification permission is denied.');
  }
  if (permission !== NotificationPermissionState.Granted) {
    return failure(
      NotificationOutcome.PermissionDismissed,
      'The permission prompt was dismissed without a decision.',
    );
  }

  return null;
};

export const showNotification = async (
  title: string,
  options: WebNotificationOptions,
  context: ShowContext,
): Promise<ShowResult> => {
  if (!isNotificationSupported()) {
    return failure(NotificationOutcome.Unsupported, 'The Web Notifications API is unavailable.');
  }

  if (!isSecureContext()) {
    return failure(
      NotificationOutcome.InsecureContext,
      'Notifications require a secure context (HTTPS or localhost).',
    );
  }

  const { registration, registry } = context;
  const requestedActions = options.actions ?? [];
  const delivery = resolveDelivery(
    options.delivery ?? DeliveryPreference.Auto,
    options,
    requestedActions,
    registration,
  );

  const wantsPersistent = delivery === NotificationDelivery.Persistent;

  if (wantsPersistent && !registration) {
    if (readPermission() === NotificationPermissionState.Denied) {
      return failure(NotificationOutcome.PermissionDenied, 'Notification permission is denied.');
    }

    return failure(
      NotificationOutcome.RegistrationRequired,
      'Persistent delivery requires a ServiceWorkerRegistration.',
    );
  }

  const refused = await refusedPermission();
  if (refused) {
    return refused;
  }

  if (wantsPersistent && registration) {
    return showPersistent(title, options, registration, registry, requestedActions);
  }

  const result = showTransient(title, options, registry, requestedActions.length > 0);

  const canRetryPersistent
    = result.outcome !== NotificationOutcome.Shown
      && registration !== undefined
      && options.delivery !== DeliveryPreference.Transient;

  if (!canRetryPersistent) {
    return result;
  }

  return showPersistent(title, options, registration, registry, requestedActions);
};
