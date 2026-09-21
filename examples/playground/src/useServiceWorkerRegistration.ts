import { useEffect, useState } from 'react';

export const useServiceWorkerRegistration = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setError('unsupported');

      return;
    }

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then(setRegistration)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      });
  }, []);

  return {
    registration,
    error,
  };
};
