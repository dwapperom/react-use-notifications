import { useState } from 'react';

import { useNotificationCapabilities, useNotifications } from 'react-use-notifications';

import { ACTIONS } from '../Playground.constants';
import { Demo } from '../ui';
import { describeActionsResult } from './describeActionsResult';

const toActionsCode = (count: number): string => {
  const lines = ACTIONS.slice(0, count)
    .map((action) => `    { action: '${action.action}', title: '${action.title}' },`)
    .join('\n');

  return `import { useNotifications } from 'react-use-notifications';

const registration = await navigator.serviceWorker.ready;
const { show } = useNotifications({ registration });

const result = await show('Ada replied', {
  actions: [
${lines}
  ],
});

// Anything the browser refused to draw.
console.log(result.clampedActions);`;
};

const ACTION_OPTIONS = [1, 2, 3].map((count) => ({
  count,
  label: `${count} action${count === 1 ? '' : 's'}`,
  code: toActionsCode(count),
}));

export const ActionsSection = () => {
  const { show } = useNotifications();
  const { maxActions } = useNotificationCapabilities();
  const [summary, setSummary] = useState<string | null>(null);

  const drawnHere = `This browser draws ${maxActions}.`;

  return (
    <Demo
      title="Actions"
      description={(
        <>
          Action buttons only exist on service worker notifications.
          {' '}
          {drawnHere}
          {' '}
          Ask for more and the extras come back in clampedActions rather than vanishing, so you
          can put them somewhere else.
        </>
      )}
      result={summary}
      options={ACTION_OPTIONS.map(({ count, label, code }) => ({
        label,
        code,
        run: () => {
          void show('Ada replied', { actions: ACTIONS.slice(0, count) }).then((result) => {
            setSummary(describeActionsResult(count, result));
          });
        },
      }))}
    />
  );
};
