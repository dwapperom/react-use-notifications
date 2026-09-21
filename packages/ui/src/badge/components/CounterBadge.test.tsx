import { render, screen } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { CounterBadge } from './CounterBadge';

describe('CounterBadge', () => {
  it('renders nothing at zero, so callers need no conditional of their own', () => {
    const { container } = render(<CounterBadge count={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a zero when asked', () => {
    render(<CounterBadge count={0} showZero />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('caps at max and says so through data-overflowing', () => {
    render(<CounterBadge count={140} max={99} />);

    const badge = screen.getByText('99+');
    expect(badge).toHaveAttribute('data-overflowing', 'true');
    expect(badge).toHaveAttribute('data-count', '99+');
  });

  it('announces the count, and lets the caller replace the wording', () => {
    const { rerender } = render(<CounterBadge count={3} />);
    expect(screen.getByRole('status')).toHaveAccessibleName('3 unread');

    rerender(<CounterBadge count={3} aria-label="3 ongelezen berichten" />);
    expect(screen.getByRole('status')).toHaveAccessibleName('3 ongelezen berichten');
  });
});
