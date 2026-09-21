import { DEFAULT_NAVIGATE_URL } from '../Notification.constants';

import type { NavigationHints } from '../Notification.types';
import type { Payload } from './payload';
import type {
  NotificationEventLike,
  NotificationHandlerOptions,
  ServiceWorkerGlobalScopeLike,
} from './ServiceWorker.types';

export interface Target {
  url: string;
  explicit: boolean;
}

const readDataUrl = (data: unknown): string | undefined => {
  if (typeof data !== 'object' || data === null || !('url' in data)) {
    return undefined;
  }

  const { url } = data;

  return typeof url === 'string' && url !== ''
    ? url
    : undefined;
};

const firstTarget = (...candidates: unknown[]): string | undefined => {
  return candidates.find(
    (candidate): candidate is string => typeof candidate === 'string' && candidate !== '',
  );
};

const readActionTarget = (hints: NavigationHints | undefined, action: string): unknown => {
  const targets = hints?.actions;
  if (!targets || !Object.prototype.hasOwnProperty.call(targets, action)) {
    return undefined;
  }

  return targets[action];
};

const resolveTargetUrl = (
  event: NotificationEventLike,
  payload: Payload,
  defaultUrl: string,
): Target => {
  const { notification, action } = event;
  const { hints, userData } = payload;
  const activatedAction = notification.actions?.find((candidate) => candidate.action === action);

  const target = firstTarget(
    readActionTarget(hints, action),
    activatedAction?.navigate,
    hints?.navigate,
    notification.navigate,
    readDataUrl(userData),
  );

  return target === undefined
    ? { url: defaultUrl, explicit: false }
    : { url: target, explicit: true };
};

const toAbsoluteUrl = (target: string, base: string): string | undefined => {
  try {
    return new URL(target, base).href;
  } catch (error) {
    console.error('[react-use-notifications] could not parse the navigation target', error);

    return undefined;
  }
};

const isAllowedTarget = (
  absoluteUrl: string,
  scope: ServiceWorkerGlobalScopeLike,
  options: NotificationHandlerOptions,
): boolean => {
  let url: URL;
  try {
    url = new URL(absoluteUrl);
  } catch (error) {
    console.error('[react-use-notifications] could not parse the resolved target', error);

    return false;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return false;
  }

  if (options.isAllowedUrl) {
    return options.isAllowedUrl(url);
  }

  return url.origin === new URL(scope.location.href).origin
    || (options.allowedOrigins?.includes(url.origin) ?? false);
};

export const resolveNavigation = (
  event: NotificationEventLike,
  payload: Payload,
  scope: ServiceWorkerGlobalScopeLike,
  options: NotificationHandlerOptions,
): { navigateTo: string; reported: Target } => {
  const defaultUrl = options.defaultUrl ?? DEFAULT_NAVIGATE_URL;
  const requested = resolveTargetUrl(event, payload, defaultUrl);
  const absoluteUrl = toAbsoluteUrl(requested.url, scope.location.href);

  const allowed = absoluteUrl !== undefined && isAllowedTarget(absoluteUrl, scope, options);
  if (!allowed) {
    console.warn('[react-use-notifications] refused a navigation target outside this origin');
  }

  const explicit = allowed && requested.explicit;

  return {
    navigateTo: allowed
      ? absoluteUrl
      : toAbsoluteUrl(defaultUrl, scope.location.href) ?? scope.location.href,
    reported: { url: requested.url, explicit },
  };
};

export const isSamePage = (a: string, b: string): boolean => {
  try {
    const left = new URL(a);
    const right = new URL(b);

    return left.origin === right.origin && left.pathname === right.pathname;
  } catch (error) {
    console.error('[react-use-notifications] could not compare client URLs', error);

    return a === b;
  }
};
