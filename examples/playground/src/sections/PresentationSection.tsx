import { NotificationPresentation, ToastVariant, useToaster } from 'react-use-notifications-ui';

import { Demo } from '../ui';
import { useLastResult } from '../useLastResult';

const IN_APP_CODE = `import {
  useToaster,
  NotificationPresentation,
  ToastVariant,
} from 'react-use-notifications-ui';
import { NotificationToaster } from 'react-use-notifications-ui/tailwind';

const { show, toasts, dismiss } = useToaster({
  presentation: NotificationPresentation.InApp,
});

await show('Deploy finished', {
  variant: ToastVariant.Success,
});

<NotificationToaster toasts={toasts} onDismiss={dismiss} />`;

const AUTO_CODE = `import {
  useToaster,
  NotificationPresentation,
} from 'react-use-notifications-ui';

// In the page while focused, the OS once it is not.
const { show } = useToaster({
  presentation: NotificationPresentation.Auto,
});`;

const NATIVE_CODE = `import {
  useToaster,
  NotificationPresentation,
} from 'react-use-notifications-ui';

// Falls back in-app only if the OS refuses.
const { show } = useToaster({
  presentation: NotificationPresentation.Native,
});`;

export const PresentationSection = () => {
  const toaster = useToaster();
  const result = useLastResult();

  return (
    <Demo
      title="Where it is drawn"
      description={(
        <>
          in-app never touches the Notifications API, so it prompts nobody and looks the same in
          every browser.
        </>
      )}
      result={result.text}
      options={[
        {
          label: 'in-app',
          code: IN_APP_CODE,
          run: result.capture(() => {
            return toaster.show('Deploy finished', {
              body: 'Drawn in the page',
              presentation: NotificationPresentation.InApp,
              variant: ToastVariant.Success,
            });
          }),
        },
        {
          label: 'auto',
          code: AUTO_CODE,
          run: result.capture(() => {
            return toaster.show('Auto', { presentation: NotificationPresentation.Auto });
          }),
        },
        {
          label: 'native',
          code: NATIVE_CODE,
          run: result.capture(() => {
            return toaster.show('Native first', {
              presentation: NotificationPresentation.Native,
              variant: ToastVariant.Warning,
            });
          }),
        },
      ]}
    />
  );
};
