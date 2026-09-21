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

`NotificationOutcome`, `NotificationPermissionState`, `NotificationDelivery` and `DeliveryPreference` are
const objects rather than TypeScript enums, so the constant and the raw string are the same value
and either one type checks. That matters because `Notification.permission` hands you a raw
`'granted'`, and an enum member cannot be compared to one without a cast.

If nobody has been asked for permission yet, `show()` asks. Browsers only allow that during a
click, so when the notification comes from a socket or a timer, call `request()` yourself first.

## Actions

Actions are the extra buttons the operating system draws on the notification itself, like Reply and
Archive next to the message.

They only work on notifications created by a service worker. Passing `actions` to
`new Notification()` throws a TypeError, so there are two pieces to set up.

First, the worker. This registers the click and close handlers:

```ts
// sw.js
import { initNotificationHandlers } from 'react-use-notifications/sw';

initNotificationHandlers({ defaultUrl: '/inbox' });
```

Then give the hook your registration. Once it has one, `show()` routes notifications through the
worker instead of the constructor, and that is what makes the buttons appear:

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

When the user clicks the notification or one of its buttons, the worker looks for a URL to open.
It takes the first one it finds:

1. `navigate` on the button that was clicked
2. `navigate` on the notification
3. `data.url`
4. the `defaultUrl` you gave `initNotificationHandlers`

If a tab is already showing that URL, it gets focused instead of opening a second one. If none of
the first three are set, the worker only focuses an existing tab and leaves the page it is on
alone, so a stray click never throws away a half-filled form.

The click is also sent back to your app, which is how you handle it in React instead of navigating:

```tsx
useNotificationClick(({ action, data }) => {
  if (action === 'archive') archiveThread(data.threadId);
});
```

### Two buttons, and why it is always two

`Notification.maxActions` is a constant the browser picks, not a number this library caps. Every
Chromium browser hardcodes it to **2**: Chrome, Edge, Opera, Arc, Dia, all of them, since Chrome
48. Firefox implemented actions in 152. Safari has never supported them and reports nothing, which
this normalises to 0.

