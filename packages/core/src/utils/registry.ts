interface TrackResult {
  tracked: boolean;
  evicted: string[];
}

export interface NotificationRegistry {
  trackTransient: (notification: Notification) => boolean;
  trackPersistent: (tag: string) => TrackResult;
  closeTransient: (tag?: string) => void;
  takePersistent: (tag?: string) => string[];
  dispose: () => void;
  count: () => number;
}

const MAX_TRACKED_TAGS = 128;

export const createNotificationRegistry = (): NotificationRegistry => {
  const transient = new Set<Notification>();
  const persistentTags = new Set<string>();
  let disposed = false;

  const matches = (candidate: string, tag: string | undefined): boolean => {
    return tag === undefined || (tag !== '' && candidate === tag);
  };

  const trackTransient = (notification: Notification): boolean => {
    if (disposed) {
      return false;
    }

    transient.add(notification);
    notification.addEventListener('close', () => transient.delete(notification));

    return true;
  };

  const trackPersistent = (tag: string): TrackResult => {
    if (disposed) {
      return {
        tracked: false,
        evicted: [],
      };
    }

    persistentTags.add(tag);

    const evicted: string[] = [];
    while (persistentTags.size > MAX_TRACKED_TAGS) {
      const [oldest] = persistentTags;
      if (oldest === undefined) {
        break;
      }
      persistentTags.delete(oldest);
      evicted.push(oldest);
    }

    return {
      tracked: true,
      evicted,
    };
  };

  const closeTransient = (tag?: string): void => {
    for (const notification of [...transient]) {
      if (!matches(notification.tag, tag)) {
        continue;
      }
      notification.close();
      transient.delete(notification);
    }
  };

  const takePersistent = (tag?: string): string[] => {
    const taken = [...persistentTags].filter((known) => matches(known, tag));
    for (const known of taken) {
      persistentTags.delete(known);
    }

    return taken;
  };

  return {
    trackTransient,
    trackPersistent,
    closeTransient,
    takePersistent,
    dispose: () => {
      disposed = true;
    },
    count: () => transient.size + persistentTags.size,
  };
};
