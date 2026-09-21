import { useCallback, useEffect, useLayoutEffect } from 'react';

import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useLatest } from './useLatest';

type Reader = (props: { read: () => string }) => null;

let seen: string | null = null;

const PassiveChild: Reader = ({ read }) => {
  useEffect(() => {
    seen = read();
  }, [read]);

  return null;
};

const LayoutChild: Reader = ({ read }) => {
  useLayoutEffect(() => {
    seen = read();
  }, [read]);

  return null;
};

const Parent = ({ value, child: Child }: { value: string; child: Reader | null }) => {
  const ref = useLatest(value);
  const read = useCallback(() => ref.current, [ref]);

  return Child
    ? <Child read={read} />
    : null;
};

describe('useLatest', () => {
  beforeEach(() => {
    seen = null;
  });

  it('holds the value it was seeded with', () => {
    const view = render(<Parent value="first" child={PassiveChild} />);
    view.rerender(<Parent value="first" child={PassiveChild} />);

    expect(seen).toBe('first');
  });

  it('is current for a child mounting in a later commit, read from a passive effect', () => {
    const view = render(<Parent value="stale" child={null} />);
    view.rerender(<Parent value="fresh" child={PassiveChild} />);

    expect(seen).toBe('fresh');
  });

  it('is current for a child mounting in a later commit, read from a layout effect', () => {
    const view = render(<Parent value="stale" child={null} />);
    view.rerender(<Parent value="fresh" child={LayoutChild} />);

    expect(seen).toBe('fresh');
  });
});
