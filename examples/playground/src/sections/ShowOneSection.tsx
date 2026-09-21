import { useRef } from 'react';

import { useNotifications } from 'react-use-notifications';

import { BASE } from '../Playground.constants';
import { Demo } from '../ui';
import { useLastResult } from '../useLastResult';

const PLAIN_CODE = `import { useNotifications } from 'react-use-notifications';

const { show } = useNotifications();

await show('Ada replied', {
  body: 'See you at 3',
});`;

const TAG_CODE = `import { useNotifications } from 'react-use-notifications';

const { show } = useNotifications();

// Press twice. The second replaces the first
// rather than stacking beside it.
await show(\`Ada sent \${count} messages\`, {
  tag: 'thread-42',
});`;

const ICON_CODE = `import { useNotifications } from 'react-use-notifications';

const { show } = useNotifications();

await show('Ada replied', {
  body: 'See you at 3',
  icon: '/icon.png',
});`;

const toTagMessage = (press: number) => {
  return {
    title: `Ada sent ${press} message${press === 1 ? '' : 's'}`,
    body: press === 1 ? 'Press again to replace this one' : `Replaced version ${press - 1}`,
  };
};

export const ShowOneSection = () => {
  const { show } = useNotifications();
  const result = useLastResult();
  const tagPressRef = useRef(0);

  return (
    <Demo
      title="Show one"
      description={(
        <>
          Without actions this goes through the Notification constructor. show() always resolves,
          so you read the outcome instead of catching.
        </>
      )}
      result={result.text}
      options={[
        {
          label: 'Plain',
          code: PLAIN_CODE,
          run: result.capture(() => show('Ada replied', { body: 'See you at 3' })),
        },
        {
          label: 'With a tag',
          code: TAG_CODE,
          run: result.capture(() => {
            tagPressRef.current += 1;
            const { title, body } = toTagMessage(tagPressRef.current);

            return show(title, { body, tag: 'thread-42' });
          }),
        },
        {
          label: 'With an icon',
          code: ICON_CODE,
          run: result.capture(() => {
            return show('Ada replied', { body: 'See you at 3', icon: `${BASE}icon.png` });
          }),
        },
      ]}
    />
  );
};
