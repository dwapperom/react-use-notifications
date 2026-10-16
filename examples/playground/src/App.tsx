import { NotificationProvider } from 'react-use-notifications';
import { InboxProvider, ToasterProvider } from 'react-use-notifications-ui';

import { inboxStore } from './inbox';
import { Playground } from './Playground';
import { useServiceWorkerRegistration } from './useServiceWorkerRegistration';

export const App = () => {
  const { registration, error } = useServiceWorkerRegistration();

  return (
    <NotificationProvider registration={registration}>
      <InboxProvider store={inboxStore}>
        <ToasterProvider>
          <Playground registrationStatus={registration ? 'ready' : (error ?? 'starting')} />
        </ToasterProvider>
      </InboxProvider>
    </NotificationProvider>
  );
};
