import { useCallback, useState } from 'react';

export const useRecentLines = (limit: number) => {
  const [lines, setLines] = useState<string[]>([]);

  const append = useCallback((line: string) => {
    setLines((current) => [line, ...current].slice(0, limit));
  }, [limit]);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  return {
    lines,
    append,
    clear,
  };
};
