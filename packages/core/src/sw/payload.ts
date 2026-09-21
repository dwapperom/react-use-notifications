import { NAVIGATION_DATA_KEY } from '../Notification.constants';

import type { NavigationHints } from '../Notification.types';

export interface Payload {
  hints: NavigationHints | undefined;
  userData: unknown;
}

const readHints = (data: unknown): NavigationHints | undefined => {
  if (typeof data !== 'object' || data === null || !(NAVIGATION_DATA_KEY in data)) {
    return undefined;
  }

  const hints = (data as Record<string, unknown>)[NAVIGATION_DATA_KEY];
  if (typeof hints !== 'object' || hints === null) {
    return undefined;
  }

  return hints;
};

export const decodePayload = (data: unknown): Payload => {
  const hints = readHints(data);
  if (!hints) {
    return {
      hints: undefined,
      userData: data,
    };
  }
  if ('wrapped' in hints) {
    return {
      hints,
      userData: hints.wrapped,
    };
  }

  const { [NAVIGATION_DATA_KEY]: _hints, ...rest } = data as Record<string, unknown>;

  return {
    hints,
    userData: rest,
  };
};
