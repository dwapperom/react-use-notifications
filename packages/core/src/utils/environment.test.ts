import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { installFakeNotification, setSecureContext } from '../test/fakes';
import { isSecureContext, supportsActions, supportsPersistentNotifications } from './environment';

describe('environment', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports an insecure context when there is no window at all', () => {
    vi.stubGlobal('window', undefined);

    expect(isSecureContext()).toBe(false);
  });

  it('follows the real window once there is one', () => {
    setSecureContext(true);
    expect(isSecureContext()).toBe(true);

    setSecureContext(false);
    expect(isSecureContext()).toBe(false);
  });

  it('needs both a service worker container and showNotification on the prototype', () => {
    expect(supportsPersistentNotifications()).toBe(false);

    vi.stubGlobal('navigator', { serviceWorker: {} });
    vi.stubGlobal('ServiceWorkerRegistration', class {});
    expect(supportsPersistentNotifications()).toBe(false);

    vi.stubGlobal('ServiceWorkerRegistration', class {
      showNotification() {}
    });
    expect(supportsPersistentNotifications()).toBe(true);
  });

  it('reports actions only when the platform will draw at least one', () => {
    const platform = installFakeNotification();
    vi.stubGlobal('navigator', { serviceWorker: {} });
    vi.stubGlobal('ServiceWorkerRegistration', class {
      showNotification() {}
    });

    platform.maxActions = 2;
    expect(supportsActions()).toBe(true);

    platform.maxActions = 0;
    expect(supportsActions()).toBe(false);
  });
});
