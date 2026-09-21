import { useState } from 'react';

import { CodeBlock } from './CodeBlock';
import { OptionButton } from './OptionButton';
import { Result } from './Result';
import { SectionHeading } from './SectionHeading';

import type { ReactNode } from 'react';

interface DemoOption {
  label: string;
  code: string;
  description?: ReactNode;
  run?: () => void;
}

export interface DemoProps {
  title: string;
  description: ReactNode;
  options: DemoOption[];
  result?: ReactNode;
  children?: ReactNode;
  onSelect?: (index: number) => void;
}

export const Demo = ({
  title,
  description,
  options,
  result,
  children,
  onSelect,
}: DemoProps) => {
  const [selected, setSelected] = useState(0);
  const active = options[selected];

  return (
    <section className="mb-24">
      <SectionHeading title={title}>{description}</SectionHeading>

      {options.length > 0
        ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {options.map((option, index) => (
                <OptionButton
                  key={option.label}
                  selected={index === selected}
                  onClick={() => {
                    setSelected(index);
                    onSelect?.(index);
                    option.run?.();
                  }}
                >
                  {option.label}
                </OptionButton>
              ))}
            </div>
          )
        : null}

      {active?.description
        ? (
            <p className="mt-5 text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              {active.description}
            </p>
          )
        : null}

      {children ? <div className="mt-5">{children}</div> : null}

      {active ? <CodeBlock>{active.code}</CodeBlock> : null}
      {result ? <Result>{result}</Result> : null}
    </section>
  );
};
