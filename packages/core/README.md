<img src="https://raw.githubusercontent.com/dwapperom/react-use-notifications/main/icon.png" width="52" alt="" />

# react-use-notifications

[![npm](https://img.shields.io/npm/v/react-use-notifications)](https://www.npmjs.com/package/react-use-notifications) [![downloads](https://img.shields.io/npm/dm/react-use-notifications)](https://www.npmjs.com/package/react-use-notifications) [![size](https://img.shields.io/bundlephobia/minzip/react-use-notifications)](https://bundlephobia.com/package/react-use-notifications) [![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/dwapperom/react-use-notifications/blob/main/LICENSE) [![React](https://img.shields.io/badge/React-18%20%7C%2019-149eca?logo=react&logoColor=white)](https://react.dev)

Browser notifications are split in two. The constructor is simple but cannot draw buttons or catch
clicks, and the service worker half can do both at the cost of half a day of plumbing. Get it wrong
and nothing crashes: your button never appears and your click goes nowhere.

`react-use-notifications` is one `show()` that picks the right half, tells you what the browser
actually did with it, and brings the click back as a React event.

No dependencies. [Try the playground](https://dennis.is-a.dev/react-use-notifications/).

```sh
npm i react-use-notifications
```

```tsx
import { useNotifications, NotificationPermissionState } from 'react-use-notifications';

const Bell = () => {
  const { show, permission, request } = useNotifications();

  if (permission !== NotificationPermissionState.Granted) {
    return <button onClick={request}>Enable</button>;
  }

  return <button onClick={() => show('Ada replied', { body: 'See you at 3' })}>Notify</button>;
};
```

## show()

It always resolves, so you do not need a try/catch. Look at `outcome`:

```ts
import { NotificationOutcome } from 'react-use-notifications';

const result = await show('Ada replied', { body: 'See you at 3', tag: 'thread-42' });

if (result.outcome === NotificationOutcome.Shown) {
  await result.handle.close();
} else {
  console.warn(result.outcome, result.reason);
}
```

TypeScript narrows on `outcome`, so `handle` only exists once you have checked for `Shown`.

|                                            |                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `NotificationOutcome.Shown`                | Delivered. Carries `handle`, `delivery`, `clampedActions`, `handlersUnsupported` |
| `NotificationOutcome.PermissionDenied`     | The user has blocked notifications                                               |
| `NotificationOutcome.PermissionDismissed`  | The prompt was closed without an answer                                          |
| `NotificationOutcome.Unsupported`          | No Notifications API in this browser                                             |
| `NotificationOutcome.InsecureContext`      | Not HTTPS and not localhost                                                      |
| `NotificationOutcome.RegistrationRequired` | Persistent delivery asked for without a service worker                           |
| `NotificationOutcome.Failed`               | The platform refused it. See `error`                                             |

The constants are const objects, not TypeScript enums, so the constant and the raw string both
type check.

`show()` asks for permission if nobody has been asked yet. Browsers only allow that during a
click, so call `request()` yourself when the notification comes from a socket or a timer.

## Actions

Action buttons only exist on service worker notifications. Register the handlers in your worker:

```ts
// sw.js
import { initNotificationHandlers } from 'react-use-notifications/sw';

initNotificationHandlers({ defaultUrl: '/inbox' });
```

Then hand the hook your registration:

```tsx
const registration = await navigator.serviceWorker.ready;
const { show } = useNotifications({ registration });

await show('Ada replied', {
  data: { threadId: 42 },
  actions: [
    { action: 'reply', title: 'Reply', navigate: '/threads/42' },
    { action: 'archive', title: 'Archive' },
  ],
});
```

On click the worker takes the first URL it finds: the clicked button's `navigate`, then the
notification's, then `data.url`, then `defaultUrl`. A tab already on that URL is focused rather
than reopened. With none of the first three set it only focuses.

The click also comes back to your app:

```tsx
useNotificationClick(({ action, data }) => {
  if (action === 'archive') archiveThread(data.threadId);
});
```

Read `maxActions` at runtime with `useNotificationCapabilities()`. Anything past it comes back in
`result.clampedActions` rather than being dropped. `result.actionsUnsupported` means they were
stripped because the call went out through the constructor.

## Hooks

- `useNotifications(options?)` gives you `show`, `close`, `closeAll` and everything below
- `useNotificationPermission()` gives `permission`, `isGranted`, `isDenied`, `isSupported`, `request`
- `useNotificationCapabilities()` tells you what this browser can do, including `maxActions`
- `useNotificationEvents(fn)` and `useNotificationClick(fn)` catch messages from the service worker

Wrap the tree in `<NotificationProvider>` to share one registration and a set of default options.

## Delivery

`auto` is the default: persistent when the notification carries actions the platform will draw or
a navigate target and a registration is available, transient otherwise.

`transient` gives you an instance and therefore `onClick`/`onClose`. `persistent` gives you
buttons and fails with `RegistrationRequired` when there is no worker. `auto` never fails for that
reason.

```tsx
await show('Ada replied', { delivery: DeliveryPreference.Transient, onClick: focusThread });
```

## Recipes

Three patterns run live in the [playground](https://dennis.is-a.dev/react-use-notifications/),
each with its source beside it:

- **Chat client** — one call site for a plain message and for a mention, and what `auto` does with each
- **Upload progress** — permission asked inside the click, notifications arriving minutes later under one tag
- **Your own router** — no `navigate` anywhere; the click comes back and your router decides

`data` arrives as `unknown`; narrow it to whatever you put in. Mount `useNotificationClick` near
the root, since the click can land while the user is on any route.

## Things worth knowing

Notifications need HTTPS; localhost counts. On iOS they work only once the site is added to the
Home Screen. In a normal Safari tab there is no API and `show()` returns `Unsupported`.

Ask `useNotificationCapabilities()` at runtime and branch on the answer:

```tsx
const { actions, navigate, maxActions } = useNotificationCapabilities();
```

If your tests swap out the global `Notification`, call `resetNotificationCapabilitiesCache()` from
`react-use-notifications/testing` between them. Capabilities are read once and cached.

## License

MIT
