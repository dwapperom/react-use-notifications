import { useState } from 'react';

import { useNotificationClick, useNotifications } from 'react-use-notifications';

import { RunButton } from '../ui';

import type { RecipeProps } from './Recipe.types';

const THREAD_ID = 42;

export const RouterRecipe = ({ log }: RecipeProps) => {
  const { show } = useNotifications();
  const [route, setRoute] = useState('/inbox');

  useNotificationClick(({ action, data }) => {
    const payload = data as { threadId?: number } | undefined;
    if (payload?.threadId === undefined) {
      return;
    }

    if (action === 'mute') {
      log(`Muted thread ${payload.threadId}, stayed on ${route}`);

      return;
    }

    setRoute(`/threads/${payload.threadId}`);
    log(`Click came back as data, router handled it. action: ${action || '(body)'}`);
  });

  return (
    <>
      <RunButton
        onClick={() =>
          void show('Grace replied', {
            body: 'Click the notification, not this button',
            data: { threadId: THREAD_ID },
            actions: [
              { action: 'open', title: 'Open' },
              { action: 'mute', title: 'Mute thread' },
            ],
          })}
      >
        Send one
      </RunButton>

      <RunButton onClick={() => setRoute('/inbox')}>Reset route</RunButton>

      <div className="w-full rounded-lg border border-neutral-200 px-4 py-3 font-mono text-[13px] dark:border-neutral-800">
        <span className="text-neutral-400">route</span>
        {' '}
        <span className="text-neutral-800 dark:text-neutral-200">{route}</span>
      </div>
    </>
  );
};

export const ROUTER_CODE = `import { useNotificationClick } from 'react-use-notifications';

const NotificationRoutes = () => {
  const router = useRouter();

  useNotificationClick(({ action, data }) => {
    // Unknown, because it made a round trip through
    // structured clone. Narrow it to what you put in.
    const { threadId } = data as { threadId: number };

    if (action === 'mute') {
      muteThread(threadId);
      return;
    }

    router.push(\`/threads/\${threadId}\`);
  });

  // Mount this near the root. The click can land while
  // the user is on any route, and a listener that only
  // exists on /threads is not there to hear it.
  return null;
};`;
