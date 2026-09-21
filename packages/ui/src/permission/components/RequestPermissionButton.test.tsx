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
import { RequestPermissionButton } from './RequestPermissionButton';

describe('RequestPermissionButton', () => {
  beforeEach(() => {
    installFakeNotification('default');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for permission from the click handler', async () => {
    const onPermissionChange = vi.fn();
    render(<RequestPermissionButton onPermissionChange={onPermissionChange} />);

    await userEvent.click(screen.getByRole('button'));

    expect(FakeNotification.requestPermission).toHaveBeenCalledOnce();
    expect(onPermissionChange).toHaveBeenCalledWith('default');
  });

  it('disables itself once permission is denied', () => {
    installFakeNotification('denied');

    render(<RequestPermissionButton />);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('data-permission', 'denied');
  });

  it('disables itself when the browser has no Notifications API', () => {
    vi.stubGlobal('Notification', undefined);
    resetNotificationCapabilitiesCache();

    render(<RequestPermissionButton />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders as a non-submitting button so it is safe inside a form', () => {
    render(<RequestPermissionButton />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
