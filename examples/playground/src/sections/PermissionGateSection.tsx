import { NotificationPermissionGate } from 'react-use-notifications-ui';

import { Demo } from '../ui';

export const PermissionGateSection = () => {
  return (
    <Demo
      title="Permission gate"
      description="Renders a branch per state so you write no chain of conditionals."
      options={[]}
    >
      <div className="rounded-lg border border-neutral-200 px-4 py-3 text-[14px] dark:border-neutral-800">
        <NotificationPermissionGate
          unsupported={<span>No Notifications API in this browser.</span>}
          denied={<span>Blocked. Unblock from the address bar.</span>}
          prompt={<span>Not asked yet. Press Enable at the top.</span>}
        >
          <span className="text-emerald-600 dark:text-emerald-400">
            Granted, so the real feature renders here.
          </span>
        </NotificationPermissionGate>
      </div>
    </Demo>
  );
};
