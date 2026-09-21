import { useState } from 'react';

export const useLastResult = () => {
  const [value, setValue] = useState<unknown>(null);

  const capture = (task: () => Promise<unknown>) => () => {
    void task().then(setValue, (error: unknown) => {
      setValue({ threw: error instanceof Error ? error.message : String(error) });
    });
  };

  const text = value === null ? null : JSON.stringify(value, null, 2);

  return {
    capture,
    text,
  };
};
