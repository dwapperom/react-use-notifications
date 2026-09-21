import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { FallbackReason, ToastVariant } from '../Toast.constants';
import { NotificationToaster } from './NotificationToaster';

import type { ToastItem } from '../hooks/useToaster';

const toast: ToastItem = {
  id: 'toast-1',
  title: 'Ada replied',
  body: 'See you at 3',
  variant: ToastVariant.Default,
  actions: [{ action: 'reply', title: 'Reply' }],
  owner: 'test',
  duration: 0,
  reason: FallbackReason.DocumentVisible,
};

describe('NotificationToaster', () => {
  it('mounts the live region even with nothing to show', () => {
    render(<NotificationToaster toasts={[]} onDismiss={vi.fn()} />);

    const region = screen.getByRole('list');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('data-empty', 'true');
  });

  it('renders the title, body and actions', () => {
    render(<NotificationToaster toasts={[toast]} onDismiss={vi.fn()} />);

    expect(screen.getByText('Ada replied')).toBeInTheDocument();
    expect(screen.getByText('See you at 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
  });

  it('exposes the variant and fallback reason as data attributes', () => {
    render(
      <NotificationToaster
        toasts={[{ ...toast, variant: ToastVariant.Danger }]}
        onDismiss={vi.fn()}
      />,
    );

    const item = screen.getByRole('listitem');
    expect(item).toHaveAttribute('data-variant', 'danger');
    expect(item).toHaveAttribute('data-reason', FallbackReason.DocumentVisible);
  });

  it('names the toast in the dismiss label so the button is not just an x', async () => {
    const onDismiss = vi.fn();
    render(<NotificationToaster toasts={[toast]} onDismiss={onDismiss} />);

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss: Ada replied' }));

    expect(onDismiss).toHaveBeenCalledWith('toast-1');
  });

  it('reports which toast an action came from', async () => {
    const onAction = vi.fn();
    render(<NotificationToaster toasts={[toast]} onDismiss={vi.fn()} onAction={onAction} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reply' }));

    expect(onAction).toHaveBeenCalledWith(toast, toast.actions[0]);
  });

  it('omits the body and action row when there is nothing to put in them', () => {
    render(
      <NotificationToaster
        toasts={[{ ...toast, body: undefined, actions: [] }]}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.queryByText('See you at 3')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
