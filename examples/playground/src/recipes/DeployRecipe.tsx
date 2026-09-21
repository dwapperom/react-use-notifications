import { NotificationPresentation, ToastVariant, useToaster } from 'react-use-notifications-ui';

import { RunButton } from '../ui';

import type { RecipeProps } from './Recipe.types';

const TAG = 'deploy-8f21';
const SERVICE = 'api-gateway';

export const DeployRecipe = ({ log }: RecipeProps) => {
  const { show, close } = useToaster();

  const run = async (failed: boolean) => {
    const { native, toastId } = await show(failed ? 'Deploy failed' : 'Deploy is live', {
      tag: TAG,
      body: failed ? 'Connection reset by peer' : `${SERVICE} finished in 41s`,
      variant: failed ? ToastVariant.Danger : ToastVariant.Success,
      presentation: failed ? NotificationPresentation.Native : NotificationPresentation.Auto,
    });

    if (native === null) {
      log(`Drawn in the page as toast ${toastId}`);

      return;
    }
    log(`Handed to the operating system: ${native.outcome}`);
  };

  return (
    <>
      <RunButton onClick={() => void run(false)}>Deploy succeeds</RunButton>
      <RunButton onClick={() => void run(true)}>Deploy fails</RunButton>
      <RunButton
        onClick={() =>
          void close(TAG).then(() => log(`close('${TAG}') cleared both the toast and the OS copy`))}
      >
        Cancel it
      </RunButton>
    </>
  );
};

export const DEPLOY_CODE = `import {
  NotificationPresentation,
  ToastVariant,
  useToaster,
} from 'react-use-notifications-ui';

const DeployWatcher = () => {
  const { show, close } = useToaster();

  useEventSource('/api/deploys', async (deploy) => {
    const tag = \`deploy-\${deploy.id}\`;

    if (deploy.status === 'cancelled') {
      // Reaches the in-app toast and the OS notification,
      // whichever one auto ended up picking.
      await close(tag);
      return;
    }

    const failed = deploy.status === 'failed';

    await show(failed ? 'Deploy failed' : 'Deploy is live', {
      tag,
      body: deploy.service,
      variant: failed ? ToastVariant.Danger : ToastVariant.Success,
      // A failure is worth interrupting for even when the
      // user is looking right at the page.
      presentation: failed
        ? NotificationPresentation.Native
        : NotificationPresentation.Auto,
    });
  });

  return null;
};`;
