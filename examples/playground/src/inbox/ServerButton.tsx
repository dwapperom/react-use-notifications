import type { ReactNode } from 'react';

export interface ServerButtonProps {
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export const ServerButton = ({ onClick, pressed, disabled, children }: ServerButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className="h-8 rounded-md border border-border bg-background px-3 text-[13px] text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40 aria-pressed:border-foreground/40 aria-pressed:bg-accent"
    >
      {children}
    </button>
  );
};
