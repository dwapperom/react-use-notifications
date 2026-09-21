import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { ToastItem } from '../Toast.types';

export interface ToastQueueActions {
  push: (toast: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissByTag: (tag: string) => void;
  dismissAll: (owner: string) => void;
}

export interface ToastQueue {
  toasts: ToastItem[];
  actions: ToastQueueActions;
}

const MAX_TOASTS = 50;

let toastCounter = 0;

const createToastId = (): string => {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) {
    return `run-toast:${uuid}`;
  }

  toastCounter += 1;

  return `run-toast:${Date.now()}-${toastCounter}`;
};

export const useToastQueue = (): ToastQueue => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const removeWhere = useCallback((matches: (toast: ToastItem) => boolean) => {
    setToasts((current) => {
      const next = current.filter((toast) => !matches(toast));

      return next.length === current.length
        ? current
        : next;
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    removeWhere((toast) => toast.id === id);
  }, [removeWhere]);

  const dismissByTag = useCallback((tag: string) => {
    if (tag === '') {
      return;
    }
    removeWhere((toast) => toast.tag === tag);
  }, [removeWhere]);

  const dismissAll = useCallback((owner: string) => {
    removeWhere((toast) => toast.owner === owner);
  }, [removeWhere]);

  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = createToastId();

    setToasts((current) => {
      const kept = toast.tag ? current.filter((existing) => existing.tag !== toast.tag) : current;
      const next = [...kept, { ...toast, id }];

      return next.length > MAX_TOASTS
        ? next.slice(next.length - MAX_TOASTS)
        : next;
    });

    return id;
  }, []);

  useEffect(() => {
    const live = new Set(toasts.map((toast) => toast.id));

    for (const [id, timer] of timers.current) {
      if (live.has(id)) {
        continue;
      }
      clearTimeout(timer);
      timers.current.delete(id);
    }

    for (const toast of toasts) {
      if (toast.duration <= 0 || timers.current.has(toast.id)) {
        continue;
      }
      timers.current.set(toast.id, setTimeout(() => dismiss(toast.id), toast.duration));
    }
  }, [toasts, dismiss]);

  useEffect(() => {
    const pending = timers.current;

    return () => {
      for (const timer of pending.values()) {
        clearTimeout(timer);
      }
      pending.clear();
    };
  }, []);

  const actions = useMemo(() => {
    return {
      push,
      dismiss,
      dismissByTag,
      dismissAll,
    };
  }, [push, dismiss, dismissByTag, dismissAll]);

  return {
    toasts,
    actions,
  };
};
