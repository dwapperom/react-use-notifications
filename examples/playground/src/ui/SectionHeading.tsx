import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  children: ReactNode;
}

export const SectionHeading = ({ title, children }: SectionHeadingProps) => {
  return (
    <>
      <h2 className="text-[17px] font-medium tracking-tight">{title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {children}
      </p>
    </>
  );
};
