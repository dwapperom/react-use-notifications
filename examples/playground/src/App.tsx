import { NotificationProvider } from 'react-use-notifications';
import { ToasterProvider } from 'react-use-notifications-ui';

import { Playground } from './Playground';
import { useServiceWorkerRegistration } from './useServiceWorkerRegistration';

export const App = () => {
  const { registration, error } = useServiceWorkerRegistration();

  return (
    <NotificationProvider registration={registration}>
      <ToasterProvider>
        <Playground registrationStatus={registration ? 'ready' : (error ?? 'starting')} />
      </ToasterProvider>
    </NotificationProvider>
  );
};
