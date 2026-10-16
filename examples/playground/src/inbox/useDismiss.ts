import { useEffect, useRef } from 'react';

import type { RefObject } from 'react';

export const useDismiss = (
  open: boolean,
  onDismiss: () => void,
  insideRefs: RefObject<Element | null>[],
): void => {
  const latest = useRef({ onDismiss, insideRefs });
  latest.current = { onDismiss, insideRefs };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: PointerEvent) => {
      const { target } = event;
      const inside = target instanceof Node
        && latest.current.insideRefs.some((ref) => ref.current?.contains(target));

      if (!inside) {
        latest.current.onDismiss();
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        latest.current.onDismiss();
      }
    };

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);
};
