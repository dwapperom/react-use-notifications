<img src="https://raw.githubusercontent.com/dwapperom/react-use-notifications/main/icon.png" width="52" alt="" />

# react-use-notifications-ui

[![npm](https://img.shields.io/npm/v/react-use-notifications-ui)](https://www.npmjs.com/package/react-use-notifications-ui) [![downloads](https://img.shields.io/npm/dm/react-use-notifications-ui)](https://www.npmjs.com/package/react-use-notifications-ui) [![size](https://img.shields.io/bundlephobia/minzip/react-use-notifications-ui)](https://bundlephobia.com/package/react-use-notifications-ui) [![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/dwapperom/react-use-notifications/blob/main/LICENSE)

Components for [`react-use-notifications`](https://www.npmjs.com/package/react-use-notifications).
Unstyled by default, with a Tailwind layer built on shadcn/ui's design tokens, so your theme
reaches them without any configuration.
[Try the playground](https://dennis.is-a.dev/react-use-notifications/).

```sh
npm i react-use-notifications-ui react-use-notifications
```

```tsx
import { ToasterProvider, useToaster, useToasts } from 'react-use-notifications-ui';
import { NotificationToaster, RequestPermissionButton } from 'react-use-notifications-ui/tailwind';

const App = () => (
  <ToasterProvider>
    <Notifier />
    <Toasts />
  </ToasterProvider>
);

const Notifier = () => {
  const { show } = useToaster();

  return (
    <>
      <RequestPermissionButton />
      <button onClick={() => show('Saved', { body: 'Your changes are live' })}>Notify</button>
    </>
  );
};

const Toasts = () => {
  const toasts = useToasts();
  const { dismiss } = useToaster();

  return <NotificationToaster toasts={toasts} onDismiss={dismiss} position="bottom-right" />;
};
```

`useToaster()` fires toasts; `useToasts()` reads the list. They are separate because the list
changes on every toast and every six-second expiry, and a component that only fires them has no
business re-rendering for that. `<ToasterProvider>` is what holds the list, so the in-app path
needs one.

## Where the notification is drawn

A notification the operating system refuses is still something the user needs to read. `useToaster()`
sends a real one when that makes sense, and draws it in the page when it does not. Pick with
`presentation`:

|                  |                                                                                  |
| ---------------- | -------------------------------------------------------------------------------- |
| `auto` (default) | In the page while the tab is focused, operating system once it is not            |
| `in-app`         | Always in the page. Never touches the Notifications API, so nobody gets prompted |
| `native`         | Always try the operating system, fall back in-app only when it says no           |
| `none`           | Nothing is shown. Only useful with `inbox`, where the record is the point        |

`in-app` is the interesting one. Because the browser API never gets called, there is no permission
prompt, no `denied` state to dig yourself out of, and it looks the same in every browser.

`auto` is the one to think about: it only reaches the operating system while the tab is unfocused,
and if permission is still `default` at that moment it will prompt from there. Chrome allows that
without a user gesture, so a background socket event can raise a prompt nobody asked for, and a
dismissal comes back as `PermissionDismissed` rather than an in-app toast. Ask during a click
instead, with `RequestPermissionButton` or `usePermissionRequest()`, and `auto` has its answer
before it needs one.

```tsx
const { show } = useToaster({ presentation: NotificationPresentation.InApp });

await show('Deploy failed', { variant: ToastVariant.Danger });
```

Both `presentation` and `variant` also work per call, so one hook can mix them:

```tsx
await show('Deploy failed', {
  presentation: NotificationPresentation.InApp,
  variant: ToastVariant.Danger,
});
await show('Build queued', { presentation: NotificationPresentation.Native });
```

## One queue for the whole app

The provider holds the list, so a button three levels down can raise a toast that the toaster at
the root renders. Wrap the app once:

```tsx
import { ToasterProvider, useToaster, useToasts } from 'react-use-notifications-ui';
import { NotificationToaster } from 'react-use-notifications-ui/tailwind';

const Toasts = () => {
  const toasts = useToasts();
  const { dismiss } = useToaster();
  return <NotificationToaster toasts={toasts} onDismiss={dismiss} position="bottom-right" />;
};

export const App = () => {
  return (
    <ToasterProvider presentation="in-app" duration={6000}>
      <Routes />
      <Toasts />
    </ToasterProvider>
  );
};
```

```tsx
// Anywhere below it.
const { show } = useToaster();
show('Saved', { variant: ToastVariant.Success });
```

A call beats the hook, the hook beats the provider, the provider beats the built-in default.
Registration and notification options such as `icon` live on core's `NotificationProvider` instead.

## A dashboard that knows where you are looking

`auto` decides per call rather than per app, and it checks focus, not visibility: a tab parked on
a second monitor is `visible` but nobody is reading it, so that one still goes to the operating
system.

```tsx
await show(failed ? `${service} failed` : `${service} is live`, {
  tag: `deploy-${id}`,
  variant: failed ? ToastVariant.Danger : ToastVariant.Success,
  // A failure is worth interrupting for even when the user is looking right at the page.
  presentation: failed ? NotificationPresentation.Native : NotificationPresentation.Auto,
});
```

The `tag` works in both directions. Natively it replaces the previous notification for that deploy
instead of stacking three, and `close(tag)` reaches the in-app toast and the operating system copy
with one call, whichever one `auto` picked.

Every `show()` tells you which way it went:

```ts
const { native, toastId } = await show('Deploying api');
// native === null means it was drawn in the page.
```

The whole recipe runs in the [playground](https://dennis.is-a.dev/react-use-notifications/) under
Recipes, with its source beside it.

## The inbox

A toast is gone in six seconds. An inbox item is a record of something that happened while you
were away: it survives a refresh and carries a read state. Recording comes on top of the normal
presentation, so the same call can raise an OS notification and keep the record.

```tsx
import { localStorageStore, InboxProvider } from 'react-use-notifications-ui';

const store = localStorageStore();

<InboxProvider store={store}>
  <App />
</InboxProvider>;
```

```tsx
const { show } = useToaster();

// Toast or OS notification as usual, and a record in the inbox.
await show('Build broke', { inbox: true });

// Only the unread count moves: no Notifications API, no permission prompt.
await show('Ada replied', {
  inbox: true,
  presentation: NotificationPresentation.None,
  navigate: '/threads/42',
});

// Always a toast, filed under a category.
await show('Deploy finished', {
  inbox: { category: 'deploy' },
  presentation: NotificationPresentation.InApp,
});
```

Reading it back:

```tsx
import { useInbox } from 'react-use-notifications-ui';
import { CounterBadge, NotificationList } from 'react-use-notifications-ui/tailwind';

const Bell = () => <CounterBadge count={useInbox().unread} />;

const Panel = () => <NotificationList onSelect={(item) => router.push(item.href)} />;
```

A click marks the item read before `onSelect` runs.

Timestamps use `Intl.RelativeTimeFormat` in the visitor's locale. Pass `formatTime` to change
that.

`localStorageStore()` is per browser and keeps 200 items. Where localStorage is blocked, in an old
Safari private window, with all cookies refused or inside a sandboxed iframe, it logs a warning
once and keeps the inbox in memory for the session. A write the browser refuses later, such as a
full quota, rejects, and the provider undoes it. For a server-backed inbox, hand the
provider your own store:

```ts
interface InboxStore {
  list: () => Promise<InboxItem[]>;
  add: (item: InboxItem) => Promise<void>;
  markRead: (id: string, readAt: number) => Promise<void>;
  markAllRead: (readAt: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  subscribe?: (onChange: () => void) => () => void;
  limit?: number;
}
```

`add` is an upsert: an item with an id the store already has replaces it but keeps its `readAt`,
and an item with a `tag` replaces whatever carried that tag before. `markRead` leaves an item that
is already read alone, so its `readAt` keeps the moment it was first read.

`markAllRead` marks whatever is still unread in the store, so it never depends on which items the
page happens to have loaded. `limit` is how many items the store keeps, newest first; the provider
holds its own state to the same number, so the list on screen never runs past what a reload would
bring back. Leave it out for no cap.

Writes reach the store one at a time, in the order they were made, so marking an item read straight
after adding it never overtakes the add. The page updates before the store answers; when a write
fails, the provider logs it and undoes that one change, so the screen falls back to what was
actually saved, even when the store cannot be reached to read it back. None of the actions reject, which is what lets `NotificationList` fire them from a
click without a handler.

`subscribe` is optional and exists for server push and cross-tab sync; `localStorageStore` uses it
for the `storage` event. Retention is the store's call, not the library's.

`list()` runs on mount and again after every `subscribe` call. A write that lands while `list()` is
still in flight makes the provider read again once that write has reached the store, so a
notification arriving during the first load does not cost you the rest of the inbox. When `list()`
rejects, `useInbox().loadFailed` turns true and the items stay as they were, so an outage does not
pass for an empty inbox.

When the page already has the items, from a server render or a route loader, pass them in and the
first render shows them instead of an empty inbox:

```tsx
<InboxProvider store={store} initialItems={loaderData.inbox}>
```

A notification that starts on the server already has an id there. Pass it along, and showing it
again updates that item rather than adding a second one; a read item stays read:

```tsx
socket.on('notification', (message) => {
  void show(message.title, {
    body: message.body,
    inbox: { id: message.id, receivedAt: message.createdAt },
  });
});
```

`show()` never rejects over the inbox. It records and presents side by side, so a slow store does not
hold the toast back. A store that refuses the item or a missing `<InboxProvider>` is logged and comes
back as `itemId: null` while the toast or OS notification still goes out; `useInbox().add()` answers
`null` the same way, so an id always points at an item that was saved. Calling `useInbox().add()` outside a provider throws
instead: there the inbox is the whole point of the call.

## Two ways in

**As a shadcn registry.** The component source lands in your own repo, yours to edit:

```sh
npx shadcn@latest add https://dennis.is-a.dev/react-use-notifications/r/notification-toaster.json
```

Also available: `request-permission-button`, `notification-permission-badge`,
`notification-action-list`, `counter-badge`. Each one still installs this package for the hooks and
the headless components underneath.

**As a package.** `react-use-notifications-ui` ships no CSS at all.
`react-use-notifications-ui/tailwind` is the same components with classes on them. Tailwind skips
`node_modules`, so point it at the package once:

```css
@import 'tailwindcss';
@source '../node_modules/react-use-notifications-ui/dist';
```

## Theming

The Tailwind layer is written against shadcn/ui's tokens: `--popover`, `--primary`, `--secondary`,
`--accent`, `--muted`, `--destructive`, `--ring`, `--background`, `--foreground`. Change your theme
and these follow, in both light and dark.

Two exceptions, on purpose. `success` and `warning` use literal emerald and amber, because shadcn
defines no token for either and inventing `--success` would render them unstyled in every app that
has never heard of it. `danger` maps onto the real `--destructive`.

If you are not on shadcn, define those variables yourself or skip the Tailwind entry and style the
headless components through the data attributes below.

## Components

- `NotificationPermissionGate` picks a branch per permission state instead of you writing the chain
- `RequestPermissionButton` asks from inside the click, which is the only thing Safari accepts
- `NotificationPermissionBadge` shows where you stand
- `NotificationActionList` draws what the OS will really render and names what it had to drop
- `NotificationToaster` is the in-app one, with a polite live region and dark mode
- `CounterBadge` is the unread count, capped at `max` and ringed so it survives sitting on an icon

## Styling

State comes out as data attributes, which is how the Tailwind layer is built too. Nothing is
hidden from you, and these will not change without a major version.

| Attribute         | On                    | Values                                                       |
| ----------------- | --------------------- | ------------------------------------------------------------ |
| `data-permission` | badge, request button | `default`, `granted`, `denied`; the badge adds `unsupported` |
| `data-requesting` | request button        | set while the prompt is open                                 |
| `data-variant`    | each toast            | `default`, `success`, `warning`, `danger`                    |
| `data-reason`     | each toast            | `document-visible`, `native-unavailable`, `requested`        |
| `data-clamped`    | action list           | set when actions were hidden                                 |
| `data-empty`      | toast region          | set when there is nothing to show                            |

```css
[data-permission='denied'] {
  color: crimson;
}

[data-reason='native-unavailable']::before {
  content: 'Notifications are off: ';
}
```

## Bring your own toaster

Radix is never imported here. `useToasts()` hands back plain state, so feed it to Radix, Sonner or
your own design system and skip `NotificationToaster` entirely.

## License

MIT
