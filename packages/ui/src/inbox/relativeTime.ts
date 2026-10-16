const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const formatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
  style: 'narrow',
});

export const relativeTime = (receivedAt: number, now: number = Date.now()): string => {
  const elapsed = now - receivedAt;

  if (elapsed < HOUR) {
    return formatter.format(-Math.floor(elapsed / MINUTE), 'minute');
  }

  if (elapsed < DAY) {
    return formatter.format(-Math.floor(elapsed / HOUR), 'hour');
  }

  if (elapsed < WEEK) {
    return formatter.format(-Math.floor(elapsed / DAY), 'day');
  }

  return new Date(receivedAt).toLocaleDateString();
};
