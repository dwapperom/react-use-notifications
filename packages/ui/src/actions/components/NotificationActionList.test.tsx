import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { resetNotificationCapabilitiesCache } from 'react-use-notifications/testing';

import { FakeNotification, installFakeNotification } from '../../test/fakes';
import { NotificationActionList } from './NotificationActionList';

const threeActions = [
  { action: 'reply', title: 'Reply' },
  { action: 'archive', title: 'Archive' },
  { action: 'snooze', title: 'Snooze' },
];

describe('NotificationActionList', () => {
  beforeEach(() => {
    installFakeNotification();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing when there are no actions', () => {
    const { container } = render(<NotificationActionList actions={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders only what the browser will display and names what it hid', () => {
    FakeNotification.maxActions = 2;
    resetNotificationCapabilitiesCache();

    render(<NotificationActionList actions={threeActions} />);

    expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Snooze' })).not.toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('Snooze');
  });

  it('explains the limit when the browser supports no actions at all', () => {
    FakeNotification.maxActions = 0;
    resetNotificationCapabilitiesCache();

    render(<NotificationActionList actions={threeActions} />);

    expect(screen.getByRole('note')).toHaveTextContent(/does not support notification actions/i);
  });

  it('reports the activated action', async () => {
    const onAction = vi.fn();
    render(<NotificationActionList actions={threeActions} onAction={onAction} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reply' }));

    expect(onAction).toHaveBeenCalledWith(threeActions[0]);
  });

  it('renders every action and no verdict while the limit is still unknown', () => {
    vi.stubGlobal('Notification', undefined);
    resetNotificationCapabilitiesCache();

    render(
      <NotificationActionList
        actions={[
          { action: 'reply', title: 'Reply' },
          { action: 'archive', title: 'Archive' },
          { action: 'mute', title: 'Mute' },
        ]}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
