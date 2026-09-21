import { DeliveryPreference, useNotifications } from 'react-use-notifications';

import { Demo } from '../ui';
import { useLastResult } from '../useLastResult';

const AUTO_CODE = `import { useNotifications } from 'react-use-notifications';

const { show } = useNotifications({ registration });

// Auto is the default: persistent when actions
// are present and a registration exists.
await show('Ada replied');`;

const TRANSIENT_CODE = `import {
  useNotifications,
  DeliveryPreference,
} from 'react-use-notifications';

const { show } = useNotifications();

await show('Ada replied', {
  delivery: DeliveryPreference.Transient,
  onClick: () => focusThread(),
});`;

const PERSISTENT_CODE = `import {
  useNotifications,
  DeliveryPreference,
} from 'react-use-notifications';

const { show } = useNotifications({ registration });

await show('Ada replied', {
  delivery: DeliveryPreference.Persistent,
});`;

export const DeliverySection = () => {
  const { show } = useNotifications();
  const result = useLastResult();

  return (
    <Demo
      title="Delivery"
      description={(
        <>
          Transient uses the constructor and supports onClick. Persistent goes through the worker
          and supports actions. Auto picks whichever fits.
        </>
      )}
      result={result.text}
      options={[
        {
          label: 'Auto',
          code: AUTO_CODE,
          run: result.capture(() => show('Auto', { body: 'Library picks' })),
        },
        {
          label: 'Transient',
          code: TRANSIENT_CODE,
          run: result.capture(() => show('Transient', { delivery: DeliveryPreference.Transient })),
        },
        {
          label: 'Persistent',
          code: PERSISTENT_CODE,
          run: result.capture(() => {
            return show('Persistent', { delivery: DeliveryPreference.Persistent });
          }),
        },
      ]}
    />
  );
};
