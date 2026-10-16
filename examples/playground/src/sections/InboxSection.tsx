import { InboxApp, useFakeServer } from '../inbox';
import { Demo } from '../ui';

import type { ToasterShowResult } from 'react-use-notifications-ui';

const RECORD_CODE = `import {
  NotificationPresentation,
  useToaster,
} from 'react-use-notifications-ui';

const { show } = useToaster();

// A toast while the tab is focused, an OS notification
// while it is not, and a record in the inbox either way.
await show('Ada replied', {
  body: 'See you at 3',
  navigate: '/threads/42',
  inbox: true,
});

// Only the badge moves: no toast, no permission prompt.
await show('Build broke', {
  inbox: true,
  presentation: NotificationPresentation.None,
});`;

const SERVER_CODE = `const { show } = useToaster();

socket.on('notification', (message) => {
  void show(message.title, {
    body: message.body,
    navigate: message.href,
    // The server id makes a repeat an update, not a
    // second item, and a read item stays read.
    inbox: {
      id: message.id,
      receivedAt: message.createdAt,
      category: message.category,
    },
  });
});

// Server-rendered or loader data: no empty first render.
<InboxProvider store={store} initialItems={loaderData.inbox}>`;

const BELL_CODE = `import { useInbox } from 'react-use-notifications-ui';
import {
  CounterBadge,
  NotificationList,
} from 'react-use-notifications-ui/tailwind';

const Bell = () => {
  const { unread } = useInbox();

  return <CounterBadge count={unread} />;
};

const Panel = () => {
  const { markAllRead, loadFailed } = useInbox();

  // A click marks the row read, then hands it over.
  return (
    <NotificationList
      onSelect={(item) => router.push(item.href)}
    />
  );
};`;

const STORE_CODE = `import type { InboxStore } from 'react-use-notifications-ui';

const store: InboxStore = {
  list: () => api.get('/inbox'),
  add: (item) => api.put(\`/inbox/\${item.id}\`, item),
  markRead: (id, readAt) =>
    api.patch(\`/inbox/\${id}\`, { readAt }),
  markAllRead: (readAt) =>
    api.post('/inbox/read', { readAt }),
  remove: (id) => api.delete(\`/inbox/\${id}\`),
  clear: () => api.delete('/inbox'),
  subscribe: (onChange) => {
    const source = new EventSource('/inbox/stream');
    source.addEventListener('message', onChange);

    return () => {
      source.close();
    };
  },
};`;

const summarize = (result: ToasterShowResult): string => {
  return JSON.stringify({
    native: result.native?.outcome ?? null,
    toastId: result.toastId,
    itemId: result.itemId,
  }, null, 2);
};

export const InboxSection = () => {
  const server = useFakeServer();

  return (
    <Demo
      title="Inbox"
      description={(
        <>
          What happened while you were away, kept after the toast is gone. The window is your app;
          the strip at its bottom plays your server. Open the page in a second tab and both stay in
          step.
        </>
      )}
      options={[
        { label: 'Recording', code: RECORD_CODE },
        { label: 'From your server', code: SERVER_CODE },
        { label: 'Bell and panel', code: BELL_CODE },
        { label: 'Your own store', code: STORE_CODE },
      ]}
      result={server.lastResult && summarize(server.lastResult)}
    >
      <InboxApp server={server} />
    </Demo>
  );
};
