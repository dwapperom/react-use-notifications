import {
  NotificationMessageType,
  useNotificationEvents,
  useNotifications,
} from 'react-use-notifications';

import { ACTIONS, BASE } from '../Playground.constants';
import { Demo } from '../ui';
import { useRecentLines } from '../useRecentLines';

const TARGET_CODE = `import { useNotifications } from 'react-use-notifications';

const registration = await navigator.serviceWorker.ready;
const { show } = useNotifications({ registration });

await show('Open the inbox', {
  navigate: '/inbox',
});`;

const NO_TARGET_CODE = `import { useNotifications } from 'react-use-notifications';

const { show } = useNotifications({ registration });

// Focuses the tab, leaves the page alone.
await show('No target');`;

const PER_ACTION_CODE = `import { useNotificationClick } from 'react-use-notifications';

await show('Ada replied', {
  actions: [
    { action: 'reply', title: 'Reply', navigate: '/threads/42' },
  ],
});

// Or handle it in React instead of navigating.
useNotificationClick(({ action, data }) => {
  if (action === 'reply') openThread(data);
});`;

const LOG_LENGTH = 4;

export const NavigateSection = () => {
  const { show } = useNotifications();
  const { lines, append } = useRecentLines(LOG_LENGTH);

  useNotificationEvents((message) => {
    const target = message.type === NotificationMessageType.Click && message.navigate
      ? ` -> ${message.navigate}`
      : '';

    append(`${`${message.type} ${message.tag ?? ''}`.trim()}${target}`);
  });

  return (
    <Demo
      title="Navigate"
      description={(
        <>
          Click the notification itself, not this button. The worker resolves the target and posts
          it back, which is what lands below. A tab already on that page is focused rather than
          reloaded, and only the origin and path count, so a target differing in the query string
          focuses instead of navigating.
        </>
      )}
      result={
        lines.length > 0 ? lines.join('\n') : 'Click a notification and its event lands here.'
      }
      options={[
        {
          label: 'With a target',
          code: TARGET_CODE,
          run: () => void show('Open the inbox', { navigate: `${BASE}?from=notification` }),
        },
        {
          label: 'Without one',
          code: NO_TARGET_CODE,
          run: () => void show('No target', { body: 'Focuses, does not navigate' }),
        },
        {
          label: 'Per action',
          code: PER_ACTION_CODE,
          run: () => void show('Ada replied', { actions: ACTIONS }),
        },
      ]}
    />
  );
};
