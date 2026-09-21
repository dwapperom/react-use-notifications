import { useContext } from 'react';

import { ToasterToastsContext } from '../context/ToasterContext';

import type { ToastItem } from '../Toast.types';

export const useToasts = (): ToastItem[] => {
  return useContext(ToasterToastsContext);
};
