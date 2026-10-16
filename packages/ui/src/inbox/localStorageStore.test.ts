import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { localStorageStore } from './localStorageStore';

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

describe('localStorageStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips through localStorage', async () => {
    const store = localStorageStore();
    await store.add(item('a'));

    expect(await localStorageStore().list()).toEqual([item('a')]);
  });

  it('replaces an item carrying the same tag', async () => {
    const store = localStorageStore();
    await store.add(item('a', { tag: 'deploy' }));
    await store.add(item('b', { tag: 'deploy' }));

    expect((await store.list()).map((entry) => entry.id)).toEqual(['b']);
  });

  it('replaces an item carrying the same id', async () => {
    const store = localStorageStore();
    await store.add(item('a', { title: 'first' }));
    await store.add(item('a', { title: 'second' }));

    expect(await store.list()).toEqual([item('a', { title: 'second' })]);
  });

  it('drops the oldest past the limit', async () => {
    const store = localStorageStore({ limit: 2 });
    await store.add(item('a'));
    await store.add(item('b'));
    await store.add(item('c'));

    expect((await store.list()).map((entry) => entry.id)).toEqual(['c', 'b']);
  });

  it('survives a corrupted payload instead of throwing', async () => {
    window.localStorage.setItem('react-use-notifications.inbox', '{not json');

    expect(await localStorageStore().list()).toEqual([]);
  });

  it('skips entries that are not inbox items', async () => {
    window.localStorage.setItem(
      'react-use-notifications.inbox',
      JSON.stringify([{ nope: true }, item('a')]),
    );

    expect((await localStorageStore().list()).map((entry) => entry.id)).toEqual(['a']);
  });

  it('keeps the inbox in memory where localStorage is unavailable', async () => {
    const onWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    const store = localStorageStore();
    await store.add(item('a'));
    await store.add(item('b'));

    expect((await store.list()).map((entry) => entry.id)).toEqual(['b', 'a']);
    expect(onWarn).toHaveBeenCalledTimes(1);

    setItem.mockRestore();
    onWarn.mockRestore();
  });

  it('rejects a write the browser refuses, so the provider can undo it', async () => {
    const store = localStorageStore();
    await store.list();

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });

    await expect(store.add(item('a'))).rejects.toThrow('quota');

    setItem.mockRestore();
  });

  it('marks read and removes by id', async () => {
    const store = localStorageStore();
    await store.add(item('a'));
    await store.markRead('a', 5);

    expect((await store.list())[0]?.readAt).toBe(5);

    await store.remove('a');
    expect(await store.list()).toEqual([]);
  });
});
