import { RunButton } from '../ui';
import { MENTION, PLAIN, useChatRecipe } from './useChatRecipe';

import type { RecipeProps } from './Recipe.types';

export const ChatRecipe = ({ log }: RecipeProps) => {
  const { notify, isWorkerReady, mentionLabel } = useChatRecipe(log);

  return (
    <>
      <RunButton onClick={() => void notify(PLAIN)}>Plain message, no actions</RunButton>
      <RunButton disabled={!isWorkerReady} onClick={() => void notify(MENTION)}>
        {mentionLabel}
      </RunButton>
    </>
  );
};

export const CHAT_CODE = `import {
  NotificationOutcome,
  useNotifications,
} from 'react-use-notifications';

interface ChatNotifierProps {
  currentUserId: string;
  onBlocked: () => void;
}

// currentUserId and onBlocked come from your app; useSocketEvent is your socket. Everything
// inside show() is the library.
const ChatNotifier = ({ currentUserId, onBlocked }: ChatNotifierProps) => {
  const { show } = useNotifications();

  useSocketEvent('message', async (message) => {
    const mentioned = message.mentions.includes(currentUserId);

    const result = await show(message.author, {
      body: message.preview,
      // One notification per thread, replaced in place
      // instead of stacking five of them.
      tag: \`thread-\${message.threadId}\`,
      renotify: mentioned,
      data: { threadId: message.threadId },
      actions: mentioned
        ? [
            { action: 'reply', title: 'Reply' },
            { action: 'mute', title: 'Mute thread' },
          ]
        : undefined,
    });

    // Auto went persistent for the mention because it has
    // actions, and transient for the rest. One call site.
    if (result.outcome === NotificationOutcome.PermissionDenied) {
      onBlocked();
    }
  });

  return null;
};`;
