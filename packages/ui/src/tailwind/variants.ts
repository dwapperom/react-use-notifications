import { cva } from 'class-variance-authority';

import { ToastPosition } from '../toast/Toast.constants';

export const toastRegionVariants = cva(
  'pointer-events-none fixed z-50 flex w-full max-w-sm flex-col gap-2 p-4',
  {
    variants: {
      position: {
        [ToastPosition.TopLeft]: 'left-0 top-0',
        [ToastPosition.TopRight]: 'right-0 top-0',
        [ToastPosition.BottomLeft]: 'bottom-0 left-0 flex-col-reverse',
        [ToastPosition.BottomRight]: 'bottom-0 right-0 flex-col-reverse',
      },
    },
    defaultVariants: {
      position: ToastPosition.BottomRight,
    },
  },
);

export const toastCardVariants = cva(
  [
    'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg',
    'bg-popover text-popover-foreground',
    'data-[variant=danger]:border-destructive/50',
    'data-[variant=danger]:bg-destructive/10',
    'data-[variant=danger]:text-destructive',
    'data-[variant=success]:border-emerald-300 data-[variant=success]:bg-emerald-50',
    'data-[variant=success]:text-emerald-950',
    'dark:data-[variant=success]:border-emerald-900 dark:data-[variant=success]:bg-emerald-950',
    'dark:data-[variant=success]:text-emerald-50',
    'data-[variant=warning]:border-amber-300 data-[variant=warning]:bg-amber-50',
    'data-[variant=warning]:text-amber-950',
    'dark:data-[variant=warning]:border-amber-900 dark:data-[variant=warning]:bg-amber-950',
    'dark:data-[variant=warning]:text-amber-50',
  ].join(' '),
);

export const permissionBadgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
    'bg-muted text-muted-foreground',
    'data-[permission=granted]:bg-emerald-100 data-[permission=granted]:text-emerald-800',
    'dark:data-[permission=granted]:bg-emerald-950',
    'dark:data-[permission=granted]:text-emerald-300',
    'data-[permission=denied]:bg-destructive/10 data-[permission=denied]:text-destructive',
    'data-[permission=unsupported]:bg-muted data-[permission=unsupported]:text-muted-foreground/60',
  ].join(' '),
);

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium',
    'px-3 py-2',
    'transition-colors motion-reduce:transition-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: '',
        sm: 'px-2 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export const counterBadgeVariants = cva(
  [
    'inline-flex min-w-5 items-center justify-center rounded-full px-1.5',
    'text-[11px] font-medium leading-5 tabular-nums',
    'ring-2 ring-background',
  ].join(' '),
  {
    variants: {
      tone: {
        danger: 'bg-destructive text-destructive-foreground',
        neutral: 'bg-foreground text-background',
      },
    },
    defaultVariants: { tone: 'danger' },
  },
);
