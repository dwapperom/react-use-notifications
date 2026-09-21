import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { FakeNotification, installFakeNotification } from '../test/fakes';
import { createNotificationRegistry } from './registry';

const createTransient = (tag?: string): Notification => {
  return new FakeNotification('Hi', tag === undefined ? {} : { tag }) as unknown as Notification;
};

describe('createNotificationRegistry', () => {
  beforeEach(() => {
    installFakeNotification();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('tag matching', () => {
    it('closes everything when no tag is given', () => {
      const registry = createNotificationRegistry();
      const first = createTransient('a');
      const second = createTransient('b');
      registry.trackTransient(first);
      registry.trackTransient(second);

      registry.closeTransient();

      expect(first.close).toHaveBeenCalled();
      expect(second.close).toHaveBeenCalled();
    });

    it('leaves untagged notifications alone when closing by empty tag', () => {
      const registry = createNotificationRegistry();
      const untagged = createTransient();
      registry.trackTransient(untagged);

      registry.closeTransient('');

      expect(untagged.close).not.toHaveBeenCalled();
    });

    it('never hands back persistent tags for an empty tag', () => {
      const registry = createNotificationRegistry();
      registry.trackPersistent('real-tag');

      expect(registry.takePersistent('')).toEqual([]);
      expect(registry.count()).toBe(1);
    });
  });

  describe('bookkeeping', () => {
    it('forgets a transient notification the platform closed on its own', () => {
      const registry = createNotificationRegistry();
      const instance = createTransient('a');
      registry.trackTransient(instance);

      (instance as unknown as FakeNotification).dispatch('close');

      expect(registry.count()).toBe(0);
    });

    it('forgets persistent tags once taken, so a second close is a no-op', () => {
      const registry = createNotificationRegistry();
      registry.trackPersistent('upload');

      expect(registry.takePersistent('upload')).toEqual(['upload']);
      expect(registry.takePersistent('upload')).toEqual([]);
    });

    it('evicts the oldest tags rather than growing without bound', () => {
      const registry = createNotificationRegistry();
      const evicted: string[] = [];
      for (let index = 0; index < 200; index += 1) {
        evicted.push(...registry.trackPersistent(`tag-${index}`).evicted);
      }

      expect(registry.count()).toBe(128);
      expect(registry.takePersistent('tag-0')).toEqual([]);
      expect(registry.takePersistent('tag-199')).toEqual(['tag-199']);

      expect(evicted).toContain('tag-0');
      expect(evicted).toHaveLength(200 - 128);
    });
  });

  describe('dispose', () => {
    it('refuses a transient notification that arrived after disposal', () => {
      const registry = createNotificationRegistry();
      registry.dispose();

      expect(registry.trackTransient(createTransient('late'))).toBe(false);
      expect(registry.count()).toBe(0);
    });

    it('refuses a persistent tag that arrived after disposal', () => {
      const registry = createNotificationRegistry();
      registry.dispose();

      expect(registry.trackPersistent('late')).toMatchObject({ tracked: false });
      expect(registry.count()).toBe(0);
    });
  });
});
