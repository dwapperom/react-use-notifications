import {
  NotificationPermissionBadge,
  RequestPermissionButton,
} from 'react-use-notifications-ui/tailwind';

export const PageHeader = ({ registrationStatus }: { registrationStatus: string }) => {
  return (
    <header className="mb-24 text-center">
      <h1 className="text-[52px] font-bold leading-none tracking-tight">Notifications</h1>
      <p className="mt-4 text-[17px] text-neutral-500 dark:text-neutral-400">
        React hooks for the Web Notifications API.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <RequestPermissionButton />
        <a
          href="https://github.com/dwapperom/react-use-notifications"
          className="rounded-md border border-neutral-200 px-3.5 py-2 text-[14px] text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          GitHub
        </a>
      </div>

      <p className="mt-6 font-mono text-[13px] text-neutral-400">npm i react-use-notifications</p>

      <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-neutral-400">
        <NotificationPermissionBadge />
        <span>{`service worker ${registrationStatus}`}</span>
      </div>
    </header>
  );
};
