import { useToaster, useToasts } from 'react-use-notifications-ui';
import { NotificationToaster, ToastPosition } from 'react-use-notifications-ui/tailwind';

import { RecipesSection } from './recipes';
import {
  ActionsSection,
  CapabilitiesSection,
  ClosingSection,
  DeliverySection,
  NavigateSection,
  PageHeader,
  PermissionGateSection,
  PresentationSection,
  ShowOneSection,
} from './sections';

export const Playground = ({ registrationStatus }: { registrationStatus: string }) => {
  const { dismiss } = useToaster();
  const toasts = useToasts();

  return (
    <div>
      <main className="mx-auto max-w-[640px] px-6 pb-32 pt-28">
        <PageHeader registrationStatus={registrationStatus} />

        <ShowOneSection />
        <ActionsSection />
        <NavigateSection />
        <DeliverySection />
        <ClosingSection />
        <PresentationSection />
        <PermissionGateSection />
        <RecipesSection />
        <CapabilitiesSection />
      </main>

      <NotificationToaster
        toasts={toasts}
        onDismiss={dismiss}
        position={ToastPosition.BottomRight}
      />
    </div>
  );
};
