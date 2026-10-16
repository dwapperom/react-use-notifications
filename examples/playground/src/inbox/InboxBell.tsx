import { useInbox } from 'react-use-notifications-ui';
import { CounterBadge } from 'react-use-notifications-ui/tailwind';

export interface InboxBellProps {
  open: boolean;
  onToggle: () => void;
}

export const InboxBell = ({ open, onToggle }: InboxBellProps) => {
  const { unread } = useInbox();

  return (
    <button
      type="button"
      aria-label="Inbox"
      aria-expanded={open}
      onClick={onToggle}
      className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <CounterBadge count={unread} className="absolute -right-1 -top-1" />
    </button>
  );
};
