import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createId } from './createId';

describe('createId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates a unique id from randomUUID', () => {
    expect(createId('run')).not.toBe(createId('run'));
  });

  it('still generates unique ids where randomUUID is missing', () => {
    vi.stubGlobal('crypto', {});

    const ids = [createId('run'), createId('run'), createId('run')];

    expect(new Set(ids).size).toBe(3);
    expect(ids.every((id) => id.startsWith('run:'))).toBe(true);
  });
});
