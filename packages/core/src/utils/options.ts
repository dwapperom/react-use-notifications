import { NAVIGATION_DATA_KEY } from '../Notification.constants';
import { readMaxActions } from './environment';

import type {
  NavigationHints,
  WebNotificationAction,
  WebNotificationOptions,
} from '../Notification.types';

export interface ClampResult {
  accepted: WebNotificationAction[];
  clamped: WebNotificationAction[];
}

export const clampActions = (actions: WebNotificationAction[]): ClampResult => {
  const limit = readMaxActions();
  if (actions.length <= limit) {
    return {
      accepted: actions,
      clamped: [],
    };
  }

  return {
    accepted: actions.slice(0, limit),
    clamped: actions.slice(limit),
  };
};

export const toStandardOptions = (options: WebNotificationOptions): NotificationOptions => {
  const {
    actions: _actions,
    delivery: _delivery,
    onClick: _onClick,
    onClose: _onClose,
    onError: _onError,
    onShow: _onShow,
    ...standardOptions
  } = options;

  return standardOptions;
};

const toNavigationHints = (
  options: WebNotificationOptions,
  actions: WebNotificationAction[],
): NavigationHints | null => {
  const actionTargets = Object.fromEntries(
    actions
      .filter((action) => Boolean(action.navigate))
      .map((action) => [action.action, action.navigate as string]),
  );

  const hasActionTargets = Object.keys(actionTargets).length > 0;
  if (!options.navigate && !hasActionTargets) {
    return null;
  }

  return {
    ...(options.navigate ? { navigate: options.navigate } : {}),
    ...(hasActionTargets ? { actions: actionTargets } : {}),
  };
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;

  return prototype === Object.prototype || prototype === null;
};

const withNavigationHints = (data: unknown, hints: NavigationHints): unknown => {
  if (isPlainObject(data)) {
    return {
      ...data,
      [NAVIGATION_DATA_KEY]: hints,
    };
  }

  return {
    [NAVIGATION_DATA_KEY]: { ...hints, wrapped: data },
  };
};

export const toPersistentOptions = (
  options: WebNotificationOptions,
  actions: WebNotificationAction[],
): NotificationOptions => {
  const standardOptions = toStandardOptions(options);
  const hints = toNavigationHints(options, actions);

  const withHints = hints
    ? { ...standardOptions, data: withNavigationHints(options.data, hints) }
    : standardOptions;

  if (actions.length === 0) {
    return withHints;
  }

  return { ...withHints, actions } as NotificationOptions;
};
