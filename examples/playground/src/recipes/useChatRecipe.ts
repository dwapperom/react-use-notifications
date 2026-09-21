import {
  NotificationDelivery,
  NotificationOutcome,
  useNotificationContext,
  useNotifications,
} from 'react-use-notifications';

type StoredNotification = Notification & { actions?: ReadonlyArray<{ title: string }> };

export interface ChatMessage {
  author: string;
  preview: string;
  threadId: number;
  mentioned: boolean;
}

export const PLAIN: ChatMessage = {
  author: 'Ada',
  preview: 'See you at 3',
  threadId: 42,
  mentioned: false,
};

export const MENTION: ChatMessage = {
  author: 'Grace',
  preview: 'Can you take a look at this?',
  threadId: 42,
  mentioned: true,
};

const toMentionLabel = (maxActions: number, isWorkerReady: boolean): string => {
  const drawn = maxActions === 0 ? 'no' : maxActions;
  const waiting = isWorkerReady ? '' : ' (waiting for the worker)';

  return `Mention, ${drawn} action${maxActions === 1 ? '' : 's'}${waiting}`;
};

export const useChatRecipe = (log: (line: string) => void) => {
  const { show, maxActions } = useNotifications();
  const registration = useNotificationContext()?.registration;

  const reportStoredActions = async (tag: string) => {
    if (!registration) {
      return;
    }

    const [stored] = (await registration.getNotifications({ tag })) as StoredNotification[];
    const titles = stored?.actions?.map((action) => action.title) ?? [];

    if (titles.length === 0) {
      log('The OS stored no buttons at all');

      return;
    }
    log(`The OS accepted ${titles.length}: ${titles.join(', ')}`);
    log('Not drawn? On macOS they sit behind the banner\'s More button');
  };

  const notify = async (message: ChatMessage) => {
    const tag = `thread-${message.threadId}`;
    log(`show() called with ${message.mentioned ? 'two actions' : 'no actions'}`);

    const result = await show(message.author, {
      body: message.preview,
      tag,
      renotify: message.mentioned,
      data: { threadId: message.threadId },
      actions: message.mentioned
        ? [
            { action: 'reply', title: 'Reply' },
            { action: 'mute', title: 'Mute thread' },
          ]
        : undefined,
    });

    if (result.outcome !== NotificationOutcome.Shown) {
      log(`Refused: ${result.outcome} (${result.reason})`);

      return;
    }

    const stripped = result.actionsUnsupported
      ? ', and the buttons were stripped: this delivery cannot draw them'
      : '';
    log(`Auto chose ${result.delivery}${stripped}`);

    if (result.delivery === NotificationDelivery.Persistent) {
      await reportStoredActions(tag);
    }
  };

  const isWorkerReady = Boolean(registration);

  return {
    notify,
    isWorkerReady,
    mentionLabel: toMentionLabel(maxActions, isWorkerReady),
  };
};
