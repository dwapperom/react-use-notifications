import { useEffect, useRef } from 'react';

import { useNotificationPermission, useNotifications } from 'react-use-notifications';

const FILE_NAME = 'design-system.zip';
const STEP_MS = 1300;
const PERCENTS = [40, 80];

export const useUploadRecipe = (log: (line: string) => void) => {
  const { request, isGranted } = useNotificationPermission();
  const { show } = useNotifications({ tag: 'upload-progress' });

  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;

    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);

  const later = (callback: () => void, delay: number) => {
    timers.current.push(window.setTimeout(callback, delay));
  };

  const start = async (shouldFail: boolean) => {
    if (!isGranted) {
      await request();
    }

    log(`Uploading ${FILE_NAME}`);

    PERCENTS.forEach((percent, index) => {
      const delay = (index + 1) * STEP_MS;

      later(() => {
        void show(`Uploading ${percent}%`, { body: FILE_NAME, silent: true });
        log(`${percent}%: same tag, so it replaced the last one`);
      }, delay);
    });

    later(() => {
      if (shouldFail) {
        void show('Upload failed', { body: 'Connection reset', requireInteraction: true });
        log('Failed. requireInteraction keeps it up until dismissed');

        return;
      }
      void show('Upload finished', { body: FILE_NAME });
      log('Done. This one is allowed to time out on its own');
    }, (PERCENTS.length + 1) * STEP_MS);
  };

  return {
    start,
  };
};
