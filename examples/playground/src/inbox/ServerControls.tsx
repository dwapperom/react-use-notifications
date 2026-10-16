import { NotificationPresentation } from 'react-use-notifications-ui';

import { ServerButton } from './ServerButton';

import type { FakeServer } from './useFakeServer';

export const ServerControls = ({ server }: { server: FakeServer }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border bg-muted/50 px-4 py-3">
      <span className="mr-1 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        Server
      </span>
      <ServerButton onClick={() => server.send(NotificationPresentation.Auto)}>Send</ServerButton>
      <ServerButton onClick={() => server.send(NotificationPresentation.None)}>
        Send silently
      </ServerButton>
      <ServerButton onClick={server.editLast} disabled={!server.canEdit}>Edit last</ServerButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <ServerButton onClick={server.toggleFeed} pressed={server.feeding}>Live feed</ServerButton>
      <ServerButton onClick={server.toggleRefusing} pressed={server.refusing}>
        Saving fails
      </ServerButton>
    </div>
  );
};
