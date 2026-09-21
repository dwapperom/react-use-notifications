import {
  act,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { NotificationPermissionState } from 'react-use-notifications';

import { installFakeNotification } from '../../test/fakes';
import { NotificationToaster } from '../components/NotificationToaster';
import { useToaster } from '../hooks/useToaster';
import { useToasts } from '../hooks/useToasts';
import { NotificationPresentation, ToastVariant } from '../Toast.constants';
import { ToasterProvider } from './ToasterProvider';

const useToasterWithToasts = (options?: Parameters<typeof useToaster>[0]) => {
  return {
    ...useToaster(options),
    toasts: useToasts(),
  };
};

const Publisher = () => {
  const { show } = useToaster();

  return (
    <button type="button" onClick={() => void show('From deep in the tree')}>
      publish
    </button>
  );
};

const Display = () => {
  const { dismiss } = useToaster();
  const toasts = useToasts();

  return <NotificationToaster toasts={toasts} onDismiss={dismiss} />;
};

describe('ToasterProvider', () => {
  beforeEach(() => {
    installFakeNotification(NotificationPermissionState.Granted);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lets one component publish into the toaster another component renders', async () => {
    render(
      <ToasterProvider presentation={NotificationPresentation.InApp}>
        <Publisher />
        <Display />
      </ToasterProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'publish' }));

    expect(screen.getByText('From deep in the tree')).toBeInTheDocument();
  });

  it('supplies defaults that a call can still override', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToasterProvider
        presentation={NotificationPresentation.InApp}
        variant={ToastVariant.Warning}
        duration={0}
      >
        {children}
      </ToasterProvider>
    );
    const { result } = renderHook(() => useToasterWithToasts(), { wrapper });

    await act(async () => {
      await result.current.show('Inherits the default');
      await result.current.show('Overrides it', { variant: ToastVariant.Danger });
    });

    expect(result.current.toasts[0]?.variant).toBe(ToastVariant.Warning);
    expect(result.current.toasts[1]?.variant).toBe(ToastVariant.Danger);
  });

  it('keeps hook options ahead of provider defaults', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToasterProvider variant={ToastVariant.Warning} presentation={NotificationPresentation.InApp}>
        {children}
      </ToasterProvider>
    );
    const { result } = renderHook(
      () => useToasterWithToasts({ variant: ToastVariant.Success }),
      { wrapper },
    );

    await act(async () => {
      await result.current.show('Hook wins');
    });

    expect(result.current.toasts[0]?.variant).toBe(ToastVariant.Success);
  });

  it('fires without a provider, but the in-app list needs one', async () => {
    const { result } = renderHook(() =>
      useToasterWithToasts({ presentation: NotificationPresentation.InApp }),
    );

    await act(async () => {
      await result.current.show('Standalone');
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
