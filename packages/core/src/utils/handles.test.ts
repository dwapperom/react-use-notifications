import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createFakeRegistration } from '../test/fakes';
import { closePersistent, createAutoTag } from './handles';

describe('handles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates a unique tag from randomUUID', () => {
    expect(createAutoTag()).not.toBe(createAutoTag());
  });

  it('still generates unique tags where randomUUID is missing', () => {
    vi.stubGlobal('crypto', {});

    const tags = [createAutoTag(), createAutoTag(), createAutoTag()];

    expect(new Set(tags).size).toBe(3);
    expect(tags.every((tag) => tag.startsWith('run:'))).toBe(true);
  });

  it('closes every notification carrying the tag', async () => {
    const { registration, open } = createFakeRegistration();
    open.push({ tag: 'thread-42', close: vi.fn() }, { tag: 'other', close: vi.fn() });

    await closePersistent(registration, 'thread-42');

    expect(open[0]?.close).toHaveBeenCalled();
    expect(open[1]?.close).not.toHaveBeenCalled();
  });
});
