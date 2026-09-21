import type { ReactNode } from 'react';

export interface RunButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export const RunButton = ({ onClick, disabled, children }: RunButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-neutral-200 bg-white px-3.5 py-2 text-[14px] text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:disabled:hover:bg-neutral-950"
    >
      {children}
    </button>
  );
};