On macOS the buttons are not drawn on the banner at all. The system puts them behind a **More**
dropdown that appears when you hover it, which is [documented Chrome
behaviour](https://developer.chrome.com/blog/native-mac-os-notifications) since it started handing
notifications to the native notification centre. Nothing you pass changes that, and
`registration.getNotifications()` will confirm the buttons are there.

So design for two. A third button is a bonus on some future browser, never something to rely on.
Read the number at runtime rather than baking it into your layout:

```tsx
const { maxActions } = useNotificationCapabilities();
```

Anything past the limit is never drawn, so `show()` hands it back instead of dropping it:

```ts
const result = await show('Ada replied', { actions: [reply, archive, snooze] });

if (result.outcome === NotificationOutcome.Shown && result.clampedActions.length > 0) {
  // Snooze did not fit. Put it in your own UI, or drop it deliberately.
}
```

`result.actionsUnsupported` is the other half of the story: it means the actions were stripped
because the notification went out through `new Notification()`, with no registration to make it
persistent. Different problem, different fix.

## Hooks

- `useNotifications(options?)` gives you `show`, `close`, `closeAll` and everything below
- `useNotificationPermission()` gives `permission`, `isGranted`, `isDenied`, `isSupported`, `request`
- `useNotificationCapabilities()` tells you what this browser can do, including `maxActions`
- `useNotificationEvents(fn)` and `useNotificationClick(fn)` catch messages from the service worker

Wrap the tree in `<NotificationProvider>` to share one registration and a set of default options.

## Recipes

### A chat client, and what `auto` is for

Delivery defaults to `auto`, which means persistent when the notification has actions and a
registration is available, and transient otherwise. That is what lets one call site cover both
cases: a plain message needs no buttons, a mention does.

`currentUserId` and `onBlocked` are yours, and so is `useSocketEvent`. Everything inside `show()`
is the library.

```tsx
interface ChatNotifierProps {
  currentUserId: string;
  onBlocked: () => void;
}

const ChatNotifier = ({ currentUserId, onBlocked }: ChatNotifierProps) => {
  const { show } = useNotifications();

  useSocketEvent('message', async (message) => {
    const isMention = message.mentions.includes(currentUserId);

    const result = await show(message.author, {
      body: message.preview,
      // One notification per thread. A second message replaces the first instead of stacking.
      tag: `thread-${message.threadId}`,
      renotify: isMention,
      data: { threadId: message.threadId },
      actions: isMention
        ? [
            { action: 'reply', title: 'Reply' },
            { action: 'mute', title: 'Mute thread' },
          ]
        : undefined,
    });

    if (result.outcome === NotificationOutcome.PermissionDenied) {
      onBlocked();
    }
  });

  return null;
};
```

With no registration anywhere in the tree this stays transient throughout, and the mention silently
loses its buttons, and `result.actionsUnsupported` tells you so. Add a provider and the mention
upgrades itself, without touching the code above:

```tsx
// Hoisted, not inline: a fresh object every render gives every hook below a new context value.
const DEFAULTS = { icon: '/icons/chat-192.png' };

const App = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();

  useEffect(() => {
    navigator.serviceWorker.register('/sw.js').then(setRegistration);
  }, []);

  return (
    <NotificationProvider registration={registration} defaultOptions={DEFAULTS}>
      <ChatNotifier />
    </NotificationProvider>
  );
};
```

The provider takes `undefined` happily, so nothing has to wait for the worker to be ready.

If you want to be explicit rather than let `auto` decide, pass `delivery`:

```ts
await show('Ada replied', { delivery: DeliveryPreference.Transient, onClick: focusThread });
```

`transient` guarantees you an instance and therefore `onClick`/`onClose`. `persistent` guarantees
buttons but fails with `RegistrationRequired` when there is no worker. `auto` never fails for that
reason, which is why it is the default.

### An upload that reports its own progress

Permission has to be asked during a click, but the notification comes minutes later from somewhere
else entirely. Split the two:

```tsx
const UploadButton = ({ file }: { file: File }) => {
  const { request, isGranted } = useNotificationPermission();
  const { show, close } = useNotifications({
    // Every notification here replaces the last one, so the tray never fills up.
    tag: 'upload-progress',
    // The user is watching the page again, so the tray copy is noise.
    closeOnUnmount: true,
  });

  const start = async () => {
    // Inside the click, before any await that could lose the user gesture.
    if (!isGranted) await request();

    const upload = uploadFile(file);
    upload.on('done', () => show('Upload finished', { body: file.name, data: { url: '/files' } }));
    upload.on('error', (error) =>
      show('Upload failed', { body: error.message, requireInteraction: true })
    );
  };

  return <button onClick={start}>Upload</button>;
};
```

`requireInteraction` keeps the failure on screen until it is dismissed, while the success is
allowed to time out on its own.

### Handling the click in React instead of navigating

The worker will happily open a URL, but a single-page app usually wants its own router. Skip
`navigate` and let the click come back to you:

```tsx
const NotificationRoutes = () => {
  const router = useRouter();

  useNotificationClick(({ action, data }) => {
    const { threadId } = data as { threadId: number };

    if (action === 'mute') {
      muteThread(threadId);
      return;
    }
    router.push(`/threads/${threadId}`);
  });

  return null;
};
```

`data` arrives as `unknown` because it made a round trip through structured clone; narrow it to
whatever you put in. Mount this near the root: the click can land while the user is on any route,
and a listener that only exists on `/threads` is not there to hear it.

## Things worth knowing

Notifications need HTTPS, though localhost counts. On iOS nothing shows until the site has been
added to the home screen.

Support for the rest moves, so this README does not carry a table that would go stale. Ask
`useNotificationCapabilities()` at runtime and branch on the answer:

```tsx
const { actions, navigate, maxActions } = useNotificationCapabilities();
```

If your tests swap out the global `Notification`, call `resetNotificationCapabilitiesCache()` from
`react-use-notifications/testing` between them. Capabilities are read once and cached.

## License

MIT
