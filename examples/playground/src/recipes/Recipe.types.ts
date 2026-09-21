import type { ReactNode } from 'react';

export interface RecipeProps {
  log: (line: string) => void;
}

export interface Recipe {
  label: string;
  description: string;
  code: string;
  Component: (props: RecipeProps) => ReactNode;
}
