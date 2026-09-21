import { useState } from 'react';

import { Demo } from '../ui';
import { useRecentLines } from '../useRecentLines';
import { RECIPES } from './Recipe.constants';

const LOG_LENGTH = 5;

export const RecipesSection = () => {
  const [selected, setSelected] = useState(0);
  const { lines, append, clear } = useRecentLines(LOG_LENGTH);

  const active = RECIPES[selected];

  return (
    <Demo
      title="Recipes"
      description={(
        <>
          Whole patterns rather than single calls, and all of them run. The socket, the upload and
          the deploy stream are faked; everything below them is the real library.
        </>
      )}
      options={RECIPES.map((recipe) => ({
        label: recipe.label,
        code: recipe.code,
        description: recipe.description,
      }))}
      onSelect={(index) => {
        setSelected(index);
        clear();
      }}
      result={lines.length > 0 ? lines.join('\n') : undefined}
    >
      {active
        ? (
            <div key={active.label} className="flex flex-wrap gap-2">
              <active.Component log={append} />
            </div>
          )
        : null}
    </Demo>
  );
};
