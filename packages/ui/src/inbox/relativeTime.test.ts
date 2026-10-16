import { describe, expect, it } from 'vitest';

import { relativeTime } from './relativeTime';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const now = Date.UTC(2026, 0, 15, 12, 0, 0);

const ago = (value: number, unit: Intl.RelativeTimeFormatUnit): string => {
  return new Intl.RelativeTimeFormat(undefined, {
    numeric: 'auto',
    style: 'narrow',
  }).format(-value, unit);
};

describe('relativeTime', () => {
  it('counts the minutes below an hour', () => {
    expect(relativeTime(now - 5 * MINUTE, now)).toBe(ago(5, 'minute'));
    expect(relativeTime(now - 59 * MINUTE, now)).toBe(ago(59, 'minute'));
  });

  it('counts the hours below a day', () => {
    expect(relativeTime(now - HOUR, now)).toBe(ago(1, 'hour'));
    expect(relativeTime(now - 23 * HOUR, now)).toBe(ago(23, 'hour'));
  });

  it('counts the days below a week', () => {
    expect(relativeTime(now - DAY, now)).toBe(ago(1, 'day'));
    expect(relativeTime(now - 6 * DAY, now)).toBe(ago(6, 'day'));
  });

  it('falls back to a date past a week', () => {
    expect(relativeTime(now - 7 * DAY, now)).toBe(new Date(now - 7 * DAY).toLocaleDateString());
  });

  it('reads the clock when no reference is given', () => {
    expect(relativeTime(Date.now())).toBe(ago(0, 'minute'));
  });
});
