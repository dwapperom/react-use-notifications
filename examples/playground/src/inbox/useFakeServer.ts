import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { NotificationPresentation, useToaster } from 'react-use-notifications-ui';

import { FEED_INTERVAL_MS, SERVER_MESSAGES } from './Inbox.constants';
import { isRefusingWrites, setRefusingWrites, subscribeToRefusing } from './inboxStore';

import type { ServerMessage } from './Inbox.types';
import type { ToasterShowResult } from 'react-use-notifications-ui';

interface Sent {
  id: string;
  receivedAt: number;
  message: ServerMessage;
}

export const useFakeServer = () => {
  const { show } = useToaster();
  const sentCount = useRef(0);
  const [lastSent, setLastSent] = useState<Sent | null>(null);
  const [lastResult, setLastResult] = useState<ToasterShowResult | null>(null);
  const [feeding, setFeeding] = useState(false);
  const refusing = useSyncExternalStore(subscribeToRefusing, isRefusingWrites, isRefusingWrites);

  const deliver = useCallback(async (
    { id, receivedAt, message }: Sent,
    presentation: NotificationPresentation,
  ) => {
    const result = await show(message.title, {
      body: message.body,
      navigate: message.href,
      tag: message.tag,
      presentation,
      inbox: { id, receivedAt, category: message.category },
    });
    setLastResult(result);
  }, [show]);

  const send = useCallback((presentation: NotificationPresentation) => {
    const message = SERVER_MESSAGES[sentCount.current % SERVER_MESSAGES.length];
    if (!message) {
      return;
    }

    sentCount.current += 1;
    const receivedAt = Date.now();
    const sent = {
      id: `srv-${receivedAt}-${sentCount.current}`,
      receivedAt,
      message,
    };
    setLastSent(sent);
    void deliver(sent, presentation);
  }, [deliver]);

  const editLast = useCallback(() => {
    if (!lastSent) {
      return;
    }

    const edited = { ...lastSent.message, body: `${lastSent.message.body} (edited)` };
    void deliver({ ...lastSent, message: edited }, NotificationPresentation.None);
  }, [deliver, lastSent]);

  const sendRef = useRef(send);
  sendRef.current = send;

  useEffect(() => {
    if (!feeding) {
      return;
    }

    const timer = setInterval(() => {
      sendRef.current(NotificationPresentation.None);
    }, FEED_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [feeding]);

  const toggleFeed = useCallback(() => {
    setFeeding((current) => !current);
  }, []);

  const toggleRefusing = useCallback(() => {
    setRefusingWrites(!isRefusingWrites());
  }, []);

  return {
    send,
    editLast,
    canEdit: lastSent !== null,
    feeding,
    toggleFeed,
    refusing,
    toggleRefusing,
    lastResult,
  };
};

export type FakeServer = ReturnType<typeof useFakeServer>;
