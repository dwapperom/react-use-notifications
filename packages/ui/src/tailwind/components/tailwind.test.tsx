import { render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { installFakeNotification } from '../../test/fakes';
import { FallbackReason, ToastVariant } from '../../toast/Toast.constants';
import { CounterBadge } from './CounterBadge';
import { NotificationActionList } from './NotificationActionList';
import { NotificationPermissionBadge } from './NotificationPermissionBadge';
import { NotificationToaster } from './NotificationToaster';
import { RequestPermissionButton } from './RequestPermissionButton';

import type { ToastItem } from '../../toast/hooks/useToaster';

const toast: ToastItem = {
  id: 'toast-1',
  title: 'Ada replied',
  variant: ToastVariant.Default,
  actions: [],
  owner: 'test',
  duration: 0,
  reason: FallbackReason.DocumentVisible,
};

describe('tailwind layer', () => {
  beforeEach(() => {
    installFakeNotification('default');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('applies position classes to the toast region', () => {
    render(<NotificationToaster toasts={[]} onDismiss={vi.fn()} position="top-left" />);

    expect(screen.getByRole('list')).toHaveClass('left-0', 'top-0', 'fixed');
  });

  it('lets a caller override a built-in class instead of fighting it', () => {
    render(<NotificationToaster toasts={[toast]} onDismiss={vi.fn()} className="max-w-lg" />);

    const region = screen.getByRole('list');
    expect(region).toHaveClass('max-w-lg');
    expect(region).not.toHaveClass('max-w-sm');
  });

  it('keeps the unstyled data attributes that theming depends on', () => {
    render(<NotificationPermissionBadge />);

    expect(screen.getByText('Not enabled')).toHaveAttribute('data-permission', 'default');
  });

  it('styles the button while leaving its behaviour alone', () => {
    render(<RequestPermissionButton variant="secondary" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
    expect(button.className).not.toBe('');
  });

  it('styles the action list and its clamped notice', () => {
    render(
      <NotificationActionList
        actions={[
          { action: 'a', title: 'A' },
          { action: 'b', title: 'B' },
          { action: 'c', title: 'C' },
        ]}
      />,
    );

    expect(screen.getByRole('note').className).toContain('text-amber');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('tones the counter badge and caps the count it prints', () => {
    render(<CounterBadge count={140} tone="neutral" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('99+');
    expect(badge).toHaveClass('bg-foreground', 'text-background', 'ring-background');
  });

  it('renders nothing for an empty count', () => {
    render(<CounterBadge count={0} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
