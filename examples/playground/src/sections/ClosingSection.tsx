import { NotificationOutcome, useNotifications } from 'react-use-notifications';

import { Demo } from '../ui';
import { useLastResult } from '../useLastResult';

const HANDLE_CODE = `import {
  useNotifications,
  NotificationOutcome,
} from 'react-use-notifications';

const { show } = useNotifications();
const result = await show('Uploading');

if (result.outcome === NotificationOutcome.Shown) {
  await result.handle.close();
}`;

const TAG_CODE = `import { useNotifications } from 'react-use-notifications';

const { show, close } = useNotifications();

await show('Ada replied', { tag: 'thread-42' });
await close('thread-42');`;

const ALL_CODE = `import { useNotifications } from 'react-use-notifications';

const { closeAll } = useNotifications();

// Only what this hook opened, never anything else.
await closeAll();`;

export const ClosingSection = () => {
  const { show, close, closeAll } = useNotifications();
  const result = useLastResult();

  return (
    <Demo
      title="Closing"
      description={(
        <>
          By handle, by tag, or everything this hook opened. Never anything it did not, so another
          component&apos;s notifications survive.
        </>
      )}
      result={result.text}
      options={[
        {
          label: 'Its own handle',
          code: HANDLE_CODE,
          run: result.capture(async () => {
            const shown = await show('Closing in 2s');
            if (shown.outcome !== NotificationOutcome.Shown) {
              return shown;
            }
            setTimeout(() => void shown.handle.close(), 2000);

            return {
              ...shown,
              note: 'close() scheduled',
            };
          }),
        },
        {
          label: 'By tag',
          code: TAG_CODE,
          run: result.capture(async () => {
            await close('thread-42');

            return {
              closed: 'thread-42',
            };
          }),
        },
        {
          label: 'Everything',
          code: ALL_CODE,
          run: result.capture(async () => {
            await closeAll();

            return {
              closed: 'all of this hook',
            };
          }),
        },
      ]}
    />
  );
};
