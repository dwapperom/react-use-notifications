import type { ReactNode } from 'react';

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

const SELECTED
  = 'border-neutral-300 bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100';

const UNSELECTED
  = 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900';

export const OptionButton = ({ selected, onClick, children }: OptionButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-md border px-3.5 py-2 text-[14px] transition-colors ${
        selected ? SELECTED : UNSELECTED
      }`}
    >
      {children}
    </button>
  );
};
