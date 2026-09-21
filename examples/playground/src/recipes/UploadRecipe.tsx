import { RunButton } from '../ui';
import { useUploadRecipe } from './useUploadRecipe';

import type { RecipeProps } from './Recipe.types';

export const UploadRecipe = ({ log }: RecipeProps) => {
  const { start } = useUploadRecipe(log);

  return (
    <>
      <RunButton onClick={() => void start(false)}>Upload succeeds</RunButton>
      <RunButton onClick={() => void start(true)}>Upload fails</RunButton>
    </>
  );
};

export const UPLOAD_CODE = `import {
  useNotificationPermission,
  useNotifications,
} from 'react-use-notifications';

const UploadButton = ({ file }: { file: File }) => {
  const { request, isGranted } = useNotificationPermission();
  const { show } = useNotifications({
    // A hook default, so every call below replaces the
    // previous notification instead of stacking.
    tag: 'upload-progress',
    // The user is watching the page again, so the copy
    // sitting in the tray is just noise.
    closeOnUnmount: true,
  });

  const start = async () => {
    // Inside the click. By the time the upload finishes
    // the user gesture is gone and the browser will
    // refuse to show a prompt.
    if (!isGranted) await request();

    const upload = uploadFile(file);

    upload.on('progress', (percent) =>
      show(\`Uploading \${percent}%\`, {
        body: file.name,
        silent: true,
      })
    );

    upload.on('done', () =>
      show('Upload finished', { body: file.name })
    );

    upload.on('error', (error) =>
      show('Upload failed', {
        body: error.message,
        // Stays up until dismissed. The success is
        // allowed to time out on its own.
        requireInteraction: true,
      })
    );
  };

  return <button onClick={start}>Upload</button>;
};`;
