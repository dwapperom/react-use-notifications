import type { ReactNode } from 'react';

export const Result = ({ children }: { children: ReactNode }) => {
  return (
    <div className="mt-2 whitespace-pre-wrap rounded-lg border border-dashed border-neutral-200 px-4 py-3 font-mono text-[12px] leading-relaxed text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      {children}
    </div>
  );
};
