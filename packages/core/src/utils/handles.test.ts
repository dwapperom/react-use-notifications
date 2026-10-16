import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createFakeRegistration } from '../test/fakes';
import { closePersistent } from './handles';

describe('handles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('closes every notification carrying the tag', async () => {
    const { registration, open } = createFakeRegistration();
    open.push({ tag: 'thread-42', close: vi.fn() }, { tag: 'other', close: vi.fn() });

    await closePersistent(registration, 'thread-42');

    expect(open[0]?.close).toHaveBeenCalled();
    expect(open[1]?.close).not.toHaveBeenCalled();
  });
});
