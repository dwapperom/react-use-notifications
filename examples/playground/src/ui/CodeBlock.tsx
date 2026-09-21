import { useEffect, useRef, useState } from 'react';

type CopyState = 'idle' | 'copied' | 'failed';

const LABELS: Record<CopyState, string> = {
  idle: 'Copy',
  copied: 'Copied',
  failed: 'Failed',
};

export const CodeBlock = ({ children }: { children: string }) => {
  const [state, setState] = useState<CopyState>('idle');

  const resetTimer = useRef<number>();

  useEffect(() => {
    return () => {
      clearTimeout(resetTimer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setState('copied');
    } catch {
      setState('failed');
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setState('idle'), 1600);
  };

  const label = LABELS[state];

  return (
    <div className="group relative mt-4">
      <pre className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 py-3.5 pl-4 pr-14 font-mono text-[13px] leading-relaxed text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        <code>{children}</code>
      </pre>

      <button
        type="button"
        onClick={() => void copy()}
        aria-label={state === 'idle' ? 'Copy code' : label}
        className="absolute right-2 top-2 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-500 opacity-0 transition-opacity hover:text-neutral-900 focus-visible:opacity-100 group-hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        {label}
      </button>
    </div>
  );
};
