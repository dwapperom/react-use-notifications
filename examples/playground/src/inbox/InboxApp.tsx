import { useRef, useState } from 'react';

import { InboxBell } from './InboxBell';
import { InboxPage } from './InboxPage';
import { InboxPanel } from './InboxPanel';
import { ServerControls } from './ServerControls';
import { useDismiss } from './useDismiss';

import type { FakeServer } from './useFakeServer';
import type { InboxItem } from 'react-use-notifications-ui';

interface OpenedPage {
  route: string;
  title: string | null;
}

const HOME: OpenedPage = { route: '/', title: null };

const NAV = ['Home', 'Threads', 'Deploys'];

export const InboxApp = ({ server }: { server: FakeServer }) => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(HOME);
  const popover = useRef<HTMLDivElement>(null);
  const serverStrip = useRef<HTMLDivElement>(null);

  useDismiss(open, () => setOpen(false), [popover, serverStrip]);

  const openItem = (item: InboxItem) => {
    setPage({ route: item.href ?? '/', title: item.title });
    setOpen(false);
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex h-9 items-center gap-3 border-b border-border bg-muted/50 px-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="flex-1 truncate rounded-md bg-background px-2.5 py-0.5 text-center font-mono text-[12px] text-muted-foreground">
          your-app.example
          <span data-testid="route" className="text-foreground">{page.route}</span>
        </span>
        <span className="w-[42px]" aria-hidden />
      </div>

      <div className="flex h-12 items-center gap-5 border-b border-border px-4">
        <button
          type="button"
          className="text-[14px] font-semibold text-foreground"
          onClick={() => setPage(HOME)}
        >
          Your app
        </button>

        <nav className="flex gap-4 text-[13px] text-muted-foreground" aria-hidden>
          {NAV.map((label) => <span key={label}>{label}</span>)}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div ref={popover} className="relative">
            <InboxBell open={open} onToggle={() => setOpen((current) => !current)} />

            {open
              ? (
                  <div className="absolute -right-2 top-full z-20 mt-2">
                    <InboxPanel onSelect={openItem} />
                  </div>
                )
              : null}
          </div>
          <div className="size-7 rounded-full bg-muted" aria-hidden />
        </div>
      </div>

      <InboxPage title={page.title} />
      <div ref={serverStrip}>
        <ServerControls server={server} />
      </div>
    </div>
  );
};
