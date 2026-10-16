import { describe, expect, it } from 'vitest';

import { upsertItem } from './inboxItems';

import type { InboxItem } from './Inbox.types';

const item = (id: string, overrides: Partial<InboxItem> = {}): InboxItem => {
  return {
    id,
    receivedAt: 1,
    readAt: null,
    title: id,
    ...overrides,
  };
};

describe('upsertItem', () => {
  it('keeps the read state of the item it replaces', () => {
    const items = upsertItem([item('a', { readAt: 7 })], item('a', { title: 'again' }));

    expect(items).toEqual([item('a', { title: 'again', readAt: 7 })]);
  });

  it('takes the incoming read state for an unread item', () => {
    expect(upsertItem([item('a')], item('a', { readAt: 9 }))[0]?.readAt).toBe(9);
  });

  it('replaces an item carrying the same tag', () => {
    const before = [item('a', { tag: 'deploy' }), item('b')];
    const items = upsertItem(before, item('c', { tag: 'deploy' }));

    expect(items.map((entry) => entry.id)).toEqual(['c', 'b']);
  });

  it('sorts newest first', () => {
    const items = upsertItem([item('new', { receivedAt: 10 })], item('old', { receivedAt: 3 }));

    expect(items.map((entry) => entry.id)).toEqual(['new', 'old']);
  });
});
