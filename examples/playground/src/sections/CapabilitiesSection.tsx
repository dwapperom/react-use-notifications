import { useNotificationCapabilities } from 'react-use-notifications';

import { CodeBlock, SectionHeading } from '../ui';

export const CapabilitiesSection = () => {
  const { actions, navigate, maxActions } = useNotificationCapabilities();

  return (
    <section className="mb-24">
      <SectionHeading title="Capabilities">
        Branch on this instead of sniffing the user agent. Anything false here is handled by the
        library, not broken.
      </SectionHeading>

      <CodeBlock>
        {`import { useNotificationCapabilities } from 'react-use-notifications';

const { actions, navigate, maxActions } = useNotificationCapabilities();

// This browser: actions ${actions}, navigate ${navigate}, maxActions ${maxActions}

if (!actions) {
  // Render the buttons in your own UI instead.
}`}
      </CodeBlock>
    </section>
  );
};
