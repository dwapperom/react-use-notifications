import { useMemo } from 'react';

import { useToastQueue } from '../hooks/useToastQueue';
import { ToasterContext, ToasterToastsContext } from './ToasterContext';

import type { ToasterDefaults } from './ToasterContext';
import type { ReactNode } from 'react';

export interface ToasterProviderProps extends ToasterDefaults {
  children: ReactNode;
}

export const ToasterProvider = ({
  presentation,
  variant,
  duration,
  children,
}: ToasterProviderProps) => {
  const { toasts, actions } = useToastQueue();

  const value = useMemo(() => {
    return {
      presentation,
      variant,
      duration,
      actions,
    };
  }, [presentation, variant, duration, actions]);

  return (
    <ToasterContext.Provider value={value}>
      <ToasterToastsContext.Provider value={toasts}>{children}</ToasterToastsContext.Provider>
    </ToasterContext.Provider>
  );
};
