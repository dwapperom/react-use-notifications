import { render, screen } from '@testing-library/react';
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
import { NotificationPermissionGate } from './NotificationPermissionGate';

const renderGate = () => {
  return render(
    <NotificationPermissionGate
      unsupported={<p>No API</p>}
      denied={<p>Blocked</p>}
      prompt={<p>Ask first</p>}
    >
      <p>Granted content</p>
    </NotificationPermissionGate>,
  );
};

describe('NotificationPermissionGate', () => {
  beforeEach(() => {
    installFakeNotification();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders children once permission is granted', () => {
    FakeNotification.permission = 'granted';

    renderGate();

    expect(screen.getByText('Granted content')).toBeInTheDocument();
  });

  it('renders the prompt slot before the user has decided', () => {
    FakeNotification.permission = 'default';

    renderGate();

    expect(screen.getByText('Ask first')).toBeInTheDocument();
    expect(screen.queryByText('Granted content')).not.toBeInTheDocument();
  });

  it('renders the denied slot', () => {
    FakeNotification.permission = 'denied';

    renderGate();

    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('renders the unsupported slot when the API is missing', () => {
    vi.stubGlobal('Notification', undefined);
    resetNotificationCapabilitiesCache();

    renderGate();

    expect(screen.getByText('No API')).toBeInTheDocument();
  });
});
