import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  DeliveryPreference,
  NotificationDelivery,
  NotificationOutcome,
} from '../Notification.constants';
import {
  createFakeRegistration,
  FakeNotification,
  installFakeNotification,
  setSecureContext,
} from '../test/fakes';
import { createNotificationRegistry } from './registry';
import { showNotification } from './show';

const createContext = (registration?: ServiceWorkerRegistration) => {
  return {
    registration,
    registry: createNotificationRegistry(),
  };
};

describe('showNotification', () => {
  beforeEach(() => {
    installFakeNotification();
    setSecureContext(true);
    FakeNotification.permission = 'granted';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('delivery resolution', () => {
    it('stays transient when the platform cannot draw actions, so onClick survives', async () => {
      FakeNotification.maxActions = 0;
      const { registration, shown } = createFakeRegistration();
      const onClick = vi.fn();

      const result = await showNotification(
        'Ada replied',
        { actions: [{ action: 'reply', title: 'Reply' }], onClick },
        createContext(registration),
      );

      expect(result).toMatchObject({
        delivery: NotificationDelivery.Transient,
        actionsUnsupported: true,
      });
      expect(shown).toHaveLength(0);

      FakeNotification.instances.at(-1)?.dispatch('click');
      expect(onClick).toHaveBeenCalled();
    });

    it('still honours an explicit persistent request on the same platform', async () => {
      FakeNotification.maxActions = 0;
      const { registration } = createFakeRegistration();

      const result = await showNotification(
        'Ada replied',
        { actions: [{ action: 'reply', title: 'Reply' }], delivery: DeliveryPreference.Persistent },
        createContext(registration),
      );

      expect(result).toMatchObject({ delivery: NotificationDelivery.Persistent });
    });
  });

  describe('data round trip', () => {
    it('keeps a Map intact instead of spreading it into nothing', async () => {
      const { registration, shown } = createFakeRegistration();
      const data = new Map([['orderId', 7]]);

      await showNotification(
        'Order ready',
        { navigate: '/orders/7', data, delivery: DeliveryPreference.Persistent },
        createContext(registration),
      );

      const stored = shown.at(0)?.options.data as Record<string, { wrapped: unknown }>;
      expect(stored['__reactUseNotifications']?.wrapped).toBe(data);
    });

    it('marks absent data as absent rather than as an empty object', async () => {
      const { registration, shown } = createFakeRegistration();

      await showNotification(
        'Ping',
        { navigate: '/inbox', delivery: DeliveryPreference.Persistent },
        createContext(registration),
      );

      const stored = shown.at(0)?.options.data as Record<string, object>;
      expect('wrapped' in (stored['__reactUseNotifications'] ?? {})).toBe(true);
    });

    it('adds one key to a plain object without disturbing it', async () => {
      const { registration, shown } = createFakeRegistration();

      await showNotification(
        'Ada replied',
        {
          navigate: '/threads/42',
          data: { threadId: 42 },
          delivery: DeliveryPreference.Persistent,
        },
        createContext(registration),
      );

      expect(shown.at(0)?.options.data).toMatchObject({ threadId: 42 });
    });
  });

  it('reports a rejected showNotification instead of throwing', async () => {
    const { registration } = createFakeRegistration();
    const boom = new Error('quota exceeded');
    vi.spyOn(registration, 'showNotification').mockRejectedValue(boom);

    const result = await showNotification(
      'Hi',
      { delivery: DeliveryPreference.Persistent },
      createContext(registration),
    );

    expect(result).toMatchObject({ outcome: NotificationOutcome.Failed, error: boom });
  });

  describe('guard clauses', () => {
    it('reports an unsupported environment instead of returning undefined', async () => {
      vi.stubGlobal('Notification', undefined);

      const result = await showNotification('Hi', {}, createContext());

      expect(result.outcome).toBe(NotificationOutcome.Unsupported);
    });

    it('reports an insecure context', async () => {
      setSecureContext(false);

      const result = await showNotification('Hi', {}, createContext());

      expect(result.outcome).toBe(NotificationOutcome.InsecureContext);
    });

    it('reports a denied permission rather than warning to the console', async () => {
      FakeNotification.permission = 'denied';

      const result = await showNotification('Hi', {}, createContext());

      expect(result).toMatchObject({ outcome: NotificationOutcome.PermissionDenied });
    });

    it('prompts only when the user has not decided, and reports a dismissal', async () => {
      FakeNotification.permission = 'default';

      const result = await showNotification('Hi', {}, createContext());

      expect(FakeNotification.requestPermission).toHaveBeenCalledOnce();
      expect(result.outcome).toBe(NotificationOutcome.PermissionDismissed);
    });

    it('requires a registration when persistent delivery is forced, without prompting', async () => {
      FakeNotification.permission = 'default';

      const result = await showNotification(
        'Hi',
        { delivery: DeliveryPreference.Persistent },
        createContext(),
      );

      expect(FakeNotification.requestPermission).not.toHaveBeenCalled();
      expect(result.outcome).toBe(NotificationOutcome.RegistrationRequired);
    });

    it('reports a block rather than the missing registration, so the caller can say why', async () => {
      FakeNotification.permission = 'denied';

      const result = await showNotification(
        'Hi',
        { delivery: DeliveryPreference.Persistent },
        createContext(),
      );

      expect(result.outcome).toBe(NotificationOutcome.PermissionDenied);
    });
  });

  describe('delivery selection', () => {
    it('stays transient when a registration exists but no actions were given', async () => {
      const { registration, shown } = createFakeRegistration();
      const onClick = vi.fn();

      const result = await showNotification('Hi', { onClick }, createContext(registration));

      expect(result).toMatchObject({
        outcome: NotificationOutcome.Shown,
        delivery: NotificationDelivery.Transient,
      });
      expect(shown).toHaveLength(0);

      FakeNotification.instances.at(-1)?.dispatch('click');
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('upgrades to persistent when actions are present and a registration exists', async () => {
      const { registration, shown } = createFakeRegistration();

      const result = await showNotification(
        'Hi',
        { actions: [{ action: 'open', title: 'Open' }] },
        createContext(registration),
      );

      expect(result).toMatchObject({
        outcome: NotificationOutcome.Shown,
        delivery: NotificationDelivery.Persistent,
      });
      expect(shown.at(0)?.options.actions).toHaveLength(1);
    });

    it('upgrades to persistent for a navigate target with no actions', async () => {
      const { registration, shown } = createFakeRegistration();

      const result = await showNotification('Hi', { navigate: '/inbox' }, createContext(registration));

      expect(result).toMatchObject({
        outcome: NotificationOutcome.Shown,
        delivery: NotificationDelivery.Persistent,
      });
      expect(shown).toHaveLength(1);
    });

    it('upgrades to persistent for an action navigate target the platform will not draw', async () => {
      const { registration, shown } = createFakeRegistration();
      FakeNotification.maxActions = 0;

      const result = await showNotification(
        'Hi',
        { actions: [{ action: 'open', title: 'Open', navigate: '/threads/42' }] },
        createContext(registration),
      );

      expect(result).toMatchObject({ delivery: NotificationDelivery.Persistent });
      expect(shown).toHaveLength(1);
    });

    it('stays transient for a navigate target when there is no registration', async () => {
      const result = await showNotification('Hi', { navigate: '/inbox' }, createContext());

      expect(result).toMatchObject({ delivery: NotificationDelivery.Transient });
    });

    it('strips actions and reports it when falling back to transient delivery', async () => {
      const result = await showNotification(
        'Hi',
        { actions: [{ action: 'open', title: 'Open' }] },
        createContext(),
      );

      expect(result).toMatchObject({
        outcome: NotificationOutcome.Shown,
        actionsUnsupported: true,
      });
      expect(FakeNotification.instances.at(-1)?.options).not.toHaveProperty('actions');
    });
  });

  describe('maxActions clamping', () => {
    it('clamps on the very first call and reports what was dropped', async () => {
      FakeNotification.maxActions = 2;
      const { registration, shown } = createFakeRegistration();

      const result = await showNotification(
        'Hi',
        {
          actions: [
            { action: 'a', title: 'A' },
            { action: 'b', title: 'B' },
            { action: 'c', title: 'C' },
          ],
        },
        createContext(registration),
      );

      expect(shown.at(0)?.options.actions).toHaveLength(2);
      expect(result).toMatchObject({
        clampedActions: [{ action: 'c', title: 'C' }],
      });
    });

    it('keeps every action when the browser limit is not exceeded', async () => {
      FakeNotification.maxActions = 4;
      const { registration } = createFakeRegistration();

      const result = await showNotification(
        'Hi',
        { actions: [{ action: 'a', title: 'A' }] },
        createContext(registration),
      );

      expect(result).toMatchObject({ clampedActions: [] });
    });

    it('forwards the options lib.dom does not model, so capabilities are not advertised in vain', async () => {
      const { registration, shown } = createFakeRegistration();

      await showNotification(
        'Ada replied',
        {
          tag: 'thread-42',
          renotify: true,
          image: '/preview.png',
          vibrate: [200, 100, 200],
          delivery: DeliveryPreference.Persistent,
        },
        createContext(registration),
      );

      expect(shown.at(0)?.options).toMatchObject({
        renotify: true,
        image: '/preview.png',
        vibrate: [200, 100, 200],
      });
    });
  });

  describe('navigate and options passthrough', () => {
    it('forwards navigate on both the notification and its actions', async () => {
      const { registration, shown } = createFakeRegistration();

      await showNotification(
        'Hi',
        {
          navigate: '/inbox',
          actions: [{ action: 'reply', title: 'Reply', navigate: '/inbox/reply' }],
        },
        createContext(registration),
      );

      expect(shown.at(0)?.options).toMatchObject({ navigate: '/inbox' });
      expect(shown.at(0)?.options.actions?.at(0)).toMatchObject({ navigate: '/inbox/reply' });
    });

    it('never leaks internal members to the platform', async () => {
      await showNotification(
        'Hi',
        { delivery: DeliveryPreference.Transient, onClick: vi.fn(), body: 'Body' },
        createContext(),
      );

      const created = FakeNotification.instances.at(-1);
      expect(created?.options).toEqual({ body: 'Body' });
    });
  });

  describe('handles', () => {
    it('closes only its own notification, even without a caller-supplied tag', async () => {
      const { registration, open } = createFakeRegistration();
      const context = createContext(registration);
      const actions = [{ action: 'a', title: 'A' }];

      const first = await showNotification('First', { actions }, context);
      await showNotification('Second', { actions }, context);

      if (first.outcome !== NotificationOutcome.Shown) {
        throw new Error(`expected the notification to be shown, got ${first.outcome}`);
      }
      await first.handle.close();

      expect(open.at(0)?.close).toHaveBeenCalled();
      expect(open.at(1)?.close).not.toHaveBeenCalled();
    });

    it('closes a transient notification through its instance', async () => {
      const result = await showNotification('Hi', {}, createContext());

      if (result.outcome !== NotificationOutcome.Shown) {
        throw new Error('expected the notification to be shown');
      }
      await result.handle.close();

      expect(FakeNotification.instances.at(-1)?.close).toHaveBeenCalled();
    });
  });

  describe('platform fallbacks', () => {
    it('falls back to the service worker when the constructor always throws', async () => {
      const { registration, shown } = createFakeRegistration();
      class AndroidNotification {
        static permission = 'granted';
        static maxActions = 2;
        constructor() {
          throw new TypeError('Illegal constructor');
        }
      }
      vi.stubGlobal('Notification', AndroidNotification);

      const result = await showNotification(
        'Ada replied',
        { body: 'See you at 3' },
        createContext(registration),
      );

      expect(result).toMatchObject({
        outcome: NotificationOutcome.Shown,
        delivery: NotificationDelivery.Persistent,
      });
      expect(shown).toHaveLength(1);
    });

    it('does not fall back when the caller demanded transient delivery', async () => {
      const { registration, shown } = createFakeRegistration();
      vi.stubGlobal(
        'Notification',
        class {
          static permission = 'granted';
          constructor() {
            throw new TypeError('Illegal constructor');
          }
        },
      );

      const result = await showNotification(
        'Ada replied',
        { delivery: DeliveryPreference.Transient },
        createContext(registration),
      );

      expect(result.outcome).toBe(NotificationOutcome.Failed);
      expect(shown).toHaveLength(0);
    });

    it('generates a tag when the caller passes an empty one', async () => {
      const { registration, shown } = createFakeRegistration();

      const result = await showNotification(
        'Ada replied',
        { tag: '', actions: [{ action: 'a', title: 'A' }] },
        createContext(registration),
      );

      if (result.outcome !== NotificationOutcome.Shown) {
        throw new Error('expected the notification to be shown');
      }
      expect(result.handle.tag).toBeTruthy();
      expect(shown.at(0)?.options.tag).toBeTruthy();
    });

    it('reports handlers that persistent delivery cannot honour', async () => {
      const { registration } = createFakeRegistration();

      const result = await showNotification(
        'Ada replied',
        { actions: [{ action: 'a', title: 'A' }], onClick: vi.fn() },
        createContext(registration),
      );

      expect(result).toMatchObject({
        outcome: NotificationOutcome.Shown,
        delivery: NotificationDelivery.Persistent,
        handlersUnsupported: true,
      });
    });
  });

  it('surfaces a constructor failure as a typed result', async () => {
    vi.stubGlobal(
      'Notification',
      class {
        static permission = 'granted';
        constructor() {
          throw new Error('boom');
        }
      },
    );

    const result = await showNotification('Hi', {}, createContext());

    expect(result).toMatchObject({ outcome: NotificationOutcome.Failed });
  });

  it('closes a notification the registry had to evict', async () => {
    const { registration, open } = createFakeRegistration();
    const context = createContext(registration);

    for (let index = 0; index < 129; index += 1) {
      await showNotification('Ping', { tag: `tag-${index}`, delivery: DeliveryPreference.Persistent }, context);
    }

    expect(open.find((notification) => notification.tag === 'tag-0')?.close).toHaveBeenCalled();
  });
});
